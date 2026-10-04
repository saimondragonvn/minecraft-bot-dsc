const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

class EnchantSystem {
  isUnlocked(player) {
    if (player.unlocked && player.unlocked.enchanting_table) return true;
    if (db.hasItem(player, 'enchanting_table')) {
      if (!player.unlocked) player.unlocked = {};
      player.unlocked.enchanting_table = true;
      db.saveData();
      return true;
    }
    return false;
  }

  unlock(player) {
    const diamondCount = db.getItemCount(player, 'diamond');
    const obsidianCount = db.getItemCount(player, 'obsidian');

    if (diamondCount < 2 || obsidianCount < 4) {
      return {
        success: false,
        message: `❌ **Không đủ nguyên liệu khai mở Bàn Phù Phép!**\n` +
          `• 💎 Kim Cương: **${diamondCount}/2** viên\n` +
          `• ⬛ Hắc Diện Thạch: **${obsidianCount}/4** khối\n` +
          `*(Hãy đào thêm Kim Cương \`/mine\` tỉ lệ 1:50 hoặc đúc Hắc Diện Thạch tại Bàn Chế Tạo)*`
      };
    }

    db.removeItem(player, 'diamond', 2);
    db.removeItem(player, 'obsidian', 4);
    if (!player.unlocked) player.unlocked = {};
    player.unlocked.enchanting_table = true;
    db.saveData();

    return {
      success: true,
      message: `🎉 **KHAI MỞ BÀN PHÙ PHÉP THÀNH CÔNG!** 🔮\n` +
        `Bạn đã tiêu hao **2 Kim Cương 💎** và **4 Hắc Diện Thạch ⬛** để tạo dựng chiếc **Bàn Phù Phép (Enchanting Table)** huyền bí vĩnh viễn!\n` +
        `Các ký tự Rune cổ đại đã thức tỉnh. Bây giờ bạn có thể yểm bùa trang bị bằng EXP và Ngọc Lưu Ly (Lapis 🔷).`
    };
  }

  buildEnchantUnlockScreen(player) {
    const diamondCount = db.getItemCount(player, 'diamond');
    const obsidianCount = db.getItemCount(player, 'obsidian');
    const hasEnough = diamondCount >= 2 && obsidianCount >= 4;

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('🔮 KHAI MỞ BÀN PHÙ PHÉP (ENCHANTING TABLE)')
      .setDescription(
        `Chào mừng bạn đến với khu vực **Bàn Phù Phép Ma Thuật**!\n` +
        `Bàn Phù Phép hiện đang bị phong ấn trong cổ thạch. Để khai mở ma thuật và quay Gacha bùa chú cho vũ khí & giáp, bạn cần cung cấp đủ vật phẩm hiến tế.\n\n` +
        `✨ **Yêu cầu mở khóa vĩnh viễn:**\n` +
        `• 💎 **Kim Cương (Diamond):** **${diamondCount}/2** viên ${diamondCount >= 2 ? '✅ **(ĐÃ ĐỦ)**' : '❌ **(THIẾU)**'}\n` +
        `• ⬛ **Hắc Diện Thạch (Obsidian):** **${obsidianCount}/4** khối ${obsidianCount >= 4 ? '✅ **(ĐÃ ĐỦ)**' : '❌ **(THIẾU)**'}\n\n` +
        (hasEnough
          ? `👉 *Bạn đã hội tụ đủ nguyên liệu thượng đẳng! Hãy bấm nút **[🔮 Khai Mở Bàn Phù Phép]** bên dưới để mở khóa ngay vĩnh viễn!*`
          : `💡 *Mẹo tìm kiếm:* Đào Kim Cương tại Hang Đá (\`/mine\` - tỉ lệ 1:50) và đúc Hắc Diện Thạch tại Bàn Chế Tạo (\`/craft\`)!`)
      );

    const row = new ActionRowBuilder();
    if (hasEnough) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('enchant_unlock_confirm')
          .setLabel('🔮 Khai Mở Bàn Phù Phép (-2 💎, -4 ⬛)')
          .setStyle(ButtonStyle.Success)
      );
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('enchant_unlock_disabled')
          .setLabel(`🔒 Cần 2 💎 & 4 ⬛ (Có: ${diamondCount}/2 💎, ${obsidianCount}/4 ⬛)`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }

