const { SlashCommandBuilder } = require('discord.js');
const partyCommand = require('./party');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Tổ đội cùng đồng đội săn Rồng Ender và Boss huyền thoại')
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
    return partyCommand.execute(interaction);
  }
};
