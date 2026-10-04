const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');
const uiHelper = require('../utils/uiHelper');
const timeSystem = require('../systems/timeSystem');
const mobSystem = require('../systems/mobSystem');
const combatSystem = require('../systems/combatSystem');
const dimensionSystem = require('../systems/dimensionSystem');
const craftingSystem = require('../systems/craftingSystem');
const explorationSystem = require('../systems/explorationSystem');
const miningSystem = require('../systems/miningSystem');

const woodcuttingSystem = require('../systems/woodcuttingSystem');
const enchantSystem = require('../systems/enchantSystem');
const partySystem = require('../systems/partySystem');
const smeltingSystem = require('../systems/smeltingSystem');
const imageHelper = require('../utils/imageHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('menu')
    .setDescription('Mở bảng Menu điều khiển chính của trò chơi Minecraft'),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const menuPayload = uiHelper.buildMainMenu(player);
    // Ephemeral message như trong ảnh minh họa ("Chỉ bạn mới có thể thấy điều này")
    await interaction.reply({ ...menuPayload, ephemeral: true });
  },

  /**
   * Bộ định tuyến xử lý các nút bấm trong Menu
   */
  async handleButton(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const id = interaction.customId;

    // 1. Điều hướng Menu chính
    if (id === 'menu_back') {
      const payload = uiHelper.buildMainMenu(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'menu_explore') {
      return explorationSystem.explore(interaction, player);
    }

    if (id === 'menu_info') {
      const payload = await uiHelper.buildInfoScreen(player);
      return interaction.update(payload);
    }

    if (id === 'info_skills') {
      const payload = uiHelper.buildSkillsScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'menu_stats') {
      const payload = uiHelper.buildStatsScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'stat_upgrade_dex') {
      const res = db.upgradeDexterity(player, false);
      if (!res.success) {
        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({ content: res.message, ephemeral: true }).catch(() => {});
        }
        return interaction.reply({ content: res.message, ephemeral: true }).catch(() => {});
      }
      const payload = uiHelper.buildStatsScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'stat_spend_level_dex') {
      const res = db.upgradeDexterity(player, true);
      if (!res.success) {
        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({ content: res.message, ephemeral: true }).catch(() => {});
        }
        return interaction.reply({ content: res.message, ephemeral: true }).catch(() => {});
      }
      const payload = uiHelper.buildStatsScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'menu_inventory') {
      const payload = uiHelper.buildInventoryScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'inv_expand') {
      const logCount = db.getItemCount(player, 'oak_log');
      if (logCount < 64) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Bạn không đủ gỗ! Cần ít nhất **64 Block Gỗ (Gỗ sồi)** 🪵 để chế tạo 1 Rương mở rộng (+24 slot).\n*(Hiện có: **${logCount}/64** Block Gỗ - Hãy dùng \`/chop\` hoặc vào Rừng để chặt thêm!)*`,
          ephemeral: true
        });
      }

      // Tiêu thụ 64 block gỗ
      db.removeItem(player, 'oak_log', 64);
      // Tăng thêm 24 slot vô hạn
      player.extraSlots = (player.extraSlots || 0) + 24;
      player.chestsCrafted = (player.chestsCrafted || 0) + 1;
      db.addItem(player, 'chest', 1);
      db.addExp(player, 15);
      db.saveData();

      const newMaxSlots = db.getMaxSlots(player);
      const usedSlots = db.getUsedSlots(player);

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('📦 MỞ RỘNG KHO ĐỒ THÀNH CÔNG!')
        .setDescription(
          `Bạn đã chế tạo **1 Rương Mở Rộng** bằng **64 Block Gỗ Sồi** 🪵!\n\n` +
          `✨ **Kho đồ được tăng thêm:** **+24 Ô (Slot)**\n` +
          `📦 **Tổng sức chứa hiện tại:** **${usedSlots}/${newMaxSlots} Slot**\n` +
          `🪵 Gỗ Sồi còn lại: **${db.getItemCount(player, 'oak_log')}**\n\n` +
          `*(Bạn có thể tiếp tục chế thêm Rương để nâng cấp kho đồ vô hạn lần!)*`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('inv_expand').setLabel('Mở Rộng Tiếp (+24 Slot)').setEmoji('📦').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_inventory').setLabel('Xem Túi Đồ').setEmoji('🎒').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    }

    if (id === 'menu_equipment') {
      const payload = uiHelper.buildEquipmentScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'equip_fast_action') {
      const equipCmd = require('./equip');
      const payload = equipCmd.buildEquipMessage(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id.startsWith('equip_filter_')) {
      const equipCmd = require('./equip');
      const filter = id.replace('equip_filter_', '');
      const payload = equipCmd.buildEquipMessage(player, filter === 'all' ? null : filter);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'unequip_fast_action') {
      const unequipCmd = require('./unequip');
      const payload = unequipCmd.buildUnequipMessage(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'area_enchant') {
      const enchantCmd = require('./enchant');
      return enchantCmd.execute(interaction);
    }

    if (id === 'menu_areas') {
      const payload = uiHelper.buildAreasScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'menu_settings') {
      const payload = uiHelper.buildSettingsScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'menu_donate') {
      const embed = new EmbedBuilder()
        .setColor(0xec4899)
        .setTitle('💝 Ủng Hộ Server Minecraft RPG')
        .setDescription(
          `Cảm ơn bạn đã yêu thích và ủng hộ bot!\n\n` +
          `🌟 Hãy tham gia bình chọn và rủ bạn bè cùng chơi để nhận những phần quà giá trị:\n` +
          `• Nhận ngay 100 Xu vàng 🪙\n` +
          `• Tặng 1 Táo Vàng 🍏 và 10 Thỏi Sắt 🥈!\n\n` +
          `*Chúc bạn có những chuyến phiêu lưu kỳ thú trong thế giới khối vuông!*`
        );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({ embeds: [embed], components: [row], files: [] });
    }

    // 2. Cài đặt (Settings)
    if (id === 'setting_lang') {
      player.settings.language = player.settings.language === 'vi' ? 'en' : 'vi';
      db.saveData();
      const payload = uiHelper.buildSettingsScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'setting_durability') {
      player.settings.durabilityAlert = !player.settings.durabilityAlert;
      db.saveData();
      const payload = uiHelper.buildSettingsScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'setting_dm') {
      player.settings.dmNotify = !player.settings.dmNotify;
      db.saveData();
      const payload = uiHelper.buildSettingsScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    // 2.5. Xử lý Ăn uống trong Túi đồ
    if (id === 'inv_eat') {
      const maxHp = db.getMaxHp(player);
      if (player.hp >= maxHp) {
        return interaction.reply({
          content: `❤️ Máu của bạn đã đầy 100% (**${Math.round(player.hp)}/${maxHp} HP**)! Không cần ăn thêm.`,
          ephemeral: true
        });
      }

      const availableFoods = (player.inventory || []).filter(item => {
        const def = config.ITEMS[item.itemId];
        return item.count > 0 && def && ((def.heal && def.heal > 0) || def.type === 'food');
      });

      if (availableFoods.length === 0) {
        return interaction.reply({
          content: `❌ Trong túi bạn không có thức ăn hay thuốc hồi máu nào! Hãy mua tại \`/shop\` hoặc săn bắt \`/hunt\`.`,
          ephemeral: true
        });
      }

      const options = availableFoods.slice(0, 25).map(i => {
        const itemDef = config.ITEMS[i.itemId];
        return {
          label: `${itemDef.name} (Có: x${i.count})`,
          description: `Hồi phục: +${itemDef.heal || 4} ❤️ HP`,
          value: i.itemId,
          emoji: itemDef.emoji || '🍖'
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('inv_select_eat')
        .setPlaceholder('Chọn món ăn muốn dùng để hồi máu...')
        .addOptions(options);

      const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
      const rowBack = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_inventory').setLabel('Quay lại Túi Đồ').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('🍖 CHỌN MÓN ĂN ĐỂ HỒI MÁU')
        .setDescription(
          `❤️ **Máu hiện tại:** **${Math.round(player.hp)}/${maxHp} HP** *(Còn thiếu: ${maxHp - Math.round(player.hp)} HP)*\n\n` +
          `Hãy chọn một món ăn từ danh sách dưới đây để nạp lại thanh máu:`
        );

      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [rowSelect, rowBack], files: [] });
    }

    // Xử lý Bán Đồ (Sell)
    if (id === 'inv_sell' || id.startsWith('sell_')) {
      const sellCmd = require('./sell');
      return sellCmd.handleButton(interaction);
    }

    // Xử lý Cửa Hàng (Shop)
    if (id.startsWith('shop_cat_')) {
      const shopCmd = require('./shop');
      return shopCmd.handleButton(interaction);
    }

    // 3. Xử lý Vứt đồ trong Túi
    if (id === 'inv_discard') {
      if (!player.inventory || player.inventory.length === 0) {
        return interaction.reply({ content: `<@${player.id}> ❌ Túi đồ của bạn đang trống!`, ephemeral: true });
      }

      const options = player.inventory.slice(0, 25).map(i => {
        const itemDef = config.ITEMS[i.itemId];
        return {
          label: `${itemDef ? itemDef.name : i.itemId} (Đang có: x${i.count})`,
          description: `Bấm để chọn vứt bỏ vật phẩm này khỏi túi`,
          value: i.itemId,
          emoji: itemDef && itemDef.emoji ? itemDef.emoji : '📦'
        };
      });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('inv_select_discard')
        .setPlaceholder('Chọn vật phẩm bạn muốn vứt bỏ...')
        .addOptions(options);

      const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
      const rowBack = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_inventory').setLabel('Quay lại Túi Đồ').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );

      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🗑️ VỨT BỎ VẬT PHẨM (DISCARD ITEM)')
        .setDescription(
          `Hãy chọn món đồ bạn muốn **vứt bỏ vĩnh viễn** khỏi túi đồ để giải phóng ô chứa (Slot):\n\n` +
          `⚠️ **Lưu ý:** Vật phẩm sau khi vứt sẽ biến mất hoàn toàn và không thể khôi phục!`
        );

      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [rowSelect, rowBack], files: [] });
    }

    // Xác nhận vứt bỏ vật phẩm (1 cái hoặc toàn bộ)
    if (id.startsWith('inv_discard_confirm_')) {
      const isAll = id.startsWith('inv_discard_confirm_all_');
      const itemId = isAll
        ? id.replace('inv_discard_confirm_all_', '')
        : id.replace('inv_discard_confirm_1_', '');

      const itemInInv = (player.inventory || []).find(i => i.itemId === itemId);
      const itemDef = config.ITEMS[itemId] || { name: itemId, emoji: '📦' };

      if (!itemInInv || itemInInv.count <= 0) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Bạn không còn vật phẩm này trong túi đồ!`,
          ephemeral: true
        });
      }

      const countToRemove = isAll ? itemInInv.count : 1;
      db.removeItem(player, itemId, countToRemove);
      db.saveData();

      const usedSlots = db.getUsedSlots(player);
      const maxSlots = db.getMaxSlots(player);

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('🗑️ ĐÃ VỨT BỎ VẬT PHẨM THÀNH CÔNG!')
        .setDescription(
          `Đã vứt bỏ vĩnh viễn **x${countToRemove} ${itemDef.name}** ${itemDef.emoji} khỏi túi đồ!\n\n` +
          `📦 **Sức chứa kho đồ hiện tại:** **${usedSlots}/${maxSlots} Ô (Slot)**`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('inv_discard').setLabel('Tiếp Tục Vứt Đồ').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_inventory').setLabel('Xem Túi Đồ').setEmoji('🎒').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_back').setLabel('Menu Chính').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
    }

    // 4. KHU VỰC: 🏠 Nhà (Home)
    if (id === 'area_home') {
      const timeInfo = timeSystem.getMinecraftTime();
      const chestItemsCount = (player.chest || []).reduce((sum, i) => sum + i.count, 0);

      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('🏠 Nhà Riêng Của Bạn')
        .setDescription(
          `Chào mừng bạn trở về ngôi nhà ấm cúng!\nĐây là khu vực **An Toàn Tuyệt Đối**, quái vật không thể xâm nhập.\n\n` +
          `⏰ **Thời gian bên ngoài:** ${timeInfo.icon} **${timeInfo.timeString}** (${timeInfo.title})\n` +
          `❤️ **Máu:** ${Math.round(player.hp)}/${player.maxHp} | 💧 **Mana:** ${Math.round(player.mana)}/${player.maxMana}\n` +
          `📦 **Rương an toàn:** ${chestItemsCount} vật phẩm được cất giữ *(Không bao giờ bị mất khi chết!)*`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('home_sleep').setLabel('Đi Ngủ (Hồi Máu & Qua Đêm)').setEmoji('🛏️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('home_chest').setLabel('Mở Rương Đồ An Toàn').setEmoji('📦').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      const files = imageHelper.attachWorkImage(embed, 'home');
      return interaction.update({ embeds: [embed], components: [row], files });
    }

    if (id === 'home_sleep') {
      // Hồi phục đầy đủ
      player.hp = player.maxHp;
      player.mana = player.maxMana;
      const skipped = timeSystem.skipToDay();
      db.saveData();

      const msg = skipped
        ? '🛏️ Bạn đã nằm lên giường ngủ một giấc ngon lành... Bạn thức dậy khi bình minh ló rạng! ☀️ (Máu và Mana đã được hồi phục 100%!)'
        : '🛏️ Bạn chợp mắt một lát trên giường... Máu và Mana đã được hồi phục 100%!';

      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('☀️ Chúc Một Ngày Tốt Lành!')
        .setDescription(msg);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_home').setLabel('Ở lại Nhà').setEmoji('🏠').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Ra Ngoài Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [row], files: [] });
    }

    if (id === 'home_chest') {
      const payload = uiHelper.buildHomeChestScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'home_chest_deposit') {
      const payload = uiHelper.buildHomeChestDepositScreen(player, 'gear', 0);
      return interaction.update({ ...payload, files: [] });
    }

    if (id.startsWith('home_chest_dep_cat_')) {
      const cat = id.replace('home_chest_dep_cat_', '');
      const payload = uiHelper.buildHomeChestDepositScreen(player, cat, 0);
      return interaction.update({ ...payload, files: [] });
    }

    if (id.startsWith('home_chest_dep_page_')) {
      const parts = id.split('_'); // home, chest, dep, page, cat, pageNum
      const cat = parts[4] || 'gear';
      const pageNum = parseInt(parts[5], 10) || 0;
      const payload = uiHelper.buildHomeChestDepositScreen(player, cat, pageNum);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'home_chest_withdraw') {
      const payload = uiHelper.buildHomeChestWithdrawScreen(player, 'all', 0);
      return interaction.update({ ...payload, files: [] });
    }

    if (id.startsWith('home_chest_wit_cat_')) {
      const cat = id.replace('home_chest_wit_cat_', '');
      const payload = uiHelper.buildHomeChestWithdrawScreen(player, cat, 0);
      return interaction.update({ ...payload, files: [] });
    }

    if (id.startsWith('home_chest_wit_page_')) {
      const parts = id.split('_'); // home, chest, wit, page, cat, pageNum
      const cat = parts[4] || 'all';
      const pageNum = parseInt(parts[5], 10) || 0;
      const payload = uiHelper.buildHomeChestWithdrawScreen(player, cat, pageNum);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'home_chest_expand') {
      const res = db.upgradeHomeChest(player);
      if (!res.success) {
        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({ content: res.message, ephemeral: true }).catch(() => {});
        }
        return interaction.reply({ content: res.message, ephemeral: true }).catch(() => {});
      }
      const payload = uiHelper.buildHomeChestScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'menu_combine') {
      const payload = uiHelper.buildCombineScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    // 5. KHU VỰC: 🪵 Rừng gỗ sồi (Oak Forest)
    if (id === 'area_forest') {
      const isDay = timeSystem.isDay();
      const embed = new EmbedBuilder()
        .setColor(0x15803d)
        .setTitle('🪵 Rừng Gỗ Sồi')
        .setDescription(
          `Bạn đang đứng giữa những tán cây gỗ sồi xanh mướt.\n` +
          `Thời gian hiện tại: **${isDay ? '☀️ Ban Ngày (An Toàn)' : '🌙 Ban Đêm (Cực Kỳ Nguy Hiểm)'}**\n\n` +
          `Bạn muốn làm gì?`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('forest_chop').setLabel('Chặt Cây Lấy Gỗ').setEmoji('🪓').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('forest_hunt_animals').setLabel('Săn Thú (Heo, Bò, Cừu, Gà)').setEmoji('🐑').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('forest_hunt').setLabel('Săn Quái Đêm').setEmoji('🏹').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );

      const files = imageHelper.attachWorkImage(embed, 'forest');
      return interaction.update({ embeds: [embed], components: [row], files });
    }

    if (id === 'forest_chop') {
      const result = woodcuttingSystem.chop(player);

      if (result.inventoryFull) {
        return interaction.reply({
          content: `<@${player.id}> ${result.message}`,
          ephemeral: true
        });
      }

      if (result.onCooldown) {
        return interaction.reply({
          content: `<@${player.id}> ${result.message}`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x16a34a)
        .setTitle('🪓 Tiếng Rìu Vang Vọng Rừng Xanh!')
        .setDescription(result.message);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('forest_chop').setLabel('Chặt Tiếp').setEmoji('🪓').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('area_forest').setLabel('Quay lại Rừng').setEmoji('🪵').setStyle(ButtonStyle.Secondary)
      );

      const files = imageHelper.attachWorkImage(embed, 'woodcutting');
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files });
    }

    if (id === 'forest_hunt_animals') {
      // Săn động vật nông trại (Heo, Bò, Cừu, Gà)
      const mob = mobSystem.spawnMob('animals');
      return combatSystem.startCombat(interaction, player, mob);
    }

    if (id === 'forest_hunt') {
      // Săn quái / thú trong rừng
      const mob = mobSystem.spawnMob('forest');
      return combatSystem.startCombat(interaction, player, mob);
    }

    // 6. KHU VỰC: 🪨 Hang Đá (Stone Cave)
    if (id === 'area_cave') {
      const embed = new EmbedBuilder()
        .setColor(0x4b5563)
        .setTitle('🪨 Hang Đá Sâu Thẳm')
        .setDescription(
          `Ánh sáng le lói từ đuốc phản chiếu lên những vách đá ẩm ướt.\n` +
          `Hang đá chứa rất nhiều khoáng sản quý như Than, Sắt, Vàng, Kim Cương và Hắc Diện Thạch.\n` +
          `Tuy nhiên, bóng tối là nơi trú ẩn của lũ Zombie, Skeleton và Creeper!`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cave_mine').setLabel('Đào Khoáng Sản').setEmoji('⛏️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('cave_hunt').setLabel('Chiến Đấu Quái Hang').setEmoji('⚔️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );

      const files = imageHelper.attachWorkImage(embed, 'cave');
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files });
    }

    if (id === 'cave_mine') {
      const result = miningSystem.mineCave(player);

      if (result.noPickaxe) {
        const embed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('⛏️ KHÔNG CÓ CÚP (PICKAXE)!')
          .setDescription(result.message);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('area_crafting').setLabel('Đến Bàn Chế Tạo').setEmoji('🪑').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('area_cave').setLabel('Quay lại Hang').setEmoji('🪨').setStyle(ButtonStyle.Secondary)
        );
        return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
      }

      if (result.inventoryFull) {
        return interaction.reply({
          content: `<@${player.id}> ${result.message}`,
          ephemeral: true
        });
      }

      if (result.onCooldown) {
        return interaction.reply({
          content: `<@${player.id}> ${result.message}`,
          ephemeral: true
        });
      }

      if (result.encounterMob) {
        return combatSystem.startCombat(interaction, player, result.mob);
      }

      const embed = new EmbedBuilder()
        .setColor(0x0ea5e9)
        .setTitle('⛏️ Tiếng Cuốc Vang Lên Leng Keng!')
        .setDescription(result.message);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('cave_mine').setLabel('Đào Tiếp').setEmoji('⛏️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('area_cave').setLabel('Quay lại Hang').setEmoji('🪨').setStyle(ButtonStyle.Secondary)
      );

      const files = imageHelper.attachWorkImage(embed, 'mining');
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files });
    }

    if (id === 'cave_hunt') {
      const mob = mobSystem.spawnMob('cave');
      return combatSystem.startCombat(interaction, player, mob);
    }

    // 7. KHU VỰC: 🧟 Hầm Ngục (Dungeon)
    if (id === 'area_dungeon') {
      if (player.level < 3) {
        return interaction.reply({
          content: '❌ **Cấp độ chưa đủ!** Hầm Ngục yêu cầu người chơi đạt ít nhất **Cấp 3** để bước vào.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x7c2d12)
        .setTitle('🧟 Hầm Ngục Cổ Xưa (Dungeon)')
        .setDescription(
          `Căn phòng đá rêu phong bao trùm bởi mạng nhện và lồng lộng gió lạnh.\n` +
          `Một chiếc lồng quái Spawner đang xoay tròn điên cuồng ở giữa phòng!\n\n` +
          `Quái vật trong hầm ngục rất nguy hiểm nhưng chiếc Rương Kho Báu có thể chứa **Vật Tổ Bất Tử (Totem of Undying)**, **Táo Vàng** và nhiều trang bị quý hiếm!`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('dungeon_raid').setLabel('Đột Kích Hầm Ngục').setEmoji('⚔️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );

      const files = imageHelper.attachWorkImage(embed, 'dungeon');
      return interaction.update({ embeds: [embed], components: [row], files });
    }

    if (id === 'dungeon_raid') {
      const mob = mobSystem.spawnMob('dungeon');
      return combatSystem.startCombat(interaction, player, mob, (result) => {
        if (result.won) {
          // Thưởng thêm mở rương dungeon
          const bonusLoot = [];
          if (Math.random() < 1 / 200) {
            db.addItem(player, 'totem_of_undying', 1);
            bonusLoot.push(`🗿 **x1 VẬT TỔ BẤT TỬ (TOTEM OF UNDYING) SIÊU HIẾM (1:200) - BẢO HIỂM CHẾT KHÔNG MẤT ĐỒ!**`);
          }
          if (Math.random() < 0.3) {
            db.addItem(player, 'golden_apple', 1);
            bonusLoot.push(`🍏 x1 Táo Vàng`);
          }
          if (Math.random() < 0.4) {
            db.addItem(player, 'diamond', 2);
            bonusLoot.push(`💎 x2 Kim cương`);
          }
          if (bonusLoot.length > 0) {
            db.saveData();
          }
        }
      });
    }

    // 8. KHU VỰC: 🌋 NETHER (Địa Ngục)
    if (id === 'area_nether') {
      const isUnlocked = player.unlocked && player.unlocked.nether;

      if (!isUnlocked) {
        const obsCount = db.getItemCount(player, 'obsidian');
        const flintCount = db.getItemCount(player, 'flint_and_steel');

        const embed = new EmbedBuilder()
          .setColor(0x991b1b)
          .setTitle('🌋 Cổng Địa Ngục Nether (Chưa Kích Hoạt)')
          .setDescription(
            `Để bước chân vào thế giới rực lửa Nether, bạn cần xây dựng một **Cổng Nether** vững chắc bằng Hắc diện thạch và dùng Bật lửa thắp sáng!\n\n` +
            `📋 **Nguyên liệu yêu cầu:**\n` +
            `• ⬛ Hắc diện thạch (Obsidian): **${obsCount}/10**\n` +
            `• 🔥 Bật lửa (Flint & Steel): **${flintCount}/1**\n\n` +
            `💡 **Mẹo chế tạo Hắc diện thạch:**\n` +
            `Hãy dùng **3 Thỏi Sắt** chế tạo Xô Sắt \`/craft\`, sau đó đi dạo tìm **Hồ Nước (1:10)** và **Hồ Dung Nham (1:15)** để múc. Đem kết hợp 1 Xô Nước + 1 Xô Dung Nham tại Bàn Chế Tạo để đúc ra 1 Hắc Diện Thạch (và nhận lại 2 Xô rỗng)!`
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('nether_activate').setLabel('Kích Hoạt Cổng Nether').setEmoji('🔥').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
        );

        return interaction.update({ embeds: [embed], components: [row], files: [] });
      }

      // Đã mở khóa Nether: Tự do ra vào MIỄN PHÍ vĩnh viễn!
      const embed = new EmbedBuilder()
        .setColor(0x7f1d1d)
        .setTitle('🌋 Địa Ngục Nether (Đã Kích Hoạt - Tự Do Ra Vào Miễn Phí)')
        .setDescription(
          `Khí nóng hừng hực phả vào mặt bạn, bên dưới là những biển dung nham đỏ rực sôi sục.\n` +
          `Lối vào Cổng Nether đã mở, bạn được **TỰ DO RA VÀO HOÀN TOÀN MIỄN PHÍ**!\n\n` +
          `⛏️ **Khai Thác Khoáng Sản Chuẩn Tỉ Lệ:**\n` +
          `• Đá Địa Ngục (Netherrack): **1:1.2**\n` +
          `• Thạch Anh Nether (Quartz): **1:7**\n` +
          `• Mảnh Vỡ Cổ Đại (Ancient Debris): **1:130** *(BẮT BUỘC có Cúp Kim Cương hoặc Netherite, cúp dưới không bao giờ ra!)*\n\n` +
          `🏰 **Công Trình Nether:**\n` +
          `• **Pháo Đài Địa Ngục (Nether Fortress):** Quỷ Lửa Blaze, Wither Skeleton, Rương báu vật.\n` +
          `• **Phế Tích Bastion (Bastion Remnant):** Piglin Brute, Khối vàng, Netherite, Đĩa Pigstep.\n` +
          `• **Hóa Thạch Cổ Đại (Nether Fossil):** Khai quật khối xương và than đá.\n\n` +
          `💀 **Boss Wither 3 Đầu:**\n` +
          `• Triệu hồi bằng **3 Đầu Wither Skeleton** (Đánh quái Wither Skeleton ở Nether rơi với tỉ lệ **1:100**)!\n\n` +
          `⚠️ **Cảnh báo cực độ:** Quái vật Nether vô cùng hung hăng, hãy cẩn trọng kẻo chết rơi đồ!`
        );

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nether_mine').setLabel('Khai Thác Khoáng Sản').setEmoji('⛏️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('nether_structures').setLabel('Khám Phá Công Trình Nether').setEmoji('🏰').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('nether_hunt').setLabel('Săn Quái Nether').setEmoji('⚔️').setStyle(ButtonStyle.Danger)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nether_summon_wither').setLabel('Triệu Hồi Boss Wither (3 Đầu)').setEmoji('💀').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );

      const files = imageHelper.attachWorkImage(embed, 'nether');
      return interaction.update({ embeds: [embed], components: [row1, row2], files });
    }

    if (id === 'nether_activate') {
      const res = dimensionSystem.unlockNether(player);
      if (!res.success) {
        return interaction.reply({ content: res.message, ephemeral: true });
      }
      const embed = new EmbedBuilder().setColor(0x7f1d1d).setTitle('🔥 Kích Hoạt Thành Công!').setDescription(res.message);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_nether').setLabel('Bước Vào Nether (Miễn Phí)').setEmoji('🌋').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({ embeds: [embed], components: [row], files: [] });
    }

    if (id === 'nether_mine') {
      const res = dimensionSystem.mineNether(player);
      if (res.noPickaxe) {
        const embed = new EmbedBuilder().setColor(0xef4444).setTitle('⛏️ KHÔNG CÓ CÚP (PICKAXE)!').setDescription(res.message);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('area_nether').setLabel('Quay lại').setEmoji('🌋').setStyle(ButtonStyle.Secondary)
        );
        return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
      }
      if (res.inventoryFull) {
        return interaction.reply({
          content: `<@${player.id}> ${res.message}`,
          ephemeral: true
        });
      }

      if (res.onCooldown) {
        return interaction.reply({
          content: `<@${player.id}> ${res.message}`,
          ephemeral: true
        });
      }
      if (res.died) {
        const deathResult = require('../systems/deathSystem').handleDeath(player, res.cause);
        const embed = deathResult.embed || new EmbedBuilder().setColor(0xb91c1c).setTitle('☠️ BẠN ĐÃ TỬ VONG!').setDescription(deathResult.message);
        return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [], files: [] });
      }
      const embed = new EmbedBuilder().setColor(0xd97706).setTitle('⛏️ Thám Hiểm Nether').setDescription(res.message);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nether_mine').setLabel('Khai Thác Tiếp').setEmoji('⛏️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('area_nether').setLabel('Quay lại').setEmoji('🌋').setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
    }

    if (id === 'nether_structures') {
      return dimensionSystem.exploreNetherStructure(interaction, player);
    }

    if (id === 'explore_scoop_water') {
      return explorationSystem.handleScoopWater(interaction, player, false);
    }

    if (id === 'explore_scoop_water_all') {
      return explorationSystem.handleScoopWater(interaction, player, true);
    }

    if (id === 'explore_scoop_lava') {
      return explorationSystem.handleScoopLava(interaction, player, false);
    }

    if (id === 'explore_scoop_lava_all') {
      return explorationSystem.handleScoopLava(interaction, player, true);
    }

    if (id === 'explore_quick_craft_bucket_water') {
      return explorationSystem.handleQuickCraftBucket(interaction, player, 'water');
    }

    if (id === 'explore_quick_craft_bucket_lava') {
      return explorationSystem.handleQuickCraftBucket(interaction, player, 'lava');
    }

    if (id === 'explore_choose_fly') {
      return explorationSystem.performFlight(interaction, player);
    }

    if (id === 'explore_choose_walk') {
      return explorationSystem.performWalk(interaction, player);
    }

    if (id === 'nether_hunt') {
      const mob = mobSystem.spawnMob('nether');
      return combatSystem.startCombat(interaction, player, mob);
    }

    if (id === 'nether_summon_wither') {
      return dimensionSystem.summonWither(interaction, player);
    }

    // 9. KHU VỰC: 🌌 THE END (Vùng Đất Tận Cùng)
    if (id === 'area_the_end') {
      const isUnlocked = player.unlocked && player.unlocked.the_end;

      if (!isUnlocked) {
        const eyeCount = db.getItemCount(player, 'eye_of_ender');

        const embed = new EmbedBuilder()
          .setColor(0x4c1d95)
          .setTitle('🌌 Cổng The End (Chưa Kích Hoạt)')
          .setDescription(
            `Để du hành đến The End và diện kiến Trùm Cuối Rồng Ender, bạn phải thu thập đủ **12 Mắt Ender** để kích hoạt chiếc cổng đá cổ đại!\n\n` +
            `📋 **Yêu cầu:**\n` +
            `• 👁️ Mắt Ender (Eye of Ender): **${eyeCount}/12**\n\n` +
            `*(Mắt Ender chế tạo từ: 1 Ngọc Ender Pearl + 1 Bột Lửa Blaze Powder tại Bàn Chế Tạo)*`
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('end_activate').setLabel('Lắp 12 Mắt Ender').setEmoji('👁️').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
        );

        return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
      }

      // Đã mở khóa The End
      const embed = new EmbedBuilder()
        .setColor(0x581c87)
        .setTitle('🌌 Vùng Đất The End')
        .setDescription(
          `Những hòn đảo đá End trôi lơ lửng giữa khoảng không vũ trụ đen kịt.\n` +
          `Tiếng gầm thét xé toạc bầu trời của **RỒNG ENDER (Ender Dragon)** đang đợi bạn ở đảo chính!\n\n` +
          `Hạ gục Rồng Ender sẽ mang lại **Trứng Rồng**, **Cánh Cứng Elytra**, và mở đường tới Thành Phố End để thu thập **Hộp Shulker**!`
        );

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('end_dragon_party').setLabel('Lập Đội Săn Rồng (Co-op) 👥').setEmoji('⚔️').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('end_dragon_boss').setLabel('Khiêu Chiến Solo 🐲').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('end_city').setLabel('Khám Phá Thành Phố End 🛸').setStyle(ButtonStyle.Primary)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      const files = imageHelper.attachWorkImage(embed, 'dragon');
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row1, row2], files });
    }

    if (id === 'end_activate') {
      const res = dimensionSystem.unlockTheEnd(player);
      if (!res.success) {
        return interaction.reply({ content: `<@${player.id}> ${res.message}`, ephemeral: true });
      }
      const embed = new EmbedBuilder().setColor(0x581c87).setTitle('🌌 Cổng End Đã Khởi Động!').setDescription(res.message);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_the_end').setLabel('Bước Vào The End').setEmoji('🌌').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
    }

    if (id === 'end_dragon_boss') {
      const cooldownMs = 5 * 3600 * 1000;
      const diff = player.lastDragonFight ? Date.now() - player.lastDragonFight : Infinity;
      if (diff < cooldownMs) {
        const rem = cooldownMs - diff;
        const h = Math.floor(rem / 3600000);
        const m = Math.ceil((rem % 3600000) / 60000);
        return interaction.reply({
          content: `<@${player.id}> ⏳ **Rồng Ender chưa hồi sinh!**\nBạn cần đợi thêm **${h} giờ ${m} phút** nữa mới có thể tiếp tục khiêu chiến Trùm Rồng (Thời gian hồi chiêu 5 tiếng/lần).`,
          ephemeral: true
        });
      }

      const hasBow = (player.equipment && (player.equipment.bow === 'bow' || player.equipment.bow === 'crossbow')) || db.hasItem(player, 'bow') || db.hasItem(player, 'crossbow');
      const arrowCount = db.getItemCount(player, 'arrow');
      if (!hasBow || arrowCount <= 0) {
        return interaction.reply({
          content: `<@${player.id}> 🏹 **Chưa đủ trang bị khiêu chiến Rồng Ender!**\nRồng Ender bay lượn trên bầu trời cao và 12 Pha Lê End ngự trên đỉnh các cột tháp Obsidian!\nBạn bắt buộc phải sở hữu **Cung tên (Bow/Crossbow)** và ít nhất **1 Mũi tên (Arrow)** trong người mới có thể vào khiêu chiến!`,
          ephemeral: true
        });
      }

      const dragon = mobSystem.spawnEnderDragon();
      return combatSystem.startCombat(interaction, player, dragon);
    }

    if (id === 'end_dragon_party') {
      return partySystem.createParty(interaction, player);
    }

    if (id === 'end_city') {
      const dragonKilled = (player.stats && player.stats.dragonKilled) || 0;
      if (dragonKilled === 0) {
        return interaction.reply({
          content: '❌ **CỔNG END GATEWAY ĐANG ĐÓNG KÍN!**\nBạn phải khiêu chiến và hạ gục **RỒNG ENDER (Ender Dragon)** ít nhất 1 lần để kích hoạt cổng dịch chuyển dẫn tới Thành Phố End & Tàu End!',
          ephemeral: true
        });
      }

      // Đã diệt rồng: Khám phá End City & Tàu End tìm Cánh Cứng Elytra
      const hasElytra = (player.equipment && player.equipment.chestplate === 'elytra') || db.hasItem(player, 'elytra');
      const elytraAwarded = !hasElytra || Math.random() < 0.35; // Nếu chưa có thì 100% nhận, nếu có rồi thì 35% nhận thêm

      const shulkerShells = Math.floor(2 + Math.random() * 3);
      const diamonds = Math.floor(2 + Math.random() * 4);

      if (elytraAwarded) {
        db.addItem(player, 'elytra', 1);
      }
      db.addItem(player, 'shulker_shell', shulkerShells);
      db.addItem(player, 'diamond', diamonds);
      db.addExp(player, 250);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0xa855f7)
        .setTitle('🛸 BẠN ĐÃ TÌM THẤY TÀU END VÀ ĐOẠT ĐƯỢC CÁNH CỨNG ELYTRA!')
        .setDescription(
          `Bạn ném Ngọc Ender xuyên qua cổng **End Gateway**, dịch chuyển tới các đảo End xa xôi ngập tràn cây Chorus!\n` +
          `Trước mắt bạn là một **Con Tàu End (End Ship)** lơ lửng kỳ vĩ giữa không gian!\n` +
          `Bạn tiến vào phòng thuyền trưởng và gỡ lấy báu vật trên khung treo tường:\n\n` +
          (elytraAwarded ? `• 🪽 **x1 CÁNH CỨNG ELYTRA HUYỀN THOẠI!**\n` : `• 🪽 Bạn đã sở hữu Cánh Cứng Elytra từ trước!\n`) +
          `• 🐚 **x${shulkerShells} Vỏ Shulker** *(Dùng chế tạo Hộp Shulker tăng sức chứa balo lên 4608)*\n` +
          `• 💎 **x${diamonds} Kim Cương**\n` +
          `• ⭐ **+250 EXP**\n\n` +
          `🚀 **MẸO BAY BẰNG CÁNH CỨNG ELYTRA:**\n` +
          `1. Chế tạo **Pháo Hoa (Firework Rocket)** tại Bàn Chế Tạo bằng **Giấy + Thuốc Súng**.\n` +
          `2. Mặc Cánh Cứng Elytra vào ô Áo hoặc để trong túi.\n` +
          `3. Gõ lệnh \`/explore\` hoặc bấm **[Đi Dạo]** để kích hoạt **Chế Độ Bay**!\n` +
          `4. Khi bay: **100% KHÔNG BỊ QUÁI VẬT TẤN CÔNG** và tỉ lệ phát hiện các công trình quý hiếm (Làng, Đền sa mạc, Tiền đồn, Trial Chambers 1.21.1) là **7%** (so với 5% khi đi bộ)!`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_the_end').setLabel('Quay lại The End').setEmoji('🌌').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực Khác').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [row], files: [] });
    }

    // 10. KHU VỰC: 🪑 Bàn Chế Tạo (Crafting Table)
    if (id === 'area_crafting' || id === 'area_blacksmith' || id.startsWith('craft_tab_')) {
      const activeTab = id.startsWith('craft_tab_') ? id.replace('craft_tab_', '') : 'portal_magic';
      const allRecipes = craftingSystem.getRecipes();

      let filtered = [];
      let tabTitle = '';
      if (activeTab === 'portal_magic') {
        tabTitle = '🔮 CỔNG, MA THUẬT & HẮC DIỆN THẠCH';
        filtered = allRecipes.filter(r =>
          r.id.includes('obsidian') || r.id.includes('eye_of_ender') || r.id.includes('blaze') ||
          r.id.includes('flint') || r.id.includes('anvil') || r.id.includes('enchanting_table') ||
          r.id.includes('golden_apple') || r.id.includes('totem') || r.id.includes('shulker') ||
          r.id.includes('beacon') || r.id.includes('end_crystal') || r.id.includes('netherite')
        );
      } else if (activeTab === 'tools') {
        tabTitle = '⚔️ VŨ KHÍ & DỤNG CỤ';
        filtered = allRecipes.filter(r =>
          r.id.includes('pickaxe') || r.id.includes('axe') || r.id.includes('sword') ||
          r.id.includes('bow') || r.id.includes('arrow') || r.id.includes('shield') ||
          r.id.includes('mace') || r.id.includes('wind_charge')
        );
      } else if (activeTab === 'armor') {
        tabTitle = '🛡️ ÁO GIÁP & PHÒNG NGỰ';
        filtered = allRecipes.filter(r =>
          r.id.includes('helmet') || r.id.includes('chestplate') ||
          r.id.includes('leggings') || r.id.includes('boots')
        );
      } else {
        tabTitle = '📦 CƠ BẢN & TIỆN ÍCH';
        filtered = allRecipes.filter(r =>
          r.id.includes('stick') || r.id.includes('torch') || r.id.includes('chest') ||
          r.id.includes('bed') || r.id.includes('furnace') || r.id.includes('bucket') ||
          r.id.includes('bread') || r.id.includes('book') || r.id.includes('block')
        );
      }

      if (filtered.length === 0) filtered = allRecipes;

      const seenIds = new Set();
      const options = [];
      for (const r of filtered) {
        if (seenIds.has(r.id)) continue;
        seenIds.add(r.id);
        const resDef = config.ITEMS[r.result];
        options.push({
          label: `${r.name}`.slice(0, 100),
          description: Object.entries(r.materials).map(([m, c]) => `${config.ITEMS[m] ? config.ITEMS[m].name : m} x${c}`).join(', ').slice(0, 100),
          value: r.id,
          emoji: resDef && resDef.emoji ? resDef.emoji : '🔨'
        });
        if (options.length >= 25) break;
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId('craft_select_recipe')
        .setPlaceholder(`Chọn món đồ trong: ${tabTitle}...`)
        .addOptions(options);

      const embed = new EmbedBuilder()
        .setColor(0xd97706)
        .setTitle(`🪑 Bàn Chế Tạo Minecraft: ${tabTitle}`)
        .setDescription(
          `Tại Bàn Chế Tạo, bạn có thể tự đúc **Hắc diện thạch (Obsidian)** để mở Cổng Địa Ngục và chế **Mắt Ender** để bước vào Cổng The End!\n\n` +
          `• **Chọn công thức từ menu thả bên dưới** để chế tạo ngay tức thì\n` +
          `• Hoặc dùng lệnh: \`/craft item name:[tên]\` (ví dụ: \`/craft item name:obsidian\`, \`/craft item name:mắt ender\`)\n\n` +
          `📁 *Bấm các nút danh mục bên dưới để chuyển nhóm công thức:*`
        );

      const row1 = new ActionRowBuilder().addComponents(select);
      const rowTabs = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('craft_tab_portal_magic').setLabel('Cổng & Ma Thuật').setEmoji('🔮').setStyle(activeTab === 'portal_magic' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('craft_tab_tools').setLabel('Vũ Khí & Cúp').setEmoji('⚔️').setStyle(activeTab === 'tools' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('craft_tab_armor').setLabel('Áo Giáp').setEmoji('🛡️').setStyle(activeTab === 'armor' ? ButtonStyle.Primary : ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('craft_tab_basic').setLabel('Cơ Bản & Rương').setEmoji('📦').setStyle(activeTab === 'basic' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      );
      const rowBack = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row1, rowTabs, rowBack], files: [] });
    }

    // KHU VỰC: 🔥 Lò Nung (Furnace) - Yêu cầu 50 Đá Cuội mở khóa
    if (id === 'area_furnace') {
      const payload = smeltingSystem.buildFurnaceScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'furnace_unlock_confirm') {
      const res = smeltingSystem.unlock(player);
      if (!res.success) {
        return interaction.reply({ content: `<@${player.id}> ${res.message}`, ephemeral: true });
      }
      const payload = smeltingSystem.buildFurnaceScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'furnace_select_recipe') {
      const selected = interaction.values[0];
      return smeltingSystem.handleSmeltRecipe(interaction, player, selected);
    }

    if (id === 'furnace_smelt_all') {
      return smeltingSystem.handleSmeltAll(interaction, player);
    }

    // Nút khai mở Bàn Phù Phép (-2 Kim cương, -4 Hắc diện thạch)
    if (id === 'enchant_unlock_confirm') {
      const res = enchantSystem.unlock(player);
      if (!res.success) {
        return interaction.reply({ content: `<@${player.id}> ${res.message}`, ephemeral: true });
      }
    }

    // Nút quay Gacha bùa chú ma thuật (Bậc 1, 2, 3)
    if (id.startsWith('enchant_spin_')) {
      const parts = id.split('_');
      const tier = parseInt(parts.pop(), 10) || 1;
      const slot = parts.slice(2).join('_');
      const result = enchantSystem.gachaEnchant(player, slot, tier);

      if (!result.success) {
        if (result.isAlreadyEnchanted) {
          const alertPayload = enchantSystem.buildAlreadyEnchantedAlert(player, slot, result);
          return interaction.reply({ ...alertPayload, ephemeral: true });
        }

        const failEmbed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('⚠️ KHÔNG THỂ PHÙ PHÉP')
          .setDescription(result.message);

        const failRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('area_enchant').setLabel('Bàn Phù Phép').setEmoji('🔮').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
        );

        return interaction.reply({ embeds: [failEmbed], components: [failRow], ephemeral: true });
      }

      const resEmbed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('✨ GACHA PHÙ PHÉP THÀNH CÔNG!')
        .setDescription(result.message)
        .setFooter({ text: 'Dùng /menu -> Chỉ Số hoặc /menu -> Trang Bị để kiểm tra uy lực mới' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_enchant').setLabel('Tiếp Tục Phù Phép').setEmoji('🔮').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [resEmbed], components: [row], files: [] });
    }

    // KHU VỰC: 🔮 Bàn Phù Phép (Enchanting Table) - Yêu cầu 2 Kim Cương & 4 Hắc Diện Thạch mở khóa
    if (id === 'area_enchant' || id === 'enchant_unlock_confirm') {
      if (!enchantSystem.isUnlocked(player)) {
        const payload = enchantSystem.buildEnchantUnlockScreen(player);
        return interaction.update({ ...payload, files: [] });
      }

      // Người chơi đã có Bàn Phù Phép!
      const eq = player.equipment || {};
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

      const equippedOptions = slots
        .filter(s => eq[s.slot])
        .map(s => {
          const itemDef = config.ITEMS[eq[s.slot]] || {};
          const currentEnchants = player.enchants && player.enchants[s.slot]
            ? Object.entries(player.enchants[s.slot]).map(([k, v]) => `${k} ${v}`).join(', ')
            : 'Chưa có bùa';
          return {
            label: `${s.emoji} ${itemDef.name || s.slot} (${s.name})`,
            description: `Bùa hiện tại: ${currentEnchants}`.slice(0, 100),
            value: s.slot,
            emoji: s.emoji
          };
        });

      if (equippedOptions.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x8b5cf6)
          .setTitle('🔮 BÀN PHÙ PHÉP (ENCHANTING TABLE)')
          .setDescription(
            `Bạn đang đứng trước chiếc Bàn Phù Phép ma thuật tỏa ánh sáng huyền bí!\n\n` +
            `⚠️ **Bạn chưa trang bị bất kỳ món đồ nào (Kiếm, Cúp, Rìu, Cung hoặc Giáp) trên người!**\n` +
            `Hãy vào \`/menu\` -> Túi Đồ và chọn vật phẩm để **Trang Bị** vào người trước khi phù phép.`
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('menu_inventory').setLabel('Mở Túi Đồ').setEmoji('🎒').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
        );

        return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
      }

      const selectItem = new StringSelectMenuBuilder()
        .setCustomId('enchant_select_slot')
        .setPlaceholder('Chọn món trang bị đang mặc để yểm bùa...')
        .addOptions(equippedOptions);

      const lapisCount = db.getItemCount(player, 'lapis');

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('🔮 BÀN PHÙ PHÉP (ENCHANTING TABLE)')
        .setDescription(
          `Chào mừng bạn đến với Bàn Phù Phép ma thuật Minecraft!\n\n` +
          `🔷 **Ngọc Lưu Ly (Lapis Lazuli):** **${lapisCount} viên**\n` +
          `⭐ **Điểm Kinh Nghiệm (EXP):** **${Math.round(player.exp)} EXP**\n\n` +
          `*Bước 1: Hãy chọn món trang bị bạn đang mặc muốn yểm bùa từ menu bên dưới:*`
        );

      const row1 = new ActionRowBuilder().addComponents(selectItem);
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_disenchant').setLabel('Tẩy Bùa (1 Lưu Ly)').setEmoji('🧹').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('area_anvil').setLabel('Cái Đe Ép Sách').setEmoji('🔨').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row1, row2], files: [] });
    }

    // 🔮 KHU TẨY PHÙ PHÉP (ĐÁ MÀI / GRINDSTONE) - Tốn 1 Lapis Lazuli / 1 lần xóa
    if (id === 'menu_disenchant') {
      const payload = enchantSystem.buildDisenchantScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    // Xác nhận tẩy bùa trực tiếp cho 1 slot
    if (id.startsWith('disenchant_confirm_')) {
      const slot = id.replace('disenchant_confirm_', '');
      const res = enchantSystem.disenchantSlot(player, slot);

      if (!res.success) {
        return interaction.reply({ content: `<@${player.id}> ${res.message}`, ephemeral: true });
      }

      const winEmbed = new EmbedBuilder()
        .setColor(0x06b6d4)
        .setTitle('🧹 ĐÃ TẨY SẠCH BÙA CHÚ (ĐÁ MÀI GRINDSTONE)')
        .setDescription(res.message);

      const winRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_enchant').setLabel('Quay Bùa Mới Ngay').setEmoji('🔮').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_disenchant').setLabel('Tẩy Món Khác').setEmoji('🧹').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({ content: `<@${player.id}>`, embeds: [winEmbed], components: [winRow], ephemeral: true });
      }
      return interaction.reply({ content: `<@${player.id}>`, embeds: [winEmbed], components: [winRow], ephemeral: true });
    }

    // 11. KHU VỰC: 🛒 Sàn Giao Dịch & 🏦 Ngân Hàng
    if (id === 'area_shop') {
      const shopCmd = require('./shop');
      const payload = shopCmd.buildShopScreen(player, 'potions');
      return interaction.update(payload);
    }

    if (id === 'area_bank') {
      const embed = new EmbedBuilder()
        .setColor(0x2563eb)
        .setTitle('🏦 Ngân Hàng Thành Phố')
        .setDescription(
          `Gửi tiền tiết kiệm tại ngân hàng là cách an toàn nhất để tránh bị **RƠI 50% TIỀN KHI CHẾT**!\n\n` +
          `🪙 **Tiền mặt mang theo:** **${player.coins} Xu**\n` +
          `🏦 **Tiền gửi an toàn:** **${player.bank || 0} Xu**\n\n` +
          `*Dùng các nút bên dưới để gửi hoặc rút tiền:*`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('bank_deposit_all').setLabel('Gửi Toàn Bộ Tiền Vào Ngân Hàng').setEmoji('📥').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('bank_withdraw_all').setLabel('Rút Toàn Bộ Tiền Mặt Ra').setEmoji('📤').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ embeds: [embed], components: [row], files: [] });
    }

    if (id === 'bank_deposit_all') {
      if (player.coins <= 0) {
        return interaction.reply({ content: 'Bạn không có đồng tiền mặt nào để gửi!', ephemeral: true });
      }
      player.bank = (player.bank || 0) + player.coins;
      const sent = player.coins;
      player.coins = 0;
      db.saveData();

      return interaction.reply({
        content: `✅ Đã gửi thành công **${sent} Xu** vào Ngân hàng! Số dư trong két an toàn hiện tại: **${player.bank} Xu**.`,
        ephemeral: true
      });
    }

    if (id === 'bank_withdraw_all') {
      if (!player.bank || player.bank <= 0) {
        return interaction.reply({ content: 'Trong tài khoản ngân hàng của bạn không có tiền!', ephemeral: true });
      }
      player.coins += player.bank;
      const withdrawn = player.bank;
      player.bank = 0;
      db.saveData();

      return interaction.reply({
        content: `✅ Đã rút thành công **${withdrawn} Xu** về túi tiền mặt!`,
        ephemeral: true
      });
    }

    // 12. KHU VỰC: ⚖️ Đấu Giá (Auction)
    if (id === 'area_auction') {
      const embed = new EmbedBuilder()
        .setColor(0xeab308)
        .setTitle('⚖️ Sàn Đấu Giá Vật Phẩm Hiếm')
        .setDescription(
          `Nơi các cao thủ trao đổi vũ khí Netherite, Cánh Cứng Elytra và Trứng Rồng!\n` +
          `Yêu cầu đạt cấp độ 6 để tham gia đấu giá liên server.`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
    }

    // 13. XỬ LÝ CÁC NÚT BẤM ĐỘI SĂN RỒNG (Party / Co-op Raid)
    if (id.startsWith('party_join_')) {
      const partyId = id.replace('party_join_', '');
      return partySystem.joinParty(interaction, partyId, player);
    }

    if (id.startsWith('party_leave_')) {
      const partyId = id.replace('party_leave_', '');
      return partySystem.leaveParty(interaction, partyId, player);
    }

    if (id.startsWith('party_invite_prompt_')) {
      return interaction.reply({
        content: `<@${player.id}> 💡 Để mời trực tiếp người chơi vào đội, hãy gõ lệnh:\n\`/party invite target: @người_chơi\``,
        ephemeral: true
      });
    }

    if (id.startsWith('party_start_')) {
      const partyId = id.replace('party_start_', '');
      return partySystem.startRaid(interaction, partyId);
    }

    if (id.startsWith('party_cancel_')) {
      const partyId = id.replace('party_cancel_', '');
      const party = partySystem.parties.get(partyId);
      if (!party || party.leaderId !== player.id) {
        return interaction.reply({ content: '❌ Chỉ có chủ đội mới có quyền giải tán đội!', ephemeral: true });
      }
      partySystem.parties.delete(partyId);
      return interaction.update({
        content: `❌ Đội săn rồng đã được giải tán bởi chủ đội <@${player.id}>.`,
        embeds: [],
        components: []
      });
    }

    if (id.startsWith('party_accept_')) {
      const partyId = id.replace('party_accept_', '');
      return partySystem.joinParty(interaction, partyId, player);
    }

    if (id.startsWith('party_decline_')) {
      return interaction.update({
        content: `<@${player.id}> đã từ chối lời mời vào đội.`,
        components: []
      });
    }
  },

  /**
   * Xử lý Select Menu trong Menu
   */
  async handleSelectMenu(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const id = interaction.customId;

    if (id === 'craft_select_recipe') {
      const recipeId = interaction.values[0];
      const result = craftingSystem.craft(player, recipeId);

      return interaction.reply({ content: `<@${player.id}> ${result.message}`, ephemeral: !result.success });
    }

    if (id === 'enchant_select_slot') {
      const slot = interaction.values[0];
      const equippedItemId = player.equipment && player.equipment[slot];
      if (!equippedItemId) {
        return interaction.reply({ content: `<@${player.id}> ❌ Bạn không còn trang bị món đồ ở vị trí này!`, ephemeral: true });
      }
      const itemDef = config.ITEMS[equippedItemId] || { name: equippedItemId, emoji: '📦' };

      const pLvl = player.level || 1;
      const lapisCount = db.getItemCount(player, 'lapis');

      const btn1 = new ButtonBuilder()
        .setCustomId(`enchant_spin_${slot}_1`)
        .setEmoji('🎲')
        .setStyle(ButtonStyle.Secondary);
      if (pLvl < 3) {
        btn1.setLabel('Bậc 1 (Cần 3 Cấp | Thiếu)').setDisabled(true);
      } else {
        btn1.setLabel('Bậc 1 (-3 Cấp & 1 Lapis)');
      }

      const btn2 = new ButtonBuilder()
        .setCustomId(`enchant_spin_${slot}_2`)
        .setEmoji('✨')
        .setStyle(ButtonStyle.Primary);
      if (pLvl < 30) {
        btn2.setLabel('Bậc 2 (Khóa: Cần Lv 30+)').setDisabled(true);
      } else if (pLvl < 6) {
        btn2.setLabel('Bậc 2 (Cần 6 Cấp | Thiếu)').setDisabled(true);
      } else {
        btn2.setLabel('Bậc 2 (-6 Cấp & 2 Lapis)');
      }

      const btn3 = new ButtonBuilder()
        .setCustomId(`enchant_spin_${slot}_3`)
        .setEmoji('🌟')
        .setStyle(ButtonStyle.Success);
      if (pLvl < 50) {
        btn3.setLabel('Bậc 3 (Khóa: Cần Lv 50+)').setDisabled(true);
      } else if (pLvl < 12) {
        btn3.setLabel('Bậc 3 (Cần 12 Cấp | Thiếu)').setDisabled(true);
      } else {
        btn3.setLabel('Bậc 3 (-12 Cấp & 3 Lapis)');
      }

      const tierRow = new ActionRowBuilder().addComponents(btn1, btn2, btn3);
      const navRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_enchant').setLabel('Chọn Món Khác').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      const promptEmbed = new EmbedBuilder()
        .setColor(0xa855f7)
        .setTitle(`🎲 GACHA PHÙ PHÉP: ${itemDef.emoji} ${itemDef.name}`)
        .setDescription(
          `Bạn đã đặt **${itemDef.emoji} ${itemDef.name}** lên Bàn Phù Phép!\n` +
          `⭐ **Cấp độ hiện tại:** Cấp **${pLvl}** | 🔷 **Lapis:** **${lapisCount}** viên\n\n` +
          `🎲 **3 BẬC QUAY GACHA BÀN PHÙ PHÉP:**\n` +
          `• **Bậc 1:** Dành cho Cấp 1–29+ | Tiêu hao: **3 Cấp Độ ⭐ + 1 Lapis 🔷** (Ra bùa Cấp 1 - 2)\n` +
          `• **Bậc 2:** Mở khóa Cấp 30–49+ | Tiêu hao: **6 Cấp Độ ⭐ + 2 Lapis 🔷** (Ra bùa Cấp 2 - 3)\n` +
          `• **Bậc 3:** Mở khóa Cấp 50+ | Tiêu hao: **12 Cấp Độ ⭐ + 3 Lapis 🔷** (Ra bùa Cấp 3 - 5 Cực Phẩm!)\n\n` +
          `Bấm nút chọn bậc bùa chú bên dưới để kích hoạt vòng quay ma thuật:`
        );

      return interaction.update({ content: `<@${player.id}>`, embeds: [promptEmbed], components: [tierRow, navRow], files: [] });
    }

    if (id === 'disenchant_select_slot') {
      const slot = interaction.values[0];
      const res = enchantSystem.disenchantSlot(player, slot);

      if (!res.success) {
        return interaction.reply({ content: `<@${player.id}> ${res.message}`, ephemeral: true });
      }

      const winEmbed = new EmbedBuilder()
        .setColor(0x06b6d4)
        .setTitle('🧹 ĐÃ TẨY SẠCH BÙA CHÚ (ĐÁ MÀI GRINDSTONE)')
        .setDescription(res.message);

      const winRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_enchant').setLabel('Quay Bùa Mới Ngay').setEmoji('🔮').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_disenchant').setLabel('Tẩy Món Khác').setEmoji('🧹').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [winEmbed], components: [winRow], files: [] });
    }

    if (id === 'enchant_apply_buff') {
      const val = interaction.values[0];
      const underscoreIdx = val.indexOf('_');
      const slot = val.slice(0, underscoreIdx);
      const enchantId = val.slice(underscoreIdx + 1);

      const result = enchantSystem.enchant(player, slot, enchantId);

      if (!result.success) {
        return interaction.reply({ content: `<@${player.id}> ${result.message}`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('✨ PHÙ PHÉP THÀNH CÔNG!')
        .setDescription(result.message);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_enchant').setLabel('Tiếp Tục Phù Phép').setEmoji('🔮').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
    }

    if (id === 'inv_select_eat') {
      const foodId = interaction.values[0];
      const eatCmd = require('./eat');
      const result = eatCmd.consumeFood(player, foodId);

      const invPayload = uiHelper.buildInventoryScreen(player);
      const alertMsg = result.success
        ? `😋 <@${player.id}> đã ăn ${result.foodInfo?.emoji || '🍖'} **${result.foodInfo?.name || foodId}**! Hồi phục **+${result.actualHealed} ❤️ HP** (Máu: **${Math.round(player.hp)}/${db.getMaxHp(player)} HP**)`
        : `❌ ${result.embed?.data?.description || 'Không thể ăn món này!'}`;

      return interaction.update({ content: alertMsg, embeds: invPayload.embeds, components: invPayload.components, files: [] });
    }

    if (id === 'inv_select_discard' || id === 'inv_select_item') {
      const itemId = interaction.values[0];
      const itemInInv = (player.inventory || []).find(i => i.itemId === itemId);
      const itemDef = config.ITEMS[itemId] || { name: itemId, emoji: '📦' };

      if (!itemInInv || itemInInv.count <= 0) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Bạn không còn vật phẩm này trong túi đồ!`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🗑️ XÁC NHẬN VỨT BỎ VẬT PHẨM')
        .setDescription(
          `Bạn có chắc chắn muốn vứt bỏ **${itemDef.name}** ${itemDef.emoji}?\n\n` +
          `📦 **Số lượng đang có:** **x${itemInInv.count}**\n` +
          `⚠️ *Vật phẩm sau khi vứt sẽ biến mất vĩnh viễn và giải phóng ô chứa trong túi đồ!*`
        );

      const buttons = [];
      if (itemInInv.count > 1) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`inv_discard_confirm_1_${itemId}`)
            .setLabel('Vứt 1 cái')
            .setEmoji('🗑️')
            .setStyle(ButtonStyle.Danger)
        );
      }

      buttons.push(
        new ButtonBuilder()
          .setCustomId(`inv_discard_confirm_all_${itemId}`)
          .setLabel(itemInInv.count > 1 ? `Vứt Toàn Bộ (x${itemInInv.count})` : 'Xác Nhận Vứt Bỏ')
          .setEmoji('💥')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('menu_inventory')
          .setLabel('Hủy / Quay lại')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Secondary)
      );

      const row = new ActionRowBuilder().addComponents(buttons);
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row], files: [] });
    }

    if (id === 'furnace_select_recipe') {
      const selected = interaction.values[0];
      return smeltingSystem.handleSmeltRecipe(interaction, player, selected);
    }

    if (id === 'equip_select_item') {
      const chosenItemId = interaction.values[0];
      const equipCmd = require('./equip');
      const result = equipCmd.equipItem(player, chosenItemId);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('equip_fast_action').setLabel('Mặc thêm món khác').setEmoji('🛡️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_equipment').setLabel('Xem Trang Bị').setEmoji('⚔️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [result.embed], components: [row], files: [] });
    }

    if (id === 'unequip_select_slot') {
      const chosenSlot = interaction.values[0];
      const unequipCmd = require('./unequip');
      const result = unequipCmd.unequipSlot(player, chosenSlot);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('unequip_fast_action').setLabel('Tháo thêm món khác').setEmoji('🥋').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('menu_equipment').setLabel('Xem Trang Bị').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
      );

      return interaction.update({ content: `<@${player.id}>`, embeds: [result.embed], components: [row], files: [] });
    }

    if (id === 'home_chest_dep_select') {
      const chosenVal = interaction.values[0];
      let res;
      if (chosenVal.startsWith('equip_')) {
        // Cất món đồ đang trang bị trên người (Cúp, Giáp, Cánh...)
        const parts = chosenVal.split('_');
        const slot = parts[1];
        res = db.depositEquipmentToHomeChest(player, slot);
      } else {
        const chosenItemId = chosenVal;
        const count = db.getItemCount(player, chosenItemId);
        const isUnstack = db.isUnstackableItem(chosenItemId);
        // Với cúp, giáp, cánh, totem, bật lửa...: cất 1 món mỗi lần
        const depositCount = isUnstack ? 1 : ((count > 64) ? 64 : count);
        res = db.depositToHomeChest(player, chosenItemId, depositCount);
      }

      if (!res.success) {
        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({ content: res.message, ephemeral: true }).catch(() => {});
        }
        return interaction.reply({ content: res.message, ephemeral: true }).catch(() => {});
      }
      const payload = uiHelper.buildHomeChestScreen(player);
      return interaction.update({ ...payload, content: `<@${player.id}>\n${res.message}`, files: [] });
    }

    if (id === 'home_chest_wit_select') {
      const chosenItemId = interaction.values[0];
      const chestItem = (player.chest || []).find(i => (i.itemId || i.id) === chosenItemId);
      const count = chestItem ? chestItem.count : 1;
      const isUnstack = db.isUnstackableItem(chosenItemId);
      const withdrawCount = isUnstack ? 1 : ((count > 64) ? 64 : count);
      const res = db.withdrawFromHomeChest(player, chosenItemId, withdrawCount);
      if (!res.success) {
        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({ content: res.message, ephemeral: true }).catch(() => {});
        }
        return interaction.reply({ content: res.message, ephemeral: true }).catch(() => {});
      }
      const payload = uiHelper.buildHomeChestScreen(player);
      return interaction.update({ ...payload, content: `<@${player.id}>\n${res.message}`, files: [] });
    }

    if (id === 'combine_select') {
      const val = interaction.values[0]; // combine_slot_itemId
      const parts = val.split('_');
      const targetSlot = parts[1];
      const secondItemId = parts.slice(2).join('_');
      const res = db.combineItems(player, targetSlot, secondItemId);
      if (!res.success) {
        if (interaction.replied || interaction.deferred) {
          return interaction.followUp({ content: res.message, ephemeral: true }).catch(() => {});
        }
        return interaction.reply({ content: res.message, ephemeral: true }).catch(() => {});
      }
      const payload = uiHelper.buildEquipmentScreen(player);
      return interaction.update({ ...payload, files: [] });
    }

    if (id === 'inv_select_sell') {
      const sellCmd = require('./sell');
      return sellCmd.handleSelectMenu(interaction);
    }

    if (id === 'shop_cat_select' || id.startsWith('shop_buy_select')) {
      const shopCmd = require('./shop');
      return shopCmd.handleSelectMenu(interaction);
    }
  }
};
