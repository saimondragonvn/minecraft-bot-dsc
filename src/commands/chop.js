const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const woodcuttingSystem = require('../systems/woodcuttingSystem');
const imageHelper = require('../utils/imageHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chop')
    .setDescription('Chặt cây lấy Gỗ Sồi, Que Gỗ và Táo trong rừng (Tốc độ phụ thuộc vào Rìu)'),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());

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
      .setTitle('🪓 Bạn Đã Đốn Hạ Một Cây Gỗ Sồi!')
      .setDescription(result.message)
      .setFooter({ text: 'Dùng /menu để xem túi đồ và các khu vực khác' });

    const files = imageHelper.attachWorkImage(embed, 'woodcutting');
    await interaction.reply({ content: `<@${player.id}>`, embeds: [embed], files });
  }
};