    row.addComponents(
      new ButtonBuilder()
        .setCustomId('menu_areas')
        .setLabel('Quay lại Khu Vực')
        .setEmoji('🗺️')
        .setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
  }

  constructor() {
    this.ENCHANTS = {
      sharpness: {
        id: 'sharpness',
        name: 'Sắc bén (Sharpness)',
        emoji: '⚔️',
        slots: ['sword'],
        maxLevel: 5,
        description: 'Tăng +2 Sát thương Tấn công mỗi cấp độ',
        getBonus: (lvl) => lvl * 2,
        cost: (lvl) => ({ lapis: lvl, exp: lvl * 30 })
      },
      smite: {
        id: 'smite',
        name: 'Trừng phạt (Smite)',
        emoji: '⚡',
        slots: ['sword', 'axe'],
        maxLevel: 5,
        description: 'Tăng +4 Sát thương cực lớn khi đánh quái Xác Sống (Zombie, Skeleton, Wither)',
        getBonus: (lvl) => lvl * 4,
        cost: (lvl) => ({ lapis: lvl, exp: lvl * 30 })
      },
      fire_aspect: {
        id: 'fire_aspect',
        name: 'Góc nhìn lửa (Fire Aspect)',
        emoji: '🔥',
        slots: ['sword'],
        maxLevel: 2,
        description: 'Thiêu đốt kẻ địch gây thêm 3–6 sát thương lửa mỗi lượt',
        getBonus: (lvl) => lvl * 3,
        cost: (lvl) => ({ lapis: lvl * 2, exp: lvl * 40 })
      },
      looting: {
        id: 'looting',
        name: 'Cướp bóc (Looting)',
        emoji: '💰',
        slots: ['sword'],
        maxLevel: 3,
        description: 'Tăng thêm 25% tỉ lệ rơi đồ hiếm và gấp đôi lượng tiền xu nhặt được',
        getBonus: (lvl) => lvl * 0.25,
        cost: (lvl) => ({ lapis: lvl * 2, exp: lvl * 45 })
      },
      protection: {
        id: 'protection',
        name: 'Bảo vệ (Protection)',
        emoji: '🛡️',
        slots: ['helmet', 'chestplate', 'leggings', 'boots'],
        maxLevel: 4,
        description: 'Tăng +2 Điểm Giáp phòng thủ mỗi cấp độ',
        getBonus: (lvl) => lvl * 2,
        cost: (lvl) => ({ lapis: lvl, exp: lvl * 30 })
      },
      thorns: {
        id: 'thorns',
        name: 'Gai (Thorns)',
        emoji: '🌵',
        slots: ['helmet', 'chestplate', 'leggings', 'boots'],
        maxLevel: 3,
        description: 'Phản lại 2–6 sát thương cho kẻ tấn công khi bạn bị đánh trúng',
        getBonus: (lvl) => lvl * 2,
        cost: (lvl) => ({ lapis: lvl, exp: lvl * 35 })
      },
      efficiency: {
        id: 'efficiency',
        name: 'Hiệu suất (Efficiency)',
        emoji: '⛏️',
        slots: ['pickaxe', 'axe'],
        maxLevel: 5,
        description: 'Giảm thời gian cooldown và tăng thêm sản lượng quặng/gỗ',
        getBonus: (lvl) => lvl * 250, // ms giảm cooldown
        cost: (lvl) => ({ lapis: lvl, exp: lvl * 35 })
      },
      fortune: {
        id: 'fortune',
        name: 'Gia tài (Fortune)',
        emoji: '💎',
        slots: ['pickaxe'],
        maxLevel: 3,
        description: 'Tăng gấp bội tỉ lệ và số lượng rơi quặng quý (Kim Cương, Vàng, Sắt)',
        getBonus: (lvl) => lvl,
        cost: (lvl) => ({ lapis: lvl * 2, exp: lvl * 50 })
      },
      power: {
        id: 'power',
        name: 'Sức mạnh (Power)',
        emoji: '🏹',
        slots: ['bow'],
        maxLevel: 5,
        description: 'Tăng +3 Sát thương cho Cung mỗi cấp độ',
        getBonus: (lvl) => lvl * 3,
        cost: (lvl) => ({ lapis: lvl, exp: lvl * 30 })
      },
      unbreaking: {
        id: 'unbreaking',
        name: 'Chậm hỏng (Unbreaking)',
        emoji: '🔨',
        slots: ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'],
        maxLevel: 3,
        description: 'Giảm 50% / 66% / 75% tỉ lệ hao mòn độ bền, hạn chế tối đa nguy cơ bị vỡ',
        getBonus: (lvl) => (lvl === 1 ? 0.50 : lvl === 2 ? 0.66 : 0.75),
        cost: (lvl) => ({ lapis: lvl, exp: lvl * 25 })
      },
      mending: {
        id: 'mending',
        name: 'Tu sửa (Mending)',
        emoji: '✨',
        slots: ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'],
        maxLevel: 1,
        description: 'Tự động hấp thụ EXP khi đánh quái hoặc đào khoáng để phục hồi độ bền trang bị (Chỉ mua trong Shop 50k xu hoặc tìm rương kho báu)',
        getBonus: (lvl) => 2,
        cost: (lvl) => ({ lapis: 3, exp: 60 }),
        isTreasure: true // Không bao giờ xuất hiện ở Bàn Phù Phép!
      },
      bane_of_arthropods: {
        id: 'bane_of_arthropods',
        name: 'Hại động vật chân đốt (Bane of Arthropods)',
        emoji: '🕷️',
        slots: ['sword', 'axe'],
        maxLevel: 5,
        description: 'Tăng +4 Sát thương cực lớn khi tấn công Nhện Khổng Lồ và Nhện Hang',
        getBonus: (lvl) => lvl * 4,
        cost: (lvl) => ({ lapis: lvl, exp: lvl * 30 })
      }
    };
  }

