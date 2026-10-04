const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Dọn sạch túi đồ hoặc xóa món đồ chỉ định')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('ID món đồ muốn xóa hoặc gõ "all" để xóa sạch túi đồ (Mặc định: xóa sạch)')
        .setRequired(false)
    )
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Người chơi muốn xóa đồ (Dành riêng cho Admin)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const caller = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const itemArg = interaction.options.getString('item');

    const isAdmin = config.ADMIN_IDS.includes(interaction.user.id) || caller.isAdmin;

    // Nếu xóa đồ của người khác thì bắt buộc phải là Admin
    if (targetUser.id !== interaction.user.id && !isAdmin) {
      return interaction.reply({
        content: `<@${caller.id}> ❌ Bạn chỉ có quyền tự xóa túi đồ của mình, không thể xóa đồ của người khác!`,
        ephemeral: true
      });
    }

    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());

    // 1. Xóa toàn bộ túi đồ (nếu không truyền item hoặc truyền "all")
    if (!itemArg || itemArg.toLowerCase() === 'all') {
      const removedCount = (target.inventory || []).length;
      target.inventory = [];
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🗑️ ĐÃ DỌN SẠCH TÚI ĐỒ (INVENTORY CLEARED)')
        .setDescription(
          `Người thực hiện: <@${interaction.user.id}>\n` +
          `Mục tiêu: <@${target.id}>\n\n` +
          `✨ **Đã xóa sạch ${removedCount} loại vật phẩm khỏi túi đồ!**\n` +
          `📦 Sức chứa hiện tại: **0/${db.getMaxSlots(target)} Slot**.`
        )
        .setTimestamp();

      return interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
    }

    // 2. Xóa món đồ cụ thể
    const query = itemArg.toLowerCase();
    let foundKey = Object.keys(config.ITEMS).find(k => k.toLowerCase() === query);
    if (!foundKey) {
      foundKey = Object.keys(config.ITEMS).find(k => config.ITEMS[k].name.toLowerCase().includes(query));
    }

    const removeId = foundKey || query;
    const idx = (target.inventory || []).findIndex(i => i.itemId.toLowerCase() === removeId.toLowerCase());

    if (idx === -1) {
      return interaction.reply({
        content: `<@${caller.id}> ❌ <@${target.id}> hiện không có vật phẩm "${itemArg}" trong túi đồ!`,
        ephemeral: true
      });
    }

    const removedItem = target.inventory.splice(idx, 1)[0];
    db.saveData();

    const itemDef = config.ITEMS[removedItem.itemId] || { name: removedItem.itemId, emoji: '📦' };

    const embed = new EmbedBuilder()
      .setColor(0xf97316)
      .setTitle('🗑️ ĐÃ XÓA VẬT PHẨM KHỎI TÚI ĐỒ')
      .setDescription(
        `Người thực hiện: <@${interaction.user.id}>\n` +
        `Mục tiêu: <@${target.id}>\n\n` +
        `✨ Đã vứt bỏ: **${itemDef.emoji} x${removedItem.count} ${itemDef.name}**!\n` +
        `📦 Số slot còn dùng: **${db.getUsedSlots(target)}/${db.getMaxSlots(target)} Slot**.`
      )
      .setTimestamp();

    return interaction.reply({ content: `<@${target.id}>`, embeds: [embed] });
  }
};
