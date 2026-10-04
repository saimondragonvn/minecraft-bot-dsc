const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Điểm danh nhận phần thưởng hàng ngày (Tiền vàng & Thức ăn)'),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (player.lastDaily && now - player.lastDaily < oneDay) {
      const remainingMs = oneDay - (now - player.lastDaily);
      const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
      const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      return interaction.reply({
        content: `⏳ Bạn đã nhận quà điểm danh hôm nay rồi! Vui lòng quay lại sau **${remainingHours} giờ ${remainingMinutes} phút**.`,
        ephemeral: true
      });
    }

    const rewardCoins = 100;
    player.coins = Math.round((player.coins + rewardCoins) * 100) / 100;
    player.lastDaily = now;
    db.addItem(player, 'apple', 3);
    db.addItem(player, 'raw_beef', 2);
    db.addExp(player, 25);
    db.saveData();

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🎁 Điểm Danh Hàng Ngày Thành Công!')
      .setDescription(
        `Chúc mừng bạn đã nhận được gói quà tiếp tế sinh tồn:\n\n` +
        `• 🪙 **+100 Xu** tiền vàng\n` +
        `• 🍎 **x3 Quả Táo**\n` +
        `• 🥩 **x2 Thịt bò sống**\n` +
        `• ⭐ **+25 EXP**\n\n` +
        `*Số dư hiện tại: **${player.coins} Xu**.*`
      );

    await interaction.reply({ embeds: [embed] });
  }
};