  /**
   * Lấy danh sách các bùa có thể phù phép cho slot trang bị
   * @param {string} slot
   * @param {boolean} fromTable - Nếu từ Bàn Phù Phép thì loại trừ Mending (chỉ mua trong Shop 50k xu)
   */
  getApplicableEnchants(slot, fromTable = false) {
    return Object.values(this.ENCHANTS).filter(e => {
      if (!e.slots.includes(slot)) return false;
      if (fromTable && e.id === 'mending') return false; // Tu Sửa (Mending) không ra ở Bàn Phép!
      return true;
    });
  }

  /**
   * Lấy cấp độ enchant hiện tại của 1 slot trang bị
   */
  getEnchantLevel(player, slot, enchantId) {
    if (!player.enchants || !player.enchants[slot]) return 0;
    return player.enchants[slot][enchantId] || 0;
  }

  /**
   * Tính năng GACHA Bàn Phù Phép (Enchanting Table)
   * Tiêu hao Lapis Lazuli và EXP để quay ngẫu nhiên bùa chú
   * @param {Object} player
   * @param {string} slot - Vị trí trang bị ('sword', 'pickaxe', etc.)
   * @param {number} tier - Cấp độ gacha (1: 1 lapis, 2: 2 lapis, 3: 3 lapis)
   */
  gachaEnchant(player, slot, tier = 1) {
    if (!this.isUnlocked(player)) {
      return {
        success: false,
        message: '❌ **Bạn chưa mở khóa Bàn Phù Phép!**\nCần **2 Kim Cương 💎** và **4 Hắc Diện Thạch ⬛** để khai mở Bàn Phù Phép vĩnh viễn! (Vào `/menu` -> Bàn Phù Phép để mở khóa)'
      };
    }

    const equippedItem = player.equipment && player.equipment[slot];
    if (!equippedItem) {
      return { success: false, message: `❌ Bạn chưa trang bị vật phẩm nào ở ô **${slot}** để phù phép!` };
    }

    // Luật Minecraft: Trang bị đã có phù phép rồi thì KHÔNG thể phù phép thêm tại Bàn Phù Phép!
    if (player.enchants && player.enchants[slot] && Object.keys(player.enchants[slot]).length > 0) {
      const curList = Object.entries(player.enchants[slot])
        .map(([k, v]) => `• ✨ **${this.ENCHANTS[k]?.name || k} Cấp ${v}**`)
        .join('\n');
      return {
        success: false,
        isAlreadyEnchanted: true,
        slot,
        equippedItem,
        curList,
        message: `❌ **TRANG BỊ ĐÃ CÓ PHÙ PHÉP!**\nMón đồ ở ô **${slot}** của bạn đã có bùa chú!\n💡 *Theo luật Minecraft, Bàn Phù Phép chỉ nhận phù phép đồ TRẮNG. Hãy dùng Đá Mài (Tẩy Bùa) hoặc Cái Đe (Anvil) để ép sách!*`
      };
    }

    const applicable = this.getApplicableEnchants(slot, true);
    if (applicable.length === 0) {
      return { success: false, message: `❌ Không có bùa chú nào phù hợp cho trang bị ô **${slot}**!` };
    }

    const costs = {
      1: { lapis: 1, levels: 3, reqMinLvl: 1, label: 'Bậc 1 (Cơ Bản)' },
      2: { lapis: 2, levels: 6, reqMinLvl: 30, label: 'Bậc 2 (Trung Cấp)' },
      3: { lapis: 3, levels: 12, reqMinLvl: 50, label: 'Bậc 3 (Tối Thượng)' }
    };
    const cost = costs[tier] || costs[1];

    const playerLvl = player.level || 1;

    // Kiểm tra cấp độ để mở khóa bậc phù phép
    if (tier === 2 && playerLvl < 30) {
      return {
        success: false,
        message: `❌ **Phù Phép Bậc 2 chưa mở khóa!**\nCần đạt tối thiểu **Cấp 30** để mở khóa Bậc 2 (Hiện tại bạn đang Cấp ${playerLvl}). Cấp 1–29 chỉ có thể phù phép Bậc 1!`
      };
    }

    if (tier === 3 && playerLvl < 50) {
      return {
        success: false,
        message: `❌ **Phù Phép Bậc 3 chưa mở khóa!**\nCần đạt tối thiểu **Cấp 50** để mở khóa Bậc 3 (Hiện tại bạn đang Cấp ${playerLvl}). Cấp 30–49 chỉ có thể phù phép đến Bậc 2!`
      };
    }

    // Kiểm tra số cấp độ đủ để tiêu hao
    if (playerLvl < cost.levels) {
      return {
        success: false,
        message: `❌ **Không đủ Cấp Độ!**\nPhù phép ${cost.label} cần tiêu hao **${cost.levels} Cấp Độ** (Hiện tại bạn chỉ có Cấp ${playerLvl}). Hãy cày thêm cấp độ trước!`
      };
    }

    const currentLapis = db.getItemCount(player, 'lapis');
    if (currentLapis < cost.lapis) {
      return {
        success: false,
        message: `❌ **Không đủ Ngọc Lưu Ly (Lapis Lazuli 🔷)!**\nCần: **${cost.lapis} Lapis** (Hiện có: ${currentLapis}).\n*(Gợi ý: Cầm cúp đá trở lên đi đào trong Hang đá \`/mine\`)*`
      };
    }

    // Tiêu hao tài nguyên: Lapis và Cấp độ
    db.removeItem(player, 'lapis', cost.lapis);
    player.level = Math.max(1, playerLvl - cost.levels);
    player.maxExp = Math.round(player.level * 200 * 1.2);
    if (player.exp > player.maxExp) {
      player.exp = Math.min(player.exp, player.maxExp - 1);
    }

    // Gacha ngẫu nhiên bùa
    const chosenEnchant = applicable[Math.floor(Math.random() * applicable.length)];
    
    // Gacha ngẫu nhiên cấp độ (Tỉ lệ ra Cấp 5 ở Bậc 3 chuẩn 1:30)
    let rolledLvl = 1;
    if (tier === 1) {
      rolledLvl = Math.floor(1 + Math.random() * 2); // Cấp 1 hoặc 2
    } else if (tier === 2) {
      rolledLvl = Math.floor(2 + Math.random() * 2); // Cấp 2 hoặc 3
    } else if (tier === 3) {
      // Tỉ lệ ra Cấp 5 ở Bàn Phù Phép chính xác là 1:30 (1/30 ~ 3.33%)!
      const hitLvl5 = (Math.random() < (1 / 30));
      if (hitLvl5) {
        rolledLvl = 5;
      } else {
        rolledLvl = Math.floor(3 + Math.random() * 2); // Cấp 3 hoặc 4
      }
    }
    rolledLvl = Math.min(chosenEnchant.maxLevel, rolledLvl);

    if (!player.enchants) player.enchants = {};
    if (!player.enchants[slot]) player.enchants[slot] = {};

    player.enchants[slot][chosenEnchant.id] = rolledLvl;
    db.saveData();

    db.saveData();

    const itemDef = config.ITEMS[equippedItem] || { name: equippedItem, emoji: '📦' };

    return {
      success: true,
      enchant: chosenEnchant,
      level: rolledLvl,
      message: `🎲 **GACHA BÀN PHÙ PHÉP THÀNH CÔNG!** 🔮\n\n` +
        `Bạn đã đặt ${itemDef.emoji} **${itemDef.name}** lên Bàn Phù Phép và các ký tự ma thuật cổ đại bừng sáng:\n` +
        `✨ **Nhận được bùa:** ${chosenEnchant.emoji} **${chosenEnchant.name} Cấp ${rolledLvl}**!\n` +
        `• Tác dụng: ${chosenEnchant.description}\n` +
        `• Tiêu hao: -${cost.lapis} Lapis 🔷 | -${cost.levels} Cấp Độ ⭐ (Cấp hiện tại: **Cấp ${player.level}**)`
    };
  }

