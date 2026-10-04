const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

// Danh sách các loại thức ăn và hồi máu cân bằng
const FOOD_HEALS = {
  apple: { name: 'Táo', emoji: '🍎', heal: 4, desc: 'Táo tươi giòn ngọt' },
  bread: { name: 'Bánh mì', emoji: '🥖', heal: 6, desc: 'Bánh mì nóng hổi thơm phức' },
  cooked_beef: { name: 'Bít tết bò chín', emoji: '🥩', heal: 8, desc: 'Thịt bò nướng thơm ngậy tẩm ướp' },
  cooked_porkchop: { name: 'Thịt heo nướng', emoji: '🍖', heal: 8, desc: 'Thịt heo nướng giòn rụm' },
  cooked_chicken: { name: 'Thịt gà nướng', emoji: '🍗', heal: 6, desc: 'Đùi gà nướng vàng ươm' },
  cooked_mutton: { name: 'Thịt cừu nướng', emoji: '🍖', heal: 8, desc: 'Thịt cừu nướng thơm lừng' },
  golden_apple: { name: 'Táo vàng', emoji: '🍏', heal: 15, desc: 'Thần dược Táo Vàng hồi phục cực mạnh' },
  health_potion: { name: 'Bình thuốc hồi máu', emoji: '🧪', heal: 12, desc: 'Dược phẩm ma thuật chữa lành vết thương' },
  raw_beef: { name: 'Thịt bò sống', emoji: '🥩', heal: 3, desc: 'Thịt sống (nên nung chín trong Lò nung)' },
  raw_pork: { name: 'Thịt heo sống', emoji: '🥩', heal: 3, desc: 'Thịt sống (nên nung chín trong Lò nung)' },
  raw_chicken: { name: 'Thịt gà sống', emoji: '🍗', heal: 2, desc: 'Thịt gà sống' },
  raw_mutton: { name: 'Thịt cừu sống', emoji: '🥩', heal: 3, desc: 'Thịt sống (nên nung chín trong Lò nung)' },
  rotten_flesh: { name: 'Thịt thối rữa', emoji: '🍖', heal: 2, desc: 'Thịt zombie vị hôi nồng cay xè' }
};

// Danh sách các loại thuốc bổ trợ & thần dược
const POTION_EFFECTS = {
  strength_potion: { name: 'Thuốc Sức Mạnh', emoji: '💪', type: 'strength', value: 6, durationMinutes: 10, desc: 'Tăng +6 Sát Thương (Công) trong 10 phút' },
  resistance_potion: { name: 'Thuốc Kháng Cự', emoji: '🛡️', type: 'resistance', value: 5, durationMinutes: 10, desc: 'Tăng +5 Phòng Thủ (Giáp) trong 10 phút' },
  luck_potion: { name: 'Thuốc May Mắn', emoji: '🍀', type: 'luck', value: 1, durationMinutes: 10, desc: 'Tăng 2x tỉ lệ đào trúng Kim Cương/Quặng quý & rơi đồ trong 10 phút' },
};

