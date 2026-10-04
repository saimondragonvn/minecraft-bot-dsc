const db = require('../database/db');
const config = require('../config');

class WoodcuttingSystem {
  /**
   * Tìm rìu tốt nhất của người chơi (ưu tiên rìu đang trang bị, sau đó trong túi đồ)
   * @param {Object} player
   * @returns {Object}
   */
  findBestAxe(player) {
    if (player.equipment && player.equipment.axe) {
      const axeId = player.equipment.axe;
      if (config.AXE_COOLDOWNS[axeId]) {
        const itemDef = config.ITEMS[axeId] || {};
        return {
          id: axeId,
          name: itemDef.name || axeId,
          emoji: itemDef.emoji || '🪓',
          cooldown: config.AXE_COOLDOWNS[axeId],
          choppingPower: itemDef.choppingPower || 1,
          isEquipped: true
        };
      }
    }

    const axesInInv = (player.inventory || [])
      .filter(i => config.AXE_COOLDOWNS[i.itemId])
      .map(i => {
        const itemDef = config.ITEMS[i.itemId] || {};
        return {
          id: i.itemId,
          name: itemDef.name || i.itemId,
          emoji: itemDef.emoji || '🪓',
          cooldown: config.AXE_COOLDOWNS[i.itemId],
          choppingPower: itemDef.choppingPower || 1,
          isEquipped: false
        };
      })
      .sort((a, b) => a.cooldown - b.cooldown);

    if (axesInInv.length > 0) return axesInInv[0];

    // Mặc định dùng tay không: cooldown 5 giây
    return {
      id: 'none',
      name: 'Tay không',
      emoji: '✊',
      cooldown: config.AXE_COOLDOWNS.none || 5000,
      choppingPower: 0,
      isEquipped: false
    };
  }

  /**
   * Giảm độ bền của rìu
   */
  consumeAxeDurability(player, axe) {
    if (!axe || !axe.isEquipped) return null;
    let warning = null;
    if (player.durability && player.durability.axe !== undefined) {
      player.durability.axe -= 1;
      if (player.durability.axe <= 0) {
        player.equipment.axe = null;
        delete player.durability.axe;
        warning = `⚠️ **${axe.emoji} ${axe.name} của bạn đã bị gãy do hết độ bền!**`;
      }
    }
    return warning;
  }

  /**
   * Thực hiện đốn gỗ
   */
  chop(player) {
    const axe = this.findBestAxe(player);
    const now = Date.now();
    const lastChop = player.lastChop || 0;

    if (now - lastChop < axe.cooldown) {
      const wait = ((axe.cooldown - (now - lastChop)) / 1000).toFixed(1);
      return {
        success: false,
        onCooldown: true,
        remainingSec: wait,
        cooldownSec: (axe.cooldown / 1000).toFixed(1),
        axe,
        message: `⏳ **Bạn đang nghỉ tay!** Vui lòng chờ thêm **${wait}s** nữa để tiếp tục chặt gỗ.\n*(Tốc độ vung của ${axe.emoji} **${axe.name}** là **${(axe.cooldown / 1000).toFixed(1)}s**/lần)*`
      };
    }

    player.lastChop = now;

    const usedSlots = db.getUsedSlots(player);
    const maxSlots = db.getMaxSlots(player);
    if (usedSlots >= maxSlots && !db.hasInventorySpaceFor(player, 'oak_log', 1)) {
      return {
        success: false,
        inventoryFull: true,
        usedSlots,
        maxSlots,
        axe,
        message: `❌ **Kho đồ của bạn đã chật kín (${usedSlots}/${maxSlots} Slot)!**\n` +
          `Không thể chứa thêm gỗ. Hãy chế tạo **Rương Mở Rộng (+24 Slot)** (tốn 64 Block Gỗ 🪵) hoặc vứt bớt đồ!`
      };
    }

    // Sản lượng gỗ tăng theo cấp rìu
    const bonus = axe.choppingPower || 0;
    const logs = Math.floor((3 + bonus) + Math.random() * (5 + bonus));
    db.addItem(player, 'oak_log', logs);

    const extra = [];
    if (Math.random() < 0.45) {
      const sticks = Math.floor(1 + Math.random() * (3 + bonus));
      db.addItem(player, 'stick', sticks);
      extra.push(`🥢 x${sticks} Que gỗ`);
    }
    if (Math.random() < 0.3) {
      db.addItem(player, 'apple', 1);
      extra.push(`🍎 x1 Quả Táo ngọt`);
    }

    const brokenAlert = this.consumeAxeDurability(player, axe);

    if (!player.skills.woodcutting) player.skills.woodcutting = { level: 1, exp: 0 };
    player.skills.woodcutting.exp += 15;
    if (player.skills.woodcutting.exp >= 100) {
      player.skills.woodcutting.exp -= 100;
      player.skills.woodcutting.level += 1;
    }

    db.addExp(player, 8);
    db.saveData();

    return {
      success: true,
      logs,
      extra,
      axe,
      cooldownSec: (axe.cooldown / 1000).toFixed(1),
      brokenAlert,
      message: `🪓 Sử dụng **${axe.emoji} ${axe.name}** (Tốc độ: **${(axe.cooldown / 1000).toFixed(1)}s**/lần):\n\n` +
        `• 🪵 x${logs} Gỗ sồi\n` +
        (extra.length > 0 ? extra.map(e => `• ${e}`).join('\n') + '\n' : '') +
        `\n⭐ **+8 EXP** | 🪓 **EXP Tiều Phu:** +15` +
        (brokenAlert ? `\n\n${brokenAlert}` : '')
    };
  }
}

module.exports = new WoodcuttingSystem();
