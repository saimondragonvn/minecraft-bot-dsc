const db = require('../database/db');
const config = require('../config');
const mobSystem = require('./mobSystem');

class MiningSystem {
  /**
   * Tìm cúp tốt nhất của người chơi (ưu tiên cúp đang trang bị, sau đó tìm trong túi đồ)
   * @param {Object} player
   * @returns {Object|null}
   */
  findBestPickaxe(player) {
    // 1. Kiểm tra ô trang bị cúp
    if (player.equipment && player.equipment.pickaxe) {
      const pickaxeId = player.equipment.pickaxe;
      if (config.PICKAXE_TIERS[pickaxeId]) {
        const itemDef = config.ITEMS[pickaxeId] || {};
        return {
          id: pickaxeId,
          name: itemDef.name || pickaxeId,
          emoji: itemDef.emoji || '⛏️',
          ...config.PICKAXE_TIERS[pickaxeId],
          isEquipped: true
        };
      }
    }

    // 2. Tìm trong túi đồ (lấy cúp có cấp độ cao nhất)
    const pickaxesInInv = (player.inventory || [])
      .filter(i => config.PICKAXE_TIERS[i.itemId])
      .map(i => {
        const itemDef = config.ITEMS[i.itemId] || {};
        return {
          id: i.itemId,
          name: itemDef.name || i.itemId,
          emoji: itemDef.emoji || '⛏️',
          ...config.PICKAXE_TIERS[i.itemId],
          isEquipped: false
        };
      })
      .sort((a, b) => b.tier - a.tier);

    return pickaxesInInv.length > 0 ? pickaxesInInv[0] : null;
  }

  /**
   * Giảm độ bền của cúp sau khi đào
   * @param {Object} player
   * @param {Object} pickaxeInfo
   * @returns {string|null} Cảnh báo nếu cúp bị gãy
   */
  consumePickaxeDurability(player, pickaxeInfo) {
    if (!pickaxeInfo) return null;

    let warning = null;
    if (pickaxeInfo.isEquipped) {
      if (player.durability && player.durability.pickaxe !== undefined) {
        player.durability.pickaxe -= 1;
        if (player.durability.pickaxe <= 0) {
          player.equipment.pickaxe = null;
          delete player.durability.pickaxe;
          warning = `⚠️ **${pickaxeInfo.emoji} ${pickaxeInfo.name} của bạn đã bị gãy do hết độ bền!**`;
        }
      }
    }

    return warning;
  }

  getPickaxeCooldown(pickaxe) {
    if (!pickaxe || !config.PICKAXE_COOLDOWNS[pickaxe.id]) {
      return config.PICKAXE_COOLDOWNS.none || 8000;
    }
    return config.PICKAXE_COOLDOWNS[pickaxe.id];
  }

