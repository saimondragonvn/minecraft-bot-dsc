const db = require('../database/db');
const config = require('../config');
const miningSystem = require('./miningSystem');
const mobSystem = require('./mobSystem');
const combatSystem = require('./combatSystem');
const { EmbedBuilder } = require('discord.js');
const imageHelper = require('../utils/imageHelper');

class DimensionSystem {
  /**
   * Kiểm tra điều kiện và mở khóa Cổng Nether
   * Đủ 10 Hắc diện thạch + 1 Bật lửa -> Mở khóa và tự do ra vào MIỄN PHÍ vĩnh viễn!
   */
  unlockNether(player) {
    if (player.unlocked && player.unlocked.nether) {
      return { success: false, message: 'Bạn đã kích hoạt Cổng Nether từ trước rồi! Bạn có thể tự do ra vào Địa Ngục hoàn toàn MIỄN PHÍ.' };
    }

    const hasObsidian = db.hasItem(player, 'obsidian', 10);
    const hasFlint = db.hasItem(player, 'flint_and_steel', 1);

    if (!hasObsidian || !hasFlint) {
      return {
        success: false,
        message: `❌ **Chưa đủ điều kiện xây Cổng Nether!**\nBạn cần:\n• ⬛ Hắc diện thạch: ${db.getItemCount(player, 'obsidian')}/10\n• 🔥 Bật lửa: ${db.getItemCount(player, 'flint_and_steel')}/1\n\n*(Mẹo: Hãy dùng 3 Thỏi sắt chế Xô sắt, đi dạo gặp Hồ Nước và Hồ Dung Nham để múc, sau đó dùng bàn chế tạo đúc Hắc diện thạch!)*`
      };
    }

    // Tiêu thụ nguyên liệu xây cổng
    db.removeItem(player, 'obsidian', 10);
    if (!player.unlocked) player.unlocked = {};
    player.unlocked.nether = true;
    db.addExp(player, 100);
    db.saveData();

    return {
      success: true,
      message: `🌋 **CHÚC MỪNG! BẠN ĐÃ MỞ KHÓA CỔNG NETHER THÀNH CÔNG!**\nKhung obsidian bốc lên ngọn lửa tím ma mị!\nTừ giờ bạn đã chính thức mở khóa và được **TỰ DO RA VÀO ĐỊA NGỤC HOÀN TOÀN MIỄN PHÍ** bất cứ lúc nào!`
    };
  }

  /**
   * Kiểm tra điều kiện và kích hoạt Cổng The End
   */
  unlockTheEnd(player) {
    if (player.unlocked && player.unlocked.the_end) {
      return { success: false, message: 'Bạn đã kích hoạt Cổng The End từ trước rồi!' };
    }

    const hasEye = db.hasItem(player, 'eye_of_ender', 12);
    if (!hasEye) {
      return {
        success: false,
        message: `❌ **Chưa đủ điều kiện mở Cổng The End!**\nBạn cần đủ **12 Mắt Ender** để lấp đầy khung cổng!\nHiện có: ${db.getItemCount(player, 'eye_of_ender')}/12\n*(Gợi ý: Chế tạo Mắt Ender bằng Bột lửa Blaze + Ngọc Ender Pearl tại Bàn Chế Tạo)*`
      };
    }

    // Tiêu thụ 12 mắt ender
    db.removeItem(player, 'eye_of_ender', 12);
    if (!player.unlocked) player.unlocked = {};
    player.unlocked.the_end = true;
    db.addExp(player, 300);
    db.saveData();

    return {
      success: true,
      message: `🌌 **CHÚC MỪNG! BẠN ĐÃ MỞ CỔNG THE END THÀNH CÔNG!**\n12 con mắt Ender phát sáng rực rỡ, hồ nước đen sâu thẳm xuất hiện! Hãy trang bị giáp kim cương/netherite và cung tên để đối đầu với Rồng Ender!`
    };
  }

  /**
   * Khai thác tài nguyên ở Nether (Ủy thác qua miningSystem)
   * Tỉ lệ: Netherrack 1:1.2, Quartz 1:7, Ancient Debris 1:130 (Cần cúp Kim Cương+)
   */
  mineNether(player) {
    return miningSystem.mineNether(player);
  }