  /**
   * Ép Sách Phù Phép vào Trang Bị bằng Cái Đe (Anvil)
   * Yêu cầu: Người chơi phải có Cái Đe (chế tạo bằng 3 Khối Sắt + 4 Thỏi Sắt)
   */
  applyEnchantedBook(player, bookId, slot) {
    // 1. Kiểm tra người chơi có Cái Đe (Anvil) trong túi đồ không
    const hasAnvil = db.hasItem(player, 'anvil');
    if (!hasAnvil) {
      return {
        success: false,
        needAnvil: true,
        message: '❌ **Bạn cần có Cái Đe (Anvil) 🔨 để ép Sách Phù Phép vào Trang Bị!**\n' +
          'Hãy chế tạo Cái Đe qua lệnh `/craft recipe: craft_anvil` (Cần: 3 Khối Sắt `iron_block` + 4 Thỏi Sắt `iron_ingot`).'
      };
    }

    // 2. Kiểm tra sách trong túi đồ
    const hasBook = db.hasItem(player, bookId);
    if (!hasBook) {
      return { success: false, message: '❌ Bạn không có cuốn Sách Phù Phép này trong túi đồ!' };
    }

    const bookDef = config.ITEMS[bookId];
    if (!bookDef || bookDef.type !== 'book') {
      return { success: false, message: '❌ Vật phẩm này không phải là Sách Phù Phép hợp lệ!' };
    }

    // 3. Kiểm tra trang bị đang đeo
    const equippedItem = player.equipment && player.equipment[slot];
    if (!equippedItem) {
      return { success: false, message: `❌ Bạn chưa trang bị vật phẩm nào ở ô **${slot}** để đập đe!` };
    }

    // 4. Kiểm tra sách có phù hợp với slot không
    if (bookDef.targetSlot) {
      const allowedSlots = Array.isArray(bookDef.targetSlot) ? bookDef.targetSlot : [bookDef.targetSlot];
      if (!allowedSlots.includes(slot)) {
        return { success: false, message: `❌ Cuốn sách này chỉ dùng cho ô: **${allowedSlots.join(', ')}** (không thể ép vào ${slot})!` };
      }
    }

    // 5. Ép bùa vào trang bị
    const enchantId = bookDef.enchantId;
    const enchantLevel = bookDef.level || 1;

    if (!player.enchants) player.enchants = {};
    if (!player.enchants[slot]) player.enchants[slot] = {};

    player.enchants[slot][enchantId] = Math.max(player.enchants[slot][enchantId] || 0, enchantLevel);

    // Tiêu hao sách
    db.removeItem(player, bookId, 1);
    db.saveData();

    const itemDef = config.ITEMS[equippedItem] || { name: equippedItem, emoji: '📦' };
    const enchantDef = this.ENCHANTS[enchantId] || { name: enchantId, emoji: '✨' };

    return {
      success: true,
      message: `🔨 **ĐẬP ĐE ÉP SÁCH THÀNH CÔNG!** 🔨\n\n` +
        `Đã ép **${bookDef.name}** vào ${itemDef.emoji} **${itemDef.name}**!\n` +
        `• Bùa nhận được: ${enchantDef.emoji} **${enchantDef.name} Cấp ${enchantLevel}**\n` +
        `• Sức mạnh mới đã kích hoạt ngay lập tức!`
    };
  }

