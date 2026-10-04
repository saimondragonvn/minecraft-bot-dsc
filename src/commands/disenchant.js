const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const enchantSystem = require('../systems/enchantSystem');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disenchant')
    .setDescription('🧹 Tẩy bùa phù phép (Đá Mài / Grindstone) - Tiêu tốn 1 Ngọc Lưu Ly để xóa sạch bùa!')
    .addStringOption(opt =>
      opt.setName('slot')
        .setDescription('Vị trí trang bị muốn tẩy bùa về đồ TRẮNG')
        .setRequired(false)
        .addChoices(
          { name: '🗡️ Kiếm (Sword)', value: 'sword' },
          { name: '⛏️ Cúp (Pickaxe)', value: 'pickaxe' },
          { name: '🪓 Rìu (Axe)', value: 'axe' },
          { name: '🏹 Cung (Bow)', value: 'bow' },
          { name: '🪖 Mũ (Helmet)', value: 'helmet' },
          { name: '🥋 Áo (Chestplate)', value: 'chestplate' },
          { name: '👖 Quần (Leggings)', value: 'leggings' },
          { name: '👢 Ủng (Boots)', value: 'boots' }
        )
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const slot = interaction.options?.getString ? interaction.options.getString('slot') : null;

    if (!slot) {
      const payload = enchantSystem.buildDisenchantScreen(player);
      return interaction.reply({ ...payload, ephemeral: true });
    }

    const res = enchantSystem.disenchantSlot(player, slot);
    if (!res.success) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('⚠️ KHÔNG THỂ TẨY BÙA')
        .setDescription(res.message);

      return interaction.reply({ embeds: [errEmbed], ephemeral: true });
    }

    const winEmbed = new EmbedBuilder()
      .setColor(0x06b6d4)
      .setTitle('🧹 ĐÃ TẨY SẠCH BÙA CHÚ (ĐÁ MÀI GRINDSTONE)')
      .setDescription(res.message);

    const winRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('area_enchant').setLabel('Bàn Phù Phép').setEmoji('🔮').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_disenchant').setLabel('Tẩy Món Khác').setEmoji('🧹').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [winEmbed], components: [winRow], ephemeral: true });
  }
};
