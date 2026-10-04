const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const MARKET_FILE = path.join(DATA_DIR, 'market.json');

// Đảm bảo thư mục data tồn tại
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.players = new Map();
    this.market = [];
    this.loadData();

    // Tự động lưu mỗi 30 giây
    const saveTimer = setInterval(() => {
      this.saveData();
    }, 30000);
    if (saveTimer.unref) saveTimer.unref();
  }

  loadData() {
    try {
      if (fs.existsSync(PLAYERS_FILE)) {
        const raw = fs.readFileSync(PLAYERS_FILE, 'utf8');
        const data = JSON.parse(raw);
        for (const [id, player] of Object.entries(data)) {
          if (player.pvpHpStolen === undefined) player.pvpHpStolen = 0;
          if (player.customMaxHp === undefined) player.customMaxHp = null;
          if (player.dexterity === undefined) player.dexterity = 0;
          if (!player.effects) player.effects = {};
          player.maxHp = this.getMaxHp(player);
          if (player.hp > player.maxHp) player.hp = player.maxHp;
          this.players.set(id, player);
        }
      }
      if (fs.existsSync(MARKET_FILE)) {
        const raw = fs.readFileSync(MARKET_FILE, 'utf8');
        this.market = JSON.parse(raw);
      }
      console.log(`[Database] Đã nạp ${this.players.size} người chơi và ${this.market.length} mục chợ.`);
    } catch (err) {
      console.error('[Database] Lỗi khi nạp dữ liệu:', err);
    }
  }

  saveData() {
    try {
      const obj = {};
      for (const [id, player] of this.players.entries()) {
        obj[id] = player;
      }
      fs.writeFileSync(PLAYERS_FILE, JSON.stringify(obj, null, 2), 'utf8');
      fs.writeFileSync(MARKET_FILE, JSON.stringify(this.market, null, 2), 'utf8');
    } catch (err) {
      console.error('[Database] Lỗi khi lưu dữ liệu:', err);
    }
  }

  // Lấy hoặc tạo hồ sơ người chơi
  getPlayer(userId, username = 'Người Chơi', avatarUrl = null) {
    if (this.players.has(userId)) {
      const player = this.players.get(userId);
      // Cập nhật tên và avatar mới nhất nếu có
      if (username && username !== 'Người Chơi') player.name = username;
      if (avatarUrl) player.avatar = avatarUrl;
      if (player.pvpHpStolen === undefined) player.pvpHpStolen = 0;
      if (player.customMaxHp === undefined) player.customMaxHp = null;
      if (!player.effects) player.effects = {};
      player.maxHp = this.getMaxHp(player);
      if (player.hp > player.maxHp) player.hp = player.maxHp;
      return player;
    }

    // Khởi tạo hồ sơ người chơi mới (bắt đầu từ bàn tay trắng 0 đồ)
    const newPlayer = {
      id: userId,
      name: username,
      avatar: avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
      effects: {},
      level: 1,
      exp: 0,
      maxExp: 200,
      hp: 40,
      maxHp: 40,
      pvpHpStolen: 0,
      customMaxHp: null,
      mana: 10,
      maxMana: 10,
      coins: 0,
      bank: 0,
      inventory: [],
      chest: [], // Rương cá nhân tại Nhà (an toàn khi chết)
      equipment: {
        pickaxe: null,
        axe: null,
        sword: null,
        bow: null,
        helmet: null,
        chestplate: null,
        leggings: null,
        boots: null,
        shield: null
      },
      durability: {},
      skills: {
        mining: { level: 1, exp: 0 },
        woodcutting: { level: 1, exp: 0 },
        combat: { level: 1, exp: 0 },
        farming: { level: 1, exp: 0 }
      },
      stats: {
        deaths: 0,
        mobsKilled: 0,
        pvpWins: 0,
        pvpLosses: 0,
        dragonKilled: 0
      },
      unlocked: {
        nether: false,
        the_end: false
      },
      settings: {
        language: 'vi',
        durabilityAlert: true,
        dmNotify: false
      },
      dexterity: 0, // Độ Khéo Léo (Aim: Kiếm 80%-99%, Cung 70%-93%, Max 25)
      extraSlots: 0, // Slot mở rộng thêm từ việc chế rương (+24 slot/rương)
      chestsCrafted: 0,
      lastDaily: 0,
      lastFlight: 0,
      lastDragonFight: 0,
      lastDeathReason: null
    };

    this.players.set(userId, newPlayer);
    this.saveData();
    return newPlayer;
  }

  // Lấy tổng số slot tối đa của túi đồ cá nhân trên người (mặc định cố định 24 ô chuẩn Minecraft)
  getMaxSlots(player) {
    return 24;
  }

  // Lấy số slot tối đa của Rương tại Nhà (Mặc định 0 ô, mỗi lần dùng 64 block gỗ thì +8 ô vô hạn)
  getHomeChestMaxSlots(player) {
    return player.homeChestSlots || 0;
  }

  // Kiểm tra vật phẩm không xếp chồng (1 món = 1 slot theo chuẩn Minecraft: totem, giáp, kiếm, cúp, rìu, bật lửa, v.v.)
  isUnstackableItem(itemId, def = null) {
    if (!def && itemId) def = config.ITEMS[itemId];
    if (def && def.stackSize === 1) return true;
    const GEAR_TYPES = ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots', 'tool', 'armor', 'weapon', 'potion_splash'];
    if (def && GEAR_TYPES.includes(def.type)) return true;
    if (typeof itemId === 'string') {
      const lower = itemId.toLowerCase();
      if (lower.includes('totem') || lower.includes('flint') || lower.includes('sword') ||
          lower.includes('pickaxe') || lower.includes('axe') || lower.includes('helmet') ||
          lower.includes('chestplate') || lower.includes('leggings') || lower.includes('boots') ||
          lower.includes('shield') || lower.includes('bow') || lower.includes('crossbow') ||
          lower.includes('mace') || lower.includes('water_bucket') || lower.includes('lava_bucket') ||
          lower.includes('elytra') || lower.includes('spyglass') || lower.includes('shulker_box') ||
          lower.includes('dragon_egg') || lower.includes('music_disc')) {
        return true;
      }
    }
    return false;
  }

  // Lấy giới hạn xếp chồng trong 1 slot đồ (Vũ khí/giáp/totem/bật lửa: 1 món = 1 slot, vật phẩm thường 64 cái = 1 slot)
  getItemMaxStack(itemId, def = null) {
    if (this.isUnstackableItem(itemId, def)) return 1;
    if (!def && itemId) def = config.ITEMS[itemId];
    return (def && def.stackSize) ? def.stackSize : 64;
  }

  // Lấy số slot đã sử dụng trong Rương tại Nhà
  getHomeChestUsedSlots(player) {
    if (!player.chest || player.chest.length === 0) return 0;
    return player.chest.reduce((sum, item) => {
      if (!item.count || item.count <= 0) return sum;
      const itemId = item.itemId || item.id;
      const def = config.ITEMS[itemId];
      const maxStack = this.getItemMaxStack(itemId, def);
      return sum + Math.ceil(item.count / maxStack);
    }, 0);
  }

  // Kiểm tra Rương tại Nhà còn chỗ trống cho vật phẩm không
  hasHomeChestSpaceFor(player, itemId, count = 1) {
    const maxSlots = this.getHomeChestMaxSlots(player);
    const usedSlots = this.getHomeChestUsedSlots(player);
    const def = config.ITEMS[itemId];
    const maxStack = this.getItemMaxStack(itemId, def);

    if (maxStack === 1) {
      return usedSlots + count <= maxSlots;
    }

    const existing = (player.chest || []).find(i => (i.itemId || i.id) === itemId);
    if (existing) {
      const currentStacks = Math.ceil(existing.count / maxStack);
      const newStacks = Math.ceil((existing.count + count) / maxStack);
      const addedStacks = newStacks - currentStacks;
      return usedSlots + addedStacks <= maxSlots;
    }

    const neededStacks = Math.ceil(count / maxStack);
    return usedSlots + neededStacks <= maxSlots;
  }

  // Cất vật phẩm từ Túi đồ vào Rương tại Nhà
  depositToHomeChest(player, itemId, count = 1) {
    if (!this.hasItem(player, itemId, count)) {
      return { success: false, message: '❌ Bạn không có đủ vật phẩm này trong túi để cất!' };
    }
    if (!this.hasHomeChestSpaceFor(player, itemId, count)) {
      return {
        success: false,
        message: `❌ **Rương tại Nhà đã đầy!** (${this.getHomeChestUsedSlots(player)}/${this.getHomeChestMaxSlots(player)} Ô).\n💡 Hãy nâng cấp rương bằng **64 Block Gỗ Sồi 🪵** để nhận thêm **+8 Ô** rương!`
      };
    }
    this.removeItem(player, itemId, count);
    if (!player.chest) player.chest = [];
    const existing = player.chest.find(i => (i.itemId || i.id) === itemId);
    if (existing) {
      existing.count += count;
    } else {
      player.chest.push({ itemId, count });
    }
    this.saveData();
    const def = config.ITEMS[itemId];
    return {
      success: true,
      message: `📥 Đã cất ${def ? def.emoji : '📦'} x${count} **${def ? def.name : itemId}** vào Rương tại Nhà! (Rương hiện tại: **${this.getHomeChestUsedSlots(player)}/${this.getHomeChestMaxSlots(player)} Ô**)`
    };
  }

  // Cất món đồ đang trang bị trên người (cúp, giáp, cánh, kiếm...) thẳng vào Rương tại Nhà
  depositEquipmentToHomeChest(player, slot) {
    if (!player.equipment || !player.equipment[slot]) {
      return { success: false, message: '❌ Bạn không đang trang bị món đồ này trên người!' };
    }
    const itemId = player.equipment[slot];
    if (!this.hasHomeChestSpaceFor(player, itemId, 1)) {
      return {
        success: false,
        message: `❌ **Rương tại Nhà đã đầy!** (${this.getHomeChestUsedSlots(player)}/${this.getHomeChestMaxSlots(player)} Ô).\n💡 Hãy nâng cấp rương bằng **64 Block Gỗ Sồi 🪵** để nhận thêm **+8 Ô** rương!`
      };
    }
    // Gỡ trang bị khỏi người
    player.equipment[slot] = null;
    if (player.durability && player.durability[slot] !== undefined) {
      delete player.durability[slot];
    }
    // Cất vào rương an toàn
    if (!player.chest) player.chest = [];
    const existing = player.chest.find(i => (i.itemId || i.id) === itemId);
    if (existing) {
      existing.count += 1;
    } else {
      player.chest.push({ itemId, count: 1 });
    }
    this.saveData();
    const def = config.ITEMS[itemId];
    return {
      success: true,
      message: `📥 Đã tháo ${def ? def.emoji : '📦'} **${def ? def.name : itemId}** từ trên người và cất an toàn vào Rương tại Nhà! (Rương hiện tại: **${this.getHomeChestUsedSlots(player)}/${this.getHomeChestMaxSlots(player)} Ô**)`
    };
  }

  // Rút vật phẩm từ Rương tại Nhà về Túi cá nhân
  withdrawFromHomeChest(player, itemId, count = 1) {
    if (!player.chest) player.chest = [];
    const itemInChest = player.chest.find(i => (i.itemId || i.id) === itemId);
    if (!itemInChest || itemInChest.count < count) {
      return { success: false, message: '❌ Trong rương không có đủ số lượng món đồ này!' };
    }
    if (!this.hasInventorySpaceFor(player, itemId, count)) {
      return {
        success: false,
        message: `❌ **Túi đồ cá nhân đã đầy!** (${this.getUsedSlots(player)}/${this.getMaxSlots(player)} Ô). Hãy dọn bớt đồ trong túi trước!`
      };
    }
    itemInChest.count -= count;
    if (itemInChest.count <= 0) {
      player.chest = player.chest.filter(i => (i.itemId || i.id) !== itemId);
    }
    this.addItem(player, itemId, count);
    this.saveData();
    const def = config.ITEMS[itemId];
    return {
      success: true,
      message: `📤 Đã lấy ${def ? def.emoji : '📦'} x${count} **${def ? def.name : itemId}** từ Rương về Túi đồ!`
    };
  }

  // Nâng cấp rương tại Nhà (+8 Ô, tốn 64 Gỗ sồi)
  upgradeHomeChest(player) {
    const logCount = this.getItemCount(player, 'oak_log');
    if (logCount < 64) {
      return {
        success: false,
        message: `❌ **Không đủ gỗ sồi!**\nCần **64 Block Gỗ Sồi 🪵** để mở rộng thêm **+8 Ô** Rương tại Nhà. (Hiện có: **${logCount}/64**)`
      };
    }
    this.removeItem(player, 'oak_log', 64);
    player.homeChestSlots = (player.homeChestSlots || 0) + 8;
    this.saveData();
    return {
      success: true,
      newSlots: player.homeChestSlots,
      message: `🎉 **NÂNG CẤP RƯƠNG TẠI NHÀ THÀNH CÔNG!**\nĐã dùng **64 Block Gỗ Sồi 🪵**.\n📦 Sức chứa Rương tại Nhà hiện tại: **${player.homeChestSlots} Ô (Slot)** *(Mở rộng vô hạn!)*`
    };
  }

  // Lấy hoặc khởi tạo độ bền của trang bị
  getDurability(player, slot) {
    if (!player.equipment || !player.equipment[slot]) return null;
    const itemId = player.equipment[slot];
    const def = config.ITEMS[itemId];
    if (!def || !def.maxDurability) return null;
    if (!player.durability) player.durability = {};
    if (player.durability[slot] === undefined) {
      player.durability[slot] = def.durability || def.maxDurability;
    }
    return {
      current: Math.max(0, player.durability[slot]),
      max: def.maxDurability,
      percent: Math.round((Math.max(0, player.durability[slot]) / def.maxDurability) * 100)
    };
  }

  // Tiêu hao độ bền trang bị (áp dụng bùa Chậm Hỏng - Unbreaking)
  consumeDurability(player, slot, amount = 1) {
    if (!player.equipment || !player.equipment[slot]) return { consumed: false };
    const itemId = player.equipment[slot];
    const def = config.ITEMS[itemId];
    if (!def || !def.maxDurability) return { consumed: false };

    if (!player.durability) player.durability = {};
    if (player.durability[slot] === undefined) {
      player.durability[slot] = def.durability || def.maxDurability;
    }

    // Bùa Chậm Hỏng (Unbreaking): Cấp 1 (50% không tốn), Cấp 2 (66% không tốn), Cấp 3 (75% không tốn)
    const unbreakingLvl = (player.enchants && player.enchants[slot] && player.enchants[slot].unbreaking) || 0;
    if (unbreakingLvl > 0) {
      const ignoreRate = unbreakingLvl === 1 ? 0.50 : (unbreakingLvl === 2 ? 0.66 : 0.75);
      if (Math.random() < ignoreRate) {
        return {
          consumed: false,
          broken: false,
          ignoredByUnbreaking: true,
          current: player.durability[slot],
          remaining: player.durability[slot],
          max: def.maxDurability,
          name: def.name,
          emoji: def.emoji
        };
      }
    }

    player.durability[slot] -= amount;

    if (player.durability[slot] <= 0) {
      // Đồ bị vỡ!
      const brokenItem = { ...def, slot };
      player.equipment[slot] = null;
      delete player.durability[slot];
      if (player.enchants && player.enchants[slot]) {
        delete player.enchants[slot];
      }
      this.saveData();
      return {
        broken: true,
        consumed: true,
        item: brokenItem,
        name: def.name,
        emoji: def.emoji,
        remaining: 0,
        current: 0,
        max: def.maxDurability
      };
    }

    this.saveData();
    return {
      consumed: true,
      broken: false,
      remaining: player.durability[slot],
      current: player.durability[slot],
      max: def.maxDurability,
      name: def.name,
      emoji: def.emoji,
      percent: Math.round((player.durability[slot] / def.maxDurability) * 100)
    };
  }

  // Bùa Tu Sửa (Mending): Dùng EXP để tự động sửa chữa độ bền trang bị đang đeo
  repairWithMending(player, expGained) {
    if (!player.equipment || expGained <= 0) return [];
    if (!player.enchants) return [];

    const repaired = [];
    const slots = ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'];
    for (const slot of slots) {
      if (player.equipment[slot] && player.enchants[slot] && player.enchants[slot].mending) {
        const itemId = player.equipment[slot];
        const def = config.ITEMS[itemId];
        if (def && def.maxDurability) {
          const cur = player.durability && player.durability[slot] !== undefined ? player.durability[slot] : def.maxDurability;
          if (cur < def.maxDurability) {
            // Trong Minecraft: 1 EXP hồi 2 độ bền
            const repairAmt = expGained * 2;
            const newDur = Math.min(def.maxDurability, cur + repairAmt);
            player.durability[slot] = newDur;
            repaired.push({ slot, item: def.name, healed: newDur - cur, current: newDur, max: def.maxDurability });
          }
        }
      }
    }
    if (repaired.length > 0) this.saveData();
    return repaired;
  }

  // Ghép 2 trang bị cùng loại để sửa chữa độ bền và gộp bùa phù phép (chuẩn Minecraft Anvil & Crafting Grid)
  combineItems(player, targetSlot, secondItemId) {
    const eqId = player.equipment && player.equipment[targetSlot];
    if (!eqId) return { success: false, message: '❌ Ô trang bị mục tiêu đang trống!' };
    const targetDef = config.ITEMS[eqId];
    if (eqId !== secondItemId) {
      return { success: false, message: `❌ Hai trang bị phải CÙNG LOẠI mới có thể ghép vào nhau! (${targetDef.name} khác với ${config.ITEMS[secondItemId]?.name || secondItemId})` };
    }
    if (!this.hasItem(player, secondItemId, 1)) {
      return { success: false, message: `❌ Bạn không có món **${targetDef.name}** thứ hai trong túi đồ để ghép!` };
    }

    if (!player.durability) player.durability = {};
    const maxDur = targetDef.maxDurability || 100;
    const curDur = player.durability[targetSlot] !== undefined ? player.durability[targetSlot] : (targetDef.durability || maxDur);
    // Minecraft bonus: Hồi phục độ bền món 2 + 5% maxDurability
    const bonusDur = Math.max(1, Math.floor(maxDur * 0.05));
    const addedDur = targetDef.durability || maxDur;
    const finalDur = Math.min(maxDur, curDur + addedDur + bonusDur);

    // Tiêu thụ món thứ 2 trong túi
    this.removeItem(player, secondItemId, 1);
    player.durability[targetSlot] = finalDur;
    this.saveData();

    return {
      success: true,
      item: targetDef,
      oldDur: curDur,
      newDur: finalDur,
      maxDur: maxDur,
      message: `🎉 **GHÉP & SỬA CHỮA THÀNH CÔNG!**\nĐã hợp nhất 2 **${targetDef.name}** ${targetDef.emoji} thành 1!\n• 🔧 Độ bền phục hồi: **${curDur} ➔ ${finalDur}/${maxDur}** *(Được thưởng +5% độ bền!)*`
    };
  }

  // Lấy số slot hiện đang sử dụng trong túi đồ (Vũ khí/giáp/totem/bật lửa: 1 món = 1 slot, vật phẩm thường: 64 cái = 1 slot)
  getUsedSlots(player) {
    if (!player.inventory || player.inventory.length === 0) return 0;
    return player.inventory.reduce((sum, item) => {
      if (!item.count || item.count <= 0) return sum;
      const itemId = item.itemId || item.id;
      const def = config.ITEMS[itemId];
      const maxStack = this.getItemMaxStack(itemId, def);
      return sum + Math.ceil(item.count / maxStack);
    }, 0);
  }

  // Kiểm tra còn chỗ trống trong kho đồ cho vật phẩm cụ thể không
  hasInventorySpaceFor(player, itemId, count = 1) {
    const maxSlots = this.getMaxSlots(player);
    const usedSlots = this.getUsedSlots(player);
    const def = config.ITEMS[itemId];
    const maxStack = this.getItemMaxStack(itemId, def);

    if (maxStack === 1) {
      return usedSlots + count <= maxSlots;
    }

    const existing = (player.inventory || []).find(i => (i.itemId || i.id) === itemId);
    if (existing) {
      const currentStacks = Math.ceil(existing.count / maxStack);
      const newStacks = Math.ceil((existing.count + count) / maxStack);
      const addedStacks = newStacks - currentStacks;
      return usedSlots + addedStacks <= maxSlots;
    }

    const neededStacks = Math.ceil(count / maxStack);
    return usedSlots + neededStacks <= maxSlots;
  }

  // Tính toán sức chứa balo hiện tại (trọng lượng)
  getInventoryWeight(player) {
    let currentWeight = 0;
    for (const item of player.inventory) {
      const def = config.ITEMS[item.itemId];
      const w = def ? (def.weight || 1) : 1;
      currentWeight += item.count * w;
    }
    return Math.round(currentWeight * 10) / 10;
  }

  // Sức chứa tối đa (nếu có hộp Shulker trong túi thì 4608, mặc định 1000)
  getMaxCapacity(player) {
    const hasShulker = (player.inventory || []).some(i => i.itemId === 'shulker_box');
    return hasShulker ? 4608 : 1000;
  }

  // Thêm vật phẩm vào túi đồ
  addItem(player, itemId, count = 1) {
    if (count <= 0) return true;
    const existing = player.inventory.find(i => i.itemId === itemId);
    if (existing) {
      existing.count += count;
    } else {
      player.inventory.push({ itemId, count });
    }
    this.saveData();
    return true;
  }

  // Lấy bớt hoặc xóa vật phẩm khỏi túi đồ
  removeItem(player, itemId, count = 1) {
    const index = player.inventory.findIndex(i => i.itemId === itemId);
    if (index === -1) return false;
    if (player.inventory[index].count < count) return false;

    player.inventory[index].count -= count;
    if (player.inventory[index].count <= 0) {
      player.inventory.splice(index, 1);
    }
    this.saveData();
    return true;
  }

  // Kiểm tra người chơi có đủ vật phẩm không
  hasItem(player, itemId, count = 1) {
    if (!player || !player.inventory) return false;
    const item = player.inventory.find(i => (i.itemId || i.id) === itemId);
    return item ? item.count >= count : false;
  }

  // Lấy số lượng vật phẩm trong túi
  getItemCount(player, itemId) {
    if (!player || !player.inventory) return 0;
    const item = player.inventory.find(i => (i.itemId || i.id) === itemId);
    return item ? item.count : 0;
  }

  // Thêm EXP và tính toán lên cấp
  addExp(player, amount) {
    player.exp += amount;
    let leveledUp = false;
    while (player.exp >= player.maxExp) {
      player.exp -= player.maxExp;
      player.level += 1;
      player.maxExp = Math.round(player.level * 200 * 1.2);
      // Exp KHÔNG tăng máu! Max HP cố định 40 (hoặc customMaxHp / pvpStolen / beacon)
      player.maxHp = this.getMaxHp(player);
      player.hp = Math.min(player.maxHp, player.hp);
      player.maxMana += 2;
      player.mana = player.maxMana;
      leveledUp = true;
    }
    this.saveData();
    return leveledUp;
  }

  // Tính lượng Máu tối đa của người chơi (Cố định 40 HP cơ bản, EXP không tăng máu, cộng thêm máu cướp PvP tối đa 50, trừ Admin đặt lệnh)
  getMaxHp(player) {
    if (player.customMaxHp !== undefined && player.customMaxHp !== null) {
      return player.customMaxHp;
    }
    const base = 40; // Giới hạn máu cơ bản 40 HP cho tất cả mọi người
    const pvpHp = Math.min(50, Math.max(0, player.pvpHpStolen || 0)); // Tối đa cướp được 50 máu từ PvP
    const beaconBonus = this.hasItem(player, 'beacon') ? 5 : 0;
    return base + pvpHp + beaconBonus;
  }

  // Tính tổng sát thương (Tấn công)
  getTotalAttack(player) {
    let atk = 1; // Sát thương gốc nắm đấm
    const eq = player.equipment || {};
    if (eq.sword) {
      const sw = config.ITEMS[eq.sword];
      if (sw && sw.attack) atk += sw.attack;
      // Bonus từ bùa Sắc bén (Sharpness)
      if (player.enchants && player.enchants.sword && player.enchants.sword.sharpness) {
        atk += player.enchants.sword.sharpness * 2;
      }
    } else if (eq.axe) {
      const ax = config.ITEMS[eq.axe];
      if (ax && ax.attack) atk += ax.attack;
      if (player.enchants && player.enchants.axe && player.enchants.axe.sharpness) {
        atk += player.enchants.axe.sharpness * 2;
      }
    }
    // Thêm bonus từ kỹ năng chiến đấu
    const combatLvl = player.skills && player.skills.combat ? player.skills.combat.level : 1;
    atk += Math.floor((combatLvl - 1) * 0.8);

    // Hào quang Đèn Hiệu Beacon (Rơi từ Trùm Wither)
    if (this.hasItem(player, 'beacon')) {
      atk += 2;
    }

    // Hiệu ứng Thuốc Sức Mạnh (Strength Potion)
    const strEffect = this.hasEffect(player, 'strength');
    if (strEffect) {
      atk += strEffect.value || 6;
    }

    return atk;
  }

  // Tính tổng phòng thủ (Giáp)
  getTotalDefense(player) {
    let def = 0;
    const eq = player.equipment || {};
    const slots = ['helmet', 'chestplate', 'leggings', 'boots'];
    for (const slot of slots) {
      const itemId = eq[slot];
      if (itemId && config.ITEMS[itemId]) {
        def += config.ITEMS[itemId].defense || 0;
      }
      // Bonus từ bùa Bảo vệ (Protection)
      if (player.enchants && player.enchants[slot] && player.enchants[slot].protection) {
        def += player.enchants[slot].protection * 2;
      }
    }

    // Hào quang Đèn Hiệu Beacon (Rơi từ Trùm Wither)
    if (this.hasItem(player, 'beacon')) {
      def += 2;
    }

    // Hiệu ứng Thuốc Kháng Cự (Resistance Potion)
    const resEffect = this.hasEffect(player, 'resistance');
    if (resEffect) {
      def += resEffect.value || 5;
    }

    return def;
  }

  // Tính % giảm sát thương từ phòng thủ
  getDamageReduction(defense) {
    if (defense <= 0) return 0;
    // Mỗi điểm giáp giảm khoảng 3.5%, tối đa 80%
    return Math.min(80, Math.round((defense / (defense + 20)) * 100));
  }

  // Áp dụng hiệu ứng thuốc/buff cho người chơi
  applyEffect(player, effectType, value, durationMinutes) {
    if (!player.effects) player.effects = {};
    const now = Date.now();
    const durationMs = durationMinutes * 60 * 1000;

    // Nếu hiệu ứng cũ vẫn còn thời gian, cộng dồn thêm thời gian (tối đa 30 phút)
    let newExpiresAt = now + durationMs;
    if (player.effects[effectType] && player.effects[effectType].expiresAt > now) {
      const remaining = player.effects[effectType].expiresAt - now;
      newExpiresAt = now + Math.min(30 * 60 * 1000, remaining + durationMs);
    }

    const effectInfo = {
      strength: { name: 'Sức Mạnh (Strength)', emoji: '💪' },
      resistance: { name: 'Kháng Cự (Resistance)', emoji: '🛡️' },
      luck: { name: 'May Mắn (Luck)', emoji: '🍀' }
    }[effectType] || { name: effectType, emoji: '✨' };

    player.effects[effectType] = {
      type: effectType,
      name: effectInfo.name,
      emoji: effectInfo.emoji,
      value: value,
      expiresAt: newExpiresAt
    };

    this.saveData();
    return player.effects[effectType];
  }

  // Lấy các hiệu ứng đang có hiệu lực (tự động dọn dẹp các hiệu ứng hết hạn)
  getActiveEffects(player) {
    if (!player.effects) return [];
    const now = Date.now();
    const active = [];
    let changed = false;

    for (const [type, eff] of Object.entries(player.effects)) {
      if (eff && eff.expiresAt && eff.expiresAt > now) {
        const remainingMs = eff.expiresAt - now;
        const totalSec = Math.ceil(remainingMs / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        active.push({
          ...eff,
          remainingMs,
          remainingText: `${mins > 0 ? `${mins}m` : ''}${secs}s`
        });
      } else {
        delete player.effects[type];
        changed = true;
      }
    }

    if (changed) this.saveData();
    return active;
  }

  // Kiểm tra người chơi có hiệu ứng cụ thể đang hoạt động không
  hasEffect(player, effectType) {
    if (!player.effects || !player.effects[effectType]) return null;
    const now = Date.now();
    if (player.effects[effectType].expiresAt > now) {
      return player.effects[effectType];
    }
    delete player.effects[effectType];
    return null;
  }

  // Định dạng chuỗi hiệu ứng hiển thị trong giao diện
  formatEffectsString(player) {
    const active = this.getActiveEffects(player);
    if (active.length === 0) return '';
    return active.map(eff => `${eff.emoji} **${eff.name}** (\`${eff.remainingText}\`)`).join(' | ');
  }

  // Lấy chỉ số Khéo Léo (Dexterity, tối đa 25 điểm)
  getDexterity(player) {
    return Math.min(25, Math.max(0, player.dexterity || 0));
  }

  // Tỉ lệ đánh trúng Kiếm / Cận chiến (Mặc định 80%, tối đa 99%)
  getSwordAim(player) {
    const dex = this.getDexterity(player);
    return Math.min(99, Math.round(80 + dex * 0.76));
  }

  // Tỉ lệ bắn trúng Cung (Mặc định 70%, tối đa 93%)
  getBowAim(player) {
    const dex = this.getDexterity(player);
    return Math.min(93, Math.round(70 + dex * 0.92));
  }

  // Chi phí sao (⭐ Điểm Tiềm Năng) để nâng lên cấp Khéo Léo tiếp theo (mỗi lần nâng tăng lên 1 sao: 1, 2, 3, 4...)
  getDexUpgradeCost(player) {
    const currentDex = this.getDexterity(player);
    return Math.max(1, currentDex + 1);
  }

  // Tổng số sao đã đầu tư vào Khéo Léo
  getDexUsedStars(currentDex) {
    return (currentDex * (currentDex + 1)) / 2;
  }

  // Lấy số sao (⭐ Điểm Tiềm Năng) khả dụng từ cấp độ (Mỗi cấp độ từ cấp 2 nhận 1 sao)
  getAvailableStatPoints(player) {
    const totalStars = Math.max(0, (player.level || 1) - 1) + (player.bonusStatPoints || 0);
    const currentDex = this.getDexterity(player);
    const usedStars = this.getDexUsedStars(currentDex);
    return Math.max(0, totalStars - usedStars);
  }

  // Nâng điểm Khéo Léo (Mỗi cấp Khéo Léo tốn tăng thêm 1 sao)
  upgradeDexterity(player, spendLevel = false) {
    const currentDex = this.getDexterity(player);
    if (currentDex >= 25) {
      return {
        success: false,
        reason: 'max',
        message: '🎯 Bạn đã đạt cấp độ Khéo Léo tối đa (**25/25**)! Tỉ lệ Kiếm 99% & Cung 93% đã MAX.'
      };
    }

    const cost = this.getDexUpgradeCost(player); // Cấp 0->1: 1 sao, 1->2: 2 sao, 2->3: 3 sao...
    const availablePoints = this.getAvailableStatPoints(player);

    if (availablePoints >= cost) {
      player.dexterity = currentDex + 1;
      this.saveData();
      const nextCost = this.getDexUpgradeCost(player);
      const remaining = this.getAvailableStatPoints(player);
      return {
        success: true,
        usedType: 'point',
        cost,
        dexterity: player.dexterity,
        swordAim: this.getSwordAim(player),
        bowAim: this.getBowAim(player),
        availablePoints: remaining,
        nextCost: player.dexterity < 25 ? nextCost : null,
        message: `🎉 **NÂNG CẤP KHÉO LÉO THÀNH CÔNG!**\nĐộ Khéo Léo tăng lên Cấp **${player.dexterity}/25**!\n• 🗡️ Tỉ lệ đánh trúng Kiếm: **${this.getSwordAim(player)}%** (Gốc 80% ➔ Max 99%)\n• 🏹 Tỉ lệ bắn trúng Cung: **${this.getBowAim(player)}%** (Gốc 70% ➔ Max 93%)\n*(Đã tốn: **${cost} ⭐**, còn lại: **${remaining} ⭐**${player.dexterity < 25 ? ` - Cấp tiếp theo cần: **${nextCost} ⭐**` : ' - Đã MAX!'})*`
      };
    }

    // Nếu không đủ điểm sao nhưng chọn hy sinh cấp độ
    if (spendLevel) {
      const neededLevels = Math.max(1, cost - availablePoints);
      if ((player.level || 1) <= neededLevels) {
        return {
          success: false,
          reason: 'low_level',
          message: `❌ Cấp độ của bạn là **Cấp ${player.level}**, không đủ để tiêu hao **${neededLevels} Cấp**! Hãy đánh quái thám hiểm để tích luỹ EXP lên cấp.`
        };
      }
      player.level -= neededLevels;
      player.dexterity = currentDex + 1;
      this.saveData();
      const nextCost = this.getDexUpgradeCost(player);
      return {
        success: true,
        usedType: 'level',
        cost: neededLevels,
        dexterity: player.dexterity,
        swordAim: this.getSwordAim(player),
        bowAim: this.getBowAim(player),
        currentLevel: player.level,
        nextCost: player.dexterity < 25 ? nextCost : null,
        message: `🎉 **TIÊU HAO ${neededLevels} CẤP ĐỘ ĐỂ NÂNG KHÉO LÉO!**\nĐộ Khéo Léo tăng lên Cấp **${player.dexterity}/25**!\n• 🗡️ Tỉ lệ đánh trúng Kiếm: **${this.getSwordAim(player)}%**\n• 🏹 Tỉ lệ bắn trúng Cung: **${this.getBowAim(player)}%**\n*(Cấp độ hiện tại: Cấp ${player.level}${player.dexterity < 25 ? ` - Cấp tiếp theo cần: **${nextCost} ⭐**` : ''})*`
      };
    }

    return {
      success: false,
      reason: 'need_stars',
      cost,
      availablePoints,
      message: `❌ **BẠN CẦN ${cost} ⭐ ĐỂ NÂNG LÊN CẤP ${currentDex + 1}!**\nHiện tại bạn chỉ có: **${availablePoints} ⭐** (Thiếu **${cost - availablePoints} ⭐**).\n💡 *Mỗi cấp Khéo Léo chi phí sẽ tăng thêm 1 sao (1⭐, 2⭐, 3⭐...).* Hãy đi đánh quái cày EXP lên cấp hoặc bấm nút đổi cấp độ!`
    };
  }

  // Reset hoàn toàn người chơi về vạch xuất phát ban đầu (khóa sạch Nether, The End, Lò nung, Bàn phép...)
  resetPlayer(player) {
    player.level = 1;
    player.exp = 0;
    player.maxExp = 200;
    player.hp = 40;
    player.maxHp = 40;
    player.pvpHpStolen = 0;
    player.customMaxHp = null;
    player.mana = 10;
    player.maxMana = 10;
    player.coins = 0;
    player.bank = 0;
    player.inventory = [];
    player.chest = [];
    player.equipment = {
      pickaxe: null,
      axe: null,
      sword: null,
      bow: null,
      helmet: null,
      chestplate: null,
      leggings: null,
      boots: null,
      shield: null
    };
    player.durability = {};
    player.enchants = {};
    player.effects = {};
    player.skills = {
      mining: { level: 1, exp: 0 },
      woodcutting: { level: 1, exp: 0 },
      combat: { level: 1, exp: 0 },
      farming: { level: 1, exp: 0 }
    };
    player.stats = {
      deaths: 0,
      mobsKilled: 0,
      pvpWins: 0,
      pvpLosses: 0,
      dragonKilled: 0
    };
    player.unlocked = {
      nether: false,
      the_end: false,
      furnace: false,
      enchant: false,
      enchanting_table: false
    };
    player.dexterity = 0;
    player.extraSlots = 0;
    player.chestsCrafted = 0;
    player.homeChestSlots = 0;
    player.lastDaily = 0;
    player.lastFlight = 0;
    player.lastDragonFight = 0;
    player.lastDeathReason = null;
    this.saveData();
    return player;
  }

  // Reset toàn bộ tất cả người chơi trong hệ thống về đầu
  resetAllPlayers() {
    let count = 0;
    for (const [id, player] of this.players.entries()) {
      this.resetPlayer(player);
      count++;
    }
    this.saveData();
    return count;
  }
}

module.exports = new Database();
