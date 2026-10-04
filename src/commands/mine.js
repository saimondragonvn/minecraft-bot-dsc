const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const combatSystem = require('../systems/combatSystem');
const miningSystem = require('../systems/miningSystem');
const imageHelper = require('../utils/imageHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mine')
    .setDescription('Đi đào khoáng sản trong Hang Đá (Cần Cúp, tốc độ khai thác theo cúp)'),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());

    if (player.hp <= 3) {
      return interaction.reply({
        content: '❌ Bạn đang bị thương quá nặng (<= 3 HP)! Hãy dùng lệnh `/sleep` hoặc ăn thức ăn để hồi máu trước khi vào hang.',
        ephemeral: true
      });
    }

    const result = miningSystem.mineCave(player);

    if (result.noPickaxe) {
      return interaction.reply({ content: `<@${player.id}> ${result.message}`, ephemeral: true });
    }

    if (result.inventoryFull) {
      return interaction.reply({ content: `<@${player.id}> ${result.message}`, ephemeral: true });
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
      .setColor(0x0284c7)
      .setTitle('⛏️ Tiếng Cuốc Leng Keng Trong Hang Sâu!')
      .setDescription(result.message)
      .setFooter({ text: 'Dùng /menu để xem túi đồ và các khu vực khác' });

    const files = imageHelper.attachWorkImage(embed, 'mining');
    await interaction.reply({ content: `<@${player.id}>`, embeds: [embed], files });
  }
};
