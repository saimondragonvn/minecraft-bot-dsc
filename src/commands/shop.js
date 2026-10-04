const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

// Phân nhóm danh mục hàng hóa trong Cửa Hàng (CHỈ BÁN THUỐC, SÁCH, TOTEM - TỈ LỆ 1 KIẾM : 20 MUA)
const CATEGORIES = {
  potions: {
    id: 'potions',
    name: 'Tiệm Thuốc & Thần Dược (Potions)',
    emoji: '🧪',
    color: 0x8b5cf6,
    desc: 'Các loại thần dược tăng lực, hồi máu, phòng thủ và may mắn như trong Minecraft.',
    items: [
      'health_potion',
      'mana_potion',
      'strength_potion',
      'resistance_potion',
      'luck_potion'
    ]
  },
  books_basic: {
    id: 'books_basic',
    name: 'Sách Phù Phép Cơ Bản (Cấp I - II)',
    emoji: '📘',
    color: 0x3b82f6,
    desc: 'Sách thường và sách bùa Cấp 1, Cấp 2 khởi đầu cho tân thủ dùng trên Cái Đe (Anvil).',
    items: [
      'book',
      'book_sharpness_1', 'book_smite_1', 'book_bane_of_arthropods_1', 'book_efficiency_1', 'book_power_1', 'book_protection_1', 'book_fire_aspect_1', 'book_looting_1', 'book_thorns_1', 'book_unbreaking_1', 'book_fortune_1',
      'book_sharpness_2', 'book_smite_2', 'book_efficiency_2', 'book_power_2', 'book_protection_2', 'book_unbreaking_2', 'book_fire_aspect_2'
    ]
  },
  books_high: {
    id: 'books_high',
    name: 'Sách Phù Phép Cấp Cao (Cấp III - V & Tu Sửa)',
    emoji: '📕',
    color: 0xec4899,
    desc: 'Sách bùa Cấp cao tối thượng và bùa Thần thoại Tu Sửa (Mending) dùng trên Cái Đe (Anvil).',
    items: [
      'book_sharpness_3', 'book_smite_3', 'book_efficiency_3', 'book_power_3', 'book_protection_3', 'book_unbreaking_3', 'book_looting_3', 'book_thorns_3', 'book_fortune_3',
      'book_sharpness_4', 'book_smite_4', 'book_efficiency_4', 'book_power_4', 'book_protection_4',
      'book_sharpness_5', 'book_smite_5', 'book_efficiency_5', 'book_power_5',
      'book_mending'
    ]
  },
  totem: {
    id: 'totem',
    name: 'Vật Tổ Bất Tử (Totem of Undying)',
    emoji: '🗿',
    color: 0xf59e0b,
    desc: 'Bảo vật thần kỳ cứu sống bạn thoát chết trong gang tấc khi thám hiểm hiểm nguy.',
    items: [
      'totem_of_undying'
    ]
  }
};

