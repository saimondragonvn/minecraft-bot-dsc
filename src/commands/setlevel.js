const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlevel')
    .setDescription('[ADMIN] Đặt cấp độ cho người chơi')
    .addUserOption(opt => opt.setName('target').setDescription('Người chơi muốn đặt cấp độ').setRequired(true))
    .addIntegerOption(opt => opt.setName('level').setDescription('Cấp độ mới (ví dụ: 10, 50, 100)').setRequired(true).setMinValue(1).setMaxValue(1000)),

  async execute(interaction) {
    const callerId = interaction.user.id;
    const caller = db.getPlayer(callerId, interaction.user.username, interaction.user.displayAvatarURL());

    const isAdmin = config.ADMIN_IDS.includes(callerId) || (caller && caller.isAdmin);
    if (!isAdmin) {
      return interaction.reply({
        content: `❌ **Bạn không có quyền Admin!** Lệnh này chỉ dành cho Admin của hệ thống (<@944428607642664972>).`,
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('target');
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    const newLevel = interaction.options.getInteger('level');

    const oldLevel = target.level;
    target.level = newLevel;
    target.maxExp = Math.round(newLevel * 200 * 1.2);
    target.exp = 0;
    target.maxHp = 20 + (newLevel - 1) * 2;
    target.hp = target.maxHp;
    target.maxMana = 10 + (newLevel - 1) * 2;
    target.mana = target.maxMana;

    db.saveData();

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle('⭐ ĐẶT CẤP ĐỘ THÀNH CÔNG!')
      .setDescription(
        `👑 **Admin thực hiện:** <@${callerId}>\n` +
        `👤 **Người chơi:** <@${target.id}>\n\n` +
        `• Cấp độ cũ: Cấp **${oldLevel}**\n` +
        `• Cấp độ mới: Cấp **${newLevel}**\n` +
        `• Máu tối đa: **${target.maxHp}** HP ❤️\n` +
        `• Mana tối đa: **${target.maxMana}** MP 💧`
      )
      .setTimestamp();

    await interaction.reply({ content: `<@${target.id}> <@${callerId}>`, embeds: [embed] });
  }
};
