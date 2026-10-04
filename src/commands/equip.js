const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

// Ánh xạ kiểu trang bị sang slot
const TYPE_TO_SLOT = {
  sword: 'sword',
  pickaxe: 'pickaxe',
  axe: 'axe',
  bow: 'bow',
  shield: 'shield',
  helmet: 'helmet',
  chestplate: 'chestplate',
  leggings: 'leggings',
  boots: 'boots',
  tool: 'pickaxe',
  armor: 'chestplate',
  weapon: 'sword'
};

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

const TIER_ORDER = {
  netherite: 6,
  diamond: 5,
  iron: 4,
  copper: 3,
  golden: 2,
  gold: 2,
  stone: 1,
  wooden: 0,
  wood: 0,
  leather: 0
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equip')
    .setDescription('Đeo vũ khí, công cụ, khiên và giáp bảo hộ từ túi đồ')
    .addStringOption(opt =>
      opt.setName('item')
        .setDescription('Tên hoặc ID món trang bị muốn mặc (vd: diamond_sword, iron_chestplate, shield)')
        .setRequired(false)
    ),

  TYPE_TO_SLOT,
  SLOT_NAMES,

  /**
   * Tạo giao diện chọn trang bị (Select Menu + Bộ lọc theo vị trí)
   */
  buildEquipMessage(player, filterSlot = null) {
    if (!player.inventory) player.inventory = [];

    // Lọc các món đồ có thể trang bị
    let equippables = player.inventory.filter(item => {
      const itemId = item.itemId || item.id;
      const count = item.count || 0;
      if (count <= 0) return false;
      const def = config.ITEMS[itemId];
      return def && TYPE_TO_SLOT[def.type];
    });

    if (equippables.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('⚔️ KHÔNG CÓ TRANG BỊ ĐỂ ĐEO')
        .setDescription(
          `Túi đồ của bạn hiện không có vũ khí, công cụ hay áo giáp nào!\n\n` +
          `💡 **Cách sở hữu trang bị:**\n` +
          `• Chế tạo tại Bàn Chế Tạo \`/craft\`\n` +
          `• Khám phá các công trình và rương kho báu \`/explore\`\n` +
          `• Mua tại Cửa Hàng \`/shop\``
        );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('menu_equipment').setLabel('Quay lại Trang Bị').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
      );
      return { embeds: [embed], components: [row] };
    }

    // Nếu có chọn bộ lọc vị trí
    if (filterSlot) {
      if (filterSlot === 'weapons') {
        equippables = equippables.filter(item => {
          const def = config.ITEMS[item.itemId || item.id];
          const slot = TYPE_TO_SLOT[def.type];
          return slot === 'sword' || slot === 'pickaxe' || slot === 'axe' || slot === 'bow' || slot === 'shield';
        });
      } else {
        equippables = equippables.filter(item => {
          const def = config.ITEMS[item.itemId || item.id];
          return TYPE_TO_SLOT[def.type] === filterSlot;
        });
      }
    }

    // Sắp xếp ưu tiên: Món mạnh nhất / cấp cao nhất lên đầu (Netherite > Diamond > Iron > ...)
    equippables.sort((a, b) => {
      const idA = a.itemId || a.id;
      const idB = b.itemId || b.id;
      const defA = config.ITEMS[idA] || {};
      const defB = config.ITEMS[idB] || {};
      const tierA = Object.keys(TIER_ORDER).find(t => idA.includes(t));
      const tierB = Object.keys(TIER_ORDER).find(t => idB.includes(t));
      const scoreA = (tierA ? TIER_ORDER[tierA] * 10 : 0) + (defA.defense || 0) + (defA.attack || 0);
      const scoreB = (tierB ? TIER_ORDER[tierB] * 10 : 0) + (defB.defense || 0) + (defB.attack || 0);
      return scoreB - scoreA;
    });

    if (equippables.length === 0) {
      const slotLabel = filterSlot === 'weapons' ? 'Vũ khí / Công cụ' : (SLOT_NAMES[filterSlot] || filterSlot);
      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle(`🛡️ KHÔNG CÓ TRANG BỊ [${slotLabel.toUpperCase()}]`)
        .setDescription(`Trong túi của bạn không có món đồ nào thuộc vị trí **${slotLabel}**! Hãy bấm nút chọn vị trí khác bên dưới.`);
      const rowFilter1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('equip_filter_helmet').setLabel('Mũ').setEmoji('🪖').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('equip_filter_chestplate').setLabel('Áo').setEmoji('🥋').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('equip_filter_leggings').setLabel('Quần').setEmoji('👖').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('equip_filter_boots').setLabel('Ủng').setEmoji('👢').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('equip_filter_weapons').setLabel('Vũ khí').setEmoji('⚔️').setStyle(ButtonStyle.Primary)
      );
      const rowFilter2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('equip_filter_all').setLabel('Tất cả').setEmoji('🌟').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_equipment').setLabel('Quay lại Trang Bị').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
      );
      return { embeds: [embed], components: [rowFilter1, rowFilter2] };
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('equip_select_item')
      .setPlaceholder(filterSlot ? `Chọn một món [${filterSlot}] để mặc...` : 'Chọn trang bị từ túi đồ để mặc vào người...');

    equippables.slice(0, 25).forEach(invItem => {
      const iId = invItem.itemId || invItem.id;
      const def = config.ITEMS[iId];
      const slot = TYPE_TO_SLOT[def.type];
      const statParts = [];
      if (def.defense) statParts.push(`+${def.defense} Giáp`);
      if (def.attack) statParts.push(`+${def.attack} Công`);
      if (def.miningPower) statParts.push(`Cúp Cấp ${def.miningPower}`);
      if (def.choppingPower) statParts.push(`Rìu Cấp ${def.choppingPower}`);
      if (def.speedBonus) statParts.push(`+${def.speedBonus}% Tốc`);
      const statText = statParts.length > 0 ? ` | ${statParts.join(', ')}` : '';

      selectMenu.addOptions({
        label: `${def.name} (x${invItem.count})`.slice(0, 100),
        description: `Vị trí: ${SLOT_NAMES[slot]}${statText}`.slice(0, 100),
        value: iId,
        emoji: def.emoji || '⚔️'
      });
    });

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    const rowFilter1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('equip_filter_helmet').setLabel('Mũ').setEmoji('🪖').setStyle(filterSlot === 'helmet' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('equip_filter_chestplate').setLabel('Áo').setEmoji('🥋').setStyle(filterSlot === 'chestplate' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('equip_filter_leggings').setLabel('Quần').setEmoji('👖').setStyle(filterSlot === 'leggings' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('equip_filter_boots').setLabel('Ủng').setEmoji('👢').setStyle(filterSlot === 'boots' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('equip_filter_weapons').setLabel('Vũ khí').setEmoji('⚔️').setStyle(filterSlot === 'weapons' ? ButtonStyle.Success : ButtonStyle.Primary)
    );

    const rowFilter2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('equip_filter_all').setLabel('Tất cả trang bị').setEmoji('🌟').setStyle(!filterSlot ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('menu_equipment').setLabel('Quay lại Trang Bị').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
    );

    const filterText = filterSlot ? ` (Đang lọc: **${filterSlot === 'weapons' ? 'Vũ khí / Công cụ' : (SLOT_NAMES[filterSlot] || filterSlot)}**)` : '';
    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('🛡️ MẶC TRANG BỊ & GIÁP BẢO HỘ')
      .setDescription(
        `Hãy chọn một trang bị từ danh sách bên dưới để mặc vào người.${filterText}\n` +
        `*(Nếu ô tương ứng đã có đồ cũ, hệ thống sẽ tự động tháo và cất về lại túi đồ)*\n\n` +
        `💡 **Mẹo:** Bạn có thể bấm các nút phân loại bên dưới (Mũ, Áo, Quần, Ủng, Vũ khí) để lọc nhanh loại đồ muốn mặc!`
      );

    return { content: `<@${player.id}>`, embeds: [embed], components: [rowSelect, rowFilter1, rowFilter2] };
  },

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const rawItem = interaction.options?.getString ? interaction.options.getString('item') : null;

    // Nếu không nhập món đồ cụ thể -> hiển thị giao diện chọn đồ
    if (!rawItem) {
      const payload = module.exports.buildEquipMessage(player);
      if (interaction.isButton && interaction.isButton()) {
        return interaction.update(payload);
      }
      return interaction.reply(payload);
    }

    // Nếu người dùng nhập tên/ID món đồ
    const searchStr = rawItem.toLowerCase().trim();
    const itemKey = Object.keys(config.ITEMS).find(k => k.toLowerCase() === searchStr || config.ITEMS[k].name.toLowerCase().includes(searchStr));

    if (!itemKey) {
      const failMsg = {
        content: `❌ Không tìm thấy món đồ nào khớp với "${rawItem}". Hãy kiểm tra lại tên vật phẩm trong túi đồ!`,
        ephemeral: true
      };
      if (interaction.isButton && interaction.isButton()) return interaction.reply(failMsg);
      return interaction.reply(failMsg);
    }

    const result = module.exports.equipItem(player, itemKey);
    const rowBack = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('equip_fast_action').setLabel('Mặc thêm món khác').setEmoji('🛡️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_equipment').setLabel('Xem Trang Bị').setEmoji('⚔️').setStyle(ButtonStyle.Secondary)
    );

    if (interaction.isButton && interaction.isButton()) {
      return interaction.update({ content: `<@${player.id}>`, embeds: [result.embed], components: [rowBack] });
    }
    return interaction.reply({ embeds: [result.embed], components: [rowBack], ephemeral: !result.success });
  },

  /**
   * Logic cốt lõi đeo trang bị
   */
  equipItem(player, itemId) {
    const itemDef = config.ITEMS[itemId];
    if (!itemDef) {
      return {
        success: false,
        embed: new EmbedBuilder().setColor(0xef4444).setTitle('❌ LỖI').setDescription('Vật phẩm không tồn tại trong hệ thống!')
      };
    }

    const slot = TYPE_TO_SLOT[itemDef.type];
    if (!slot) {
      return {
        success: false,
        embed: new EmbedBuilder().setColor(0xef4444).setTitle('❌ KHÔNG THỂ ĐEO').setDescription(`Vật phẩm **${itemDef.name}** không phải là trang bị có thể đeo!`)
      };
    }

    if (!db.hasItem(player, itemId)) {
      return {
        success: false,
        embed: new EmbedBuilder().setColor(0xef4444).setTitle('❌ KHÔNG ĐỦ VẬT PHẨM').setDescription(`Trong túi đồ của bạn không có **${itemDef.name}**!`)
      };
    }

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

    // Lấy món cũ đang đeo (nếu có)
    const oldItemId = player.equipment[slot];
    let oldItemDef = null;

    // Lấy 1 cái từ túi đồ để đeo
    db.removeItem(player, itemId, 1);

    // Nếu có món cũ -> trả lại vào túi đồ
    if (oldItemId) {
      oldItemDef = config.ITEMS[oldItemId];
      db.addItem(player, oldItemId, 1);
    }

    // Cập nhật ô trang bị
    player.equipment[slot] = itemId;
    db.saveData();

    // Tính toán chỉ số mới
    const atk = db.getTotalAttack(player);
    const def = db.getTotalDefense(player);
    const red = db.getDamageReduction(def);
    const maxHp = db.getMaxHp(player);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('🛡️ ĐEO TRANG BỊ THÀNH CÔNG!')
      .setDescription(
        `Bạn đã trang bị ${itemDef.emoji} **${itemDef.name}** vào ô **${SLOT_NAMES[slot]}**!\n` +
        (oldItemDef ? `*(Đã tháo ${oldItemDef.emoji} ${oldItemDef.name} cũ cất lại vào túi đồ)*\n\n` : '\n') +
        `📊 **Chỉ số nhân vật sau khi mặc đồ:**\n` +
        `• ⚔️ **Sát thương Tấn công:** **${atk}**\n` +
        `• 🛡️ **Điểm Giáp Phòng thủ:** **${def}** *(Giảm ${red}% sát thương)*\n` +
        `• ❤️ **Máu Tối Đa:** **${maxHp} HP**`
      );

    return { success: true, embed, slot, itemId };
  }
};
