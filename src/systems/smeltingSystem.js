const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

class SmeltingSystem {
  constructor() {
    this.recipes = [
      { id: 'iron', input: 'iron_ore', output: 'iron_ingot', name: 'Quặng Sắt ➔ Thỏi Sắt', emoji: '🥈', expPerItem: 2 },
      { id: 'gold', input: 'gold_ore', output: 'gold_ingot', name: 'Quặng Vàng ➔ Thỏi Vàng', emoji: '🥇', expPerItem: 3 },
      { id: 'copper', input: 'copper_ore', output: 'copper_ingot', name: 'Quặng Đồng ➔ Thỏi Đồng', emoji: '🥉', expPerItem: 2 },
      { id: 'ancient_debris', input: 'ancient_debris', output: 'netherite_scrap', name: 'Mảnh Vỡ Cổ Đại ➔ Mảnh Netherite', emoji: '🪨', expPerItem: 10 },
      { id: 'cobblestone', input: 'cobblestone', output: 'stone', name: 'Đá Cuội ➔ Đá Nhẵn (Stone)', emoji: '🪨', expPerItem: 1 },
      { id: 'beef', input: 'raw_beef', output: 'cooked_beef', name: 'Thịt Bò Sống ➔ Bít Tết Bò Chín', emoji: '🥩', expPerItem: 2 },
      { id: 'pork', input: 'raw_pork', output: 'cooked_porkchop', name: 'Thịt Heo Sống ➔ Thịt Heo Nướng', emoji: '🍖', expPerItem: 2 },
      { id: 'chicken', input: 'raw_chicken', output: 'cooked_chicken', name: 'Thịt Gà Sống ➔ Thịt Gà Nướng', emoji: '🍗', expPerItem: 2 }
    ];
  }

  getRecipes() {
    return this.recipes;
  }

  getRecipe(id) {
    return this.recipes.find(r => r.id === id || r.input === id);
  }

  isUnlocked(player) {
    if (player.unlocked && player.unlocked.furnace) return true;
    if (db.hasItem(player, 'furnace')) {
      if (!player.unlocked) player.unlocked = {};
      player.unlocked.furnace = true;
      db.saveData();
      return true;
    }
    return false;
  }

  unlock(player) {
    const cobbleCount = db.getItemCount(player, 'cobblestone');
    if (cobbleCount < 50) {
      return {
        success: false,
        message: `❌ **Không đủ Đá Cuội!** Bạn cần tối thiểu **50 Đá Cuội** 🪨 để xây dựng Lò Nung (Hiện có: **${cobbleCount}/50** 🪨).\n*(Hãy cầm Cúp vào Hang Đá \`/mine\` để khai thác thêm đá!)*`
      };
    }

    db.removeItem(player, 'cobblestone', 50);
    if (!player.unlocked) player.unlocked = {};
    player.unlocked.furnace = true;
    db.saveData();

    return {
      success: true,
      message: `🎉 **XÂY DỰNG & MỞ KHÓA LÒ NUNG THÀNH CÔNG!** 🔥\n` +
        `Bạn đã sử dụng **50 Đá Cuội** 🪨 để hoàn thiện chiếc **Lò Nung (Furnace)** kiên cố vĩnh viễn!\n` +
        `Từ nay bạn có thể thoải mái luyện quặng và nướng thịt bất cứ lúc nào qua lệnh \`/smelt\` hoặc \`/menu\`!`
    };
  }