  /**
   * Tiến hành phù phép trang bị (Hỗ trợ Gacha mặc định)
   */
  enchant(player, slot, enchantId = null, tier = 1) {
    if (!enchantId || enchantId === 'gacha') {
      return this.gachaEnchant(player, slot, tier);
    }

    const enchantDef = this.ENCHANTS[enchantId];
    if (!enchantDef) return { success: false, message: 'Bùa chú không tồn tại!' };

    const equippedItem = player.equipment && player.equipment[slot];
    if (!equippedItem) {
      return { success: false, message: `❌ Bạn chưa trang bị vật phẩm nào ở ô **${slot}** để phù phép!` };
    }

    if (!enchantDef.slots.includes(slot)) {
      return { success: false, message: `❌ Bùa **${enchantDef.name}** không thể áp dụng cho trang bị ô **${slot}**!` };
    }

    const currentLvl = this.getEnchantLevel(player, slot, enchantId);
    if (currentLvl >= enchantDef.maxLevel) {
      return { success: false, message: `⭐ Bùa **${enchantDef.name}** đã đạt cấp độ tối đa (Cấp ${enchantDef.maxLevel})!` };
    }

    const nextLvl = currentLvl + 1;
    const { lapis: neededLapis, exp: neededExp } = enchantDef.cost(nextLvl);

    // Kiểm tra Ngọc Lưu Ly (Lapis)
    const currentLapis = db.getItemCount(player, 'lapis');
    if (currentLapis < neededLapis) {
      return {
        success: false,
        message: `❌ **Không đủ Ngọc Lưu Ly (Lapis Lazuli)!**\nCần: **${neededLapis} Lapis** 🔷 (Bạn chỉ có ${currentLapis}).\n*(Gợi ý: Dùng cúp đá trở lên đào trong Hang đá)*`
      };
    }

    // Kiểm tra EXP
    if (player.exp < neededExp) {
      return {
        success: false,
        message: `❌ **Không đủ EXP!**\nCần: **${neededExp} EXP** ⭐ (Bạn hiện có ${Math.round(player.exp)} EXP).\n*(Gợi ý: Đi săn quái, đào đá, chặt cây để tích lũy EXP)*`
      };
    }

    // Tiêu thụ tài nguyên
    db.removeItem(player, 'lapis', neededLapis);
    player.exp -= neededExp;

    if (!player.enchants) player.enchants = {};
    if (!player.enchants[slot]) player.enchants[slot] = {};
    player.enchants[slot][enchantId] = nextLvl;

    db.saveData();

    const itemDef = config.ITEMS[equippedItem] || { name: equippedItem, emoji: '📦' };

    return {
      success: true,
      message: `✨ **PHÙ PHÉP THÀNH CÔNG!** ✨\n` +
        `${itemDef.emoji} **${itemDef.name}** đã được yểm bùa **${enchantDef.emoji} ${enchantDef.name} Cấp ${nextLvl}**!\n` +
        `• Tác dụng: ${enchantDef.description}\n` +
        `• Tiêu hao: ${neededLapis} Lapis 🔷 | ${neededExp} EXP ⭐`
    };
  }

