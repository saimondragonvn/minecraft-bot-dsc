const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const config = require('../config');
const mobSystem = require('./mobSystem');
const combatSystem = require('./combatSystem');
const deathSystem = require('./deathSystem');
const timeSystem = require('./timeSystem');
const imageHelper = require('../utils/imageHelper');

class ExplorationSystem {
  /**
   * Tỉ lệ 1:15 rơi Sách Phù Phép khi loot rương công trình hoặc rương kho báu
   */
  rollBookLoot(player) {
    const luckEff = db.hasEffect(player, 'luck');
    const bookChance = (1 / 15) * (luckEff ? 2 : 1);
    if (Math.random() < bookChance) {
      const bookPool = ['book_sharpness', 'book_protection', 'book_efficiency', 'book_power', 'book_unbreaking'];
      const chosenBook = bookPool[Math.floor(Math.random() * bookPool.length)];
      db.addItem(player, chosenBook, 1);
      const bookDef = config.ITEMS[chosenBook] || { name: 'Sách Phù Phép', emoji: '📖' };
      return `\n• ✨ ${bookDef.emoji} **x1 ${bookDef.name}** *(Sách Phù Phép rơi từ Rương công trình!${luckEff ? ' 🍀 May Mắn x2' : ''})*`;
    }
    return '';
  }

  /**
   * Thực hiện chuyến đi dạo / thám hiểm thế giới Minecraft
   * @param {Object} interaction - Discord interaction
   * @param {Object} player - Đối tượng người chơi
   * @param {string|null} forceMode - 'fly' hoặc 'walk'
   */
  async explore(interaction, player, forceMode = null) {
    if (player.hp <= 3) {
      const err = '❌ Máu của bạn quá thấp (<= 3 HP)! Hãy về Nhà ngủ `/sleep` hoặc ăn thức ăn hồi máu trước khi đi dạo kẻo gặp nạn.';
      return interaction.deferred || interaction.replied ? interaction.editReply({ content: err, components: [] }) : interaction.reply({ content: err, ephemeral: true });
    }

    const hasElytra = (player.equipment && player.equipment.chestplate === 'elytra') || db.hasItem(player, 'elytra');
    const hasFirework = db.hasItem(player, 'firework_rocket');
    const canFly = hasElytra && hasFirework;

    // Nếu người chơi chỉ định rõ chế độ
    if (forceMode === 'fly') {
      if (!canFly) {
        const msg = '❌ Bạn cần có **Cánh Cứng Elytra** (mặc hoặc trong túi) và ít nhất **1 Quả Pháo Hoa (Firework Rocket)** để có thể bay!';
        return interaction.deferred || interaction.replied ? interaction.editReply({ content: msg, components: [] }) : interaction.reply({ content: msg, ephemeral: true });
      }
      return this.performFlight(interaction, player);
    }

    if (forceMode === 'walk') {
      return this.performWalk(interaction, player);
    }

    // Nếu người chơi ĐỦ ĐIỀU KIỆN BAY và chưa chọn mode: Hiển thị giao diện lựa chọn Bay hoặc Đi Bộ
    if (canFly) {
      const now = Date.now();
      const lastFlight = player.lastFlight || 0;
      const flyCooldownMs = 5000;
      const onFlyCooldown = (now - lastFlight < flyCooldownMs);
      const waitSec = onFlyCooldown ? ((flyCooldownMs - (now - lastFlight)) / 1000).toFixed(1) : 0;

      const flyCount = db.getItemCount(player, 'firework_rocket');
      const embed = new EmbedBuilder()
        .setColor(0x38bdf8)
        .setTitle('🧭 CHỌN PHƯƠNG THỨC THÁM HIỂM THẾ GIỚI')
        .setDescription(
          `Bạn đang sở hữu **Cánh Cứng Elytra 🪽** và **${flyCount} Pháo Hoa 🚀**!\n\n` +
          `Hãy chọn cách bạn muốn khám phá thế giới Minecraft:\n\n` +
          `🚀 **Bay Bằng Cánh Cứng & Pháo Hoa (Khuyên Dùng):**\n` +
          `• Bay lướt trên tầng mây an toàn, không bị quái vật quấy rầy!\n` +
          `• Dễ dàng quan sát và tiếp cận các công trình vĩ đại từ trên cao!\n` +
          `• Hồi chiêu: **5 giây/lần cất cánh**.\n` +
          `• Tiêu hao: **1 Pháo hoa** mỗi lần cất cánh.\n\n` +
          `🚶 **Đi Bộ Dưới Mặt Đất:**\n` +
          `• Thám hiểm bộ hành truyền thống băng qua các quần xã sinh vật\n` +
          `• Khám phá các công trình cổ đại bí ẩn, thu thập rương báu\n` +
          `• Chạm trán các quái vật hoang dã hoặc Boss ngầm trên đường đi.`
        );

      const flyBtn = new ButtonBuilder()
        .setCustomId('explore_choose_fly')
        .setLabel(onFlyCooldown ? `Cánh Đang Nghỉ (${waitSec}s)` : 'Bay Bằng Cánh Cứng (-1 Pháo Hoa)')
        .setEmoji('🚀')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(
        flyBtn,
        new ButtonBuilder().setCustomId('explore_choose_walk').setLabel('Đi Bộ Dưới Đất (10s)').setEmoji('🚶').setStyle(ButtonStyle.Secondary)
      );

      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
      } else {
        return interaction.reply({ content: `<@${player.id}>`, embeds: [embed], components: [row], ephemeral: true });
      }
    }