  buildFurnaceUnlockScreen(player) {
    const cobbleCount = db.getItemCount(player, 'cobblestone');
    const hasEnough = cobbleCount >= 50;

    const embed = new EmbedBuilder()
      .setColor(0xea580c)
      .setTitle('🔥 XÂY DỰNG & MỞ KHÓA LÒ NUNG (FURNACE)')
      .setDescription(
        `Chào mừng bạn đến với khu vực **Lò Nung Minecraft**!\n` +
        `Hiện tại bạn **chưa mở khóa Lò Nung**. Để bắt đầu luyện quặng thành thỏi và nướng thịt chín thơm ngon, bạn cần thu thập đủ **50 Đá Cuội** để xây dựng lò nung kiên cố.\n\n` +
        `🧱 **Yêu cầu mở khóa Lò Nung vĩnh viễn:**\n` +
        `• 🪨 **Đá Cuội (Cobblestone):** **${cobbleCount}/50** viên ${hasEnough ? '✅ **(ĐÃ ĐỦ NGUYÊN LIỆU)**' : '❌ **(CHƯA ĐỦ)**'}\n\n` +
        (hasEnough
          ? `👉 *Bạn đã có đủ nguyên liệu! Hãy bấm nút **[🔨 Mở Khóa Lò Nung]** bên dưới để mở khóa ngay vĩnh viễn!*`
          : `⛏️ *Hãy cầm Cúp vào Hang Đá (\`/mine\` hoặc \`/menu\` -> Hang Đá) để đào thêm **${50 - cobbleCount} Đá Cuội** nữa nhé!*`)
      );

    const row = new ActionRowBuilder();
    if (hasEnough) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('furnace_unlock_confirm')
          .setLabel('🔨 Mở Khóa Lò Nung (-50 Đá Cuội)')
          .setStyle(ButtonStyle.Success)
      );
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('furnace_unlock_disabled')
          .setLabel(`🔒 Cần 50 Đá Cuội (Có: ${cobbleCount}/50)`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }

    row.addComponents(
      new ButtonBuilder()
        .setCustomId('menu_areas')
        .setLabel('Quay lại Khu Vực')
        .setEmoji('🗺️')
        .setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
  }

  /**
   * Tạo giao diện Lò Nung (Furnace Screen)
   */
  buildFurnaceScreen(player) {
    if (!this.isUnlocked(player)) {
      return this.buildFurnaceUnlockScreen(player);
    }

    const coalCount = db.getItemCount(player, 'coal');
    const usedSlots = db.getUsedSlots(player);
    const maxSlots = db.getMaxSlots(player);

    let summaryLines = [];
    const availableOptions = [];

    for (const r of this.recipes) {
      const inputDef = config.ITEMS[r.input] || { name: r.input, emoji: '📦' };
      const outputDef = config.ITEMS[r.output] || { name: r.output, emoji: '📦' };
      const count = db.getItemCount(player, r.input);

      summaryLines.push(
        `• ${inputDef.emoji} **${inputDef.name}** (có: **${count}**) ➔ ${outputDef.emoji} **${outputDef.name}**`
      );

      if (count > 0) {
        availableOptions.push({
          label: `${outputDef.emoji} ${r.name}`,
          description: `Hiện có: ${count} ${inputDef.name} | Cần 1 Than cho 4 món`,
          value: r.id,
          emoji: outputDef.emoji
        });
      }
    }

    const maxSmeltableWithCoal = coalCount * 4;

    const embed = new EmbedBuilder()
      .setColor(0xea580c)
      .setTitle('🔥 LÒ NUNG VẬT PHẨM (FURNACE)')
      .setDescription(
        `Chào mừng bạn đến với **Lò Nung Minecraft**!\n` +
        `Tại đây bạn có thể luyện quặng thô thành kim loại và nướng chín thực phẩm.\n\n` +
        `⚖️ **Quy tắc nhiên liệu:** **1 Than đá ⚫ nung được 4 món vật phẩm**\n` +
        `⚫ **Than đá hiện có:** **${coalCount}** viên *(Đủ nung tối đa **${maxSmeltableWithCoal}** món)*\n` +
        `📦 **Kho đồ:** ${usedSlots}/${maxSlots} Ô\n\n` +
        `📋 **Danh sách công thức nung:**\n` +
        summaryLines.join('\n') +
        `\n\n*(Chọn món muốn nung từ menu bên dưới hoặc bấm **[Nung Tất Cả]** để tự động luyện hết quặng/thịt!)*`
      );

    const components = [];

    if (availableOptions.length > 0) {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('furnace_select_recipe')
        .setPlaceholder('Chọn vật phẩm bạn muốn nung...')
        .addOptions(availableOptions.slice(0, 25));

      components.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('furnace_smelt_all').setLabel('🔥 Nung Tất Cả (Tự Động Tính Than)').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );

    components.push(actionRow);

    return { content: `<@${player.id}>`, embeds: [embed], components };
  }