  /**
   * Tẩy phù phép (Xóa bùa chú) trên trang bị
   * Tiêu hao: 1 Ngọc Lưu Ly (Lapis Lazuli) / 1 lần xóa
   * @param {Object} player
   * @param {string} slot - Vị trí trang bị ('sword', 'pickaxe', etc.)
   */
  disenchantSlot(player, slot) {
    if (!player.equipment || !player.equipment[slot]) {
      return { success: false, message: `❌ Bạn chưa trang bị vật phẩm nào ở ô **${slot}**!` };
    }
    const equippedItem = player.equipment[slot];
    const itemDef = config.ITEMS[equippedItem] || { name: equippedItem, emoji: '📦' };

    if (!player.enchants || !player.enchants[slot] || Object.keys(player.enchants[slot]).length === 0) {
      return {
        success: false,
        message: `⚠️ Món **${itemDef.emoji} ${itemDef.name}** (ô **${slot}**) của bạn hiện **chưa có phù phép** nào để xóa!`
      };
    }

    const lapisCount = db.getItemCount(player, 'lapis');
    if (lapisCount < 1) {
      return {
        success: false,
        message: `❌ **Không đủ Ngọc Lưu Ly (Lapis Lazuli 🔷)!**\nĐể tẩy bùa cần tiêu tốn **1 Ngọc Lưu Ly 🔷** (Hiện có: ${lapisCount} viên).\n💡 Hãy cầm cúp đi đào trong Hang Đá \`/mine\` để kiếm thêm Lapis!`
      };
    }

    // Liệt kê các bùa bị xóa để thông báo
    const oldEnchants = Object.entries(player.enchants[slot])
      .map(([k, v]) => `• ✨ **${this.ENCHANTS[k]?.name || k} Cấp ${v}**`)
      .join('\n');

    // Trừ 1 Lapis và xóa bùa
    db.removeItem(player, 'lapis', 1);
    delete player.enchants[slot];
    db.saveData();

    return {
      success: true,
      slot,
      itemDef,
      oldEnchants,
      message:
        `🎉 **TẨY BÙA THÀNH CÔNG! (ĐÁ MÀI / GRINDSTONE)**\n\n` +
        `Đã tiêu hao: **1 Ngọc Lưu Ly 🔷**\n` +
        `Trang bị **${itemDef.emoji} ${itemDef.name}** đã được thanh tẩy hoàn toàn về đồ **TRẮNG** nguyên bản!\n\n` +
        `Các dòng bùa chú đã bị gỡ bỏ:\n${oldEnchants}\n\n` +
        `💡 *Giờ đây bạn có thể đặt món đồ này lên Bàn Phù Phép để quay lại bùa mới mong muốn!*`
    };
  }

