const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');
const tradeSystem = require('../systems/tradeSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trade')
    .setDescription('🤝 Giao dịch vật phẩm với người chơi khác (Yêu cầu cả 2 đạt Cấp 10+)')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('Người chơi bạn muốn giao dịch cùng (Cần Level 10+)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Mã vật phẩm muốn giao dịch (vd: diamond, iron_ingot, obsidian, golden_apple, ...)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('count')
        .setDescription('Số lượng vật phẩm muốn trao đổi (mặc định 1)')
        .setRequired(false)
        .setMinValue(1)
    )
    .addIntegerOption(opt =>
      opt.setName('price')
        .setDescription('Số Xu yêu cầu người mua trả (0 = tặng miễn phí, mặc định 0)')
        .setRequired(false)
        .setMinValue(0)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const itemId = interaction.options.getString('item').toLowerCase().trim();
    const count = interaction.options.getInteger('count') || 1;
    const price = interaction.options.getInteger('price') || 0;

    const seller = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const buyer = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());

    const result = tradeSystem.createTradeOffer({
      seller,
      buyer,
      itemId,
      count,
      price
    });

    if (!result.success) {
      return interaction.reply({ content: `<@${seller.id}> ${result.message}`, ephemeral: true });
    }

    return interaction.reply({
      content: result.content,
      embeds: [result.embed],
      components: [result.row]
    });
  }
};