    // Nếu không đủ điều kiện bay: Đi bộ thông thường
    return this.performWalk(interaction, player);
  }

  /**
   * CHẾ ĐỘ BAY: Cánh Cứng Elytra + Pháo Hoa
   * - Hồi chiêu 5s mỗi lần bay khi dùng cánh
   * - 100% không gặp Mobs nguy hiểm
   * - 7% tìm thấy Công trình (có thông báo thế giới công khai)
   * - 10% (1:10) tìm thấy Hồ Nước
   * - 6.67% (1:15) tìm thấy Hồ Dung Nham
   * - 1:150 (~0.67%) tìm thấy Rương kho báu bí ẩn
   * - Còn lại là lướt gió êm đềm (hiện 1 dòng tại tin nhắn riêng)
   */
  async performFlight(interaction, player) {
    const now = Date.now();
    const lastFlight = player.lastFlight || 0;
    const cooldownMs = 5000; // 5s giới hạn thời gian bay

    if (now - lastFlight < cooldownMs) {
      const wait = ((cooldownMs - (now - lastFlight)) / 1000).toFixed(1);
      const content = `<@${player.id}> ⏳ **Cánh Cứng đang nghỉ!** Vui lòng đợi thêm **${wait}s** nữa để cất cánh tiếp (Giới hạn bay 5s/lần).`;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('explore_choose_fly').setLabel(`Bay Tiếp (${wait}s)`).setEmoji('🚀').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('explore_choose_walk').setLabel('Đáp Xuống Đi Bộ').setEmoji('🚶').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      if (interaction.update && !interaction.replied) {
        return interaction.update({ content, embeds: [], components: [row] });
      } else if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content, embeds: [], components: [row] });
      } else {
        return interaction.reply({ content, embeds: [], components: [row], ephemeral: true });
      }
    }

    const fireworkCount = db.getItemCount(player, 'firework_rocket');
    if (fireworkCount <= 0) {
      const content = `<@${player.id}> ❌ Bạn đã hết Pháo Hoa để bay! Hãy chế tạo thêm bằng Giấy + Thuốc Súng tại Bàn Chế Tạo \`/craft\`.`;
      if (interaction.update && !interaction.replied) {
        return interaction.update({ content, embeds: [], components: [] });
      } else if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content, embeds: [], components: [] });
      } else {
        return interaction.reply({ content, embeds: [], components: [], ephemeral: true });
      }
    }

    player.lastFlight = now;
    db.removeItem(player, 'firework_rocket', 1);
    db.addExp(player, 50);
    db.saveData();

    const roll = Math.random() * 100;
    if (roll < 2.5) {
      // 2.5% ra công trình khi bay (báo công khai toàn server, đã giảm tỉ lệ theo yêu cầu)
      return this.handleStructureEvent(interaction, player, true);
    } else if (roll < 12.5) {
      // 10% (1:10) Hồ Nước
      return this.handleWaterLakeEvent(interaction, player, true);
    } else if (roll < 19.17) {
      // 6.67% (1:15) Hồ Dung Nham
      return this.handleLavaPoolEvent(interaction, player, true);
    } else if (roll < 19.84) {
      // 1:150 (~0.67%) Rương báu bí ẩn
      return this.handleChestEvent(interaction, player, true);
    } else {
      // Cảnh quan bay lượn ngắm mây trời yên bình (1 dòng ngắn gọn riêng cho người đó)
      return this.handlePeacefulEvent(interaction, player, true);
    }
  }

  /**
   * CHẾ ĐỘ ĐI BỘ: Thám hiểm mặt đất truyền thống
   * - Hồi chiêu 10s mỗi lần đi dạo
   * - 1.5% ra công trình (giảm tỉ lệ theo yêu cầu)
   * - 10% (1:10) Hồ Nước
   * - 6.67% (1:15) Hồ Dung Nham
   * - 1:150 (~0.67%) Rương kho báu bí ẩn
   * - 30% Chạm trán Quái vật / Boss
   * - Còn lại là cảnh quan yên bình
   */
  async performWalk(interaction, player) {
    const now = Date.now();
    const lastWalk = player.lastWalk || 0;
    const walkCooldownMs = 10000; // 10s hồi chiêu mỗi lần đi dạo

    if (now - lastWalk < walkCooldownMs) {
      const wait = ((walkCooldownMs - (now - lastWalk)) / 1000).toFixed(1);
      const content = `<@${player.id}> ⏳ **Bạn đang nghỉ mệt sau chuyến đi dạo!** Vui lòng đợi thêm **${wait}s** nữa để tiếp tục đi dạo (Hồi chiêu 10s/lần).`;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('explore_choose_walk').setLabel(`Đi Dạo Tiếp (${wait}s)`).setEmoji('🚶').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      if (interaction.update && !interaction.replied) {
        return interaction.update({ content, embeds: [], components: [row] });
      } else if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content, embeds: [], components: [row] });
      } else {
        return interaction.reply({ content, embeds: [], components: [row], ephemeral: true });
      }
    }

    player.lastWalk = now;
    db.saveData();

    const roll = Math.random() * 100;
    if (roll < 1.5) {
      // 1.5% ra công trình khi đi bộ (đã giảm tỉ lệ theo yêu cầu)
      return this.handleStructureEvent(interaction, player, false);
    } else if (roll < 11.5) {
      // 10% (1:10) Hồ Nước
      return this.handleWaterLakeEvent(interaction, player, false);
    } else if (roll < 18.17) {
      // 6.67% (1:15) Hồ Dung Nham
      return this.handleLavaPoolEvent(interaction, player, false);
    } else if (roll < 18.84) {
      // 1:150 (~0.67%) Rương báu bí ẩn
      return this.handleChestEvent(interaction, player, false);
    } else {
      // Điều chỉnh theo Chu kỳ Ngày / Đêm Minecraft:
      const isDay = timeSystem.isDay();
      if (isDay) {
        // BAN NGÀY: Thú hiền (Heo, Bò, Gà) xuất hiện nhiều hơn hẳn (65%), còn lại là cảnh quan thiên nhiên
        if (roll < 83.84) {
          return this.handleBossOrMobEvent(interaction, player);
        } else {
          return this.handlePeacefulEvent(interaction, player, false);
        }
      } else {
        // BAN ĐÊM: Quái vật hung dữ tràn ngập bóng tối (75% tỉ lệ đụng độ quái vật!), cực kỳ nguy hiểm
        if (roll < 93.84) {
          return this.handleBossOrMobEvent(interaction, player);
        } else {
          return this.handlePeacefulEvent(interaction, player, false);
        }
      }
    }
  }

  /**
   * 1. Sự kiện gặp Công Trình Minecraft (Structures)
   * @param {boolean} isFlying - Người chơi có đang bay bằng Elytra không
   */
  async handleStructureEvent(interaction, player, isFlying = false) {
    const structures = ['trial_chambers', 'village', 'desert_temple', 'pillager_outpost', 'shipwreck', 'ruined_portal', 'witch_hut'];
    const chosen = structures[Math.floor(Math.random() * structures.length)];

    const structTitles = {
      trial_chambers: 'Phòng Thử Nghiệm Trial Chambers (Minecraft 1.21.1) 🏰',
      village: 'Ngôi Làng Dân Làng (Village) 🌾',
      desert_temple: 'Đền Sa Mạc Cổ Đại (Desert Temple) 🏜️',
      pillager_outpost: 'Tiền Đồn Kẻ Cướp (Pillager Outpost) 🏹',
      shipwreck: 'Xác Tàu Đắm Dưới Đáy Biển (Shipwreck) 🚢',
      ruined_portal: 'Cổng Nether Đổ Nát (Ruined Portal) 🌋',
      witch_hut: 'Túp Lều Phù Thủy Đầm Lầy (Witch Hut) 🧙‍♀️'
    };
    const structName = structTitles[chosen] || chosen;

    // "trừ khi ra công trình thì hãy báo" -> Thông báo công khai lên kênh chat server!
    if (interaction.channel && typeof interaction.channel.send === 'function') {
      interaction.channel.send({
        content: `📢 **THÔNG BÁO THẾ GIỚI!** Người chơi <@${player.id}> ${isFlying ? 'khi lướt Cánh Cứng Elytra 🪽 trên bầu trời' : 'khi đi dạo thám hiểm'} đã phát hiện ra công trình kỳ vĩ: **${structName}**! 🏛️`
      }).catch(() => {});
    }

    const flyPrefix = isFlying
      ? `🚀 **[CHẾ ĐỘ BAY ELYTRA]** Bạn kích hoạt pháo hoa lướt qua những tầng mây trắng! Tầm nhìn từ trên không giúp bạn dễ dàng phát hiện công trình và hoàn toàn không bị quái vật dưới đất quấy rầy!\n\n`
      : '';

    // CÔNG TRÌNH MỚI 1.21.1: PHÒNG THỬ NGHIỆM TRIAL CHAMBERS!
    if (chosen === 'trial_chambers') {
      const heavyCore = Math.random() < 0.35 ? 1 : 0;
      const breezeRod = Math.floor(1 + Math.random() * 3);
      const windCharge = Math.floor(4 + Math.random() * 8);
      const copper = Math.floor(4 + Math.random() * 8);
      const bookDrop = this.rollBookLoot(player);

      if (heavyCore) db.addItem(player, 'heavy_core', 1);
      db.addItem(player, 'breeze_rod', breezeRod);
      db.addItem(player, 'wind_charge', windCharge);
      db.addItem(player, 'copper_ingot', copper);
      db.addItem(player, 'trial_key', 1);
      db.addExp(player, 80);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0xd97706)
        .setTitle('🏰 BẠN PHÁT HIỆN PHÒNG THỬ NGHIỆM TRIAL CHAMBERS! (MINECRAFT 1.21.1)')
        .setDescription(
          flyPrefix +
          `Bạn nhìn thấy một quần thể hầm ngục bằng đá tuf và đồng sáng rực rỡ đặc trưng của **Minecraft 1.21.1**!\n` +
          `Bạn mở khối Vault kỳ bí bằng Chìa Khóa Trial Key và thu về chiến lợi phẩm siêu giá trị:\n\n` +
          (heavyCore ? `• 🪨 **x1 KHỐI LÕI NẶNG (HEAVY CORE) CỰC HIẾM!** *(Dùng chế Chùy Mace 1.21.1)*\n` : '') +
          `• 🌀 **x${breezeRod} Que Breeze (Breeze Rod)** *(Dùng chế Chùy Mace & Đạn Gió)*\n` +
          `• 💨 x${windCharge} Đạn Gió (Wind Charge 1.21.1)\n` +
          `• 🗝️ x1 Chìa Khóa Trial Key\n` +
          `• 🥉 x${copper} Thỏi đồng\n` +
          `• ⭐ **+80 EXP**` +
          bookDrop +
          `\n\n*(Gợi ý: Dùng Lõi Nặng + Que Breeze tại bàn chế tạo để tạo Chùy Mace đập cực mạnh!)*`
        );

      return this.sendReply(interaction, embed, [], isFlying);
    }

    if (chosen === 'village') {
      const iron = Math.floor(2 + Math.random() * 4);
      const bread = Math.floor(3 + Math.random() * 5);
      const emerald = Math.floor(1 + Math.random() * 4);
      const bookDrop = this.rollBookLoot(player);

      db.addItem(player, 'iron_ingot', iron);
      db.addItem(player, 'bread', bread);
      db.addItem(player, 'emerald', emerald);
      player.hp = Math.min(player.maxHp, player.hp + 5);
      db.addExp(player, 30);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0x22c55e)
        .setTitle('🌾 BẠN PHÁT HIỆN MỘT NGÔI LÀNG DÂN LÀNG! (VILLAGE)')
        .setDescription(
          flyPrefix +
          `Những mái nhà gỗ ấm cúng của Dân Làng hiện ra giữa cánh đồng bát ngát!\n` +
          `Bạn hạ cánh giao lưu cùng dân làng và thu hoạch chiến lợi phẩm:\n\n` +
          `• 🥈 x${iron} Thỏi sắt\n` +
          `• 🥖 x${bread} Bánh mì\n` +
          `• 🟢 x${emerald} Ngọc lục bảo (Emerald)\n` +
          `• ❤️ **Hồi phục:** +5 Máu\n` +
          `• ⭐ **+30 EXP**` +
          bookDrop
        );

      return this.sendReply(interaction, embed, [], isFlying);
    }

    if (chosen === 'desert_temple') {
      // Khi bay, 100% né bẫy vì hạ cánh thẳng vào phòng rương từ trên nóc đền!
      const isTrapped = isFlying ? false : (Math.random() < 0.25);

      if (isTrapped) {
        const dmg = 10;
        player.hp -= dmg;
        if (player.hp <= 0) {
          const deathResult = deathSystem.handleDeath(player, 'bị nổ tung bởi bẫy TNT trong Đền Sa Mạc');
          return this.sendReply(interaction, deathResult.embed);
        }
        db.saveData();
        const embed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('🏜️ ĐỀN SA MẠC - BẠN ĐÃ ĐẠP PHẢI ĐĨA ÁP LỰC!')
          .setDescription(`💥 **BÙM!** Thuốc nổ TNT nổ tung! Bạn mất **${dmg} Máu**!`);
        return this.sendReply(interaction, embed, [], isFlying);
      }

      // Khám phá thành công
      const diamond = Math.floor(1 + Math.random() * 3);
      const gold = Math.floor(3 + Math.random() * 6);
      const gApple = Math.random() < 0.4 ? 1 : 0;
      const bookDrop = this.rollBookLoot(player);

      db.addItem(player, 'diamond', diamond);
      db.addItem(player, 'gold_ingot', gold);
      if (gApple) db.addItem(player, 'golden_apple', 1);
      db.addItem(player, 'tnt', 2);
      db.addExp(player, 40);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle('🏜️ KHÁM PHÁ ĐỀN SA MẠC THÀNH CÔNG! (DESERT TEMPLE)')
        .setDescription(
          flyPrefix +
          (isFlying ? `Bạn đáp cánh chuẩn xác từ đỉnh kim tự tháp sa mạc, dễ dàng vô hiệu hóa bẫy TNT!\n` : `Bạn đã khéo léo gỡ bỏ đĩa áp lực bẫy TNT dưới đáy kim tự tháp!\n`) +
          `Mở cả 4 chiếc rương cổ xưa, bạn thu được:\n\n` +
          `• 💎 **x${diamond} Kim cương**\n` +
          `• 🥇 x${gold} Thỏi vàng\n` +
          (gApple ? `• 🍏 **x1 TÁO VÀNG!**\n` : '') +
          `• 🧨 x2 Thuốc nổ TNT\n` +
          `• ⭐ **+40 EXP**` +
          bookDrop
        );
      return this.sendReply(interaction, embed, [], isFlying);
    }

    if (chosen === 'shipwreck') {
      const iron = Math.floor(3 + Math.random() * 5);
      const gold = Math.floor(2 + Math.random() * 4);
      const lapis = Math.floor(3 + Math.random() * 8);
      const bookDrop = this.rollBookLoot(player);

      db.addItem(player, 'iron_ingot', iron);
      db.addItem(player, 'gold_ingot', gold);
      db.addItem(player, 'lapis', lapis);
      db.addExp(player, 30);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0x0284c7)
        .setTitle('🚢 BẠN TÌM THẤY MỘT XÁC TÀU ĐẮM! (SHIPWRECK)')
        .setDescription(
          flyPrefix +
          `Một xác thuyền buồm cổ bị đắm dạt vào bãi san hô tuyệt đẹp!\n` +
          `Bạn lục soát rương thuyền trưởng và thu được:\n\n` +
          `• 🥈 x${iron} Thỏi sắt\n` +
          `• 🥇 x${gold} Thỏi vàng\n` +
          `• 🔷 x${lapis} Ngọc lưu ly\n` +
          `• ⭐ **+30 EXP**` +
          bookDrop
        );
      return this.sendReply(interaction, embed, [], isFlying);
    }

    if (chosen === 'ruined_portal') {
      const obs = Math.floor(2 + Math.random() * 4);
      const goldOre = Math.floor(2 + Math.random() * 4);
      const bookDrop = this.rollBookLoot(player);

      db.addItem(player, 'obsidian', obs);
      db.addItem(player, 'gold_ingot', goldOre);
      if (!db.hasItem(player, 'flint_and_steel')) {
        db.addItem(player, 'flint_and_steel', 1);
      }
      db.addExp(player, 30);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0x9333ea)
        .setTitle('🔮 CỔNG NETHER ĐỔ NÁT CỔ ĐẠI! (RUINED PORTAL)')
        .setDescription(
          flyPrefix +
          `Cổng đá Hắc diện thạch cổ bốc khói tím bao quanh bởi nham thạch rực lửa!\n` +
          `Chiếc rương cổ còn sót lại đem lại cho bạn:\n\n` +
          `• ⬛ **x${obs} Hắc diện thạch (Obsidian)**\n` +
          `• 🥇 x${goldOre} Thỏi vàng\n` +
          `• 🔥 x1 Bật lửa\n` +
          `• ⭐ **+30 EXP**` +
          bookDrop
        );
      return this.sendReply(interaction, embed, [], isFlying);
    }

    if (chosen === 'pillager_outpost') {
      if (isFlying) {
        // Đang bay thì bắn tỉa loot đồ không cần đánh quái
        const emerald = Math.floor(2 + Math.random() * 4);
        const arrows = Math.floor(8 + Math.random() * 12);
        const bookDrop = this.rollBookLoot(player);

        db.addItem(player, 'emerald', emerald);
        db.addItem(player, 'arrow', arrows);
        db.addExp(player, 40);
        db.saveData();

        const embed = new EmbedBuilder()
          .setColor(0x475569)
          .setTitle('🏹 ĐỘT KÍCH TIỀN ĐỒN KẺ CƯỚP TỪ TRÊN KHÔNG!')
          .setDescription(
            flyPrefix +
            `Bạn bay lượn trên đỉnh tháp canh gỗ của toán Kẻ Cướp, chớp thời cơ ném bom gió và cướp lấy rương báu mà lũ cướp bên dưới không kịp trở tay!\n\n` +
            `• 🟢 x${emerald} Ngọc lục bảo\n` +
            `• 🏹 x${arrows} Mũi tên\n` +
            `• ⭐ **+40 EXP**` +
            bookDrop
          );
        return this.sendReply(interaction, embed, [], isFlying);
      } else {
        const captain = mobSystem.createMobInstance('pillager_captain');
        return combatSystem.startCombat(interaction, player, captain);
      }
    }

    if (chosen === 'witch_hut') {
      if (isFlying) {
        const bookDrop = this.rollBookLoot(player);
        db.addItem(player, 'health_potion', 1);
        db.addItem(player, 'glowstone_dust', 3);
        db.addExp(player, 35);
        db.saveData();

        const embed = new EmbedBuilder()
          .setColor(0x6b21a8)
          .setTitle('🧙‍♀️ ĐỘT NHẬP TÚP LỀU PHÙ THỦY TỪ MÁI NHÀ!')
          .setDescription(
            flyPrefix +
            `Bạn đáp cánh nhẹ nhàng lên mái túp lều phù thủy giữa đầm lầy, khéo léo cuỗm lấy bình thuốc quý trong lúc mụ phù thủy đang mải đun vạc thuốc!\n\n` +
            `• 🧪 x1 Bình thuốc hồi máu\n` +
            `• ✨ x3 Bột đá phát sáng\n` +
            `• ⭐ **+35 EXP**` +
            bookDrop
          );
        return this.sendReply(interaction, embed, [], isFlying);
      } else {
        const witch = mobSystem.createMobInstance('witch');
        return combatSystem.startCombat(interaction, player, witch);
      }
    }
  }

  /**
   * 2. Sự kiện nhặt Rương Kho Báu Bí Mật (Treasure Chest)
   */
  async handleChestEvent(interaction, player, isFlying = false) {
    const coinsFound = Math.floor(150 + Math.random() * 350);
    player.coins = Math.round((player.coins + coinsFound) * 100) / 100;

    const bonus = [];
    if (Math.random() < 0.6) {
      const d = Math.floor(1 + Math.random() * 3);
      db.addItem(player, 'diamond', d);
      bonus.push(`💎 **x${d} Kim Cương**`);
    }
    if (Math.random() < 0.4) {
      db.addItem(player, 'golden_apple', 1);
      bonus.push(`🍏 **x1 Táo Vàng**`);
    }
    // Rơi Totem of Undying
    if (Math.random() < 1 / 200) {
      db.addItem(player, 'totem_of_undying', 1);
      bonus.push(`🗿 **x1 VẬT TỔ BẤT TỬ (TOTEM OF UNDYING) SIÊU HIẾM - CỨU MẠNG CHẾT KHÔNG MẤT ĐỒ!**`);
    }

    // Tỉ lệ 1:15 rơi Sách Phù Phép khi loot rương
    const bookDrop = this.rollBookLoot(player);
    if (bookDrop) {
      bonus.push(bookDrop.replace('\n• ', ''));
    }

    db.addExp(player, 30);
    db.saveData();

    if (isFlying) {
      const bonusStr = bonus.length > 0 ? ` (${bonus.map(b => b.replace(/\*\*/g, '')).join(', ')})` : '';
      const content = `<@${player.id}> 📦 **[Bay Elytra]** Bạn phát hiện Rương Kho Báu lộ thiên bên vách núi! Thu được: **+${coinsFound} Xu**, **+30 EXP**${bonusStr}!`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('explore_choose_fly').setLabel('Bay Tiếp (5s)').setEmoji('🚀').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('explore_choose_walk').setLabel('Đáp Xuống Đi Bộ').setEmoji('🚶').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      if (interaction.update) {
        return interaction.update({ content, embeds: [], components: [row] });
      } else if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content, embeds: [], components: [row] });
      } else {
        return interaction.reply({ content, embeds: [], components: [row], ephemeral: true });
      }
    }

    const flyPrefix = isFlying
      ? `🚀 **[CHẾ ĐỘ BAY ELYTRA]** Bạn phát hiện chiếc rương từ trên không và đáp cánh xuống nhặt!\n\n`
      : '';

    const embed = new EmbedBuilder()
      .setColor(0xeab308)
      .setTitle('📦 BẠN PHÁT HIỆN RƯƠNG KHO BÁU BÍ ẨN!')
      .setDescription(
        flyPrefix +
        `Bạn cạy nắp rương và thu được vô số báu vật sáng chói:\n\n` +
        `• 🪙 **+${coinsFound} Xu** tiền vàng\n` +
        (bonus.length > 0 ? bonus.map(b => `• ${b}`).join('\n') + '\n' : '') +
        `• ⭐ **+30 EXP**`
      );

    return this.sendReply(interaction, embed);
  }

  /**
   * 3. Sự kiện gặp Hồ Nước Tự Nhiên
   * Cho phép múc nước bằng xô sắt (3 thỏi sắt) để đúc Obsidian
   */
  async handleWaterLakeEvent(interaction, player, isFlying = false) {
    const hasBucket = db.hasItem(player, 'bucket');
    const bucketCount = db.getItemCount(player, 'bucket');
    const ironCount = db.getItemCount(player, 'iron_ingot');

    if (isFlying) {
      const content = `<@${player.id}> 🌊 **[Bay Elytra]** Từ trên tầng mây nhìn xuống, bạn phát hiện một **Hồ Nước Ngọt** tự nhiên trong vắt!`;
      const row = new ActionRowBuilder();
      if (hasBucket) {
        row.addComponents(
          new ButtonBuilder().setCustomId('explore_scoop_water').setLabel(`Múc 1 Xô Nước`).setEmoji('💧').setStyle(ButtonStyle.Primary)
        );
        if (bucketCount > 1) {
          row.addComponents(
            new ButtonBuilder().setCustomId('explore_scoop_water_all').setLabel(`Múc Hết (${bucketCount} Xô)`).setEmoji('🪣').setStyle(ButtonStyle.Success)
          );
        }
      } else if (ironCount >= 3) {
        row.addComponents(
          new ButtonBuilder().setCustomId('explore_quick_craft_bucket_water').setLabel('Chế Nhanh Xô (3 Sắt)').setEmoji('🔨').setStyle(ButtonStyle.Success)
        );
      }
      row.addComponents(
        new ButtonBuilder().setCustomId('explore_choose_fly').setLabel('Bay Tiếp (5s)').setEmoji('🚀').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('explore_choose_walk').setLabel('Đáp Xuống Đi Bộ').setEmoji('🚶').setStyle(ButtonStyle.Secondary)
      );

      if (interaction.update) {
        return interaction.update({ content, embeds: [], components: [row] });
      } else if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content, embeds: [], components: [row] });
      } else {
        return interaction.reply({ content, embeds: [], components: [row], ephemeral: true });
      }
    }

    const flyPrefix = isFlying
      ? `🚀 **[CHẾ ĐỘ BAY ELYTRA]** Từ trên tầng mây, bạn nhìn thấy mặt nước lấp lánh phản chiếu ánh mặt trời rực rỡ!\n\n`
      : '';

    const embed = new EmbedBuilder()
      .setColor(0x0284c7)
      .setTitle('🌊 BẠN BẮT GẶP MỘT HỒ NƯỚC TỰ NHIÊN!')
      .setDescription(
        flyPrefix +
        `Một hồ nước ngọt trong vắt mát rượi uốn lượn giữa lòng thung lũng!\n\n` +
        (hasBucket
          ? `🪣 Bạn đang mang theo **${bucketCount} Xô Sắt (Bucket)**!\n` +
            `Hãy bấm nút bên dưới để múc nước vào xô.\n\n` +
            `*(Dùng 1 Xô Nước + 1 Xô Dung Nham tại Bàn Chế Tạo \`/craft\` để đúc Hắc Diện Thạch xây Cổng Nether!)*`
          : `⚠️ **Bạn không có Xô Sắt 🪣!**\n` +
            (ironCount >= 3
              ? `✨ Nhưng bạn đang có **${ironCount} Thỏi Sắt** 🥈! Bạn có thể bấm nút **[Chế Nhanh Xô Sắt]** ngay tại đây để múc nước.\n\n`
              : `💡 **Công thức chế tạo Xô Sắt:**\nCần **3 Thỏi Sắt (Iron Ingot)** 🥈 tại Bàn Chế Tạo (\`/craft\` hoặc nút Chế Tạo).\n\n`))
      );

    const row = new ActionRowBuilder();
    if (hasBucket) {
      row.addComponents(
        new ButtonBuilder().setCustomId('explore_scoop_water').setLabel(`Múc 1 Xô Nước`).setEmoji('💧').setStyle(ButtonStyle.Primary)
      );
      if (bucketCount > 1) {
        row.addComponents(
          new ButtonBuilder().setCustomId('explore_scoop_water_all').setLabel(`Múc Hết (${bucketCount} Xô)`).setEmoji('🪣').setStyle(ButtonStyle.Success)
        );
      }
    } else if (ironCount >= 3) {
      row.addComponents(
        new ButtonBuilder().setCustomId('explore_quick_craft_bucket_water').setLabel('Chế Nhanh Xô Sắt (3 Sắt)').setEmoji('🔨').setStyle(ButtonStyle.Success)
      );
    }

    row.addComponents(
      new ButtonBuilder().setCustomId('menu_explore').setLabel('Đi Dạo Tiếp (10s)').setEmoji('🚶').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );

    return this.sendReply(interaction, embed, [row]);
  }

  /**
   * 4. Sự kiện gặp Hồ Dung Nham (Lava Pool)
   * Cho phép múc dung nham bằng xô sắt để đúc Obsidian
   */
  async handleLavaPoolEvent(interaction, player, isFlying = false) {
    const hasBucket = db.hasItem(player, 'bucket');
    const bucketCount = db.getItemCount(player, 'bucket');
    const ironCount = db.getItemCount(player, 'iron_ingot');

    if (isFlying) {
      const content = `<@${player.id}> 🌋 **[Bay Elytra]** Từ trên cao nhìn xuống, bạn phát hiện một **Hồ Dung Nham** rực lửa sôi sục!`;
      const row = new ActionRowBuilder();
      if (hasBucket) {
        row.addComponents(
          new ButtonBuilder().setCustomId('explore_scoop_lava').setLabel(`Múc 1 Xô Dung Nham`).setEmoji('🌋').setStyle(ButtonStyle.Danger)
        );
        if (bucketCount > 1) {
          row.addComponents(
            new ButtonBuilder().setCustomId('explore_scoop_lava_all').setLabel(`Múc Hết (${bucketCount} Xô)`).setEmoji('🪣').setStyle(ButtonStyle.Success)
          );
        }
      } else if (ironCount >= 3) {
        row.addComponents(
          new ButtonBuilder().setCustomId('explore_quick_craft_bucket_lava').setLabel('Chế Nhanh Xô (3 Sắt)').setEmoji('🔨').setStyle(ButtonStyle.Success)
        );
      }
      row.addComponents(
        new ButtonBuilder().setCustomId('explore_choose_fly').setLabel('Bay Tiếp (5s)').setEmoji('🚀').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('explore_choose_walk').setLabel('Đáp Xuống Đi Bộ').setEmoji('🚶').setStyle(ButtonStyle.Secondary)
      );

      if (interaction.update) {
        return interaction.update({ content, embeds: [], components: [row] });
      } else if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content, embeds: [], components: [row] });
      } else {
        return interaction.reply({ content, embeds: [], components: [row], ephemeral: true });
      }
    }

    const flyPrefix = isFlying
      ? `🚀 **[CHẾ ĐỘ BAY ELYTRA]** Cột khói đen bốc lên từ mặt đất, luồng nhiệt nóng rực báo hiệu một hồ dung nham lộ thiên!\n\n`
      : '';

    const embed = new EmbedBuilder()
      .setColor(0xd97706)
      .setTitle('🌋 BẠN BẮT GẶP HỒ DUNG NHAM RỰC LỬA!')
      .setDescription(
        flyPrefix +
        `Những dòng nham thạch sôi sục bốc khói nghi ngút, magma cuồn cuộn đỏ rực nguy hiểm!\n\n` +
        (hasBucket
          ? `🪣 Bạn đang mang theo **${bucketCount} Xô Sắt (Bucket)**!\n` +
            `Hãy bấm nút bên dưới để cẩn thận múc dung nham vào xô.\n\n` +
            `*(Dùng 1 Xô Nước + 1 Xô Dung Nham tại Bàn Chế Tạo \`/craft\` để đúc Hắc Diện Thạch xây Cổng Nether!)*`
          : `⚠️ **Bạn không có Xô Sắt 🪣!**\n` +
            (ironCount >= 3
              ? `✨ Nhưng bạn đang có **${ironCount} Thỏi Sắt** 🥈! Bạn có thể bấm nút **[Chế Nhanh Xô Sắt]** ngay tại đây để múc dung nham.\n\n`
              : `💡 **Công thức chế tạo Xô Sắt:**\nCần **3 Thỏi Sắt (Iron Ingot)** 🥈 tại Bàn Chế Tạo (\`/craft\` hoặc nút Chế Tạo).\n\n`))
      );

    const row = new ActionRowBuilder();
    if (hasBucket) {
      row.addComponents(
        new ButtonBuilder().setCustomId('explore_scoop_lava').setLabel(`Múc 1 Xô Dung Nham`).setEmoji('🌋').setStyle(ButtonStyle.Danger)
      );
      if (bucketCount > 1) {
        row.addComponents(
          new ButtonBuilder().setCustomId('explore_scoop_lava_all').setLabel(`Múc Hết (${bucketCount} Xô)`).setEmoji('🪣').setStyle(ButtonStyle.Success)
        );
      }
    } else if (ironCount >= 3) {
      row.addComponents(
        new ButtonBuilder().setCustomId('explore_quick_craft_bucket_lava').setLabel('Chế Nhanh Xô Sắt (3 Sắt)').setEmoji('🔨').setStyle(ButtonStyle.Success)
      );
    }

    row.addComponents(
      new ButtonBuilder().setCustomId('menu_explore').setLabel('Đi Dạo Tiếp (10s)').setEmoji('🚶').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );

    return this.sendReply(interaction, embed, [row]);
  }

  /**
   * Chế tạo nhanh Xô Sắt ngay tại hồ (tốn 3 Thỏi sắt)
   */
  async handleQuickCraftBucket(interaction, player, lakeType = 'water') {
    const ironCount = db.getItemCount(player, 'iron_ingot');
    if (ironCount < 3) {
      const err = `❌ Bạn không đủ Thỏi Sắt! Cần **3 Thỏi Sắt** 🥈 để rèn Xô Sắt (Hiện có: ${ironCount}/3).`;
      return interaction.reply({ content: `<@${player.id}> ${err}`, ephemeral: true });
    }

    db.removeItem(player, 'iron_ingot', 3);
    db.addItem(player, 'bucket', 1);
    db.addExp(player, 10);
    db.saveData();

    if (lakeType === 'lava') {
      return this.handleLavaPoolEvent(interaction, player, false);
    } else {
      return this.handleWaterLakeEvent(interaction, player, false);
    }
  }

  /**
   * Xử lý hành động múc nước
   */
  async handleScoopWater(interaction, player, scoopAll = false) {
    const bucketCount = db.getItemCount(player, 'bucket');
    if (bucketCount <= 0) {
      const err = '❌ Bạn không có Xô Sắt rỗng trong túi!';
      return interaction.update ? interaction.update({ content: `<@${player.id}> ${err}`, components: [] }) : interaction.reply({ content: `<@${player.id}> ${err}`, ephemeral: true });
    }

    const countToScoop = scoopAll ? bucketCount : 1;
    db.removeItem(player, 'bucket', countToScoop);
    db.addItem(player, 'water_bucket', countToScoop);
    db.addExp(player, 15 * countToScoop);
    db.saveData();

    const remainingBuckets = db.getItemCount(player, 'bucket');

    const embed = new EmbedBuilder()
      .setColor(0x0284c7)
      .setTitle('💧 MÚC NƯỚC VÀO XÔ THÀNH CÔNG!')
      .setDescription(
        `Bạn đã hạ Xô Sắt xuống làn nước trong veo và múc đầy **x${countToScoop} Xô Nước (Water Bucket) 💧**!\n\n` +
        `📦 **Nhận được:** 💧 x${countToScoop} Xô Nước\n` +
        `🪣 **Xô rỗng còn lại:** ${remainingBuckets} chiếc\n` +
        `⭐ **+${15 * countToScoop} EXP**\n\n` +
        `*(Mẹo: Dùng 1 Xô Nước + 1 Xô Dung Nham tại Bàn Chế Tạo \`/craft\` để đúc Hắc Diện Thạch xây Cổng Nether! Hoàn trả lại 2 xô rỗng!)*`
      );

    const row = new ActionRowBuilder();
    if (remainingBuckets > 0) {
      row.addComponents(
        new ButtonBuilder().setCustomId('explore_scoop_water').setLabel(`Múc Tiếp (${remainingBuckets} xô)`).setEmoji('💧').setStyle(ButtonStyle.Primary)
      );
    }
    row.addComponents(
      new ButtonBuilder().setCustomId('menu_explore').setLabel('Đi Dạo Tiếp (10s)').setEmoji('🚶').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );

    if (interaction.update) {
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    } else if (interaction.deferred || interaction.replied) {
      return interaction.editReply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    } else {
      return interaction.reply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    }
  }

  /**
   * Xử lý hành động múc dung nham
   */
  async handleScoopLava(interaction, player, scoopAll = false) {
    const bucketCount = db.getItemCount(player, 'bucket');
    if (bucketCount <= 0) {
      const err = '❌ Bạn không có Xô Sắt rỗng trong túi!';
      return interaction.update ? interaction.update({ content: `<@${player.id}> ${err}`, components: [] }) : interaction.reply({ content: `<@${player.id}> ${err}`, ephemeral: true });
    }

    const countToScoop = scoopAll ? bucketCount : 1;
    db.removeItem(player, 'bucket', countToScoop);
    db.addItem(player, 'lava_bucket', countToScoop);
    db.addExp(player, 20 * countToScoop);
    db.saveData();

    const remainingBuckets = db.getItemCount(player, 'bucket');

    const embed = new EmbedBuilder()
      .setColor(0xd97706)
      .setTitle('🌋 MÚC DUNG NHAM VÀO XÔ THÀNH CÔNG!')
      .setDescription(
        `Bạn đã khéo léo dùng Xô Sắt múc đầy **x${countToScoop} Xô Dung Nham (Lava Bucket) 🌋** nóng rực rỡ!\n\n` +
        `📦 **Nhận được:** 🌋 x${countToScoop} Xô Dung Nham\n` +
        `🪣 **Xô rỗng còn lại:** ${remainingBuckets} chiếc\n` +
        `⭐ **+${20 * countToScoop} EXP**\n\n` +
        `*(Mẹo: Dùng 1 Xô Nước + 1 Xô Dung Nham tại Bàn Chế Tạo \`/craft\` để đúc ra Hắc Diện Thạch (Obsidian) xây Cổng Nether! Hoàn trả lại 2 xô rỗng!)*`
      );

    const row = new ActionRowBuilder();
    if (remainingBuckets > 0) {
      row.addComponents(
        new ButtonBuilder().setCustomId('explore_scoop_lava').setLabel(`Múc Tiếp (${remainingBuckets} xô)`).setEmoji('🌋').setStyle(ButtonStyle.Danger)
      );
    }
    row.addComponents(
      new ButtonBuilder().setCustomId('menu_explore').setLabel('Đi Dạo Tiếp (10s)').setEmoji('🚶').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
    );

    if (interaction.update) {
      return interaction.update({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    } else if (interaction.deferred || interaction.replied) {
      return interaction.editReply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    } else {
      return interaction.reply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    }
  }

  /**
   * 5. Sự kiện chạm trán Mobs / Thú / Quái vật theo Ngày & Đêm
   */
  async handleBossOrMobEvent(interaction, player) {
    const isDay = timeSystem.isDay();

    if (isDay) {
      // BAN NGÀY: 85% là thú hiền ôn hòa (Gà, Heo, Bò), 15% là quái bóng râm hoặc Breeze hiếm
      if (Math.random() < 0.85) {
        const animal = mobSystem.spawnMob('forest'); // Gà (40%), Heo (35%), Bò (25%)
        return combatSystem.startCombat(interaction, player, animal);
      } else {
        const threatId = Math.random() < 0.5 ? 'spider' : 'breeze';
        const mob = mobSystem.createMobInstance(threatId);
        return combatSystem.startCombat(interaction, player, mob);
      }
    } else {
      // BAN ĐÊM: Màn đêm buông xuống, quái vật hung tợn tràn lan khắp thế giới!
      const roll = Math.random();
      if (roll < 0.08) {
        // 8% Quái Thú Ravager đột kích trong bóng đêm
        const ravager = mobSystem.createMobInstance('ravager');
        return combatSystem.startCombat(interaction, player, ravager);
      } else if (roll < 0.16) {
        // 8% Quái gió Breeze
        const breeze = mobSystem.createMobInstance('breeze');
        return combatSystem.startCombat(interaction, player, breeze);
      } else {
        // 84% Quái vật đêm kinh điển (Zombie, Skeleton, Spider, Creeper, Enderman)
        const mob = mobSystem.spawnMob('forest'); // isDay=false -> Zombie, Skeleton, Spider, Creeper, Enderman
        return combatSystem.startCombat(interaction, player, mob);
      }
    }
  }

  /**
   * 6. Sự kiện Cảnh Quan Yên Bình & Gặp Gỡ Thú Hoang
   */
  async handlePeacefulEvent(interaction, player, isFlying = false) {
    if (isFlying) {
      db.addExp(player, 30);
      db.saveData();

      const remainingFireworks = db.getItemCount(player, 'firework_rocket');
      const content = `<@${player.id}> 🚀 **[Bay Elytra]** Bạn đang lướt gió êm đềm trên tầng mây, không bóng quái vật! ⭐ +50 EXP *(Còn ${remainingFireworks} 🚀 Pháo hoa)*`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('explore_choose_fly').setLabel('Bay Tiếp (5s)').setEmoji('🚀').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('explore_choose_walk').setLabel('Đáp Xuống Đi Bộ').setEmoji('🚶').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
      );

      if (interaction.update) {
        return interaction.update({ content, embeds: [], components: [row] });
      } else if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content, embeds: [], components: [row] });
      } else {
        return interaction.reply({ content, embeds: [], components: [row], ephemeral: true });
      }
    }

    const peacefulEvents = ['wolf', 'trader', 'spring', 'sunflower'];
    const ev = peacefulEvents[Math.floor(Math.random() * peacefulEvents.length)];

    if (ev === 'spring') {
      player.hp = player.maxHp;
      player.mana = player.maxMana;
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0x06b6d4)
        .setTitle('💧 SUỐI NƯỚC KHOÁNG MA THUẬT GIỮA THUNG LŨNG')
        .setDescription(
          `Bạn dừng chân ngâm mình bên một hồ suối khoáng nước trong vắt phản chiếu bầu trời xanh.\n\n` +
          `❤️ **Máu:** ${player.hp}/${player.maxHp} *(Hồi phục 100%)*\n` +
          `💧 **Mana:** ${player.mana}/${player.maxMana} *(Hồi phục 100%)*`
        );
      return this.sendReply(interaction, embed);
    }

    if (ev === 'trader') {
      const emerald = Math.floor(1 + Math.random() * 3);
      db.addItem(player, 'emerald', emerald);
      db.addItem(player, 'sugar_cane', 3);
      db.addItem(player, 'apple', 2);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0x8b5cf6)
        .setTitle('🦙 THƯƠNG NHÂN LANG THANG (WANDERING TRADER)')
        .setDescription(
          `Bạn bắt gặp thương nhân lang thang cùng 2 chú Lạc đà đang thong thả đi qua.\n` +
          `Thương nhân tặng bạn quà lưu niệm:\n\n` +
          `• 🟢 x${emerald} Ngọc lục bảo (Emerald)\n` +
          `• 🎋 x3 Mía đường *(Dùng chế tạo Giấy & Pháo hoa bay!)*\n` +
          `• 🍎 x2 Quả Táo ngọt\n` +
          `• ⭐ +20 EXP`
        );
      return this.sendReply(interaction, embed);
    }

    if (ev === 'wolf') {
      db.addExp(player, 35);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0xe2e8f0)
        .setTitle('🐺 GẶP GỠ CHÚ CHÓ SÓI TUYẾT HOANG DÃ')
        .setDescription(
          `Một chú chó sói với bộ lông trắng mượt bước ra từ rừng thông, vẫy đuôi thân thiện chào bạn!\n\n` +
          `⭐ **+35 EXP Thám Hiểm**`
        );
      return this.sendReply(interaction, embed);
    }

    if (ev === 'sunflower') {
      db.addExp(player, 25);
      db.saveData();

      const embed = new EmbedBuilder()
        .setColor(0xfacc15)
        .setTitle('🌻 CÁNH ĐỒNG HOA HƯỚNG DƯƠNG RỰC RỠ')
        .setDescription(
          `Bạn dạo bước giữa cánh đồng hoa hướng dương ngập tràn ánh nắng ấm áp.\n\n` +
          `⭐ **+25 EXP Thám Hiểm**`
        );
      return this.sendReply(interaction, embed);
    }
  }

  async sendReply(interaction, embed, components = [], isFlying = false) {
    const userId = interaction.user ? interaction.user.id : (interaction.member ? interaction.member.id : null);
    const content = userId ? `<@${userId}>` : undefined;

    let files = [];
    if (embed) {
      files = imageHelper.attachWorkImage(embed, isFlying ? 'walk' : 'explore');
    }

    if (components.length === 0) {
      const row = new ActionRowBuilder();
      if (isFlying) {
        row.addComponents(
          new ButtonBuilder().setCustomId('explore_choose_fly').setLabel('Bay Tiếp (5s)').setEmoji('🚀').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('explore_choose_walk').setLabel('Đáp Xuống Đi Bộ').setEmoji('🚶').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
        );
      } else {
        row.addComponents(
          new ButtonBuilder().setCustomId('menu_explore').setLabel('Đi Dạo Tiếp (10s)').setEmoji('🚶').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('menu_areas').setLabel('Khu Vực').setEmoji('🗺️').setStyle(ButtonStyle.Secondary)
        );
      }
      components = [row];
    }

    let msg;
    if (interaction.update && !interaction.replied && !interaction.deferred) {
      msg = await interaction.update({ content, embeds: embed ? [embed] : [], components, files, fetchReply: true });
    } else if (interaction.deferred || interaction.replied) {
      msg = await interaction.editReply({ content, embeds: embed ? [embed] : [], components, files });
    } else {
      msg = await interaction.reply({ content, embeds: embed ? [embed] : [], components, files, ephemeral: true, fetchReply: true });
    }

    if (components.length > 0 && msg && typeof msg.createMessageComponentCollector === 'function') {
      const collector = msg.createMessageComponentCollector({
        time: 45000,
        max: 1
      });

      collector.on('collect', async i => {
        const player = db.getPlayer(i.user.id, i.user.username, i.user.displayAvatarURL());
        if (i.customId === 'explore_scoop_water') {
          return this.handleScoopWater(i, player);
        } else if (i.customId === 'explore_scoop_lava') {
          return this.handleScoopLava(i, player);
        }
      });
    }

    return msg;
  }
}

module.exports = new ExplorationSystem();
