const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Xem Bảng Xếp Hạng cao thủ Minecraft RPG')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Hạng mục bảng xếp hạng')
        .setRequired(false)
        .addChoices(
          { name: '⭐ Cấp Độ (Level)', value: 'level' },
          { name: '🪙 Tài Phú (Coins)', value: 'coins' },
          { name: '⚔️ Đấu Sĩ PvP (Thắng)', value: 'pvp' },
          { name: '🐲 Thợ Săn Rồng Ender', value: 'dragon' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('category') || 'level';
    const allPlayers = Array.from(db.players.values());

    if (allPlayers.length === 0) {
      return interaction.reply({ content: 'Chưa có dữ liệu người chơi nào!', ephemeral: true });
    }

    let title = '';
    let sorted = [];

    if (category === 'level') {
      title = '⭐ BẢNG XẾP HẠNG CẤP ĐỘ CAO NHẤT';
      sorted = allPlayers.sort((a, b) => b.level - a.level || b.exp - a.exp);
    } else if (category === 'coins') {
      title = '🪙 BẢNG XẾP HẠNG TÀI PHÚ (ĐẠI GIA)';
      sorted = allPlayers.sort((a, b) => (b.coins + (b.bank || 0)) - (a.coins + (a.bank || 0)));
    } else if (category === 'pvp') {
      title = '⚔️ BẢNG XẾP HẠNG ĐẤU SĨ PVP';
      sorted = allPlayers.sort((a, b) => (b.stats.pvpWins || 0) - (a.stats.pvpWins || 0));
    } else if (category === 'dragon') {
      title = '🐲 BẢNG VÀNG DŨNG SĨ DIỆT RỒNG ENDER';
      sorted = allPlayers.sort((a, b) => (b.stats.dragonKilled || 0) - (a.stats.dragonKilled || 0));
    }

    const top10 = sorted.slice(0, 10);
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const lines = top10.map((p, index) => {
      let statText = '';
      if (category === 'level') statText = `Cấp **${p.level}** (${Number(p.exp).toFixed(1)} EXP)`;
      else if (category === 'coins') statText = `**${(p.coins + (p.bank || 0)).toFixed(2)}** Xu`;
      else if (category === 'pvp') statText = `**${p.stats.pvpWins || 0}** trận thắng (${p.stats.pvpLosses || 0} thua)`;
      else if (category === 'dragon') statText = `**${p.stats.dragonKilled || 0}** lần hạ Rồng`;

      return `${medals[index]} **${p.name}** — ${statText}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle(title)
      .setDescription(lines.join('\n\n'))
      .setFooter({ text: 'Dùng /top để theo dõi vị trí của bạn' });

    await interaction.reply({ embeds: [embed] });
  }
};