// Aliases dự phòng tránh lỗi nếu gọi từ menu cũ
CATEGORIES.books = CATEGORIES.books_basic;
CATEGORIES.foods = CATEGORIES.potions;
CATEGORIES.gear = CATEGORIES.potions;
CATEGORIES.utilities = CATEGORIES.potions;
CATEGORIES.special = CATEGORIES.totem;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Sàn giao dịch mua bán tài nguyên và vật phẩm Minecraft')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Xem bảng giá và mua sắm theo từng danh mục')
        .addStringOption(opt =>
          opt.setName('category')
            .setDescription('Chọn danh mục muốn xem')
            .setRequired(false)
            .addChoices(
              { name: '🧪 Tiệm Thuốc & Thần Dược (Potions)', value: 'potions' },
              { name: '📘 Sách Phù Phép Cơ Bản (Cấp I - II)', value: 'books_basic' },
              { name: '📕 Sách Phù Phép Cấp Cao (Cấp III - V & Mending)', value: 'books_high' },
              { name: '🗿 Vật Tổ Bất Tử (Totem)', value: 'totem' },
              { name: '🌐 Tất Cả Mặt Hàng (Overview)', value: 'all' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('buy')
        .setDescription('Mua vật phẩm từ cửa hàng (Thông báo lên kênh chat khi thành công)')
        .addStringOption(opt => opt.setName('item').setDescription('ID hoặc tên món đồ (vd: health_potion, book_mending, totem_of_undying)').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng muốn mua').setRequired(false).setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('sell')
        .setDescription('Bán vật phẩm trong túi lấy tiền vàng (Gửi riêng)')
        .addStringOption(opt => opt.setName('item').setDescription('ID hoặc tên món đồ (vd: oak_log, cobblestone, rotten_flesh)').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng muốn bán').setRequired(false).setMinValue(1))
    ),

  /**
   * Tạo giao diện Bảng Cửa Hàng phân theo từng Danh Mục gọn gàng
   */
  buildShopScreen(player, category = 'potions', alertMsg = '') {
    const isOverview = (category === 'all');
    const cat = CATEGORIES[category] || CATEGORIES.potions;

    const embed = new EmbedBuilder()
      .setColor(cat.color || 0x10b981)
      .setTitle(`${isOverview ? '🛒' : cat.emoji} SÀN GIAO DỊCH: ${isOverview ? 'TẤT CẢ DANH MỤC' : cat.name.toUpperCase()}`);

    const activeBuffs = db.formatEffectsString(player);
    let desc = `🪙 **Số dư hiện tại:** **${player.coins.toLocaleString()} Xu**\n` +
      (activeBuffs ? `✨ **Hiệu ứng đang có:** ${activeBuffs}\n` : '') +
      `📦 **Sức chứa túi cá nhân:** **${db.getUsedSlots(player)}/${db.getMaxSlots(player)} Ô**\n\n`;

    if (alertMsg) {
      desc += `${alertMsg}\n\n`;
    }

    if (isOverview) {
      desc += `💡 *Chọn danh mục bên dưới để xem chi tiết và mua đồ 1-Click:*\n\n`;
      const uniqueCats = [CATEGORIES.potions, CATEGORIES.books_basic, CATEGORIES.books_high, CATEGORIES.totem];
      for (const c of uniqueCats) {
        desc += `**${c.emoji} ${c.name}:**\n`;
        const previewItems = c.items.slice(0, 3).map(id => {
          const item = config.ITEMS[id];
          return item ? `${item.emoji} ${item.name} (${item.buyPrice ? `${item.buyPrice.toLocaleString()}🪙` : 'Chỉ bán'})` : id;
        }).join(' • ');
        desc += `> ${previewItems} ... *(+${Math.max(0, c.items.length - 3)} món khác)*\n\n`;
      }
    } else {
      desc += `ℹ️ *${cat.desc}*\n\n` +
        `💡 *Cách mua: Chọn từ menu thả **"Mua Nhanh 1-Click"** bên dưới hoặc gõ \`/shop buy item:[tên] amount:[số_lượng]\`*\n\n`;

      const itemLines = cat.items.map(itemId => {
        const item = config.ITEMS[itemId];
        if (!item) return null;
        const buyStr = item.buyPrice ? `**${item.buyPrice.toLocaleString()} Xu**` : `*Không bán*`;
        const sellStr = item.sellPrice ? `**${item.sellPrice.toLocaleString()} Xu**` : `*Không thu mua*`;
        const descText = item.description ? `\n  ↳ *${item.description}*` : '';
        return `• ${item.emoji} **${item.name}** (\`${item.id}\`)\n  💵 Mua: ${buyStr} | 🪙 Bán: ${sellStr}${descText}`;
      }).filter(Boolean);

      desc += itemLines.join('\n\n');
    }

    desc += `\n\n⚠️ **Quy định Chợ & Tỉ Lệ Kinh Tế:**\n` +
      `• *Công cụ, vũ khí, cúp, kiếm, giáp & thức ăn KHÔNG BÁN tại Chợ (bắt buộc phải tự chế tạo / săn bắt).* \n` +
      `• *Chợ chỉ bán Thuốc, Sách & Vật Tổ Bất Tử theo đúng tỉ lệ chuẩn: **Kiếm 1 Xu cần 20 Xu để mua**.*`;

    embed.setDescription(desc);

    // Row 1: Chọn Danh Mục (Category Selector Dropdown)
    const catOptions = [
      { label: '🧪 Tiệm Thuốc & Thần Dược', value: 'potions', description: 'Thuốc hồi máu, sức mạnh, kháng cự, may mắn', default: category === 'potions' },
      { label: '📘 Sách Phù Phép Cơ Bản (Cấp I - II)', value: 'books_basic', description: 'Sách thường, Sắc bén I-II, Bảo vệ I-II, Hiệu suất I-II...', default: category === 'books_basic' || category === 'books' },
      { label: '📕 Sách Phù Phép Cấp Cao (Cấp III - V & Mending)', value: 'books_high', description: 'Sắc bén V, Sức mạnh V, Tu sửa Mending thần thoại...', default: category === 'books_high' },
      { label: '🗿 Vật Tổ Bất Tử (Totem)', value: 'totem', description: 'Bảo vật hồi sinh thần kỳ khi cạn máu', default: category === 'totem' || category === 'special' },
      { label: '🌐 Tất Cả Mặt Hàng (Overview)', value: 'all', description: 'Xem tổng hợp toàn bộ các gian hàng của chợ', default: isOverview }
    ];

    const rowCategory = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('shop_cat_select')
        .setPlaceholder('📂 Chọn Danh Mục Cửa Hàng...')
        .addOptions(catOptions)
    );

    const components = [rowCategory];

    // Row 2: Menu Mua Nhanh 1-Click (Chỉ hiện khi đang xem danh mục cụ thể)
    if (!isOverview && cat.items && cat.items.length > 0) {
      const buyableItems = cat.items
        .map(id => config.ITEMS[id])
        .filter(item => item && item.buyPrice && item.buyPrice > 0);

      if (buyableItems.length > 0) {
        const buyOptions = buyableItems.slice(0, 25).map(item => ({
          label: `${item.name}`,
          description: `Giá: ${item.buyPrice.toLocaleString()} Xu | Có sẵn`,
          value: item.id,
          emoji: item.emoji || '📦'
        }));

        const rowBuy = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`shop_buy_select_${category}`)
            .setPlaceholder(`🛒 Chọn món đồ để MUA 1-CLICK trong mục này...`)
            .addOptions(buyOptions)
        );
        components.push(rowBuy);
      }
    }

    // Row 3: Nút chức năng tiện ích
    const rowActions = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('inv_sell').setLabel('Mở Bảng Bán Đồ').setEmoji('💰').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('sell_quick_mob').setLabel('Bán Nhanh Quái').setEmoji('⚡').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_inventory').setLabel('Xem Túi Đồ').setEmoji('🎒').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
    );
    components.push(rowActions);

    return { content: `<@${player.id}>`, embeds: [embed], components, files: [] };
  },

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const sub = interaction.options?.getSubcommand ? interaction.options.getSubcommand() : 'list';

    if (sub === 'list') {
      const cat = (interaction.options?.getString ? interaction.options.getString('category') : null) || 'potions';
      const payload = module.exports.buildShopScreen(player, cat);
      return interaction.reply({ ...payload, ephemeral: true });
    }

    if (sub === 'buy') {
      const rawItem = interaction.options.getString('item').toLowerCase().trim();
      const amount = interaction.options.getInteger('amount') || 1;

      // Tìm kiếm theo id hoặc tên
      const itemKey = Object.keys(config.ITEMS).find(k => k === rawItem || config.ITEMS[k].name.toLowerCase().includes(rawItem));
      if (!itemKey) {
        return interaction.reply({ content: `❌ Không tìm thấy món đồ "${rawItem}" trong cửa hàng! Dùng \`/shop list\` để tra cứu.`, ephemeral: true });
      }

      const itemDef = config.ITEMS[itemKey];
      if (!itemDef) {
        return interaction.reply({ content: `❌ Vật phẩm không hợp lệ!`, ephemeral: true });
      }

      // TUYỆT ĐỐI KHÔNG BÁN KHOÁNG SẢN VÀ CÁC MÓN ĐỒ QUÝ / ENDGAME TRÁNH LẠM PHÁT
      if (itemDef.isMineral || !itemDef.buyPrice || itemDef.buyPrice <= 0) {
        return interaction.reply({
          content: `❌ **CỬA HÀNG KHÔNG BÁN VẬT PHẨM NÀY!**\n` +
            `Vật phẩm ${itemDef.emoji} **${itemDef.name}** không được bày bán tại cửa hàng nhằm bảo đảm cân bằng kinh tế và tránh lạm phát!\n` +
            `*(Hãy tự chế tạo tại Bàn Chế Tạo hoặc khám phá/hạ gục Boss để thu thập)*`,
          ephemeral: true
        });
      }

      const totalPrice = itemDef.buyPrice * amount;

      if (player.coins < totalPrice) {
        return interaction.reply({
          content: `❌ Bạn không có đủ tiền! Cần **${totalPrice.toLocaleString()} Xu** (Hiện có: **${player.coins.toLocaleString()} Xu**).`,
          ephemeral: true
        });
      }

      const usedSlots = db.getUsedSlots(player);
      const maxSlots = db.getMaxSlots(player);
      if (usedSlots >= maxSlots && !db.hasInventorySpaceFor(player, itemKey, amount)) {
        return interaction.reply({
          content: `❌ **Túi đồ của bạn đã đầy (${usedSlots}/${maxSlots} Ô)!** Vui lòng mở rộng rương hoặc cất bớt đồ vào Rương Nhà trước khi mua.`,
          ephemeral: true
        });
      }

      player.coins = Math.round((player.coins - totalPrice) * 100) / 100;
      db.addItem(player, itemKey, amount);
      db.saveData();

      return interaction.reply({
        content: `🛒 <@${interaction.user.id}> đã mua thành công ${itemDef.emoji} x${amount} **${itemDef.name}** với giá **${totalPrice.toLocaleString()} Xu**! Số dư còn lại: **${player.coins.toLocaleString()} Xu**.`
      });
    }

    if (sub === 'sell') {
      const rawItem = interaction.options.getString('item').toLowerCase().trim();
      const amount = interaction.options.getInteger('amount') || 1;

      const itemKey = Object.keys(config.ITEMS).find(k => k === rawItem || config.ITEMS[k].name.toLowerCase().includes(rawItem));
      if (!itemKey) {
        return interaction.reply({ content: `❌ Không tìm thấy vật phẩm "${rawItem}"!`, ephemeral: true });
      }

      const itemDef = config.ITEMS[itemKey];
      if (!itemDef) {
        return interaction.reply({ content: `❌ Vật phẩm không hợp lệ!`, ephemeral: true });
      }

      // CHẶN BÁN CÁC VẬT PHẨM QUÝ/ĐẶC BIỆT HOẶC KHÔNG CÓ GIÁ THU MUA
      if (!itemDef.sellPrice || itemDef.sellPrice <= 0) {
        return interaction.reply({
          content: `❌ Vật phẩm ${itemDef.emoji} **${itemDef.name}** là vật phẩm đặc biệt/quý hiếm, không có giá thu mua tại chợ nhằm chống lạm phát kinh tế!`,
          ephemeral: true
        });
      }

      const hasCount = db.getItemCount(player, itemKey);
      if (hasCount < amount) {
        return interaction.reply({
          content: `❌ Trong túi bạn chỉ có **${hasCount}** cái, không đủ để bán **${amount}** cái!`,
          ephemeral: true
        });
      }

      const earned = itemDef.sellPrice * amount;

      db.removeItem(player, itemKey, amount);
      player.coins = Math.round((player.coins + earned) * 100) / 100;
      db.saveData();

      return interaction.reply({
        content: `💰 Đã bán ${itemDef.emoji} x${amount} **${itemDef.name}** và nhận được **+${earned.toLocaleString()} Xu**! Số dư hiện tại: **${player.coins.toLocaleString()} Xu**.`,
        ephemeral: true
      });
    }
  },

  /**
   * Xử lý tương tác Nút bấm của Shop
   */
  async handleButton(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const id = interaction.customId;

    if (id.startsWith('shop_cat_')) {
      const cat = id.replace('shop_cat_', '');
      const payload = module.exports.buildShopScreen(player, cat);
      return interaction.update(payload);
    }
  },

  /**
   * Xử lý tương tác Select Menu của Shop (Chọn danh mục hoặc Mua 1-Click)
   */
  async handleSelectMenu(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const id = interaction.customId;

    // 1. Chuyển đổi Danh Mục (Category switch)
    if (id === 'shop_cat_select') {
      const chosenCat = interaction.values[0];
      const payload = module.exports.buildShopScreen(player, chosenCat);
      return interaction.update(payload);
    }

    // 2. Mua hàng 1-Click (1-Click Buy)
    if (id.startsWith('shop_buy_select')) {
      const currentCat = id.replace('shop_buy_select_', '') || 'potions';
      const itemId = interaction.values[0];
      const itemDef = config.ITEMS[itemId];

      if (!itemDef || !itemDef.buyPrice || itemDef.buyPrice <= 0) {
        const payload = module.exports.buildShopScreen(player, currentCat, `❌ Mặt hàng này hiện không thể mua!`);
        return interaction.update(payload);
      }

      if (player.coins < itemDef.buyPrice) {
        const payload = module.exports.buildShopScreen(
          player,
          currentCat,
          `❌ **Không đủ tiền!** Cần **${itemDef.buyPrice.toLocaleString()} Xu** (Hiện có: **${player.coins.toLocaleString()} Xu**)`
        );
        return interaction.update(payload);
      }

      const usedSlots = db.getUsedSlots(player);
      const maxSlots = db.getMaxSlots(player);
      if (usedSlots >= maxSlots && !db.hasInventorySpaceFor(player, itemId, 1)) {
        const payload = module.exports.buildShopScreen(
          player,
          currentCat,
          `❌ **Túi đồ đã đầy (${usedSlots}/${maxSlots} Ô)!** Vui lòng giải phóng ô chứa trước khi mua.`
        );
        return interaction.update(payload);
      }

      // Mua thành công 1 món
      player.coins = Math.round((player.coins - itemDef.buyPrice) * 100) / 100;
      db.addItem(player, itemId, 1);
      db.saveData();

      const successMsg = `✅ **MUA THÀNH CÔNG!** Đã nhận ${itemDef.emoji} **x1 ${itemDef.name}** (-${itemDef.buyPrice.toLocaleString()} Xu)!`;
      const payload = module.exports.buildShopScreen(player, currentCat, successMsg);
      return interaction.update(payload);
    }
  }
};
