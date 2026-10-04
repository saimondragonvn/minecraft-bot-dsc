const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

// Danh sách các vật phẩm an toàn không bao giờ tự động bán hàng loạt
const PROTECTED_ITEMS = new Set([
  'totem_of_undying', 'elytra', 'beacon', 'dragon_egg', 'nether_star',
  'mace', 'heavy_core', 'trial_key', 'firework_rocket', 'shulker_box',
  'shulker_shell', 'saddle', 'tnt', 'bed', 'breeze_rod', 'wind_charge',
  'crafter', 'dragon_breath', 'wither_skeleton_skull', 'wither_rose',
  'ancient_debris', 'netherite_scrap', 'netherite_ingot', 'netherite_block'
]);

// Danh sách vật phẩm quái rơi
const MOB_DROP_ITEMS = new Set([
  'rotten_flesh', 'bone', 'string', 'spider_eye', 'gunpowder',
  'arrow', 'ender_pearl', 'blaze_rod', 'blaze_powder', 'glowstone_dust',
  'wither_skeleton_skull', 'ghast_tear', 'nether_wart', 'feather', 'leather', 'bone_block'
]);

// Danh sách vật phẩm gỗ và đá cơ bản
const STONE_WOOD_ITEMS = new Set([
  'cobblestone', 'stone', 'netherrack', 'oak_log', 'stick'
]);

