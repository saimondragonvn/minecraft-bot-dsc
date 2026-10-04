const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');
const uiHelper = require('../utils/uiHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('upgrade')
    .setDescription('Nâng cấp chỉ số tiềm năng & độ Khéo Léo (Aim Kiếm & Cung)')
    .addSubcommand(sub =>
      sub.setName('view')
        .setDescription('Xem bảng chỉ số và điểm tiềm năng')
    )
    .addSubcommand(sub =>
      sub.setName('dex')
        .setDescription('Nâng 1 điểm Khéo Léo (Tăng tỉ lệ trúng Kiếm 80%➔99% & Cung 70%➔93%)')
        .addBooleanOption(opt =>
          opt.setName('spend_level')
            .setDescription('Tiêu hao 1 Cấp độ nếu không còn Điểm Tiềm Năng')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const sub = interaction.options && interaction.options.getSubcommand ? interaction.options.getSubcommand() : 'view';

    if (sub === 'dex') {
      const spendLevel = interaction.options && interaction.options.getBoolean ? (interaction.options.getBoolean('spend_level') || false) : false;
      const res = db.upgradeDexterity(player, spendLevel);
      return interaction.reply({ content: res.message, ephemeral: true });
    }

    // sub === 'view' hoặc mặc định
    const payload = uiHelper.buildStatsScreen(player);
    return interaction.reply({ ...payload, ephemeral: true });
  }
};
