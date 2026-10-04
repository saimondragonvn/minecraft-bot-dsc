const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const craftingSystem = require('../systems/craftingSystem');
const config = require('../config');
const imageHelper = require('../utils/imageHelper');

const CATEGORIES = {
  all: { name: '🌟 Tất Cả Công Thức', icon: '🌟' },
  tools: { name: '⚔️ Vũ Khí & Dụng Cụ', icon: '⚔️' },
  armor: { name: '🛡️ Áo Giáp & Phòng Ngự', icon: '🛡️' },
  basic: { name: '📦 Cơ Bản & Tiện Ích (Rương, Giường, Đuốc...)', icon: '📦' },
  magic: { name: '🔮 Ma Thuật & Đúc Cổng (Hắc diện thạch, Mắt Ender, Đe...)', icon: '🔮' }
};

function getCategoryRecipes(cat) {
  const recipes = craftingSystem.getRecipes();
  if (cat === 'tools') {
    return recipes.filter(r =>
      r.id.includes('pickaxe') || r.id.includes('axe') || r.id.includes('sword') ||
      r.id.includes('bow') || r.id.includes('arrow') || r.id.includes('shield') ||
      r.id.includes('crossbow') || r.id.includes('mace') || r.id.includes('wind_charge') ||
      r.id.includes('lightning_rod') || r.id.includes('spyglass')
    );
  }
  if (cat === 'armor') {
    return recipes.filter(r =>
      r.id.includes('helmet') || r.id.includes('chestplate') ||
      r.id.includes('leggings') || r.id.includes('boots')
    );
  }
  if (cat === 'basic') {
    return recipes.filter(r =>
      r.id.includes('crafting_table') || r.id.includes('furnace') || r.id.includes('chest') ||
      r.id.includes('bed') || r.id.includes('torch') || r.id.includes('bucket') ||
      r.id.includes('bread') || r.id.includes('paper') || r.id.includes('firework') ||
      r.id.includes('bone_block') || r.id.includes('book') || r.id.includes('crafter') ||
      (r.id.includes('_block') && !r.id.includes('bone'))
    );
  }
  if (cat === 'magic') {
    return recipes.filter(r =>
      r.id.includes('obsidian') || r.id.includes('flint') || r.id.includes('blaze') ||
      r.id.includes('eye_of_ender') || r.id.includes('anvil') || r.id.includes('enchanting_table') ||
      r.id.includes('golden_apple') || r.id.includes('totem') || r.id.includes('shulker') ||
      r.id.includes('beacon') || r.id.includes('end_crystal') || r.id.includes('tnt') ||
      r.id.includes('netherite_scrap') || r.id.includes('netherite_ingot')
    );
  }
  return recipes;
}

function formatRecipe(r) {
  const resDef = config.ITEMS[r.result];
  const emoji = resDef ? resDef.emoji : '📦';
  const mats = Object.entries(r.materials).map(([m, c]) => {
    const mDef = config.ITEMS[m];
    return `${mDef ? mDef.emoji + ' ' + mDef.name : m} x${c}`;
  }).join(' + ');
  const retStr = r.returns ? ` *(Hoàn trả: ${Object.entries(r.returns).map(([k, c]) => `${config.ITEMS[k]?.emoji || ''} x${c}`).join(', ')})*` : '';
  const countStr = (r.count && r.count > 1) ? ` (x${r.count})` : '';
  return `• ${emoji} **${r.name}**${countStr}\n  └ Lệnh: \`/craft item name:${r.id}\`\n  └ Cần: \`${mats}\`${retStr}`;
}

