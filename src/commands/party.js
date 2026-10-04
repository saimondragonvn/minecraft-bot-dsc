const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const partySystem = require('../systems/partySystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('party')
    .setDescription('Hệ thống tổ đội săn Rồng Ender và Boss Minecraft')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Thành lập đội mới để khiêu chiến Rồng Ender (The End Raid)')
    )
    .addSubcommand(sub =>
      sub.setName('invite')
        .setDescription('Mời bạn bè trong server gia nhập đội săn rồng của bạn')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi muốn mời').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('leave')
        .setDescription('Rời khỏi đội hiện tại')
    )
    .addSubcommand(sub =>
      sub.setName('start')
        .setDescription('Bắt đầu trận chiến săn Rồng cùng toàn đội (Chỉ chủ đội mới được gõ)')
    )
    .addSubcommand(sub =>
      sub.setName('status')
        .setDescription('Xem thông tin các thành viên trong đội hiện tại')
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const sub = interaction.options.getSubcommand();

    // 1. Tạo đội
    if (sub === 'create') {
      return partySystem.createParty(interaction, player);
    }

    // 2. Mời thành viên
    if (sub === 'invite') {
      const targetUser = interaction.options.getUser('target');
      return partySystem.invitePlayer(interaction, player, targetUser);
    }

    // 3. Rời đội
    if (sub === 'leave') {
      const currentParty = partySystem.getPlayerParty(player.id);
      if (!currentParty) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Bạn hiện không ở trong đội nào! Dùng \`/party create\` để tạo đội mới.`,
          ephemeral: true
        });
      }
      return partySystem.leaveParty(interaction, currentParty.id, player);
    }

    // 4. Bắt đầu trận chiến
    if (sub === 'start') {
      const currentParty = partySystem.getPlayerParty(player.id);
      if (!currentParty) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Bạn chưa tạo hoặc ở trong đội nào! Dùng \`/party create\` để tạo đội trước.`,
          ephemeral: true
        });
      }
      if (currentParty.leaderId !== player.id) {
        return interaction.reply({
          content: `<@${player.id}> ❌ Chỉ có Chủ Đội (<@${currentParty.leaderId}>) mới có quyền bắt đầu trận chiến!`,
          ephemeral: true
        });
      }
      return partySystem.startRaid(interaction, currentParty.id);
    }

    // 5. Xem trạng thái đội
    if (sub === 'status') {
      const currentParty = partySystem.getPlayerParty(player.id);
      if (!currentParty) {
        return interaction.reply({
          content: `<@${player.id}> ℹ️ Bạn hiện chưa tham gia đội nào. Dùng lệnh \`/party create\` để tạo đội săn rồng!`,
          ephemeral: true
        });
      }
      const payload = partySystem.buildLobbyMessage(currentParty);
      return interaction.reply({ content: `<@${player.id}>`, ...payload });
    }
  }
};
