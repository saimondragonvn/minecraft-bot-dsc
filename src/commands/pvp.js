const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const pvpSystem = require('../systems/pvpSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pvp')
    .setDescription('Khiêu chiến người chơi khác trong đấu trường Minecraft PvP')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Người chơi bạn muốn thách đấu')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Số tiền cược (Xu) cho trận đấu')
        .setRequired(false)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Chế độ thi đấu: Giao hữu hoặc Sinh tử (Chết mất hết đồ!)')
        .setRequired(false)
        .addChoices(
          { name: '🤝 Giao hữu (An toàn, chỉ mất tiền cược)', value: 'friendly' },
          { name: '🔥 Sinh tử (Hardcore - Kẻ thua bị Chết Mất Đồ!)', value: 'hardcore' }
        )
    ),

  async execute(interaction) {
    const challengerUser = interaction.user;
    const targetUser = interaction.options.getUser('target');
    const bet = interaction.options.getInteger('bet') || 0;
    const mode = interaction.options.getString('mode') || 'friendly';

    if (targetUser.id === challengerUser.id) {
      return interaction.reply({ content: '❌ Bạn không thể tự khiêu chiến chính mình!', ephemeral: true });
    }

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ Bạn không thể khiêu chiến Bot!', ephemeral: true });
    }

    const p1 = db.getPlayer(challengerUser.id, challengerUser.username, challengerUser.displayAvatarURL());
    const p2 = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());

    if (p1.hp <= 5) {
      return interaction.reply({ content: '❌ Máu của bạn quá thấp (<= 5 HP)! Hãy về Nhà ngủ hồi máu hoặc ăn uống trước khi PvP.', ephemeral: true });
    }

    if (p2.hp <= 5) {
      return interaction.reply({ content: `❌ Đối thủ <@${targetUser.id}> hiện đang bị thương nặng (<= 5 HP) nên không thể thi đấu!`, ephemeral: true });
    }

    if (bet > 0) {
      if (p1.coins < bet) {
        return interaction.reply({ content: `❌ Bạn không có đủ ${bet} Xu để đặt cược (Hiện có: ${p1.coins} Xu)!`, ephemeral: true });
      }
      if (p2.coins < bet) {
        return interaction.reply({ content: `❌ Đối thủ <@${targetUser.id}> không có đủ ${bet} Xu để tham gia cược!`, ephemeral: true });
      }
    }

    const inviteEmbed = new EmbedBuilder()
      .setColor(mode === 'hardcore' ? 0xdc2626 : 0x3b82f6)
      .setTitle('⚔️ LỜI THÁCH ĐẤU MINECRAFT PVP!')
      .setDescription(
        `Người chơi <@${challengerUser.id}> vừa gửi lời khiêu chiến tới <@${targetUser.id}>!\n\n` +
        `🏆 **Chế độ:** ${mode === 'hardcore' ? '🔥 **SINH TỬ (KẺ THUA BỊ CHẾT MẤT TOÀN BỘ ĐỒ ĐẠC!)**' : '🤝 Giao hữu (An toàn)'}\n` +
        `🪙 **Tiền cược:** **${bet} Xu** mỗi bên\n\n` +
        `<@${targetUser.id}>, bạn có dám nhận lời thách đấu này không?`
      )
      .setFooter({ text: 'Lời mời sẽ hết hạn sau 60 giây' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pvp_accept_${challengerUser.id}_${targetUser.id}`).setLabel('Chấp Nhận Khiêu Chiến').setEmoji('⚔️').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`pvp_decline_${challengerUser.id}_${targetUser.id}`).setLabel('Từ Chối').setEmoji('❌').setStyle(ButtonStyle.Danger)
    );

    const msg = await interaction.reply({ embeds: [inviteEmbed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === targetUser.id,
      time: 60000
    });

    collector.on('collect', async i => {
      if (i.customId.startsWith('pvp_accept')) {
        collector.stop('accepted');
        await i.deferUpdate();
        await msg.edit({ content: '⚔️ Trận chiến đang được khởi tạo...', embeds: [], components: [] });
        return pvpSystem.startDuel(interaction.channel, p1, p2, bet, mode);
      } else {
        collector.stop('declined');
        await i.deferUpdate();
        const declineEmbed = new EmbedBuilder()
          .setColor(0x6b7280)
          .setTitle('❌ Lời Khiêu Chiến Bị Từ Chối')
          .setDescription(`<@${targetUser.id}> đã từ chối lời thách đấu của <@${challengerUser.id}>.`);
        return msg.edit({ embeds: [declineEmbed], components: [] });
      }
    });

    collector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        const timeoutEmbed = new EmbedBuilder()
          .setColor(0x6b7280)
          .setTitle('⌛ Lời Mời Hết Hạn')
          .setDescription(`Không có phản hồi từ <@${targetUser.id}>, trận đấu bị hủy bỏ.`);
        await msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
      }
    });
  }
};