function buildCraftListPayload(player, category = 'all') {
  const catInfo = CATEGORIES[category] || CATEGORIES.all;

  let desc = `💡 *Cách chế tạo: Dùng lệnh \`/craft item name:[mã_công_thức]\` hoặc chọn món trong \`/menu\` -> Bàn Chế Tạo.*\n\n`;

  if (category === 'all') {
    const toolRecs = getCategoryRecipes('tools');
    const armorRecs = getCategoryRecipes('armor');
    const basicRecs = getCategoryRecipes('basic');
    const magicRecs = getCategoryRecipes('magic');

    desc += `⚔️ **VŨ KHÍ & DỤNG CỤ (${toolRecs.length} món):**\n` + toolRecs.slice(0, 8).map(formatRecipe).join('\n') + `\n  *(Bấm nút "Vũ Khí & Dụng Cụ" bên dưới để xem toàn bộ ${toolRecs.length} món)*\n\n`;
    desc += `🛡️ **ÁO GIÁP & PHÒNG NGỰ (${armorRecs.length} món):**\n` + armorRecs.slice(0, 6).map(formatRecipe).join('\n') + `\n  *(Bấm nút "Áo Giáp" bên dưới để xem toàn bộ ${armorRecs.length} món)*\n\n`;
    desc += `📦 **CƠ BẢN, TIỆN ÍCH & GIƯỜNG (${basicRecs.length} món):**\n` + basicRecs.slice(0, 6).map(formatRecipe).join('\n') + `\n  *(Bấm nút "Cơ Bản & Giường" bên dưới để xem toàn bộ ${basicRecs.length} món)*\n\n`;
    desc += `🔮 **MA THUẬT, ĐÚC CỔNG & LUYỆN KIM (${magicRecs.length} món):**\n` + magicRecs.slice(0, 6).map(formatRecipe).join('\n') + `\n  *(Bấm nút "Ma Thuật & Cổng" bên dưới để xem toàn bộ ${magicRecs.length} món)*`;
  } else {
    const recs = getCategoryRecipes(category);
    desc += `📁 **DANH MỤC: ${catInfo.name.toUpperCase()}** (${recs.length} công thức):\n\n` +
      recs.map(formatRecipe).join('\n\n');
  }

  const embed = new EmbedBuilder()
    .setColor(0xd97706)
    .setTitle(`🪑 BẢNG CÔNG THỨC CHẾ TẠO (CRAFTING RECIPES)`)
    .setDescription(desc);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('craft_list_all').setLabel('Tất Cả').setEmoji('🌟').setStyle(category === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('craft_list_tools').setLabel('Vũ Khí').setEmoji('⚔️').setStyle(category === 'tools' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('craft_list_armor').setLabel('Áo Giáp').setEmoji('🛡️').setStyle(category === 'armor' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('craft_list_basic').setLabel('Cơ Bản').setEmoji('📦').setStyle(category === 'basic' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('craft_list_magic').setLabel('Ma Thuật').setEmoji('🔮').setStyle(category === 'magic' ? ButtonStyle.Primary : ButtonStyle.Secondary)
  );

  return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('craft')
    .setDescription('Chế tạo công cụ, vũ khí, áo giáp và vật phẩm Minecraft')
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('Xem toàn bộ bảng công thức chế tạo và nguyên liệu yêu cầu (Gửi riêng)')
        .addStringOption(opt =>
          opt.setName('category')
            .setDescription('Phân loại công thức muốn xem')
            .setRequired(false)
            .addChoices(
              { name: '🌟 Tất cả công thức', value: 'all' },
              { name: '⚔️ Vũ khí & Dụng cụ', value: 'tools' },
              { name: '🛡️ Áo giáp & Phòng ngự', value: 'armor' },
              { name: '📦 Cơ bản & Tiện ích (Rương, Giường, Đuốc...)', value: 'basic' },
              { name: '🔮 Ma thuật & Đúc Cổng (Hắc diện thạch, Mắt Ender, Đe...)', value: 'magic' }
            )
        )
    )
    .addSubcommand(sub =>
      sub.setName('item')
        .setDescription('Chế tạo một món đồ cụ thể')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Mã công thức hoặc tên món đồ (vd: craft_bow, craft_bed, craft_shield, craft_obsidian)')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const sub = interaction.options?.getSubcommand ? interaction.options.getSubcommand() : null;

    if (sub === 'list' || (!sub && !interaction.options?.getString('name') && !interaction.options?.getString('recipe'))) {
      const category = interaction.options?.getString ? (interaction.options.getString('category') || 'all') : 'all';
      const payload = buildCraftListPayload(player, category);
      return interaction.reply({ ...payload, ephemeral: true });
    }

    const query = interaction.options?.getString ? (interaction.options.getString('name') || interaction.options.getString('recipe')) : null;
    if (!query) {
      const payload = buildCraftListPayload(player, 'all');
      return interaction.reply({ ...payload, ephemeral: true });
    }

    const qLower = query.toLowerCase().trim();
    const recipe = craftingSystem.getRecipes().find(r => {
      const resDef = config.ITEMS[r.result];
      return (
        r.id.toLowerCase() === qLower ||
        r.id.toLowerCase() === `craft_${qLower}` ||
        r.result.toLowerCase() === qLower ||
        r.name.toLowerCase().includes(qLower) ||
        (resDef && resDef.name.toLowerCase().includes(qLower)) ||
        ((qLower.includes('obsidian') || qLower.includes('hắc diện')) && r.result === 'obsidian') ||
        ((qLower.includes('ender') || qLower.includes('mắt')) && r.result === 'eye_of_ender')
      );
    });
    if (!recipe) {
      return interaction.reply({ content: `<@${player.id}> ❌ Không tìm thấy công thức chế tạo phù hợp với "${query}"! Dùng \`/craft list\` để tra cứu toàn bộ công thức.`, ephemeral: true });
    }

    const result = craftingSystem.craft(player, recipe.id);
    return interaction.reply({ content: `<@${player.id}> ${result.message}`, ephemeral: !result.success });
  },

  async handleButton(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const id = interaction.customId;
    const cat = id.replace('craft_list_', '');
    const payload = buildCraftListPayload(player, cat);
    return interaction.update(payload);
  }
};