function isSafeToBulkSell(itemId) {
  if (PROTECTED_ITEMS.has(itemId)) return false;
  if (itemId.startsWith('book_')) return false; // Không tự động bán sách phù phép
  // Không tự động bán trang bị vũ khí, giáp, công cụ
  const suffixes = ['_sword', '_axe', '_pickaxe', '_shovel', '_hoe', '_helmet', '_chestplate', '_leggings', '_boots', 'bow', 'crossbow', 'shield'];
  if (suffixes.some(s => itemId === s || itemId.endsWith(s))) return false;
  return true;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Bán vật phẩm trong túi đồ lấy tiền Xu (Giao diện trực quan hoặc Bán nhanh)')
    .addBooleanOption(opt => opt.setName('all').setDescription('Bán nhanh toàn bộ tài nguyên & quái rơi trong túi'))
    .addStringOption(opt => opt.setName('item').setDescription('ID hoặc tên món đồ muốn bán (vd: cobblestone, oak_log, iron_ingot)'))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng muốn bán').setMinValue(1)),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const isAll = interaction.options?.getBoolean ? interaction.options.getBoolean('all') : false;
    const rawItem = interaction.options?.getString ? interaction.options.getString('item') : null;
    const amount = (interaction.options?.getInteger ? interaction.options.getInteger('amount') : null) || 1;

    // 1. Nếu chọn bán tất cả đồ trong túi
    if (isAll || (rawItem && ['all', 'tatca', 'everything'].includes(rawItem.toLowerCase().trim()))) {
      const result = module.exports.bulkSell(player, () => true);
      if (!result.success) {
        return interaction.reply({ content: `<@${player.id}> ❌ ${result.message}`, ephemeral: true });
      }
      return interaction.reply({ content: `<@${player.id}>`, embeds: [result.embed] });
    }

    // 2. Nếu gõ từ khoá bán quái rơi hoặc đá gỗ
    if (rawItem && ['mob', 'quai', 'monster'].includes(rawItem.toLowerCase().trim())) {
      const result = module.exports.bulkSell(player, (itemId) => MOB_DROP_ITEMS.has(itemId));
      if (!result.success) {
        return interaction.reply({ content: `<@${player.id}> ❌ ${result.message}`, ephemeral: true });
      }
      return interaction.reply({ content: `<@${player.id}>`, embeds: [result.embed] });
    }

    if (rawItem && ['stone', 'da', 'wood', 'go', 'khoangsan'].includes(rawItem.toLowerCase().trim())) {
      const result = module.exports.bulkSell(player, (itemId) => STONE_WOOD_ITEMS.has(itemId));
      if (!result.success) {
        return interaction.reply({ content: `<@${player.id}> ❌ ${result.message}`, ephemeral: true });
      }
      return interaction.reply({ content: `<@${player.id}>`, embeds: [result.embed] });
    }

    // 3. Nếu chỉ định cụ thể món đồ và số lượng
    if (rawItem) {
      const search = rawItem.toLowerCase().trim();
      const itemKey = Object.keys(config.ITEMS).find(k => k === search || config.ITEMS[k].name.toLowerCase().includes(search));
      if (!itemKey) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Không tìm thấy vật phẩm nào có tên hoặc ID là "${rawItem}"! Dùng \`/sell\` để mở bảng bán.`,
          ephemeral: true
        });
      }

      const itemDef = config.ITEMS[itemKey];
      if (!itemDef.sellPrice || itemDef.sellPrice <= 0) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Vật phẩm ${itemDef.emoji} **${itemDef.name}** không có giá thu mua tại chợ (vật phẩm quý hiếm/đặc biệt không thể bán lấy xu nhằm chống lạm phát)!`,
          ephemeral: true
        });
      }

      const hasCount = db.getItemCount(player, itemKey);
      if (hasCount <= 0) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Trong túi đồ của bạn không có ${itemDef.emoji} **${itemDef.name}** nào!`,
          ephemeral: true
        });
      }

      const actualAmount = Math.min(hasCount, amount);
      const earned = itemDef.sellPrice * actualAmount;

      db.removeItem(player, itemKey, actualAmount);
      player.coins = Math.round((player.coins + earned) * 100) / 100;
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('💰 BÁN VẬT PHẨM THÀNH CÔNG!')
        .setDescription(
          `Bạn đã bán thành công ${itemDef.emoji} **x${actualAmount} ${itemDef.name}**!\n\n` +
          `💵 **Đơn giá:** **${itemDef.sellPrice.toLocaleString()} Xu / cái**\n` +
          `🪙 **Tổng thu về:** **+${earned.toLocaleString()} Xu**\n` +
          `🏦 **Số dư tài khoản hiện tại:** **${player.coins.toLocaleString()} Xu**`
        );

      return interaction.reply({ content: `<@${player.id}>`, embeds: [embed] });
    }

    // 3. Không có tham số -> Mở bảng giao diện bán đồ tương tác 1-Click
    const payload = module.exports.buildSellScreen(player);
    return interaction.reply(payload);
  },

  /**
   * Tạo giao diện Bảng Bán Đồ trực quan (1-Click Sell Menu)
   */
  buildSellScreen(player, alertMsg = '') {
    const sellableItems = (player.inventory || []).filter(item => {
      const def = config.ITEMS[item.itemId];
      return item.count > 0 && def && def.sellPrice && def.sellPrice > 0;
    });

    const totalWorth = sellableItems.reduce((acc, cur) => {
      const def = config.ITEMS[cur.itemId];
      return acc + (def?.sellPrice || 0) * cur.count;
    }, 0);

    const mobItems = sellableItems.filter(i => MOB_DROP_ITEMS.has(i.itemId));
    const mobWorth = mobItems.reduce((acc, cur) => acc + (config.ITEMS[cur.itemId]?.sellPrice || 0) * cur.count, 0);

    const stoneItems = sellableItems.filter(i => STONE_WOOD_ITEMS.has(i.itemId));
    const stoneWorth = stoneItems.reduce((acc, cur) => acc + (config.ITEMS[cur.itemId]?.sellPrice || 0) * cur.count, 0);

    let itemsList = '';
    if (sellableItems.length === 0) {
      itemsList = '*(Túi đồ hiện không có vật phẩm nào có thể bán được)*';
    } else {
      itemsList = sellableItems.slice(0, 10).map(i => {
        const def = config.ITEMS[i.itemId];
        const lineTotal = def.sellPrice * i.count;
        return `• ${def.emoji} **${def.name}** (x${i.count}) ➔ **+${lineTotal.toLocaleString()} Xu** (${def.sellPrice} Xu/cái)`;
      }).join('\n');

      if (sellableItems.length > 10) {
        itemsList += `\n... và **${sellableItems.length - 10} loại vật phẩm khác**`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('💰 SÀN THU MUA VẬT PHẨM (SELL SHOP)')
      .setDescription(
        (alertMsg ? `🔔 **${alertMsg}**\n\n` : '') +
        `🪙 **Số dư hiện tại:** **${player.coins.toLocaleString()} Xu**\n` +
        `📦 **Tổng giá trị đồ trong túi:** **${totalWorth.toLocaleString()} Xu**\n\n` +
        `📋 **Vật phẩm có thể bán ngay trong túi:**\n` +
        `${itemsList}\n\n` +
        `💡 *Chọn món từ danh sách bên dưới hoặc bấm nút bán nhanh để nhận tiền Xu ngay lập tức!*`
      )
      .setFooter({ text: '💡 Nút "Bán Hết" an toàn 100%: Không bao giờ bán trang bị, vũ khí, bùa phép hay vật tổ quý!' });

    const components = [];

    // Select Menu chọn món đồ cụ thể
    if (sellableItems.length > 0) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('inv_select_sell')
        .setPlaceholder('Chọn món đồ cụ thể muốn bán (Bán 1, 10, 50% hoặc Tất cả)...');

      sellableItems.slice(0, 25).forEach(invItem => {
        const def = config.ITEMS[invItem.itemId];
        const lineTotal = def.sellPrice * invItem.count;
        selectMenu.addOptions({
          label: `${def.name} (Có: x${invItem.count})`,
          description: `Giá: ${def.sellPrice} Xu/cái | Thu về: +${lineTotal.toLocaleString()} Xu`,
          value: invItem.itemId,
          emoji: def.emoji || '📦'
        });
      });

      components.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    // Hàng nút thao tác Bán Nhanh
    const rowButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sell_quick_mob')
        .setLabel(`Bán Quái Rơi (+${mobWorth.toLocaleString()} Xu)`)
        .setEmoji('⚡')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(mobWorth <= 0),
      new ButtonBuilder()
        .setCustomId('sell_quick_stone')
        .setLabel(`Bán Gỗ & Đá (+${stoneWorth.toLocaleString()} Xu)`)
        .setEmoji('🪨')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(stoneWorth <= 0),
      new ButtonBuilder()
        .setCustomId('sell_all_confirm')
        .setLabel(`Bán Hết Toàn Bộ (+${totalWorth.toLocaleString()} Xu)`)
        .setEmoji('🌟')
        .setStyle(ButtonStyle.Success)
        .setDisabled(totalWorth <= 0)
    );

    // Hàng nút điều hướng
    const rowNav = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_inventory').setLabel('Túi Đồ').setEmoji('🎒').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('menu_back').setLabel('Menu Chính').setEmoji('🏠').setStyle(ButtonStyle.Secondary)
    );

    components.push(rowButtons, rowNav);
    return { content: `<@${player.id}>`, embeds: [embed], components, files: [] };
  },

  /**
   * Tạo giao diện chọn số lượng bán cho 1 món đồ cụ thể
   */
  buildItemSellScreen(player, itemId) {
    const itemInInv = (player.inventory || []).find(i => i.itemId === itemId);
    const itemDef = config.ITEMS[itemId] || { name: itemId, emoji: '📦', sellPrice: 1 };

    if (!itemInInv || itemInInv.count <= 0) {
      return module.exports.buildSellScreen(player, `❌ Bạn không còn ${itemDef.emoji} ${itemDef.name} trong túi đồ!`);
    }

    const count = itemInInv.count;
    const unitPrice = itemDef.sellPrice || 1;
    const totalLinePrice = unitPrice * count;
    const halfCount = Math.floor(count / 2);

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle(`💰 BÁN: ${itemDef.emoji} ${itemDef.name.toUpperCase()}`)
      .setDescription(
        `📦 **Số lượng đang có trong túi:** **x${count} cái**\n` +
        `💵 **Giá thu mua tại chợ:** **${unitPrice.toLocaleString()} Xu / cái**\n` +
        `🪙 **Tổng giá trị nếu bán hết:** **+${totalLinePrice.toLocaleString()} Xu**\n\n` +
        `Hãy chọn số lượng bạn muốn bán bên dưới:`
      );

    const buttons = [
      new ButtonBuilder()
        .setCustomId(`sell_do_1_${itemId}`)
        .setLabel(`Bán 1 cái (+${unitPrice.toLocaleString()} Xu)`)
        .setEmoji('🪙')
        .setStyle(ButtonStyle.Primary)
    ];

    if (count >= 10) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`sell_do_10_${itemId}`)
          .setLabel(`Bán 10 cái (+${(unitPrice * 10).toLocaleString()} Xu)`)
          .setEmoji('🔟')
          .setStyle(ButtonStyle.Primary)
      );
    }

    if (count > 2 && halfCount > 1) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`sell_do_half_${itemId}`)
          .setLabel(`Bán 50% (x${halfCount} = +${(unitPrice * halfCount).toLocaleString()} Xu)`)
          .setEmoji('⚖️')
          .setStyle(ButtonStyle.Primary)
      );
    }

    buttons.push(
      new ButtonBuilder()
        .setCustomId(`sell_do_all_${itemId}`)
        .setLabel(count > 1 ? `Bán Tất Cả (x${count} = +${totalLinePrice.toLocaleString()} Xu)` : `Bán Hết`)
        .setEmoji('💰')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('inv_sell')
        .setLabel('Quay lại')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);
    return { content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] };
  },

  /**
   * Bán hàng loạt theo điều kiện lọc
   */
  bulkSell(player, filterFn = () => true) {
    const candidates = (player.inventory || []).filter(item => {
      const def = config.ITEMS[item.itemId];
      if (!def || !def.sellPrice || def.sellPrice <= 0 || item.count <= 0) return false;
      if (!isSafeToBulkSell(item.itemId)) return false;
      return filterFn(item.itemId, def);
    });

    if (candidates.length === 0) {
      return { success: false, message: 'Trong túi đồ của bạn không có vật phẩm phù hợp để bán!' };
    }

    let totalCoins = 0;
    let totalItemsCount = 0;
    const soldBreakdown = [];

    for (const c of candidates) {
      const def = config.ITEMS[c.itemId];
      const earn = def.sellPrice * c.count;
      totalCoins += earn;
      totalItemsCount += c.count;
      soldBreakdown.push(`• ${def.emoji} **${def.name}** x${c.count} ➔ **+${earn.toLocaleString()} Xu**`);
      db.removeItem(player, c.itemId, c.count);
    }

    player.coins = Math.round((player.coins + totalCoins) * 100) / 100;
    db.saveData();

    const summaryText = soldBreakdown.slice(0, 12).join('\n') +
      (soldBreakdown.length > 12 ? `\n... và **${soldBreakdown.length - 12} món khác**` : '');

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('🎉 BÁN NHANH THÀNH CÔNG!')
      .setDescription(
        `Đã bán thành công **${totalItemsCount} vật phẩm** trong túi đồ!\n\n` +
        `📋 **Chi tiết thu mua:**\n${summaryText}\n\n` +
        `🪙 **Tổng tiền nhận được:** **+${totalCoins.toLocaleString()} Xu**\n` +
        `🏦 **Số dư tài khoản mới:** **${player.coins.toLocaleString()} Xu**`
      );

    return {
      success: true,
      totalCoins,
      totalItemsCount,
      embed
    };
  },

  /**
   * Xử lý tương tác Nút bấm Bán Đồ
   */
  async handleButton(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const id = interaction.customId;

    // 1. Mở bảng bán đồ
    if (id === 'inv_sell') {
      const payload = module.exports.buildSellScreen(player);
      return interaction.update(payload);
    }

    // 2. Bán nhanh Quái Rơi
    if (id === 'sell_quick_mob') {
      const res = module.exports.bulkSell(player, (itemId) => MOB_DROP_ITEMS.has(itemId));
      if (!res.success) {
        const payload = module.exports.buildSellScreen(player, `❌ ${res.message}`);
        return interaction.update(payload);
      }
      const payload = module.exports.buildSellScreen(player, `✅ Đã bán quái rơi thu về +${res.totalCoins.toLocaleString()} Xu!`);
      return interaction.update(payload);
    }

    // 3. Bán nhanh Gỗ & Đá
    if (id === 'sell_quick_stone') {
      const res = module.exports.bulkSell(player, (itemId) => STONE_WOOD_ITEMS.has(itemId));
      if (!res.success) {
        const payload = module.exports.buildSellScreen(player, `❌ ${res.message}`);
        return interaction.update(payload);
      }
      const payload = module.exports.buildSellScreen(player, `✅ Đã bán Gỗ & Đá thu về +${res.totalCoins.toLocaleString()} Xu!`);
      return interaction.update(payload);
    }

    // 4. Bán toàn bộ túi đồ
    if (id === 'sell_all_confirm') {
      const res = module.exports.bulkSell(player, () => true);
      if (!res.success) {
        const payload = module.exports.buildSellScreen(player, `❌ ${res.message}`);
        return interaction.update(payload);
      }
      const payload = module.exports.buildSellScreen(player, `✅ Đã bán sạch túi đồ thu về +${res.totalCoins.toLocaleString()} Xu!`);
      return interaction.update(payload);
    }

    // 5. Thao tác bán cụ thể 1 món: sell_do_[qty]_[itemId]
    if (id.startsWith('sell_do_')) {
      const parts = id.split('_');
      // id dạng: sell_do_1_cobblestone hoặc sell_do_all_cobblestone
      const qtyType = parts[2]; // '1', '10', 'half', 'all'
      const itemId = parts.slice(3).join('_');
      const itemDef = config.ITEMS[itemId];
      const itemInInv = (player.inventory || []).find(i => i.itemId === itemId);

      if (!itemInInv || itemInInv.count <= 0 || !itemDef) {
        const payload = module.exports.buildSellScreen(player, `❌ Bạn không còn vật phẩm này trong túi!`);
        return interaction.update(payload);
      }

      let sellAmount = 1;
      if (qtyType === '1') sellAmount = 1;
      else if (qtyType === '10') sellAmount = Math.min(10, itemInInv.count);
      else if (qtyType === 'half') sellAmount = Math.max(1, Math.floor(itemInInv.count / 2));
      else if (qtyType === 'all') sellAmount = itemInInv.count;

      const earned = (itemDef.sellPrice || 1) * sellAmount;
      db.removeItem(player, itemId, sellAmount);
      player.coins = Math.round((player.coins + earned) * 100) / 100;
      db.saveData();

      const remaining = db.getItemCount(player, itemId);
      const alertMsg = `Đã bán ${itemDef.emoji} x${sellAmount} ${itemDef.name} ➔ +${earned.toLocaleString()} Xu! (Còn: x${remaining})`;

      if (remaining > 0) {
        const payload = module.exports.buildItemSellScreen(player, itemId);
        return interaction.update({ ...payload, content: `<@${player.id}> 💰 ${alertMsg}` });
      } else {
        const payload = module.exports.buildSellScreen(player, alertMsg);
        return interaction.update(payload);
      }
    }
  },

  /**
   * Xử lý Select Menu chọn món đồ để bán
   */
  async handleSelectMenu(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const itemId = interaction.values[0];
    const payload = module.exports.buildItemSellScreen(player, itemId);
    return interaction.update(payload);
  }
};
