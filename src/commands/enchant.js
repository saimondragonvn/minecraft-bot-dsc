const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const enchantSystem = require('../systems/enchantSystem');
const config = require('../config');
const imageHelper = require('../utils/imageHelper');

const SLOT_NAMES = {
  sword: '🗡️ Kiếm (Sword)',
  pickaxe: '⛏️ Cúp (Pickaxe)',
  axe: '🪓 Rìu (Axe)',
  bow: '🏹 Cung (Bow)',
  helmet: '🪖 Mũ (Helmet)',
  chestplate: '🥋 Áo (Chestplate)',
  leggings: '👖 Quần (Leggings)',
  boots: '👢 Ủng (Boots)'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('enchant')
    .setDescription('🎲 GACHA Bàn Phù Phép (Enchanting Table) - Tiêu hao Lapis và EXP để quay bùa ngẫu nhiên!')
    .addStringOption(opt =>
      opt.setName('slot')
        .setDescription('Vị trí trang bị đang đeo muốn quay Gacha phù phép')
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
    )
    .addIntegerOption(opt =>
      opt.setName('tier')
        .setDescription('Bậc quay Gacha bùa chú (1: tốn 3 Cấp, 2: tốn 6 Cấp [Lv 30+], 3: tốn 12 Cấp [Lv 50+])')
        .setRequired(false)
        .addChoices(
          { name: '🎲 Bậc 1 (Cần Lv 1+: Tốn 3 Cấp ⭐ + 1 Lapis 🔷)', value: 1 },
          { name: '✨ Bậc 2 (Cần Lv 30+: Tốn 6 Cấp ⭐ + 2 Lapis 🔷)', value: 2 },
          { name: '🌟 Bậc 3 (Cần Lv 50+: Tốn 12 Cấp ⭐ + 3 Lapis 🔷)', value: 3 }
        )
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const slot = interaction.options?.getString ? interaction.options.getString('slot') : null;
    const tier = interaction.options?.getInteger ? (interaction.options.getInteger('tier') || 1) : 1;

    // Kiểm tra Bàn Phù Phép: có thể dùng nếu có trong túi đồ hoặc đã mở khóa (cần 2 kim cương và 4 hắc diện thạch)
    if (!enchantSystem.isUnlocked(player)) {
      return interaction.reply({ ...enchantSystem.buildEnchantUnlockScreen(player), ephemeral: true });
    }

    const lapisCount = db.getItemCount(player, 'lapis');

    // Nếu không truyền slot -> hiển thị bảng hướng dẫn Gacha và nút chọn slot
    if (!slot) {
      const equippedSlots = Object.keys(SLOT_NAMES).filter(s => player.equipment && player.equipment[s]);

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('🔮 BÀN PHÙ PHÉP MA THUẬT (GACHA ENCHANTING)')
        .setDescription(
          `Chào mừng bạn đến với hệ thống **GACHA Bàn Phù Phép** cổ xưa của Minecraft!\n` +
          `Các ký tự ma thuật Rune bay lơ lửng quanh bàn gỗ hắc diện thạch, sẵn sàng truyền ban sức mạnh ngẫu nhiên vào vũ khí và giáp của bạn!\n\n` +
          `💎 **Tài nguyên hiện có:**\n` +
          `• ⭐ **Cấp Độ Người Chơi:** **Cấp ${player.level || 1}**\n` +
          `• 🔷 **Ngọc Lưu Ly (Lapis Lazuli):** **${lapisCount}** viên\n\n` +
          `🎲 **3 BẬC QUAY GACHA BÀN PHÙ PHÉP:**\n` +
          `• **Bậc 1 (Cơ Bản):** Dành cho **Cấp 1 – 29+** | Tiêu hao: **3 Cấp Độ ⭐ + 1 Lapis 🔷** (Ra bùa Cấp 1 - 2)\n` +
          `• **Bậc 2 (Trung Cấp):** Mở khóa ở **Cấp 30 – 49+** | Tiêu hao: **6 Cấp Độ ⭐ + 2 Lapis 🔷** (Ra bùa Cấp 2 - 3)\n` +
          `• **Bậc 3 (Tối Thượng):** Mở khóa khi đạt **Cấp 50+** | Tiêu hao: **12 Cấp Độ ⭐ + 3 Lapis 🔷** (Ra bùa Cấp 3 - 5 Cực Phẩm!)\n\n` +
          `💡 **Lưu ý quan trọng:**\n` +
          `• Bàn Phù Phép quay **ngẫu nhiên** bùa chú trực tiếp vào món đang mặc trên người.\n` +
          `• Nếu bạn sở hữu **Sách Phù Phép (Enchanted Book)**, hãy rèn **Cái Đe (Anvil 🔨)** qua lệnh \`/craft recipe: craft_anvil\` rồi dùng \`/anvil\` để ép chính xác bùa mong muốn!`
        );

      const files = imageHelper.attachWorkImage(embed, 'enchant');

      if (equippedSlots.length === 0) {
        embed.addFields({
          name: '⚠️ CHƯA CÓ TRANG BỊ ĐANG MẶC',
          value: 'Bạn chưa mặc bất kỳ trang bị nào! Hãy dùng lệnh `/equip` để mặc vũ khí/giáp trước khi Gacha!'
        });
        return interaction.reply({ embeds: [embed], files, ephemeral: true });
      }

      // Tạo Select Menu để chọn slot trang bị muốn Gacha
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('enchant_select_slot')
        .setPlaceholder('Chọn trang bị đang mặc để quay Gacha bùa...');

      equippedSlots.forEach(s => {
        const itemId = player.equipment[s];
        const itemDef = config.ITEMS[itemId] || { name: itemId, emoji: '📦' };
        selectMenu.addOptions({
          label: `${SLOT_NAMES[s]}: ${itemDef.name}`,
          description: `Đặt món ${itemDef.name} lên Bàn Phù Phép để quay bùa`,
          value: s,
          emoji: itemDef.emoji || '✨'
        });
      });

      const row = new ActionRowBuilder().addComponents(selectMenu);
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_disenchant').setLabel('Tẩy Bùa (1 Lưu Ly)').setEmoji('🧹').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('area_anvil').setLabel('Cái Đe Ép Sách').setEmoji('🔨').setStyle(ButtonStyle.Primary)
      );

      const msg = await interaction.reply({ embeds: [embed], components: [row, row2], files, ephemeral: true, fetchReply: true });

      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === player.id,
        time: 60000,
        max: 1
      });

      collector.on('collect', async i => {
        if (i.customId === 'menu_disenchant') {
          return i.update({ ...enchantSystem.buildDisenchantScreen(player), files: [] });
        }
        if (i.customId === 'area_anvil') {
          const anvilCmd = require('./anvil');
          return anvilCmd.execute(i);
        }

        const chosenSlot = i.values[0];
        // Cho người dùng chọn Tier Gacha theo cấp độ hiện có
        const pLvl = player.level || 1;

        const btn1 = new ButtonBuilder()
          .setCustomId(`enchant_spin_${chosenSlot}_1`)
          .setEmoji('🎲')
          .setStyle(ButtonStyle.Secondary);
        if (pLvl < 3) {
          btn1.setLabel('Bậc 1 (Cần 3 Cấp | Thiếu)').setDisabled(true);
        } else {
          btn1.setLabel('Bậc 1 (-3 Cấp & 1 Lapis)');
        }

        const btn2 = new ButtonBuilder()
          .setCustomId(`enchant_spin_${chosenSlot}_2`)
          .setEmoji('✨')
          .setStyle(ButtonStyle.Primary);
        if (pLvl < 30) {
          btn2.setLabel('Bậc 2 (Khóa: Cần Lv 30+)').setDisabled(true);
        } else if (pLvl < 6) {
          btn2.setLabel('Bậc 2 (Cần 6 Cấp | Thiếu)').setDisabled(true);
        } else {
          btn2.setLabel('Bậc 2 (-6 Cấp & 2 Lapis)');
        }

        const btn3 = new ButtonBuilder()
          .setCustomId(`enchant_spin_${chosenSlot}_3`)
          .setEmoji('🌟')
          .setStyle(ButtonStyle.Success);
        if (pLvl < 50) {
          btn3.setLabel('Bậc 3 (Khóa: Cần Lv 50+)').setDisabled(true);
        } else if (pLvl < 12) {
          btn3.setLabel('Bậc 3 (Cần 12 Cấp | Thiếu)').setDisabled(true);
        } else {
          btn3.setLabel('Bậc 3 (-12 Cấp & 3 Lapis)');
        }

        const tierRow = new ActionRowBuilder().addComponents(btn1, btn2, btn3);

        const promptEmbed = new EmbedBuilder()
          .setColor(0xa855f7)
          .setTitle('🎲 CHỌN BẬC GACHA PHÙ PHÉP')
          .setDescription(
            `Bạn đã đặt **${SLOT_NAMES[chosenSlot]}** lên Bàn Phù Phép!\n` +
            `⭐ **Cấp độ hiện tại:** Cấp **${pLvl}** | 🔷 **Lapis:** **${lapisCount}** viên\n\n` +
            `• **Bậc 1:** Mở khóa Cấp 1–29+ (Tiêu hao 3 Cấp & 1 Lapis)\n` +
            `• **Bậc 2:** Mở khóa Cấp 30–49+ (Tiêu hao 6 Cấp & 2 Lapis)\n` +
            `• **Bậc 3:** Mở khóa Cấp 50+ (Tiêu hao 12 Cấp & 3 Lapis)\n\n` +
            `Hãy chọn bậc phù phép bên dưới để kích hoạt nghi thức ma thuật:`
          );

        await i.update({ embeds: [promptEmbed], components: [tierRow], files: [] });

        const spinCollector = msg.createMessageComponentCollector({
          filter: btnI => btnI.user.id === player.id && btnI.customId.startsWith(`enchant_spin_${chosenSlot}_`),
          time: 45000,
          max: 1
        });

        spinCollector.on('collect', async btnI => {
          const selectedTier = parseInt(btnI.customId.split('_').pop(), 10) || 1;
          const result = enchantSystem.gachaEnchant(player, chosenSlot, selectedTier);

          if (!result.success) {
            if (result.isAlreadyEnchanted) {
              const alertPayload = enchantSystem.buildAlreadyEnchantedAlert(player, chosenSlot, result);
              return btnI.update({ ...alertPayload, files: [] });
            }
            const failEmbed = new EmbedBuilder()
              .setColor(0xef4444)
              .setTitle('⚠️ KHÔNG THỂ PHÙ PHÉP')
              .setDescription(result.message);
            return btnI.update({ content: `<@${player.id}>`, embeds: [failEmbed], components: [], files: [] });
          }

          const resEmbed = new EmbedBuilder()
            .setColor(0x10b981)
            .setTitle('✨ GACHA PHÙ PHÉP THÀNH CÔNG!')
            .setDescription(result.message)
            .setFooter({ text: 'Dùng /menu -> Chỉ Số hoặc /menu -> Trang Bị để kiểm tra uy lực mới' });

          return btnI.update({ content: `<@${player.id}>`, embeds: [resEmbed], components: [], files: [] });
        });
      });

      return;
    }

    // Nếu người dùng dùng lệnh trực tiếp có slot và tier
    const result = enchantSystem.gachaEnchant(player, slot, tier);
    if (!result.success) {
      if (result.isAlreadyEnchanted) {
        const alertPayload = enchantSystem.buildAlreadyEnchantedAlert(player, slot, result);
        return interaction.reply({ ...alertPayload, ephemeral: true });
      }
      const failEmbed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('⚠️ KHÔNG THỂ PHÙ PHÉP')
        .setDescription(result.message);
      return interaction.reply({ content: `<@${player.id}>`, embeds: [failEmbed], ephemeral: true });
    }

    const resEmbed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('✨ GACHA PHÙ PHÉP THÀNH CÔNG!')
      .setDescription(result.message)
      .setFooter({ text: 'Dùng /menu -> Chỉ Số hoặc /menu -> Trang Bị để kiểm tra uy lực mới' });

    return interaction.reply({ content: `<@${player.id}>`, embeds: [resEmbed] });
  }
};
