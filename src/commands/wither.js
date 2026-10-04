const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');
const dimensionSystem = require('../systems/dimensionSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wither')
    .setDescription('Triệu hồi Boss Wither 3 Đầu tại Nether (Cần 3 Đầu Wither Skeleton, tỉ lệ rơi 1:100)'),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username);
    return dimensionSystem.summonWither(interaction, player);
  }
};
