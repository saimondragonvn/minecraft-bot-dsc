const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const timeSystem = require('../systems/timeSystem');
const imageHelper = require('../utils/imageHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sleep')
    .setDescription('Đi ngủ tại Nhà để hồi phục đầy đủ Máu & Mana, đồng thời bỏ qua đêm tối sang ban ngày'),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());

    player.hp = player.maxHp;
    player.mana = player.maxMana;
    const skippedNight = timeSystem.skipToDay();
    db.saveData();

    const timeInfo = timeSystem.getMinecraftTime();

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('🛏️ Bạn Đã Đi Ngủ Tại Nhà Ấm Cúng!')
      .setDescription(
        (skippedNight
          ? `Màn đêm buông xuống dần tan biến... Ánh nắng ban mai rọi chiếu qua khung cửa sổ! ☀️\n`
          : `Bạn chợp mắt nghỉ ngơi trên chiếc giường êm ái.\n`) +
        `\n❤️ **Máu:** ${player.hp}/${player.maxHp} *(Hồi phục 100%)*` +
        `\n💧 **Mana:** ${player.mana}/${player.maxMana} *(Hồi phục 100%)*` +
        `\n⏰ **Thời gian hiện tại:** ${timeInfo.icon} **${timeInfo.timeString}** (${timeInfo.title})`
      );

    const files = imageHelper.attachWorkImage(embed, 'home');
    await interaction.reply({ embeds: [embed], files });
  }
};