  /**
   * Tạo giao diện Khu Tẩy Phù Phép (Đá Mài / Grindstone)
   */
  buildDisenchantScreen(player) {
    const eq = player.equipment || {};
    const lapisCount = db.getItemCount(player, 'lapis');

    const slots = [
      { slot: 'sword', name: 'Kiếm (Sword)', emoji: '🗡️' },
      { slot: 'pickaxe', name: 'Cúp (Pickaxe)', emoji: '⛏️' },
      { slot: 'axe', name: 'Rìu (Axe)', emoji: '🪓' },
      { slot: 'bow', name: 'Cung (Bow)', emoji: '🏹' },
      { slot: 'helmet', name: 'Mũ (Helmet)', emoji: '🪖' },
      { slot: 'chestplate', name: 'Áo (Chestplate)', emoji: '🥋' },
      { slot: 'leggings', name: 'Quần (Leggings)', emoji: '👖' },
      { slot: 'boots', name: 'Ủng (Boots)', emoji: '👢' }
    ];

    // Chỉ lấy những món đang trang bị VÀ đã có phù phép
    const enchantedItems = slots
      .filter(s => eq[s.slot] && player.enchants && player.enchants[s.slot] && Object.keys(player.enchants[s.slot]).length > 0)
      .map(s => {
        const itemDef = config.ITEMS[eq[s.slot]] || { name: s.slot, emoji: s.emoji };
        const bùaList = Object.entries(player.enchants[s.slot])
          .map(([k, v]) => `${this.ENCHANTS[k]?.name || k} ${v}`)
          .join(', ');
        return {
          slot: s.slot,
          itemDef,
          bùaList,
          label: `${s.emoji} ${itemDef.name} (${s.name})`,
          description: `Bùa: ${bùaList}`.slice(0, 100),
          value: s.slot
        };
      });

    const embed = new EmbedBuilder()
      .setColor(0x06b6d4)
      .setTitle('🧹 KHU TẨY PHÙ PHÉP (ĐÁ MÀI / GRINDSTONE)')
      .setDescription(
        `Chào mừng bạn đến với khu vực **Đá Mài (Grindstone)** ma thuật!\n` +
        `Tại đây, bạn có thể thanh tẩy toàn bộ bùa chú trên trang bị để đưa món đồ trở về trạng thái **đồ TRẮNG**, sẵn sàng quay bùa mới tại Bàn Phù Phép!\n\n` +
        `🔷 **Chi Phí Tẩy Bùa:** **1 Ngọc Lưu Ly (Lapis Lazuli 🔷)** / 1 lần xóa\n` +
        `💎 **Ngọc Lưu Ly hiện có:** **${lapisCount} viên**\n\n` +
        (enchantedItems.length > 0
          ? `📋 **Danh Sách Trang Bị Đang Có Bùa:**\n` +
            enchantedItems.map(i => `• ${i.itemDef.emoji} **${i.itemDef.name}**: ✨ *[${i.bùaList}]*`).join('\n') +
            `\n\n*Hãy chọn món trang bị bạn muốn tẩy bùa từ menu bên dưới:*`
          : `⚠️ *Hiện tại bạn không có trang bị nào đang được phù phép trên người!*`)
      )
      .setFooter({ text: 'Tẩy bùa giúp bạn xóa những dòng bùa không ưng ý để quay lại từ đầu!' });

    const rows = [];
    if (enchantedItems.length > 0) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('disenchant_select_slot')
        .setPlaceholder('Chọn trang bị muốn tẩy bùa (Tốn 1 Lưu Ly 🔷)...')
        .addOptions(
          enchantedItems.map(i => ({
            label: i.label,
            description: i.description,
            value: i.value,
            emoji: '🧹'
          }))
        );
      rows.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('area_enchant').setLabel('Bàn Phù Phép').setEmoji('🔮').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('area_anvil').setLabel('Cái Đe Ép Sách').setEmoji('🔨').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );
    rows.push(navRow);