function renderHpBar(current, max) {
  const totalBars = 10;
  const filled = Math.min(totalBars, Math.max(0, Math.round((current / max) * totalBars)));
  const empty = totalBars - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eat')
    .setDescription('Ăn thức ăn hồi máu hoặc uống thuốc tăng cường sức mạnh, kháng cự, may mắn')
    .addStringOption(opt =>
      opt.setName('food')
        .setDescription('Tên hoặc ID món ăn / thuốc (vd: bread, apple, strength_potion, luck_potion)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username, interaction.user.displayAvatarURL());
    const maxHp = db.getMaxHp(player);

    const rawItem = interaction.options?.getString ? interaction.options.getString('food') : null;

    // Lọc thức ăn và thuốc đang có trong túi đồ
    const availableFoods = player.inventory.filter(item => FOOD_HEALS[item.itemId] && item.count > 0);
    const availablePotions = player.inventory.filter(item => POTION_EFFECTS[item.itemId] && item.count > 0);

    if (availableFoods.length === 0 && availablePotions.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('🥖 HẾT THỨC ĂN & THUỐC!')
        .setDescription(
          `❤️ Máu hiện tại: **${Math.round(player.hp)}/${maxHp} HP**\n\n` +
          `❌ Túi đồ của bạn không có thức ăn hay bình thuốc nào!\n\n` +
          `💡 **Cách kiếm thức ăn & thuốc:**\n` +
          `• Mua thuốc tại Cửa Hàng: \`/shop buy item:health_potion\`, \`/shop buy item:strength_potion\`\n` +
          `• Đi săn thú (Heo 🐷, Bò 🐮, Gà 🐔) bằng lệnh \`/hunt\` hoặc đi dạo \`/explore\`\n` +
          `• Dùng Lò Nung \`/smelt\` nướng chín thịt sống hoặc \`/craft\` làm Bánh Mì để hồi phục!\n` +
          `• Về Nhà ngủ một giấc qua đêm \`/sleep\` để hồi đầy 100% Máu!`
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Nếu máu đầy và không có thuốc buff nào
    if (player.hp >= maxHp && availablePotions.length === 0 && !rawItem) {
      const embed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('🍖 BẠN ĐANG NO CĂNG BỤNG!')
        .setDescription(
          `❤️ **Thanh máu:** \`[${renderHpBar(player.hp, maxHp)}]\` **${Math.round(player.hp)}/${maxHp} HP** (100%)\n\n` +
          `Máu của bạn đã hoàn toàn đầy! Không cần phải ăn thêm lúc này.\n` +
          `*(Hãy tiếp tục đi dạo, đào mỏ hoặc chiến đấu)*`
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Nếu không nhập món cụ thể -> hiện menu chọn thức ăn/thuốc đang có
    if (!rawItem) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('eat_select_food')
        .setPlaceholder('Chọn món ăn hoặc thuốc muốn dùng...');

      // Thêm thuốc trước
      availablePotions.forEach(invItem => {
        const info = POTION_EFFECTS[invItem.itemId];
        selectMenu.addOptions({
          label: `${info.name} (Có: x${invItem.count})`,
          description: `Thuốc: ${info.desc}`.slice(0, 100),
          value: invItem.itemId,
          emoji: info.emoji || '🧪'
        });
      });

      // Thêm thức ăn
      availableFoods.slice(0, 25 - availablePotions.length).forEach(invItem => {
        const info = FOOD_HEALS[invItem.itemId];
        selectMenu.addOptions({
          label: `${info.name} (Có: x${invItem.count})`,
          description: `Hồi phục: +${info.heal} ❤️ | ${info.desc}`.slice(0, 100),
          value: invItem.itemId,
          emoji: info.emoji || '🍖'
        });
      });

      const row = new ActionRowBuilder().addComponents(selectMenu);
      const activeBuffsStr = db.formatEffectsString(player);

      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('🍖 DÙNG THỨC ĂN HOẶC UỐNG THUỐC')
        .setDescription(
          `❤️ **Máu hiện tại:** \`[${renderHpBar(player.hp, maxHp)}]\` **${Math.round(player.hp)}/${maxHp} HP**\n` +
          (activeBuffsStr ? `✨ **Hiệu ứng đang có:** ${activeBuffsStr}\n` : '') +
          `\nHãy chọn món ăn hoặc bình thuốc từ danh sách bên dưới:`
        );

      const msg = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true, fetchReply: true });

      const collector = msg.createMessageComponentCollector({
        filter: i => i.user.id === player.id,
        time: 45000,
        max: 1
      });

      collector.on('collect', async i => {
        const chosenId = i.values[0];
        const result = module.exports.consumeFood(player, chosenId);
        if (!result.success) {
          return i.update({ content: `<@${player.id}> ❌ ${result.embed.data.description}`, embeds: [], components: [] });
        }

        if (result.isPotion) {
          await i.update({
            content: `🧪 <@${player.id}> đã uống ${result.foodInfo.emoji} **${result.foodInfo.name}**! Nhận hiệu ứng: **${result.foodInfo.desc}**. *(Đang đóng...)*`,
            embeds: [],
            components: []
          });
        } else {
          await i.update({
            content: `😋 <@${player.id}> đã ăn ${result.foodInfo.emoji} **${result.foodInfo.name}** (+${result.actualHealed} ❤️ HP)! Máu hiện tại: **${Math.round(player.hp)}/${maxHp} HP**. *(Đang đóng...)*`,
            embeds: [],
            components: []
          });
        }

        setTimeout(async () => {
          try {
            await interaction.deleteReply();
          } catch (e) {}
        }, 1800);
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && collected.size === 0) {
          try {
            await interaction.deleteReply();
          } catch (e) {}
        }
      });

      return;
    }

    // Nếu người dùng nhập tên thức ăn / thuốc
    const search = rawItem.toLowerCase().trim();
    const allDefs = { ...FOOD_HEALS, ...POTION_EFFECTS };
    const matchedKey = Object.keys(allDefs).find(k => k === search || allDefs[k].name.toLowerCase().includes(search));

    if (!matchedKey) {
      return interaction.reply({
        content: `❌ Không tìm thấy món ăn hoặc thuốc nào là "${rawItem}". Dùng lệnh \`/eat\` không tham số để mở danh sách chọn!`,
        ephemeral: true
      });
    }

    const result = module.exports.consumeFood(player, matchedKey);
    if (!result.success) {
      return interaction.reply({ embeds: [result.embed], ephemeral: true });
    }

    if (result.isPotion) {
      await interaction.reply({
        content: `🧪 <@${player.id}> đã uống ${result.foodInfo.emoji} **${result.foodInfo.name}**! Nhận hiệu ứng: **${result.foodInfo.desc}**. *(Tự đóng sau 2s...)*`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `😋 <@${player.id}> đã ăn ${result.foodInfo.emoji} **${result.foodInfo.name}** (+${result.actualHealed} ❤️ HP)! Máu: **${Math.round(player.hp)}/${maxHp} HP**. *(Tự đóng sau 2s...)*`,
        ephemeral: true
      });
    }

    setTimeout(async () => {
      try {
        await interaction.deleteReply();
      } catch (e) {}
    }, 2000);
  },

  /**
   * Logic ăn uống & dùng thuốc
   */
  consumeFood(player, itemId) {
    // 1. Nếu là thuốc bổ trợ (Potion)
    if (POTION_EFFECTS[itemId]) {
      const pInfo = POTION_EFFECTS[itemId];
      if (!db.hasItem(player, itemId)) {
        return {
          success: false,
          embed: new EmbedBuilder().setColor(0xef4444).setTitle('❌ KHÔNG CÓ THUỐC').setDescription(`Trong túi bạn không còn ${pInfo.emoji} **${pInfo.name}** nào!`)
        };
      }

      db.removeItem(player, itemId, 1);
      const applied = db.applyEffect(player, pInfo.type, pInfo.value, pInfo.durationMinutes);
      const remaining = db.getItemCount(player, itemId);

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle(`🧪 ĐÃ UỐNG ${pInfo.emoji} ${pInfo.name.toUpperCase()}!`)
        .setDescription(
          `*${pInfo.desc}*\n\n` +
          `✨ **Hiệu ứng kích hoạt:** **${applied.name}**\n` +
          `⏳ **Thời gian hiệu lực:** **${pInfo.durationMinutes} phút**\n` +
          `📦 **Còn lại trong túi:** ${remaining} bình`
        );

      return { success: true, isPotion: true, embed, foodInfo: pInfo, applied };
    }

    // 2. Nếu là thức ăn hồi máu (Food)
    const foodInfo = FOOD_HEALS[itemId];
    if (!foodInfo) {
      return {
        success: false,
        embed: new EmbedBuilder().setColor(0xef4444).setTitle('❌ LỖI').setDescription('Món đồ này không thể dùng được!')
      };
    }

    if (!db.hasItem(player, itemId)) {
      return {
        success: false,
        embed: new EmbedBuilder().setColor(0xef4444).setTitle('❌ KHÔNG CÓ THỨC ĂN').setDescription(`Trong túi bạn không còn ${foodInfo.emoji} **${foodInfo.name}** nào!`)
      };
    }

    const maxHp = db.getMaxHp(player);
    if (player.hp >= maxHp) {
      return {
        success: false,
        embed: new EmbedBuilder().setColor(0x10b981).setTitle('🍖 ĐÃ ĐẦY MÁU').setDescription(`Máu của bạn đã đầy (**${player.hp}/${maxHp} HP**)! Không thể ăn thêm lúc này.`)
      };
    }

    const hpBefore = player.hp;
    const healAmount = foodInfo.heal;
    player.hp = Math.min(maxHp, player.hp + healAmount);
    const actualHealed = Math.round((player.hp - hpBefore) * 10) / 10;

    // Tiêu thụ 1 thức ăn
    db.removeItem(player, itemId, 1);
    db.saveData();

    const remaining = db.getItemCount(player, itemId);

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle(`😋 BẠN ĐÃ ĂN ${foodInfo.emoji} ${foodInfo.name.toUpperCase()}!`)
      .setDescription(
        `*${foodInfo.desc}*\n\n` +
        `💚 **Hồi phục:** **+${actualHealed} Máu (HP)**\n` +
        `❤️ **Thanh máu mới:** \`[${renderHpBar(player.hp, maxHp)}]\` **${Math.round(player.hp)}/${maxHp} HP**\n` +
        `📦 **Còn lại trong túi:** ${remaining} cái`
      );

    return { success: true, isPotion: false, embed, foodInfo, actualHealed, hp: player.hp, maxHp };
  }
};
