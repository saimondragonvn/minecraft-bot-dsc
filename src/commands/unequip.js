const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

const SLOT_NAMES = {
  sword: '🗡️ Kiếm / Vũ khí',
  pickaxe: '⛏️ Cúp',
  axe: '🪓 Rìu',
  bow: '🏹 Cung / Nỏ',
  shield: '🛡️ Khiên',
  helmet: '🪖 Mũ',
  chestplate: '🥋 Áo giáp / Cánh Elytra',
  leggings: '👖 Quần',
  boots: '👢 Ủng'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unequip')
    .setDescription('Tháo trang bị đang mặc và cất lại vào túi đồ')
    .addStringOption(opt =>
      opt.setName('slot')
        .setDescription('Vị trí muốn tháo')
        .setRequired(false)
        .addChoices(
          { name: '🗡️ Kiếm (Sword)', value: 'sword' },
          { name: '⛏️ Cúp (Pickaxe)', value: 'pickaxe' },
          { name: '🪓 Rìu (Axe)', value: 'axe' },
          { name: '🏹 Cung (Bow)', value: 'bow' },
          { name: '🛡️ Khiên (Shield)', value: 'shield' },
          { name: '🪖 Mũ (Helmet)', value: 'helmet' },
          { name: '🥋 Áo (Chestplate / Elytra)', value: 'chestplate' },
          { name: '👖 Quần (Leggings)', value: 'leggings' },
          { name: '👢 Ủng (Boots)', value: 'boots' }
        )
    ),

  SLOT_NAMES,

  buildUnequipMessage(player) {
    if (!player.equipment) {
      player.equipment = {
        pickaxe: null,
        axe: null,
        sword: null,
        bow: null,
        helmet: null,
        chestplate: null,
        leggings: null,
        boots: null,
        shield: null
      };
    }

    const activeSlots = Object.keys(SLOT_NAMES).filter(s => player.equipment[s]);

    if (activeSlots.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🥋 KHÔNG CÓ TRANG BỊ ĐANG MẶC')
        .setDescription('Bạn hiện không mặc bất kỳ món trang bị nào trên người để tháo!');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_equipment').setLabel('Quay lại Trang Bị').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
      );
      return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('unequip_select_slot')
      .setPlaceholder('Chọn món trang bị muốn tháo ra...');

    activeSlots.forEach(s => {
      const itemId = player.equipment[s];
      const def = config.ITEMS[itemId] || { name: itemId, emoji: '📦' };
      selectMenu.addOptions({
        label: `${def.name} (${SLOT_NAMES[s]})`.slice(0, 100),
        description: `Tháo món này và cất vào túi đồ`,
        value: s,
        emoji: def.emoji || '📦'
      });
    });

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);
    const rowBack = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_equipment').setLabel('Quay lại Trang Bị').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
      .setColor(0xeab308)
      .setTitle('🥋 THÁO TRANG BỊ')
      .setDescription('Hãy chọn món trang bị bạn muốn tháo ra để cất vào túi đồ:');

    return { content: `<@${player.id}>`, embeds: [embed], components: [rowSelect, rowBack] };
  },

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const slot = interaction.options?.getString ? interaction.options.getString('slot') : null;

    // Nếu không truyền slot -> hiện Select Menu các món đang mặc
    if (!slot) {
      const payload = module.exports.buildUnequipMessage(player);
      if (interaction.isButton && interaction.isButton()) {
        return interaction.update(payload);
      }
      return interaction.reply(payload);
    }

    const result = module.exports.unequipSlot(player, slot);
    const rowBack = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('unequip_fast_action').setLabel('Tháo thêm món khác').setEmoji('🥋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_equipment').setLabel('Xem Trang Bị').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
    );

    if (interaction.isButton && interaction.isButton()) {
      return interaction.update({ content: `<@${player.id}>`, embeds: [result.embed], components: [rowBack] });
    }
    return interaction.reply({ embeds: [result.embed], components: [rowBack], ephemeral: !result.success });
  },

  /**
   * Logic tháo trang bị
   */
  unequipSlot(player, slot) {
    if (!player.equipment || !player.equipment[slot]) {
      return {
        success: false,
        embed: new EmbedBuilder().setColor(0xef4444).setTitle('❌ TRỐNG').setDescription(`Ô **${SLOT_NAMES[slot] || slot}** hiện đang trống, không có gì để tháo!`)
      };
    }

    const itemId = player.equipment[slot];
    const def = config.ITEMS[itemId] || { name: itemId, emoji: '📦' };

    player.equipment[slot] = null;
    db.addItem(player, itemId, 1);
    db.saveData();

    const atk = db.getTotalAttack(player);
    const defStat = db.getTotalDefense(player);
    const red = db.getDamageReduction(defStat);

    const embed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('📦 ĐÃ THÁO TRANG BỊ')
      .setDescription(
        `Đã tháo ${def.emoji} **${def.name}** khỏi ô **${SLOT_NAMES[slot] || slot}** và cất lại vào túi đồ.\n\n` +
        `📊 **Chỉ số sau khi tháo:**\n` +
        `• ⚔️ Tấn công: **${atk}**\n` +
        `• 🛡️ Phòng thủ: **${defStat}** *(Giảm ${red}%)*`
      );

    return { success: true, embed };
  }
};