    return { content: `<@${player.id}>`, embeds: [embed], components: rows };
  }

  /**
   * Tạo giao diện Cảnh Báo Trang Bị Đã Có Phù Phép (Cực Đẹp & Kèm Nút Tẩy Bùa)
   */
  buildAlreadyEnchantedAlert(player, slot, errorResult) {
    const equippedItem = player.equipment && player.equipment[slot];
    const itemDef = config.ITEMS[equippedItem] || { name: slot, emoji: '⚔️' };
    const lapisCount = db.getItemCount(player, 'lapis');

    const curList = errorResult?.curList || (
      player.enchants && player.enchants[slot]
        ? Object.entries(player.enchants[slot]).map(([k, v]) => `• ✨ **${this.ENCHANTS[k]?.name || k} Cấp ${v}**`).join('\n')
        : '• ✨ *Có bùa chú*'
    );

    const embed = new EmbedBuilder()
      .setColor(0xf43f5e)
      .setTitle('❌ TRANG BỊ ĐÃ CÓ PHÙ PHÉP!')
      .setDescription(
        `Món đồ **${itemDef.emoji} ${itemDef.name}** (ô **${slot}**) của bạn hiện đã mang các dòng bùa chú:\n` +
        `${curList}\n\n` +
        `💡 **Quy tắc ma thuật Minecraft:**\n` +
        `• Bàn Phù Phép chỉ nhận phù phép **đồ TRẮNG** (chưa có bùa).\n` +
        `• Nếu muốn thêm hoặc nâng cấp các dòng khác, bạn hãy dùng **Cái Đe (Anvil 🔨)** cùng với **Sách Phù Phép**.\n` +
        `• Nếu bạn muốn xóa bùa cũ để quay lại từ đầu, hãy bấm **[🧹 Tẩy Bùa Ngay (Tốn 1 Lưu Ly)]** bên dưới!\n\n` +
        `🔷 **Ngọc Lưu Ly (Lapis Lazuli) hiện có:** **${lapisCount}/1 viên**`
      )
      .setFooter({ text: 'Xóa bùa sẽ biến trang bị về đồ trắng nguyên bản để quay lại bùa mới!' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`disenchant_confirm_${slot}`)
        .setLabel('Tẩy Bùa Ngay (Tốn 1 Lưu Ly)')
        .setEmoji('🧹')
        .setStyle(lapisCount >= 1 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setDisabled(lapisCount < 1),
      new ButtonBuilder()
        .setCustomId('area_anvil')
        .setLabel('Dùng Cái Đe Ép Sách')
        .setEmoji('🔨')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('area_enchant')
        .setLabel('Chọn Món Khác')
        .setEmoji('🔮')
        .setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
  }
}

module.exports = new EnchantSystem();