  /**
   * Khám phá công trình Nether (Nether Fortress, Bastion Remnant, Nether Fossil)
   */
  async exploreNetherStructure(interaction, player) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

    if (!player.unlocked || !player.unlocked.nether) {
      const msg = '❌ Bạn chưa mở khóa Cổng Nether! Hãy thu thập đủ 10 Hắc diện thạch + 1 Bật lửa để kích hoạt cổng trước.';
      return interaction.deferred || interaction.replied ? interaction.editReply({ content: msg, components: [] }) : interaction.reply({ content: msg, ephemeral: true });
    }

    // Cooldown 20s cho mỗi lần thám hiểm Nether
    const now = Date.now();
    const lastExplore = player.lastNetherExplore || 0;
    if (now - lastExplore < 20000) {
      const wait = ((20000 - (now - lastExplore)) / 1000).toFixed(1);
      return interaction.reply({
        content: `<@${player.id}> ⏳ **Bạn đang nghỉ chân!** Vui lòng chờ thêm **${wait}s** nữa để tiếp tục thám hiểm Nether.\n*(Thời gian hồi giữa các lần thám hiểm Nether là **20s**/lần)*`,
        ephemeral: true
      });
    }

    // Kiểm tra kho đồ đầy
    const usedSlots = db.getUsedSlots(player);
    const maxSlots = db.getMaxSlots(player);
    if (usedSlots >= maxSlots) {
      return interaction.reply({
        content: `<@${player.id}> ❌ **Kho đồ của bạn đã chật kín (${usedSlots}/${maxSlots} Slot)!**\nVui lòng dọn bớt kho hoặc chế thêm **Rương Mở Rộng (+24 Slot)** (tốn 64 Block Gỗ 🪵) trước khi đi thám hiểm!`,
        ephemeral: true
      });
    }

    player.lastNetherExplore = now;

    // Tỉ lệ ra công trình Nether là 1:50 (2%)
    // Nếu không ra gì (49/50 lần)
    if (Math.random() >= (1 / 50)) {
      db.addExp(player, 5);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0x57534e)
        .setTitle('🌋 Thám Hiểm Địa Ngục Nether')
        .setDescription(
          `Bạn đã đi một quãng đường nhưng không tìm thấy gì ngoài những vách đá Netherrack cằn cỗi và dung nham sôi sục...\n\n` +
          `• ⭐ **+5 EXP** an ủi\n\n` +
          `*(Hãy kiên nhẫn tiếp tục thám hiểm sau 20s!)*`
        )
        .setFooter({ text: 'Thời gian hồi: 20 giây' });

