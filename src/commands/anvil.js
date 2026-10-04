const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');
const enchantSystem = require('../systems/enchantSystem');

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
    .setName('anvil')
    .setDescription('Dùng Cái Đe (Anvil) để ép Sách Phù Phép vào Vũ Khí và Áo Giáp')
    .addStringOption(opt =>
      opt.setName('book')
        .setDescription('ID hoặc tên Sách Phù Phép (vd: book_sharpness_1, book_mending hoặc để trống để chọn)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('slot')
        .setDescription('Vị trí trang bị muốn ép bùa')
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
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Chọn hành động khác: combine (Ghép 2 món cùng loại thành 1)')
        .setRequired(false)
        .addChoices(
          { name: '🔨 Ghép & Sửa chữa 2 trang bị cùng loại (Combine)', value: 'combine' }
        )
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());

    // 1. Kiểm tra người chơi có Cái Đe (Anvil) trong túi không
    const hasAnvil = db.hasItem(player, 'anvil');
    if (!hasAnvil) {
      const ironBlocks = db.getItemCount(player, 'iron_block');
      const ironIngots = db.getItemCount(player, 'iron_ingot');

      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🔨 BẠN CẦN CÓ CÁI ĐE (ANVIL) ĐỂ DÙNG SÁCH & GHÉP ĐỒ!')
        .setDescription(
          `Sách Phù Phép và tính năng Ghép 2 trang bị cùng loại bắt buộc phải đặt lên **Cái Đe (Anvil) 🔨**!\n\n` +
          `📜 **Công thức rèn Cái Đe tại Bàn Chế Tạo (\`/craft recipe: craft_anvil\`):**\n` +
          `• 🥈 **Khối Sắt (Iron Block):** **${ironBlocks}/3** khối\n` +
          `• 🥈 **Thỏi Sắt (Iron Ingot):** **${ironIngots}/4** thỏi\n\n` +
          `💡 **Hướng dẫn gom nguyên liệu:**\n` +
          `1. Đào quặng sắt trong Hang đá \`/mine\`\n` +
          `2. Nung quặng thành thỏi sắt trong Lò nung \`/smelt\`\n` +
          `3. Rèn 9 thỏi sắt thành 1 Khối Sắt qua \`/craft recipe: craft_iron_block\`\n` +
          `4. Khi đủ 3 Khối Sắt và 4 Thỏi Sắt, rèn Cái Đe qua \`/craft recipe: craft_anvil\`!`
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const action = interaction.options?.getString ? interaction.options.getString('action') : null;
    if (action === 'combine') {
      const uiHelper = require('../utils/uiHelper');
      const screen = uiHelper.buildCombineScreen(player);
      return interaction.reply({ embeds: screen.embeds, components: screen.components, ephemeral: true });
    }

    const bookId = interaction.options?.getString ? interaction.options.getString('book') : null;
    const slot = interaction.options?.getString ? interaction.options.getString('slot') : null;

    // Lọc các cuốn sách phù phép đang có trong túi
    const booksInInv = player.inventory.filter(i => {
      const def = config.ITEMS[i.itemId];
      return def && def.type === 'book';
    });

    if (booksInInv.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('🔨 BẠN ĐÃ CÓ CÁI ĐE, NHƯNG CHƯA CÓ SÁCH PHÙ PHÉP!')
        .setDescription(
          `Bạn đang có Cái Đe 🔨 trong túi đồ, nhưng hiện không có cuốn Sách Phù Phép nào!\n\n` +
          `📖 **Cách săn Sách Phù Phép:**\n` +
          `• Mua trực tiếp tại Cửa Hàng Chợ \`/shop list\` (Đặc biệt: Sách Tu Sửa Mending giá 50k xu)\n` +
          `• Thám hiểm thế giới \`/explore\` mở rương các công trình (Đền sa mạc, Trial Chambers, Làng, Tàu đắm...)\n` +
          `• Đột kích Pháo đài và Phế tích Bastion ở Địa Ngục Nether\n` +
          `• Khiêu chiến và tiêu diệt các Boss hùng mạnh!\n\n` +
          `💡 *Nếu bạn muốn ghép 2 trang bị cùng loại để sửa chữa độ bền, hãy gõ \`/anvil action: combine\`!*`
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Nếu người dùng chưa chọn sách hoặc slot -> hiện giao diện tương tác
    if (!bookId || !slot) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('anvil_select_book')
        .setPlaceholder('Chọn cuốn Sách Phù Phép muốn ép...');

      booksInInv.slice(0, 25).forEach(b => {
        const def = config.ITEMS[b.itemId];
        const targetStr = Array.isArray(def.targetSlot) ? def.targetSlot.join(', ') : (def.targetSlot || 'Trang bị');
        selectMenu.addOptions({
          label: `${def.name} (x${b.count})`,
          description: `Bùa: ${def.enchantId} Cấp ${def.level || 1} | Dành cho: ${targetStr}`.slice(0, 100),
          value: b.itemId,
          emoji: def.emoji || '📖'
        });
      });

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('🔨 KHU VỰC RÈN CÁI ĐE (ANVIL)')
        .setDescription(
          `Cái Đe sắt kiên cố sẵn sàng hoạt động! Hãy chọn cuốn Sách Phù Phép bạn muốn ép vào trang bị:\n\n` +
          `• Ép bùa: Chọn sách bên dưới hoặc gõ \`/anvil book:[sách] slot:[trang bị]\`\n` +
          `• Ghép 2 trang bị cùng loại: Gõ \`/anvil action: combine\` hoặc bấm vào menu Trang Bị \`/menu\``
        );

      const msg = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true, fetchReply: true });

      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === player.id,
        time: 60000,
        max: 1
      });

      collector.on('collect', async i => {
        const chosenBookId = i.values[0];
        const chosenBookDef = config.ITEMS[chosenBookId];
        let targetSlot = slot;
        if (!targetSlot) {
          if (Array.isArray(chosenBookDef.targetSlot)) {
            targetSlot = chosenBookDef.targetSlot.find(s => player.equipment && player.equipment[s]) || chosenBookDef.targetSlot[0];
          } else {
            targetSlot = chosenBookDef.targetSlot || 'sword';
          }
        }

        // Tự động ép vào slot mục tiêu của sách
        const result = enchantSystem.applyEnchantedBook(player, chosenBookId, targetSlot);
        if (!result.success) {
          return i.update({ content: `<@${player.id}> ${result.message}`, embeds: [], components: [] });
        }

        const successEmbed = new EmbedBuilder()
          .setColor(0x10b981)
          .setTitle('🔨 ĐẬP ĐE ÉP SÁCH THÀNH CÔNG!')
          .setDescription(result.message);

        return i.update({ content: `<@${player.id}>`, embeds: [successEmbed], components: [] });
      });

      return;
    }

    // Nếu đã truyền cả book và slot
    const result = enchantSystem.applyEnchantedBook(player, bookId, slot);
    if (!result.success) {
      return interaction.reply({ content: `<@${player.id}> ${result.message}`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('🔨 ĐẬP ĐE ÉP SÁCH THÀNH CÔNG!')
      .setDescription(result.message);

    return interaction.reply({ content: `<@${player.id}>`, embeds: [embed] });
  }
};
