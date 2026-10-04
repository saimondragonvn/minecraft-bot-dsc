const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');
const mobSystem = require('../systems/mobSystem');
const combatSystem = require('../systems/combatSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hunt')
    .setDescription('Đi săn thú hoặc chiến đấu với quái vật theo khu vực')
    .addStringOption(option =>
      option.setName('area')
        .setDescription('Khu vực muốn đi săn')
        .setRequired(false)
        .addChoices(
          { name: '🐑 Đồng cỏ & Nông trại (Heo, Bò, Cừu, Gà)', value: 'animals' },
          { name: '🪵 Rừng gỗ sồi (Thú ngày / Quái đêm)', value: 'forest' },
          { name: '🪨 Hang đá (Zombie, Skeleton, Creeper)', value: 'cave' },
          { name: '🧟 Hầm ngục (Quái vật cấp cao & kho báu)', value: 'dungeon' },
          { name: '🌋 Nether (Blaze, Wither Skeleton, Ghast)', value: 'nether' },
          { name: '🌌 The End (Enderman & Shulker)', value: 'the_end' }
        )
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const area = (interaction.options?.getString ? interaction.options.getString('area') : null) || 'forest';

    if (player.hp <= 4) {
      return interaction.reply({
        content: '❌ Bạn đang quá yếu (<= 4 HP)! Hãy về Nhà dùng lệnh `/sleep` để hồi máu trước khi ra trận.',
        ephemeral: true
      });
    }

    if (area === 'dungeon' && player.level < 3) {
      return interaction.reply({ content: '❌ Hầm ngục yêu cầu cấp độ 3 trở lên!', ephemeral: true });
    }

    if (area === 'nether' && (!player.unlocked || !player.unlocked.nether)) {
      return interaction.reply({ content: '❌ Bạn chưa mở Cổng Nether! Hãy vào `/menu` -> Khu Vực -> Nether để kích hoạt.', ephemeral: true });
    }

    if (area === 'the_end' && (!player.unlocked || !player.unlocked.the_end)) {
      return interaction.reply({ content: '❌ Bạn chưa mở Cổng The End! Hãy vào `/menu` -> Khu Vực -> The End để lắp 12 Mắt Ender.', ephemeral: true });
    }

    const mob = mobSystem.spawnMob(area);
    return combatSystem.startCombat(interaction, player, mob);
  }
};