  /**
   * Đào khoáng sản trong Hang Đá (Overworld Cave)
   * Tỉ lệ chuẩn xác:
   * - Đá (Cobblestone): 1:1.5 (~66.7%)
   * - Than (Coal): 1:5 (20%)
   * - Sắt (Iron Ore): 1:10 (10%)
   * - Lưu ly (Lapis): 1:10 (10%)
   * - Đá đỏ (Redstone): 1:10 (10%)
   * - Vàng (Gold Ore): 1:10 (10%)
   * - Kim cương (Diamond): 1:50 (2%)
   * Tốc độ & sản lượng đào phụ thuộc vào cúp. Cúp không đủ cấp sẽ KHÔNG BAO GIỜ ra quặng đó!
   */
  mineCave(player) {
    const pickaxe = this.findBestPickaxe(player);

    // Không có cúp: Tay không không thể đào được đá và quặng
    if (!pickaxe) {
      return {
        success: false,
        noPickaxe: true,
        message: '❌ **Bạn không có Cúp (Pickaxe) nào!**\nTrong Minecraft, dùng tay không bạn **không thể** khai thác được Đá và Quặng khoáng sản.\nHãy dùng `/craft` hoặc tới **Bàn Chế Tạo** chế tạo một chiếc **Cúp Gỗ** (3 Gỗ sồi + 2 Que gỗ) trước!'
      };
    }

    const cooldownMs = this.getPickaxeCooldown(pickaxe);
    const now = Date.now();
    const lastMine = player.lastMine || 0;
    if (now - lastMine < cooldownMs) {
      const wait = ((cooldownMs - (now - lastMine)) / 1000).toFixed(1);
      return {
        success: false,
        onCooldown: true,
        remainingSec: wait,
        cooldownSec: (cooldownMs / 1000).toFixed(1),
        pickaxe,
        message: `⏳ **Bạn đang nghỉ tay!** Vui lòng chờ thêm **${wait}s** nữa để tiếp tục đào đá.\n*(Tốc độ đào của ${pickaxe.emoji} **${pickaxe.name}** là **${(cooldownMs / 1000).toFixed(1)}s**/lần)*`
      };
    }

    player.lastMine = now;

    const usedSlots = db.getUsedSlots(player);
    const maxSlots = db.getMaxSlots(player);
    if (usedSlots >= maxSlots && !db.hasInventorySpaceFor(player, 'cobblestone', 1)) {
      return {
        success: false,
        inventoryFull: true,
        usedSlots,
        maxSlots,
        message: `❌ **Kho đồ của bạn đã chật kín (${usedSlots}/${maxSlots} Slot)!**\n` +
          `Không thể chứa thêm khoáng sản nào nữa.\n` +
          `💡 Hãy dùng **64 Block Gỗ** 🪵 để chế tạo thêm **Rương Mở Rộng (+24 Slot)** (vào \`/menu\` -> Túi đồ -> Bấm nút **[Chế Rương Mở Rộng]**) hoặc vứt bớt đồ!`
      };
    }

    // Tỉ lệ lúc đào spawn quái là 1:30 (~3.33%)
    if (Math.random() < 1 / 30) {
      const mob = mobSystem.spawnMob('cave');
      return {
        success: false,
        encounterMob: true,
        mob,
        pickaxe
      };
    }

    const { tier, minOres, maxOres, speedDesc, name: pickName, emoji: pickEmoji } = pickaxe;
    const ores = [];
    const luckEffect = db.hasEffect(player, 'luck');
    const luckMult = luckEffect ? 2.0 : 1.0;

    // 1. Đá cuội (Cobblestone) - Tỉ lệ 1:1.5 (~66.7%) | Yêu cầu Cúp Cấp 1+ (Gỗ+)
    if (tier >= config.ORE_REQUIREMENTS.cobblestone && Math.random() < config.MINING_RATES.cobblestone) {
      const count = Math.floor(minOres * 2 + Math.random() * (maxOres - minOres + 1) * 2);
      db.addItem(player, 'cobblestone', count);
      ores.push(`🪨 x${count} Đá cuội`);
    }

    // 2. Than đá (Coal) - Tỉ lệ 1:5 (20%) | Yêu cầu Cúp Cấp 1+ (Gỗ+)
    if (tier >= config.ORE_REQUIREMENTS.coal && Math.random() < config.MINING_RATES.coal) {
      const count = Math.floor(minOres + Math.random() * (maxOres - minOres + 1));
      db.addItem(player, 'coal', count);
      ores.push(`⚫ x${count} Than đá`);
    }

    // 3. Quặng sắt (Iron Ore) - Tỉ lệ 1:10 (10%) | Yêu cầu Cúp Cấp 2+ (Đá+)
    if (tier >= config.ORE_REQUIREMENTS.iron_ore && Math.random() < (config.MINING_RATES.iron_ore * (luckEffect ? 1.5 : 1.0))) {
      const count = Math.floor(minOres + Math.random() * (maxOres - minOres + 1)) + (luckEffect ? 1 : 0);
      db.addItem(player, 'iron_ore', count);
      ores.push(`🪙 x${count} Quặng sắt` + (luckEffect ? ' 🍀' : ''));
    }

    // 4. Lưu ly (Lapis Lazuli) - Tỉ lệ 1:10 (10%) | Yêu cầu Cúp Cấp 2+ (Đá+)
    if (tier >= config.ORE_REQUIREMENTS.lapis && Math.random() < (config.MINING_RATES.lapis * (luckEffect ? 1.5 : 1.0))) {
      const count = Math.floor(minOres * 2 + Math.random() * (maxOres * 2)) + (luckEffect ? 2 : 0);
      db.addItem(player, 'lapis', count);
      ores.push(`🔷 x${count} Ngọc lưu ly (Lapis)` + (luckEffect ? ' 🍀' : ''));
    }

    // 5. Đá đỏ (Redstone) - Tỉ lệ 1:10 (10%) | Yêu cầu Cúp Cấp 3+ (Sắt+)
    if (tier >= config.ORE_REQUIREMENTS.redstone && Math.random() < (config.MINING_RATES.redstone * (luckEffect ? 1.5 : 1.0))) {
      const count = Math.floor(minOres * 2 + Math.random() * (maxOres * 2)) + (luckEffect ? 2 : 0);
      db.addItem(player, 'redstone', count);
      ores.push(`🔴 x${count} Bột đá đỏ (Redstone)` + (luckEffect ? ' 🍀' : ''));
    }

    // 6. Quặng vàng (Gold Ore) - Tỉ lệ 1:10 (10%) | Yêu cầu Cúp Cấp 3+ (Sắt+)
    if (tier >= config.ORE_REQUIREMENTS.gold_ore && Math.random() < (config.MINING_RATES.gold_ore * (luckEffect ? 1.6 : 1.0))) {
      const count = Math.floor(1 + Math.random() * minOres) + (luckEffect ? 1 : 0);
      db.addItem(player, 'gold_ore', count);
      ores.push(`🪙 x${count} Quặng vàng` + (luckEffect ? ' 🍀' : ''));
    }

    // 7. Kim cương (Diamond) - Tỉ lệ 1:50 (2%) | Yêu cầu Cúp Cấp 3+ (Sắt+) - May mắn tăng x2 tỉ lệ!
    if (tier >= config.ORE_REQUIREMENTS.diamond && Math.random() < (config.MINING_RATES.diamond * luckMult)) {
      const count = Math.floor(1 + Math.random() * Math.max(1, tier - 2)) + (luckEffect ? 1 : 0);
      db.addItem(player, 'diamond', count);
      ores.push(`💎 **x${count} KIM CƯƠNG LẤP LÁNH (1:50)!**` + (luckEffect ? ' 🍀 *(May Mắn x2!)*' : ''));
    }

    // 8. Hắc diện thạch (Obsidian) - Tỉ lệ 1:25 (4%) | BẮT BUỘC: Cúp Cấp 4+ (Kim Cương trở lên)
    if (tier >= config.ORE_REQUIREMENTS.obsidian && Math.random() < ((config.MINING_RATES.obsidian || (1 / 25)) * luckMult)) {
      const count = Math.floor(1 + Math.random() * Math.max(1, tier - 2)) + (luckEffect ? 1 : 0);
      db.addItem(player, 'obsidian', count);
      ores.push(`⬛ **x${count} Hắc diện thạch (Obsidian)!**` + (luckEffect ? ' 🍀' : ''));
    }

    // Nếu không trúng quặng nào, luôn rơi ít nhất một ít đá cuội
    if (ores.length === 0) {
      const fallback = Math.max(1, minOres);
      db.addItem(player, 'cobblestone', fallback);
      ores.push(`🪨 x${fallback} Đá cuội`);
    }

    // Giảm độ bền cúp
    const brokenAlert = this.consumePickaxeDurability(player, pickaxe);

    // Kỹ năng khai thác
    if (!player.skills.mining) player.skills.mining = { level: 1, exp: 0 };
    player.skills.mining.exp += 15;
    if (player.skills.mining.exp >= 100) {
      player.skills.mining.exp -= 100;
      player.skills.mining.level += 1;
    }

    db.addExp(player, 12);
    db.saveData();

    return {
      success: true,
      ores,
      pickaxe,
      brokenAlert,
      message: `⛏️ Sử dụng **${pickEmoji} ${pickName}** (Tốc độ: **${speedDesc}**):\n\n` +
        ores.map(o => `• ${o}`).join('\n') +
        `\n\n⭐ **+12 EXP** | ⛏️ **EXP Khai Thác:** +15` +
        (luckEffect ? `\n🍀 *Hiệu ứng Thuốc May Mắn đang kích hoạt: Tăng 2x tỉ lệ Kim Cương & Quặng quý!*` : '') +
        (brokenAlert ? `\n\n${brokenAlert}` : '')
    };
  }

