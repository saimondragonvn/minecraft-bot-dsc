const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');
const explorationSystem = require('../systems/explorationSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Đi dạo thám hiểm thế giới Minecraft (Gặp công trình, rương báu, quái vật tinh anh & Boss)')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Chế độ thám hiểm')
        .setRequired(false)
        .addChoices(
          { name: '🚀 Bay bằng Cánh Cứng Elytra (Hồi chiêu 5s, 100% không gặp Mobs, công trình 2.5%)', value: 'fly' },
          { name: '🚶 Đi bộ thám hiểm dưới đất (Hồi chiêu 10s, tỉ lệ ra công trình 1.5%)', value: 'walk' },
          { name: '🌋 Thám hiểm Địa Ngục Nether (Tỉ lệ 1:50 ra Pháo Đài, Bastion)', value: 'nether' }
        )
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const mode = interaction.options?.getString ? interaction.options.getString('mode') : null;

    if (mode === 'nether') {
      const dimensionSystem = require('../systems/dimensionSystem');
      return dimensionSystem.exploreNetherStructure(interaction, player);
    }

    return explorationSystem.explore(interaction, player, mode);
  }
};
