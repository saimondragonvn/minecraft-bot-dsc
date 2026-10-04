const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const config = require('../config');
const db = require('../database/db');
const { generateProfileCard } = require('../systems/canvasProfile');
const timeSystem = require('../systems/timeSystem');

class UIHelper {
  /**
   * Màn hình Menu Chính (Screenshot 1 & 2)
   */
  buildMainMenu(player = null) {
    const timeInfo = timeSystem.getMinecraftTime();

    const embed = new EmbedBuilder()
      .setColor(0x2b2d42)
      .setTitle('Menu Chính')
      .setDescription(
        `📋 Xem thông tin cơ bản\n\n` +
        `📊 Xem chi tiết chỉ số\n\n` +
        `🎒 Xem Túi Đồ\n\n` +
        `⚔️ Xem Trang Bị\n\n` +
        `🗺️ Khu Vực\n\n` +
        `🚶 Đi dạo thám hiểm\n\n` +
        `💝 Ủng hộ\n\n` +
        `⏰ **Thời gian:** ${timeInfo.icon} **${timeInfo.timeString}** (${timeInfo.title})`
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_info').setLabel('Thông tin').setEmoji('📋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_stats').setLabel('Chỉ số').setEmoji('📊').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_inventory').setLabel('Túi đồ').setEmoji('🎒').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_equipment').setLabel('Trang bị').setEmoji('⚔️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu vực').setEmoji('🗺️').setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_explore').setLabel('Đi Dạo').setEmoji('🚶').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_donate').setLabel('Ủng hộ').setEmoji('💝').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_settings').setLabel('Cài đặt').setEmoji('⚙️').setStyle(ButtonStyle.Secondary)
    );

    return { content: player ? `<@${player.id}>` : undefined, embeds: [embed], components: [row1, row2] };
  }

  /**
   * Màn hình Thông tin cơ bản (Screenshot 3)
   */
  async buildInfoScreen(player) {
    let attachment = null;
    let files = [];
    const totems = db.getItemCount(player, 'totem_of_undying');
    const embed = new EmbedBuilder()
      .setColor(0x20222e)
      .setTitle(`👤 Hồ Sơ Nhân Vật: ${player.name} (Cấp ${player.level})`)
      .setDescription(
        `❤️ **Máu:** ${Math.round(player.hp)}/${player.maxHp} | 💧 **Mana:** ${Math.round(player.mana)}/${player.maxMana}\n` +
        `🪙 **Số dư:** ${player.coins} Xu | ⭐ **EXP:** ${player.exp}/${player.maxExp}\n` +
        `🗿 **Vật Tổ Bất Tử (Totem):** **${totems} cái** *(Tự động cứu sống khi tử vong)*`
      );

    try {
      const cardBuffer = await generateProfileCard(player);
      attachment = new AttachmentBuilder(cardBuffer, { name: 'profile.png' });
      files = [attachment];
      embed.setImage('attachment://profile.png');
    } catch (err) {
      console.error('[UIHelper] Lỗi vẽ ảnh thẻ nhân vật:', err);
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('info_skills').setLabel('Cấp Độ Kỹ Năng').setEmoji('🌟').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row], files };
  }

  /**
   * Màn hình Cấp độ kỹ năng
   */
  buildSkillsScreen(player) {
    const s = player.skills || {
      mining: { level: 1, exp: 0 },
      woodcutting: { level: 1, exp: 0 },
      combat: { level: 1, exp: 0 },
      farming: { level: 1, exp: 0 }
    };

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('🌟 Cấp Độ Kỹ Năng')
      .setDescription(
        `⛏️ **Khai Thác:** Cấp ${s.mining.level} (EXP: ${s.mining.exp}/100)\n` +
        `🪓 **Tiều Phu:** Cấp ${s.woodcutting.level} (EXP: ${s.woodcutting.exp}/100)\n` +
        `⚔️ **Chiến Đấu:** Cấp ${s.combat.level} (EXP: ${s.combat.exp}/100)\n` +
        `🌾 **Nông Nghiệp:** Cấp ${s.farming.level} (EXP: ${s.farming.exp}/100)\n\n` +
        `💡 *Kỹ năng càng cao sẽ giúp bạn thu hoạch nhiều tài nguyên hơn và gây nhiều sát thương hơn!*`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_info').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
  }

  /**
   * Màn hình Chi Tiết Chỉ Số & Điểm Tiềm Năng (Screenshot 4)
   */
  buildStatsScreen(player) {
    const atk = db.getTotalAttack(player);
    const def = db.getTotalDefense(player);
    const red = db.getDamageReduction(def);
    const dex = db.getDexterity(player);
    const swordAim = db.getSwordAim(player);
    const bowAim = db.getBowAim(player);
    const availablePoints = db.getAvailableStatPoints(player);
    const cost = db.getDexUpgradeCost(player);
    const totems = db.getItemCount(player, 'totem_of_undying');

    const embed = new EmbedBuilder()
      .setColor(0x232534)
      .setTitle('📊 Chi Tiết Chỉ Số & Điểm Tiềm Năng (Status)')
      .setDescription(
        `👤 **Người chơi:** <@${player.id}> (Cấp **${player.level}**)\n` +
        `⭐ **Điểm Tiềm Năng (Sao) khả dụng:** **${availablePoints} ⭐**\n\n` +
        `❤️ **Máu:** ${Math.round(player.hp)} / ${player.maxHp} (Gốc 40${player.pvpHpStolen ? ` +${player.pvpHpStolen} PvP` : ''}${player.customMaxHp ? ` [Admin set]` : ''})\n\n` +
        `⚔️ **Tấn công:** ${atk} (Gốc 1)\n\n` +
        `🛡️ **Phòng thủ:** ${def} (Gốc 0) (-${red}% sát thương)\n\n` +
        `🗿 **Vật Tổ Bất Tử (Totem):** **${totems} cái** *(Kháng tử vong, hồi sinh tại chỗ)*\n\n` +
        `🎯 **Độ Khéo Léo (Dexterity):** Cấp **${dex}/25**\n` +
        `• 🗡️ **Tỉ lệ trúng Kiếm / Cận chiến:** **${swordAim}%** *(Gốc 80% ➔ Tối đa 99%)*\n` +
        `• 🏹 **Tỉ lệ trúng Cung / Tầm xa:** **${bowAim}%** *(Gốc 70% ➔ Tối đa 93%)*\n` +
        (dex < 25
          ? `• 🌟 **Yêu cầu nâng Cấp ${dex + 1}:** **${cost} ⭐** *(Tăng +1 sao sau mỗi cấp)*\n\n`
          : `• ✨ **Trạng thái:** Đã đạt cấp độ Khéo Léo tối đa (MAX)!\n\n`) +
        `💡 *Độ khéo léo càng cao thì tỉ lệ đánh trúng mục tiêu càng cao, tránh bị Hụt đòn trong giao tranh! Mỗi cấp Khéo Léo yêu cầu tăng thêm 1 sao (1⭐, 2⭐, 3⭐...).*`
      );

    const row = new ActionRowBuilder();
    if (dex < 25) {
      if (availablePoints >= cost) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('stat_upgrade_dex')
            .setLabel(`Nâng Cấp ${dex + 1} (Tốn ${cost} ⭐)`)
            .setEmoji('🎯')
            .setStyle(ButtonStyle.Success)
        );
      } else {
        const needed = Math.max(1, cost - availablePoints);
        row.addComponents(
          new ButtonBuilder()
            .setCustomId('stat_spend_level_dex')
            .setLabel(`Dùng ${needed} Cấp Độ để Nâng (+1 DEX)`)
            .setEmoji('🔥')
            .setStyle(ButtonStyle.Primary)
        );
      }
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId('stat_dex_max')
          .setLabel('Khéo Léo Đã Tối Đa (25/25)')
          .setEmoji('✨')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }

    row.addComponents(
      new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
  }

  /**
   * Màn hình Túi Đồ (Screenshot 5)
   */
  buildInventoryScreen(player) {
    const usedSlots = db.getUsedSlots(player);
    const maxSlots = db.getMaxSlots(player);
    const totems = db.getItemCount(player, 'totem_of_undying');

    let itemsList = '';
    if (!player.inventory || player.inventory.length === 0) {
      itemsList = '*Túi đồ của bạn hiện đang trống.*';
    } else {
      itemsList = player.inventory
        .map(i => {
          const itemDef = config.ITEMS[i.itemId];
          const emoji = itemDef ? itemDef.emoji : '📦';
          const name = itemDef ? itemDef.name : i.itemId;
          const maxStack = db.getItemMaxStack(i.itemId, itemDef);
          const isSingle = maxStack === 1;
          const stacks = Math.ceil(i.count / maxStack);
          const stackStr = isSingle
            ? (i.count > 1 ? ` *(chiếm ${i.count} ô, 1 món/ô)*` : ` *(1 món/ô)*`)
            : (stacks > 1 ? ` *(${stacks} slot - 64/ô)*` : '');
          return `• x${i.count}  ${name}  ${emoji}${stackStr}`;
        })
        .join('\n');
    }

    const activeBuffs = db.formatEffectsString(player);
    const embed = new EmbedBuilder()
      .setColor(0x242638)
      .setTitle('🎒 Túi Đồ Cá Nhân (24 Ô)')
      .setDescription(
        (activeBuffs ? `✨ **Hiệu ứng thuốc đang hoạt động:** ${activeBuffs}\n\n` : '') +
        (totems > 0 ? `🗿 **Vật Tổ Bất Tử (Totem):** **${totems} cái** *(Chiếm ${totems} ô, tự cứu khi tử vong)*\n\n` : '') +
        `${itemsList}\n\n` +
        `📦 **Sức Chứa Túi Cá Nhân:** **${usedSlots}/24 Ô (Slot)** *(Trang bị/vũ khí/totem/bật lửa: 1 món/ô | Vật phẩm khác: 64 cái/ô)*\n` +
        `🏠 **Rương An Toàn Tại Nhà:** **${db.getHomeChestUsedSlots(player)}/${db.getHomeChestMaxSlots(player)} Ô** *(Bấm nút bên dưới để mở)*`
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('home_chest')
        .setLabel('Rương Nhà')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('inv_sell')
        .setLabel('Bán Đồ')
        .setEmoji('💰')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('inv_eat')
        .setLabel('Ăn Uống')
        .setEmoji('🍖')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_equipment').setLabel('Trang Bị').setEmoji('⚔️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('inv_discard').setLabel('Vứt Đồ').setEmoji('🗑️').setStyle(ButtonStyle.Danger)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('⬅️').setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row1, row2] };
  }

  /**
   * Màn hình Trang Bị (Screenshot 6)
   */
  buildEquipmentScreen(player) {
    const eq = player.equipment || {};

    const formatSlot = (itemId) => {
      if (!itemId) return '*Trống*';
      const itemDef = config.ITEMS[itemId];
      return itemDef ? `**${itemDef.name}** ${itemDef.emoji}` : itemId;
    };

    const embed = new EmbedBuilder()
      .setColor(0x242638)
      .setTitle('Trang Bị')
      .setDescription(
        `**Cúp:** ${formatSlot(eq.pickaxe)}\n\n` +
        `**Rìu:** ${formatSlot(eq.axe)}\n\n` +
        `**Kiếm:** ${formatSlot(eq.sword)}\n\n` +
        `**Cung:** ${formatSlot(eq.bow)}\n\n` +
        `**Mũ:** ${formatSlot(eq.helmet)}\n\n` +
        `**Áo:** ${formatSlot(eq.chestplate)}\n\n` +
        `**Quần:** ${formatSlot(eq.leggings)}\n\n` +
        `**Ủng:** ${formatSlot(eq.boots)}`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
  }

  /**
   * Màn hình Khu Vực (Screenshot 7 & User's Nether / The End)
   */
  buildAreasScreen(player) {
    const netherUnlocked = player.unlocked && player.unlocked.nether;
    const endUnlocked = player.unlocked && player.unlocked.the_end;

    const embed = new EmbedBuilder()
      .setColor(0x242638)
      .setTitle('🗺️ Các Khu Vực Thế Giới Minecraft')
      .setDescription(
        `🏠 **Nhà:** Nơi nghỉ ngơi an toàn, ngủ hồi phục máu\n\n` +
        `🪑 **Bàn Chế Tạo:** Rèn công cụ, vũ khí, áo giáp và bàn phù phép\n\n` +
        `🔥 **Lò Nung (Furnace):** Nung quặng sắt/vàng/đồng, quặng cổ đại, đá, nướng thịt (1 Than = 4 món)\n\n` +
        `🔮 **Bàn Phù Phép:** Cường hóa trang bị với Lapis Lazuli & EXP\n\n` +
        `🛒 **Sàn giao dịch** *(Yêu cầu cấp 2)*\n\n` +
        `🏦 **Ngân hàng** *(Yêu cầu cấp 2)*\n\n` +
        `⚖️ **Đấu giá** *(Yêu cầu cấp 6)*\n\n` +
        `🪵 **Rừng gỗ sồi:** Đốn gỗ theo tốc độ rìu\n\n` +
        `🪨 **Hang Đá:** Đào khoáng sản theo cấp cúp\n\n` +
        `🧟 **Hầm Ngục** *(Yêu cầu cấp 3)*\n\n` +
        `🌋 **Nether Địa Ngục** ${netherUnlocked ? '✅ *(Tự do ra vào miễn phí)*' : '🔒 *(Cần Cổng Nether)*'}\n\n` +
        `🌌 **The End Tận Cùng** ${endUnlocked ? '✅ *(Đã mở)*' : '🔒 *(Cần 12 Mắt Ender)*'}\n\n` +
        `🚶 **Đi Dạo Thám Hiểm:** Gặp công trình (5%-7%), hồ nước, hồ dung nham, quái vật & Boss`
      );

    // Hàng nút 1: Nhà, Bàn chế tạo, Lò nung, Bàn phù phép, Sàn giao dịch
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('area_home').setEmoji('🏠').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('area_crafting').setEmoji('🪑').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('area_furnace').setEmoji('🔥').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('area_enchant').setEmoji('🔮').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('area_shop').setEmoji('🛒').setStyle(ButtonStyle.Primary)
    );

    // Hàng nút 2: Ngân hàng, Đấu giá, Rừng gỗ sồi, Hang đá, Hầm ngục
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('area_bank').setEmoji('🏦').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('area_auction').setEmoji('⚖️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('area_forest').setEmoji('🪵').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('area_cave').setEmoji('🪨').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('area_dungeon').setEmoji('🧟').setStyle(ButtonStyle.Primary)
    );

    // Hàng nút 3: Nether, The End, Đi Dạo Thám Hiểm, Quay lại
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('area_nether').setEmoji('🌋').setStyle(netherUnlocked ? ButtonStyle.Danger : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('area_the_end').setEmoji('🌌').setStyle(endUnlocked ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('menu_explore').setLabel('Đi Dạo Thám Hiểm').setEmoji('🚶').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row1, row2, row3] };
  }

  /**
   * Màn hình Cài Đặt (Screenshot 8)
   */
  buildSettingsScreen(player) {
    const s = player.settings || { language: 'vi', durabilityAlert: true, dmNotify: false };

    const embed = new EmbedBuilder()
      .setColor(0x242638)
      .setTitle('Cài đặt')
      .setDescription(
        `Ngôn ngữ hiện tại: **${s.language === 'vi' ? 'Tiếng Việt' : 'English'}**\n\n` +
        `Thông báo hao độ bền giáp: **${s.durabilityAlert ? 'Bật' : 'Tắt'}**\n\n` +
        `Thông báo khớp lệnh qua DM: **${s.dmNotify ? 'Khớp hết' : 'Tắt'}**`
      );

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setting_lang').setLabel('Switch to English').setEmoji('🌐').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('setting_durability').setLabel('Thông báo hao độ bền giáp').setEmoji('🛡️').setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('setting_dm').setLabel('Thông báo khớp lệnh').setEmoji('🔔').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row1, row2] };
  }

  /**
   * Màn hình Rương An Toàn Tại Nhà (Home Chest)
   */
  buildHomeChestScreen(player) {
    const maxSlots = db.getHomeChestMaxSlots(player);
    const usedSlots = db.getHomeChestUsedSlots(player);
    const logCount = db.getItemCount(player, 'oak_log');

    let desc = `📦 **Sức Chứa Rương Tại Nhà:** **${usedSlots}/${maxSlots} Ô (Slot)**\n` +
      `🪵 Gỗ Sồi hiện có trong túi: **${logCount}/64** Block *(Dùng 64 Block Gỗ để nâng cấp **+8 Ô** rương vô hạn!)*\n` +
      `🔒 *Vật phẩm cất trong rương tại Nhà được bảo vệ an toàn 100%, không bao giờ bị rơi khi tử vong!*\n\n` +
      `📋 **DANH SÁCH VẬT PHẨM TRONG RƯƠNG:**\n`;

    if (!player.chest || player.chest.length === 0) {
      desc += `*(Rương tại nhà hiện đang trống)*\n`;
    } else {
      const itemsList = player.chest.map(i => {
        const def = config.ITEMS[i.itemId] || { name: i.itemId, emoji: '📦' };
        const maxStack = db.getItemMaxStack(i.itemId, def);
        const isSingle = maxStack === 1;
        const stacks = Math.ceil(i.count / maxStack);
        const stackStr = isSingle
          ? (i.count > 1 ? ` *(chiếm ${i.count} ô, 1 món/ô)*` : ` *(1 món/ô)*`)
          : (stacks > 1 ? ` *(${stacks} slot - 64/ô)*` : '');
        return `• ${def.emoji} **${def.name}**: x${i.count}${stackStr}`;
      }).join('\n');
      desc += itemsList + '\n';
    }

    if (maxSlots === 0) {
      desc += `\n⚠️ *Bạn chưa xây dựng rương tại nhà! Hãy bấm nút **[🔨 Xây Rương (+8 Ô)]** bên dưới (cần 64 Block Gỗ Sồi).*`;
    }

    const embed = new EmbedBuilder()
      .setColor(0xd97706)
      .setTitle('📦 RƯƠNG ĐỒ AN TOÀN TẠI NHÀ (HOME CHEST)')
      .setDescription(desc);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('home_chest_deposit')
        .setLabel('Cất Đồ Vào Rương')
        .setEmoji('📥')
        .setStyle(ButtonStyle.Success)
        .setDisabled(maxSlots === 0 || usedSlots >= maxSlots || !player.inventory || player.inventory.length === 0),
      new ButtonBuilder()
        .setCustomId('home_chest_withdraw')
        .setLabel('Lấy Đồ Ra Túi')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!player.chest || player.chest.length === 0),
      new ButtonBuilder()
        .setCustomId('home_chest_expand')
        .setLabel('Nâng Cấp (+8 Ô)')
        .setEmoji('🪵')
        .setStyle(logCount >= 64 ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('area_home')
        .setLabel('Về Nhà')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
  }

  /**
   * Màn hình chọn đồ cất vào Rương tại Nhà (Hỗ trợ danh mục, cất đồ đang mặc và phân trang)
   */
  buildHomeChestDepositScreen(player, category = 'gear', page = 0) {
    const inv = player.inventory || [];
    const eq = player.equipment || {};
    const { StringSelectMenuBuilder } = require('discord.js');

    const options = [];

    if (category === 'gear') {
      // 1. Thêm đồ đang trang bị trên người (Mũ, Áo, Quần, Giày, Cúp, Rìu, Kiếm, Cung, Khiên)
      const eqSlots = [
        { slot: 'pickaxe', name: 'Cúp' },
        { slot: 'axe', name: 'Rìu' },
        { slot: 'sword', name: 'Kiếm' },
        { slot: 'bow', name: 'Cung tên' },
        { slot: 'shield', name: 'Khiên' },
        { slot: 'helmet', name: 'Mũ giáp' },
        { slot: 'chestplate', name: 'Áo giáp / Cánh' },
        { slot: 'leggings', name: 'Quần giáp' },
        { slot: 'boots', name: 'Giày giáp' }
      ];

      for (const s of eqSlots) {
        const itemId = eq[s.slot];
        if (itemId) {
          const def = config.ITEMS[itemId] || { name: itemId, emoji: '⚔️' };
          options.push({
            label: `[Đang Mặc/Cầm] ${def.name}`,
            value: `equip_${s.slot}_${itemId}`,
            emoji: def.emoji || '⚔️',
            description: `Tháo khỏi người và cất thẳng vào rương`
          });
        }
      }

      // 2. Thêm đồ trang bị / vũ khí / unstackable trong túi cá nhân
      const gearInInv = inv.filter(i => {
        const def = config.ITEMS[i.itemId];
        return db.isUnstackableItem(i.itemId, def);
      });

      for (const i of gearInInv) {
        const def = config.ITEMS[i.itemId] || { name: i.itemId, emoji: '📦' };
        options.push({
          label: `${def.name} (Có: x${i.count})`,
          value: i.itemId,
          emoji: def.emoji || '📦',
          description: `Cất 1 món này từ túi vào rương`
        });
      }
    } else if (category === 'ores') {
      const oresInInv = inv.filter(i => {
        const lower = (i.itemId || '').toLowerCase();
        return lower.includes('ore') || lower.includes('ingot') || lower.includes('diamond') ||
               lower.includes('netherite') || lower.includes('gold') || lower.includes('iron') ||
               lower.includes('copper') || lower.includes('redstone') || lower.includes('lapis') ||
               lower.includes('quartz') || lower.includes('emerald') || lower.includes('debris') ||
               lower.includes('scrap') || lower.includes('block') || lower.includes('crystal') ||
               lower.includes('star') || lower.includes('pearl') || lower.includes('eye');
      });
      for (const i of oresInInv) {
        const def = config.ITEMS[i.itemId] || { name: i.itemId, emoji: '💎' };
        options.push({
          label: `${def.name} (Có: x${i.count})`,
          value: i.itemId,
          emoji: def.emoji || '💎',
          description: `Cất món này vào rương an toàn`
        });
      }
    } else if (category === 'books') {
      const booksInInv = inv.filter(i => (i.itemId || '').startsWith('book'));
      for (const i of booksInInv) {
        const def = config.ITEMS[i.itemId] || { name: i.itemId, emoji: '📖' };
        options.push({
          label: `${def.name} (Có: x${i.count})`,
          value: i.itemId,
          emoji: def.emoji || '📖',
          description: `Cất sách này vào rương an toàn`
        });
      }
    } else {
      // category === 'all'
      for (const i of inv) {
        const def = config.ITEMS[i.itemId] || { name: i.itemId, emoji: '📦' };
        options.push({
          label: `${def.name} (Có: x${i.count})`,
          value: i.itemId,
          emoji: def.emoji || '📦',
          description: `Cất món này vào rương an toàn`
        });
      }
    }

    // Phân trang 25 options mỗi trang
    const pageSize = 25;
    const totalPages = Math.max(1, Math.ceil(options.length / pageSize));
    const currentPage = Math.min(Math.max(0, page), totalPages - 1);
    const paginatedOptions = options.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const embed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('📥 CẤT VẬT PHẨM VÀO RƯƠNG TẠI NHÀ')
      .setDescription(
        `📦 **Sức chứa rương:** **${db.getHomeChestUsedSlots(player)}/${db.getHomeChestMaxSlots(player)} Ô**\n` +
        `Chọn danh mục bên dưới để tìm và cất món đồ bạn muốn cất:\n` +
        (category === 'gear' ? `• ⚔️ **Mục Cúp / Giáp / Cánh / Vũ Khí:** Hiển thị cả **đồ đang mặc trên người** và **đồ trong túi**!\n` : '') +
        (category === 'ores' ? `• 💎 **Mục Khoáng Sản & Quặng Quý**\n` : '') +
        (category === 'books' ? `• 📖 **Mục Sách Phù Phép**\n` : '') +
        (category === 'all' ? `• 📦 **Mục Tất Cả Vật Phẩm**\n` : '') +
        (totalPages > 1 ? `📄 Trang **${currentPage + 1}/${totalPages}** (${options.length} món)\n` : '') +
        (options.length === 0 ? `\n*(Không có vật phẩm nào trong danh mục này)*` : '')
      );

    const rows = [];
    if (paginatedOptions.length > 0) {
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('home_chest_dep_select')
          .setPlaceholder(`Chọn món đồ muốn cất (${paginatedOptions.length} món)...`)
          .addOptions(paginatedOptions)
      ));
    }

    // Hàng nút chọn danh mục
    const catRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('home_chest_dep_cat_gear')
        .setLabel('Cúp/Giáp/Cánh')
        .setEmoji('⚔️')
        .setStyle(category === 'gear' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('home_chest_dep_cat_ores')
        .setLabel('Khoáng Sản')
        .setEmoji('💎')
        .setStyle(category === 'ores' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('home_chest_dep_cat_books')
        .setLabel('Sách Phù Phép')
        .setEmoji('📖')
        .setStyle(category === 'books' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('home_chest_dep_cat_all')
        .setLabel('Tất Cả')
        .setEmoji('📦')
        .setStyle(category === 'all' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );
    rows.push(catRow);

    // Hàng nút điều hướng (Trang trước, Trang sau, Quay lại)
    const navRow = new ActionRowBuilder();
    if (totalPages > 1) {
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`home_chest_dep_page_${category}_${currentPage - 1}`)
          .setLabel('Trang trước')
          .setEmoji('⬅️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage <= 0),
        new ButtonBuilder()
          .setCustomId(`home_chest_dep_page_${category}_${currentPage + 1}`)
          .setLabel('Trang sau')
          .setEmoji('➡️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage >= totalPages - 1)
      );
    }
    navRow.addComponents(
      new ButtonBuilder().setCustomId('home_chest').setLabel('Quay lại Rương').setEmoji('🏠').setStyle(ButtonStyle.Secondary)
    );
    rows.push(navRow);

    return { content: `<@${player.id}>`, embeds: [embed], components: rows };
  }

  /**
   * Màn hình chọn đồ rút từ Rương về Túi cá nhân (Hỗ trợ danh mục và phân trang)
   */
  buildHomeChestWithdrawScreen(player, category = 'all', page = 0) {
    const chest = player.chest || [];
    const { StringSelectMenuBuilder } = require('discord.js');

    let filteredChest = chest;
    if (category === 'gear') {
      filteredChest = chest.filter(i => {
        const def = config.ITEMS[i.itemId];
        return db.isUnstackableItem(i.itemId, def);
      });
    } else if (category === 'ores') {
      filteredChest = chest.filter(i => {
        const lower = (i.itemId || '').toLowerCase();
        return lower.includes('ore') || lower.includes('ingot') || lower.includes('diamond') ||
               lower.includes('netherite') || lower.includes('gold') || lower.includes('iron') ||
               lower.includes('copper') || lower.includes('redstone') || lower.includes('lapis') ||
               lower.includes('quartz') || lower.includes('emerald') || lower.includes('debris') ||
               lower.includes('scrap') || lower.includes('block') || lower.includes('crystal') ||
               lower.includes('star') || lower.includes('pearl') || lower.includes('eye');
      });
    } else if (category === 'books') {
      filteredChest = chest.filter(i => (i.itemId || '').startsWith('book'));
    }

    const options = filteredChest.map(i => {
      const def = config.ITEMS[i.itemId] || { name: i.itemId, emoji: '📦' };
      const isUnstack = db.isUnstackableItem(i.itemId, def);
      return {
        label: `${def.name} (Có: x${i.count})`,
        value: i.itemId,
        emoji: def.emoji || '📦',
        description: isUnstack ? `Rút 1 món này về túi đồ` : `Rút món này về túi đồ`
      };
    });

    const pageSize = 25;
    const totalPages = Math.max(1, Math.ceil(options.length / pageSize));
    const currentPage = Math.min(Math.max(0, page), totalPages - 1);
    const paginatedOptions = options.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('📤 RÚT VẬT PHẨM TỪ RƯƠNG RA TÚI CÁ NHÂN')
      .setDescription(
        `📦 **Sức chứa rương:** **${db.getHomeChestUsedSlots(player)}/${db.getHomeChestMaxSlots(player)} Ô**\n` +
        `🎒 **Túi cá nhân:** **${db.getUsedSlots(player)}/24 Ô**\n` +
        `Chọn danh mục bên dưới để lọc món đồ cần rút:\n` +
        (totalPages > 1 ? `📄 Trang **${currentPage + 1}/${totalPages}** (${options.length} món)\n` : '') +
        (options.length === 0 ? `\n*(Rương không có vật phẩm nào trong mục này)*` : '')
      );

    const rows = [];
    if (paginatedOptions.length > 0) {
      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('home_chest_wit_select')
          .setPlaceholder(`Chọn món đồ muốn rút (${paginatedOptions.length} món)...`)
          .addOptions(paginatedOptions)
      ));
    }

    const catRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('home_chest_wit_cat_gear')
        .setLabel('Cúp/Giáp/Cánh')
        .setEmoji('⚔️')
        .setStyle(category === 'gear' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('home_chest_wit_cat_ores')
        .setLabel('Khoáng Sản')
        .setEmoji('💎')
        .setStyle(category === 'ores' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('home_chest_wit_cat_books')
        .setLabel('Sách Phù Phép')
        .setEmoji('📖')
        .setStyle(category === 'books' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('home_chest_wit_cat_all')
        .setLabel('Tất Cả')
        .setEmoji('📦')
        .setStyle(category === 'all' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );
    rows.push(catRow);

    const navRow = new ActionRowBuilder();
    if (totalPages > 1) {
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`home_chest_wit_page_${category}_${currentPage - 1}`)
          .setLabel('Trang trước')
          .setEmoji('⬅️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage <= 0),
        new ButtonBuilder()
          .setCustomId(`home_chest_wit_page_${category}_${currentPage + 1}`)
          .setLabel('Trang sau')
          .setEmoji('➡️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage >= totalPages - 1)
      );
    }
    navRow.addComponents(
      new ButtonBuilder().setCustomId('home_chest').setLabel('Quay lại Rương').setEmoji('🏠').setStyle(ButtonStyle.Secondary)
    );
    rows.push(navRow);

    return { content: `<@${player.id}>`, embeds: [embed], components: rows };
  }

  /**
   * Màn hình Ghép 2 Vũ Khí / Giáp cùng loại thành 1
   */
  buildCombineScreen(player) {
    const slots = ['sword', 'axe', 'pickaxe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'];
    const combinable = [];
    for (const slot of slots) {
      const eqId = player.equipment && player.equipment[slot];
      if (eqId && db.hasItem(player, eqId, 1)) {
        const def = config.ITEMS[eqId];
        const dur = db.getDurability(player, slot);
        combinable.push({ slot, id: eqId, name: def.name, emoji: def.emoji, dur });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🔨 GHÉP & SỬA CHỮA 2 VŨ KHÍ / TRANG BỊ CÙNG LOẠI')
      .setDescription(
        `💡 *Cơ chế chuẩn Minecraft: Khi bạn đang trang bị 1 món đồ và có thêm 1 món cùng loại trong túi, bạn có thể ghép chúng lại thành 1!\n` +
        `• Độ bền của 2 món sẽ được CỘNG DỒN (+ thưởng thêm 5% độ bền tối đa)!\n` +
        `• Hạn chế tối đa việc vũ khí/áo giáp bị vỡ trong lúc chiến đấu!*\n\n` +
        (combinable.length > 0
          ? `**Chọn trang bị bên dưới để ghép và phục hồi độ bền:**`
          : `❌ *Hiện tại bạn không có cặp trang bị nào cùng loại (1 đang trang bị + 1 trong túi) để ghép! Hãy rèn hoặc mua thêm 1 món giống món đang mặc để ghép.*`)
      );

    const rows = [];
    if (combinable.length > 0) {
      const { StringSelectMenuBuilder } = require('discord.js');
      const options = combinable.map(c => ({
        label: `${c.name} (${c.slot})`,
        value: `combine_${c.slot}_${c.id}`,
        emoji: c.emoji || '🔨',
        description: `Độ bền hiện tại: ${c.dur ? `${c.dur.current}/${c.dur.max}` : 'Đầy'}`
      }));

      rows.push(new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('combine_select')
          .setPlaceholder('Chọn trang bị muốn ghép và sửa chữa...')
          .addOptions(options)
      ));
    }

    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_equipment').setLabel('Về Trang Bị').setEmoji('⚔️').setStyle(ButtonStyle.Secondary)
    ));

    return { content: `<@${player.id}>`, embeds: [embed], components: rows };
  }

  /**
   * Màn hình Trang Bị Nhân Vật
   */
  buildEquipmentScreen(player) {
    const eq = player.equipment || {};
    const enchants = player.enchants || {};

    const formatSlot = (slotKey, label) => {
      const itemId = eq[slotKey];
      if (!itemId) return `• ${label}: *(Trống)*`;
      const def = config.ITEMS[itemId] || { name: itemId, emoji: '📦' };
      let enchText = '';
      if (enchants[slotKey]) {
        const enchList = Object.entries(enchants[slotKey]).map(([eId, lvl]) => `${eId} ${lvl}`).join(', ');
        if (enchList) enchText = ` ✨ [${enchList}]`;
      }
      let durText = '';
      const dur = db.getDurability(player, slotKey);
      if (dur) {
        const icon = dur.percent > 50 ? '🟢' : (dur.percent > 20 ? '🟡' : '🔴');
        durText = ` - 🔧 Độ bền: **${dur.current}/${dur.max}** ${icon}`;
      }
      return `• ${label}: ${def.emoji} **${def.name}**${enchText}${durText}`;
    };

    const atk = db.getTotalAttack(player);
    const def = db.getTotalDefense(player);
    const red = db.getDamageReduction(def);
    const maxHp = db.getMaxHp(player);
    const hasBeacon = db.hasItem(player, 'beacon');

    const embed = new EmbedBuilder()
      .setColor(0x8b5cf6)
      .setTitle(`⚔️ TRANG BỊ CỦA ${player.name.toUpperCase()}`)
      .setDescription(
        `📊 **Tổng Chỉ Số Chiến Đấu:**\n` +
        `• ⚔️ **Sát thương Tấn công:** **${atk}**\n` +
        `• 🛡️ **Điểm Giáp Phòng thủ:** **${def}** *(Giảm ${red}% sát thương)*\n` +
        `• ❤️ **Máu Tối Đa:** **${maxHp} HP**\n` +
        (hasBeacon ? `• 🗼 **Hào Quang Hải Đăng (Beacon):** +2 Công, +2 Thủ, +5 HP, +25% May Mắn!\n` : '') +
        (db.formatEffectsString(player) ? `• ✨ **Hiệu Ứng Thuốc:** ${db.formatEffectsString(player)}\n\n` : '\n') +
        `🗡️ **VŨ KHÍ & CÔNG CỤ:**\n` +
        formatSlot('sword', 'Vũ khí chính') + '\n' +
        formatSlot('pickaxe', 'Cúp đào mỏ') + '\n' +
        formatSlot('axe', 'Rìu tiều phu') + '\n' +
        formatSlot('bow', 'Cung tên') + '\n' +
        formatSlot('shield', 'Khiên đỡ đòn') + '\n\n' +
        `🛡️ **BỘ GIÁP BẢO HỘ:**\n` +
        formatSlot('helmet', 'Mũ giáp') + '\n' +
        formatSlot('chestplate', 'Áo giáp / Elytra') + '\n' +
        formatSlot('leggings', 'Quần giáp') + '\n' +
        formatSlot('boots', 'Ủng giáp') + '\n\n' +
        `💡 *Dùng nút "Ghép & Sửa Đồ" bên dưới để gộp 2 món cùng loại phục hồi độ bền, hoặc dùng lệnh \`/equip\` / \`/unequip\`.*`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('menu_combine').setLabel('Ghép & Sửa Đồ').setEmoji('🔨').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('equip_fast_action').setLabel('Mặc Đồ (/equip)').setEmoji('🛡️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('unequip_fast_action').setLabel('Tháo Đồ (/unequip)').setEmoji('🥋').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('menu_back').setLabel('Quay lại').setEmoji('📦').setStyle(ButtonStyle.Secondary)
    );

    return { content: `<@${player.id}>`, embeds: [embed], components: [row] };
  }
}

module.exports = new UIHelper();