      const files = imageHelper.attachWorkImage(embed, 'nether');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nether_structures').setLabel('Thám Hiểm Tiếp (20s)').setEmoji('🌋').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('area_nether').setLabel('Quay lại Cổng Nether').setEmoji('🧱').setStyle(ButtonStyle.Secondary)
      );

      return interaction.deferred || interaction.replied ? interaction.editReply({ embeds: [embed], components: [row], files }) : interaction.reply({ embeds: [embed], components: [row], files });
    }

    // TRÚNG TỈ LỆ 1:50 RA CÔNG TRÌNH!
    // 50% Pháo Đài Fortress / 50% Phế Tích Bastion
    const isFortress = Math.random() < 0.5;

    // 1. Pháo Đài Địa Ngục (Nether Fortress) - MỚI CÓ QUE QUỶ LỬA (BLAZE ROD)!
    if (isFortress) {
      if (Math.random() < 0.4) {
        const mobId = Math.random() < 0.5 ? 'blaze' : 'wither_skeleton';
        const mob = mobSystem.createMobInstance(mobId);
        return combatSystem.startCombat(interaction, player, mob);
      }

      const blazeRods = Math.floor(2 + Math.random() * 4); // 2 - 5 que quỷ lửa
      const netherWarts = Math.floor(3 + Math.random() * 5);
      const goldIngots = Math.floor(3 + Math.random() * 6);
      const hasSkull = Math.random() < (1 / 100);
      const hasDiamond = Math.random() < 0.3;

      db.addItem(player, 'blaze_rod', blazeRods);
      db.addItem(player, 'nether_wart', netherWarts);
      db.addItem(player, 'gold_ingot', goldIngots);
      if (hasSkull) db.addItem(player, 'wither_skeleton_skull', 1);
      if (hasDiamond) db.addItem(player, 'diamond', 2);
      db.addExp(player, 120);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0xb91c1c)
        .setTitle('🏰 BẠN ĐÃ TÌM THẤY PHÁO ĐÀI ĐỊA NGỤC (NETHER FORTRESS)!')
        .setDescription(
          `Cây cầu gạch đá đỏ sẫm vắt ngang qua những biển dung nham cuồn cuộn khói lửa!\n` +
          `Bạn khéo léo né tránh lũ Quỷ Lửa và cướp lấy Rương Báu Pháo Đài:\n\n` +
          `• 🔥 **x${blazeRods} QUE LỬA BLAZE ROD (Nguyên liệu chế Mắt Ender & Độc Quyền Pháo Đài)!**\n` +
          `• 🍄 x${netherWarts} Bướu Nether (Nether Wart)\n` +
          `• 🥇 x${goldIngots} Thỏi vàng\n` +
          (hasSkull ? `• 💀 **x1 Đầu Wither Skeleton (Nguyên liệu triệu hồi Boss Wither)!**\n` : '') +
          (hasDiamond ? `• 💎 **x2 Kim cương sáng chói!**\n` : '') +
          `• ⭐ **+120 EXP CỰC LỚN!**`
        )
        .setFooter({ text: 'Thời gian hồi: 20 giây' });

      const files = imageHelper.attachWorkImage(embed, 'nether');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('nether_structures').setLabel('Thám Hiểm Tiếp (20s)').setEmoji('🌋').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('area_nether').setLabel('Quay lại Cổng Nether').setEmoji('🧱').setStyle(ButtonStyle.Secondary)
      );

      return interaction.deferred || interaction.replied ? interaction.editReply({ embeds: [embed], components: [row], files }) : interaction.reply({ embeds: [embed], components: [row], files });
    }

    // 2. Phế Tích Bastion (Bastion Remnant) - CÓ VÀNG & SÁCH PHÙ PHÉP TĂNG SỨC MẠNH VŨ KHÍ!
    if (Math.random() < 0.4) {
      const mob = mobSystem.createMobInstance('piglin_brute');
      return combatSystem.startCombat(interaction, player, mob);
    }

    const goldBlocks = Math.floor(2 + Math.random() * 3); // 2-4 khối vàng
    const goldIngots = Math.floor(6 + Math.random() * 10);
    const bookPool = ['book_sharpness', 'book_efficiency', 'book_protection', 'book_power', 'book_unbreaking'];
    const randomBookId = bookPool[Math.floor(Math.random() * bookPool.length)];
    const bookDef = config.ITEMS[randomBookId] || { name: 'Sách Phù Phép', emoji: '📖' };

    db.addItem(player, 'gold_block', goldBlocks);
    db.addItem(player, 'gold_ingot', goldIngots);
    db.addItem(player, randomBookId, 1);

    const hasDebris = Math.random() < 0.4;
    const hasDisc = Math.random() < 0.25;
    if (hasDebris) db.addItem(player, 'ancient_debris', 1);
    if (hasDisc) db.addItem(player, 'music_disc_pigstep', 1);

    db.addExp(player, 150);
    db.saveData();

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🏛️ BẠN ĐỘT NHẬP PHẾ TÍCH BASTION REMNANT!')
      .setDescription(
        `Thành trì đá đen nguy nga của tộc Piglin ẩn giấu kho tàng hoàng kim vô giá!\n` +
        `Bạn đột kích vào trung tâm kho báu và thu hoạch được chiến lợi phẩm siêu hiếm:\n\n` +
        `• 🥇 **x${goldBlocks} KHỐI VÀNG (Gold Block) Khổng Lồ!**\n` +
        `• 🥇 x${goldIngots} Thỏi vàng nguyên chất\n` +
        `• ${bookDef.emoji} **x1 ${bookDef.name}** *(Sách phù phép tăng cực đại sức mạnh kiếm/cúp/vũ khí!)*\n` +
        (hasDebris ? `• 🧱 **x1 MẢNH VỠ CỔ ĐẠI (ANCIENT DEBRIS) SIÊU HIẾM!**\n` : '') +
        (hasDisc ? `• 💿 **x1 Đĩa nhạc Pigstep huyền thoại!**\n` : '') +
        `• ⭐ **+150 EXP KHỦNG!**`
      )
      .setFooter({ text: 'Thời gian hồi: 20 giây' });

    const files = imageHelper.attachWorkImage(embed, 'nether');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('nether_structures').setLabel('Thám Hiểm Tiếp (20s)').setEmoji('🌋').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('area_nether').setLabel('Quay lại Cổng Nether').setEmoji('🧱').setStyle(ButtonStyle.Secondary)
    );

    return interaction.deferred || interaction.replied ? interaction.editReply({ embeds: [embed], components: [row], files }) : interaction.reply({ embeds: [embed], components: [row], files });
  }

  /**
   * Triệu hồi Boss Wither 3 Đầu
   * Yêu cầu: 3 Đầu Wither Skeleton (tỉ lệ rơi từ quái Wither Skeleton ở Nether là 1:100)
   */
  async summonWither(interaction, player) {
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

    if (!player.unlocked || !player.unlocked.nether) {
      const msg = '❌ Bạn chưa mở khóa Cổng Nether! Hãy kích hoạt Cổng Nether trước khi triệu hồi Boss Wither.';
      return interaction.deferred || interaction.replied
        ? interaction.editReply({ content: msg, components: [] })
        : interaction.reply({ content: msg, ephemeral: true });
    }

    const skullCount = db.getItemCount(player, 'wither_skeleton_skull');
    if (skullCount < 3) {
      const embed = new EmbedBuilder()
        .setColor(0x1f2937)
        .setTitle('💀 TRIỆU HỒI TRÙM WITHER 3 ĐẦU')
        .setDescription(
          `❌ **Bạn chưa đủ nguyên liệu để triệu hồi Wither!**\n\n` +
          `Để triệu hồi Trùm Wither 3 Đầu hùng mạnh, bạn bắt buộc phải có:\n` +
          `• 💀 **Đầu Wither Skeleton (Wither Skull):** **${skullCount}/3**\n\n` +
          `⚔️ **Cách thu thập Đầu Wither Skeleton:**\n` +
          `• Đến Địa Ngục Nether (\`/menu\` -> Nether -> Săn Quái Nether)\n` +
          `• Hoặc thám hiểm Pháo Đài Địa Ngục (Nether Fortress)\n` +
          `• Tiêu diệt quái **Wither Skeleton** trong pháo đài Nether để thu thập Đầu!\n\n` +
          `💡 Khi tích lũy đủ 3 Đầu Wither Skeleton, hãy quay lại đây để triệu hồi Trùm Wither và đoạt lấy **Sao Địa Ngục (Nether Star)**!`
        );

      const files = imageHelper.attachWorkImage(embed, 'wither');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('area_nether').setLabel('Quay lại Cổng Nether').setEmoji('🌋').setStyle(ButtonStyle.Secondary)
      );

      return interaction.deferred || interaction.replied
        ? interaction.editReply({ content: `<@${player.id}>`, embeds: [embed], components: [row], files })
        : interaction.reply({ content: `<@${player.id}>`, embeds: [embed], components: [row], files });
    }

    // Đủ 3 Đầu Wither Skeleton -> Tiêu hao và triệu hồi Boss Wither
    db.removeItem(player, 'wither_skeleton_skull', 3);
    db.saveData();

    const wither = mobSystem.createMobInstance('wither_boss');
    return combatSystem.startCombat(interaction, player, wither);
  }
}

module.exports = new DimensionSystem();