  async sendResult(interaction, player, embed, row) {
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    }
    if (interaction.isButton?.() || interaction.isStringSelectMenu?.()) {
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    }
    return interaction.reply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
  }

  async sendError(interaction, player, message) {
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({ content: `<@${player.id}> ${message}`, ephemeral: true });
    }
    return interaction.reply({ content: `<@${player.id}> ${message}`, ephemeral: true });
  }

  /**
   * Nung một loại vật phẩm cụ thể
   */
  async handleSmeltRecipe(interaction, player, recipeId) {
    if (!this.isUnlocked(player)) {
      return this.sendError(interaction, player, '❌ **Bạn chưa mở khóa Lò Nung!** Cần **50 Đá Cuội** 🪨 để xây dựng & mở khóa Lò Nung vĩnh viễn! (Vào `/menu` -> Lò Nung để mở khóa)');
    }

    const recipe = this.getRecipe(recipeId);
    if (!recipe) {
      return this.sendError(interaction, player, '❌ Không tìm thấy công thức nung này!');
    }

    const inputDef = config.ITEMS[recipe.input] || { name: recipe.input, emoji: '📦' };
    const outputDef = config.ITEMS[recipe.output] || { name: recipe.output, emoji: '📦' };
    const itemCount = db.getItemCount(player, recipe.input);
    const coalCount = db.getItemCount(player, 'coal');

    if (itemCount <= 0) {
      return this.sendError(interaction, player, `❌ Bạn không có bất kỳ **${inputDef.name}** ${inputDef.emoji} nào trong túi đồ để nung!`);
    }

    if (coalCount <= 0) {
      return this.sendError(interaction, player, `❌ **Bạn không có viên Than đá (Coal) ⚫ nào!**\nQuy tắc: **1 Than đá ⚫ nung được 4 món vật phẩm**.\nHãy cầm Cúp vào Hang Đá để đào Than đá trước nhé!`);
    }

    // Tính toán số lượng có thể nung dựa trên số than đang có (1 than = 4 món)
    const maxSmeltable = coalCount * 4;
    const countToSmelt = Math.min(itemCount, maxSmeltable);
    const coalUsed = Math.ceil(countToSmelt / 4);

    if (countToSmelt <= 0) {
      return this.sendError(interaction, player, '❌ Không đủ tài nguyên để tiến hành nung!');
    }

    // Tiêu hao nguyên liệu & than
    db.removeItem(player, recipe.input, countToSmelt);
    db.removeItem(player, 'coal', coalUsed);
    db.addItem(player, recipe.output, countToSmelt);

    const expGained = Math.max(5, countToSmelt * recipe.expPerItem);
    const leveledUp = db.addExp(player, expGained);
    db.saveData();

    const embed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('🔥 NUNG VẬT PHẨM THÀNH CÔNG!')
      .setDescription(
        `Lò nung cháy rực rỡ với ngọn lửa than đỏ rực!\n\n` +
        `• 📥 **Đã nung:** x${countToSmelt} ${inputDef.name} ${inputDef.emoji}\n` +
        `• 📤 **Thu được:** **x${countToSmelt} ${outputDef.name}** ${outputDef.emoji}\n` +
        `• ⚫ **Tiêu hao than:** **${coalUsed} Than đá** *(1 Than = 4 món)*\n` +
        `• ⚫ **Than còn lại:** ${db.getItemCount(player, 'coal')} viên\n` +
        `• ⭐ **Kinh nghiệm:** +${expGained} EXP ${leveledUp ? '🎊 **LÊN CẤP!**' : ''}\n\n` +
        (itemCount > countToSmelt ? `⚠️ *Bạn còn ${itemCount - countToSmelt} ${inputDef.name} chưa nung do hết than đá! Hãy kiếm thêm than để nung tiếp.*` : '✅ Đã nung toàn bộ số lượng trong túi đồ!')
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('area_furnace').setLabel('Mở Lò Nung').setEmoji('🔥').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );

    return this.sendResult(interaction, player, embed, row);
  }

  /**
   * Nung tất cả mọi vật phẩm có thể nung trong túi đồ
   */
  async handleSmeltAll(interaction, player) {
    if (!this.isUnlocked(player)) {
      return this.sendError(interaction, player, '❌ **Bạn chưa mở khóa Lò Nung!** Cần **50 Đá Cuội** 🪨 để xây dựng & mở khóa Lò Nung vĩnh viễn! (Vào `/menu` -> Lò Nung để mở khóa)');
    }

    let coalCount = db.getItemCount(player, 'coal');

    if (coalCount <= 0) {
      return this.sendError(interaction, player, `❌ **Bạn không có Than đá (Coal) ⚫ nào trong túi đồ!**\nQuy tắc: **1 Than đá ⚫ nung được 4 món vật phẩm**.\nVui lòng vào Hang Đá đào Than trước khi dùng Lò Nung!`);
    }

    let remainingFuelSlots = coalCount * 4;
    const smeltedResults = [];
    let totalExp = 0;
    let totalCoalConsumed = 0;

    // Ưu tiên nung các vật phẩm giá trị cao trước: Ancient Debris, Vàng, Sắt, Đồng, Thực phẩm, Đá cuội
    for (const r of this.recipes) {
      if (remainingFuelSlots <= 0) break;

      const count = db.getItemCount(player, r.input);
      if (count <= 0) continue;

      const smeltCount = Math.min(count, remainingFuelSlots);
      if (smeltCount > 0) {
        db.removeItem(player, r.input, smeltCount);
        db.addItem(player, r.output, smeltCount);

        const inputDef = config.ITEMS[r.input] || { name: r.input, emoji: '📦' };
        const outputDef = config.ITEMS[r.output] || { name: r.output, emoji: '📦' };
        smeltedResults.push(`• x${smeltCount} ${inputDef.name} ➔ **x${smeltCount} ${outputDef.name}** ${outputDef.emoji}`);

        totalExp += smeltCount * r.expPerItem;
        remainingFuelSlots -= smeltCount;
      }
    }

    if (smeltedResults.length === 0) {
      return this.sendError(interaction, player, '❌ Bạn không có bất kỳ vật phẩm thô nào (quặng sắt/vàng/đồng/ancient debris, đá cuội, thịt sống) để nung trong túi đồ!');
    }

    const totalItemsSmelted = (coalCount * 4) - remainingFuelSlots;
    totalCoalConsumed = Math.ceil(totalItemsSmelted / 4);
    db.removeItem(player, 'coal', totalCoalConsumed);

    const leveledUp = db.addExp(player, Math.max(10, totalExp));
    db.saveData();

    const embed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('🔥 NUNG TOÀN BỘ VẬT PHẨM THÀNH CÔNG!')
      .setDescription(
        `Lò nung hoạt động hết công suất! Toàn bộ quặng và thịt đã được luyện thành phẩm:\n\n` +
        smeltedResults.join('\n') +
        `\n\n• 📦 **Tổng số vật phẩm đã nung:** **${totalItemsSmelted} món**\n` +
        `• ⚫ **Than đá tiêu hao:** **${totalCoalConsumed} viên** *(1 Than = 4 món)*\n` +
        `• ⚫ **Than đá còn lại:** **${db.getItemCount(player, 'coal')} viên**\n` +
        `• ⭐ **Kinh nghiệm nhận được:** +${Math.max(10, totalExp)} EXP ${leveledUp ? '🎊 **LÊN CẤP!**' : ''}`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('area_furnace').setLabel('Mở Lò Nung').setEmoji('🔥').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_inventory').setLabel('Kiểm Tra Túi Đồ').setEmoji('🎒').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Quay lại Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );

    return this.sendResult(interaction, player, embed, row);
  }
}

module.exports = new SmeltingSystem();