  /**
   * Đào khoáng sản tại Địa Ngục Nether
   * Tỉ lệ chuẩn xác:
   * - Đá Netherrack: 1:1.2 (~83.3%) | Cúp cấp 1+
   * - Thạch anh (Quartz): 1:7 (~14.3%) | Cúp cấp 1+
   * - Ancient Debris (Mảnh vỡ cổ đại): 1:130 (~0.77%) | BẮT BUỘC: Cúp Kim Cương hoặc Netherite (Cấp 4+)
   * Cúp dưới kim cương KHÔNG BAO GIỜ ra Ancient Debris!
   */
  mineNether(player) {
    if (!player.unlocked || !player.unlocked.nether) {
      return { success: false, message: '❌ Bạn chưa mở khóa Cổng Nether! Hãy thu thập 10 Hắc diện thạch + 1 Bật lửa để kích hoạt cổng.' };
    }

    const pickaxe = this.findBestPickaxe(player);
    if (!pickaxe) {
      return {
        success: false,
        noPickaxe: true,
        message: '❌ **Bạn không có Cúp (Pickaxe) nào!**\nKhông thể khai thác đá Netherrack và Thạch anh bằng tay không.'
      };
    }

    const cooldownMs = this.getPickaxeCooldown(pickaxe);
    const now = Date.now();
    const lastMine = player.lastMine || 0;
    if (now - lastMine < cooldownMs) {
      const wait = ((cooldownMs - (now - lastMine)) / 1000).toFixed(1);
      return {
        success: false,
        onCooldown: true,
        remainingSec: wait,
        cooldownSec: (cooldownMs / 1000).toFixed(1),
        pickaxe,
        message: `⏳ **Bạn đang nghỉ tay!** Vui lòng chờ thêm **${wait}s** nữa để tiếp tục đào Nether.\n*(Tốc độ đào của ${pickaxe.emoji} **${pickaxe.name}** là **${(cooldownMs / 1000).toFixed(1)}s**/lần)*`
      };
    }

    player.lastMine = now;

    const usedSlots = db.getUsedSlots(player);
    const maxSlots = db.getMaxSlots(player);
    if (usedSlots >= maxSlots && !db.hasInventorySpaceFor(player, 'netherrack', 1)) {
      return {
        success: false,
        inventoryFull: true,
        usedSlots,
        maxSlots,
        message: `❌ **Kho đồ của bạn đã chật kín (${usedSlots}/${maxSlots} Slot)!**\n` +
          `Không thể chứa thêm khoáng sản Nether. Hãy chế tạo **Rương Mở Rộng (+24 Slot)** (tốn 64 Block Gỗ 🪵) hoặc vứt bớt đồ!`
      };
    }

    // Nguy cơ trượt chân vào nham thạch (6% cơ hội mất máu)
    const lavaRisk = Math.random() < 0.06;
    let lavaWarning = '';
    if (lavaRisk) {
      const dmg = 8;
      player.hp -= dmg;
      lavaWarning = `\n🔥 **NGUY HIỂM!** Bạn vô tình trượt chân chạm vào dòng Nham Thạch sôi sục! Mất **${dmg}** Máu!`;
      if (player.hp <= 0) {
        db.saveData();
        return { success: false, died: true, cause: 'bị thiêu rụi bởi dòng nham thạch ở Nether' };
      }
    }

    const { tier, minOres, maxOres, speedDesc, name: pickName, emoji: pickEmoji } = pickaxe;
    const itemsGained = [];

    // 1. Đá địa ngục (Netherrack) - Tỉ lệ 1:1.2 (~83.3%) | Yêu cầu Cúp Cấp 1+
    if (tier >= config.ORE_REQUIREMENTS.netherrack && Math.random() < config.NETHER_MINING_RATES.netherrack) {
      const count = Math.floor(minOres * 2 + Math.random() * (maxOres * 2));
      db.addItem(player, 'netherrack', count);
      itemsGained.push(`🧱 x${count} Đá địa ngục (Netherrack)`);
    }

    // 2. Thạch anh Nether (Quartz) - Tỉ lệ 1:7 (~14.3%) | Yêu cầu Cúp Cấp 1+
    if (tier >= config.ORE_REQUIREMENTS.quartz && Math.random() < config.NETHER_MINING_RATES.quartz) {
      const count = Math.floor(minOres + Math.random() * (maxOres - minOres + 1));
      db.addItem(player, 'quartz', count);
      itemsGained.push(`▫️ x${count} Thạch anh Nether`);
    }

    // Bột đá phát sáng (Glowstone Dust) bonus
    if (Math.random() < 0.25) {
      const glow = Math.floor(1 + Math.random() * minOres);
      db.addItem(player, 'glowstone_dust', glow);
      itemsGained.push(`✨ x${glow} Bột đá phát sáng`);
    }

    // 3. Mảnh vỡ cổ đại (Ancient Debris) - Tỉ lệ 1:130 (~0.77%)
    // BẮT BUỘC: Cúp Kim Cương (Tier 4) hoặc Cúp Netherite (Tier 5)!
    // Cúp gỗ/đá/sắt KHÔNG BAO GIỜ đào được quặng này!
    const luckEffect = db.hasEffect(player, 'luck');
    const luckMult = luckEffect ? 2.0 : 1.0;
    if (tier >= config.ORE_REQUIREMENTS.ancient_debris) {
      if (Math.random() < (config.NETHER_MINING_RATES.ancient_debris * luckMult)) {
        db.addItem(player, 'ancient_debris', 1);
        itemsGained.push(`🧱 **x1 MẢNH VỠ CỔ ĐẠI (ANCIENT DEBRIS) SIÊU HIẾM (1:130)!**` + (luckEffect ? ' 🍀 *(May Mắn x2!)*' : ''));
      }
    }

    // Fallback nếu không trúng
    if (itemsGained.length === 0) {
      const fallback = Math.max(2, minOres);
      db.addItem(player, 'netherrack', fallback);
      itemsGained.push(`🧱 x${fallback} Đá địa ngục (Netherrack)`);
    }

    // Giảm độ bền cúp
    const brokenAlert = this.consumePickaxeDurability(player, pickaxe);

    db.addExp(player, 18);
    db.saveData();

    return {
      success: true,
      itemsGained,
      pickaxe,
      brokenAlert,
      message: `🌋 Sử dụng **${pickEmoji} ${pickName}** (Tốc độ: **${speedDesc}**):\n\n` +
        itemsGained.map(i => `• ${i}`).join('\n') +
        `\n\n⭐ **+18 EXP**${lavaWarning}` +
        (luckEffect ? `\n🍀 *Hiệu ứng Thuốc May Mắn đang kích hoạt: Tăng 2x cơ hội đào trúng Mảnh Vỡ Cổ Đại!*` : '') +
        (brokenAlert ? `\n\n${brokenAlert}` : '')
    };
  }
}

module.exports = new MiningSystem();
