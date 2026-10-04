const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');
const mobSystem = require('./mobSystem');
const deathSystem = require('./deathSystem');
const imageHelper = require('../utils/imageHelper');

class PartySystem {
  constructor() {
    // Map lưu danh sách các đội: partyId -> partyData
    this.parties = new Map();
    this.pendingFoodSelects = new Map(); // userId -> pending raid food selection
  }

  /**
   * Tạo ID duy nhất cho đội
   */
  generatePartyId(leaderId) {
    return `party_${leaderId}_${Date.now().toString(36)}`;
  }

  /**
   * Lấy đội của người chơi (nếu đang tham gia)
   */
  getPlayerParty(userId) {
    for (const party of this.parties.values()) {
      if (party.status !== 'finished' && party.members.includes(userId)) {
        return party;
      }
    }
    return null;
  }

  /**
   * Vẽ thanh máu dạng văn bản ASCII
   */
  getAsciiBar(current, max, length = 10, fillChar = '█', emptyChar = '░') {
    const ratio = Math.max(0, Math.min(1, current / max));
    const filled = Math.round(ratio * length);
    const empty = length - filled;
    return '`[' + fillChar.repeat(filled) + emptyChar.repeat(empty) + ']`';
  }

  /**
   * Tạo phòng đội đi săn Rồng Ender
   */
  async createParty(interaction, player, targetBoss = 'ender_dragon') {
    const existing = this.getPlayerParty(player.id);
    if (existing) {
      return interaction.reply({
        content: `<@${player.id}> ❌ Bạn hiện đã ở trong một đội săn rồng rồi! Hãy hoàn thành hoặc rời đội cũ trước.`,
        ephemeral: true
      });
    }

    const cooldownMs = 5 * 3600 * 1000;
    const diff = player.lastDragonFight ? Date.now() - player.lastDragonFight : Infinity;
    if (diff < cooldownMs) {
      const rem = cooldownMs - diff;
      const h = Math.floor(rem / 3600000);
      const m = Math.ceil((rem % 3600000) / 60000);
      return interaction.reply({
        content: `<@${player.id}> ⏳ **Rồng Ender chưa hồi sinh!** Bạn đang trong thời gian hồi chiêu săn Rồng, còn **${h}h ${m}m** nữa (Hồi chiêu 5 tiếng/lần).`,
        ephemeral: true
      });
    }

    const partyId = this.generatePartyId(player.id);
    const party = {
      id: partyId,
      leaderId: player.id,
      channelId: interaction.channelId,
      members: [player.id],
      maxMembers: 4,
      targetBoss: targetBoss,
      status: 'waiting', // waiting, in_combat, finished
      createdAt: Date.now()
    };

    this.parties.set(partyId, party);

    const payload = this.buildLobbyMessage(party);

    // Gửi tin nhắn công khai trong kênh để mọi người cùng thấy và tham gia
    const msg = await interaction.reply({
      content: `<@${player.id}> đã thành lập một **Đội Săn Rồng Ender**! Mọi người hãy bấm nút bên dưới để tham gia!`,
      ...payload,
      fetchReply: true
    });

    party.messageId = msg.id;
    return party;
  }

  /**
   * Xây dựng giao diện sảnh chờ của đội (Lobby)
   */
  buildLobbyMessage(party) {
    const leader = db.getPlayer(party.leaderId);
    const memberDetails = party.members.map((mId, index) => {
      const p = db.getPlayer(mId);
      const isLeader = mId === party.leaderId;
      const weaponId = p.equipment && p.equipment.sword;
      const weaponDef = weaponId && config.ITEMS[weaponId] ? config.ITEMS[weaponId] : null;
      const weaponText = weaponDef ? `${weaponDef.emoji} ${weaponDef.name}` : 'Tay không ✊';

      return `${isLeader ? '👑' : `⚔️ #${index + 1}`} <@${mId}> - Cấp **${p.level}** | ❤️ **${Math.round(p.hp)}/${p.maxHp}** | 🗡️ ${weaponText}`;
    });

    // Thêm các slot còn trống
    for (let i = party.members.length; i < party.maxMembers; i++) {
      memberDetails.push(`⏳ *Slot #${i + 1}: Còn trống (Bấm nút bên dưới để vào)*`);
    }

    const embed = new EmbedBuilder()
      .setColor(0x581c87)
      .setTitle('🐲 PHÒNG ĐỘI SĂN RỒNG ENDER (CO-OP RAID)')
      .setDescription(
        `Chủ phòng: <@${party.leaderId}>\n` +
        `Mục tiêu: **RỒNG ENDER (Ender Dragon 🐲)** tại The End!\n\n` +
        `👥 **Danh Sách Đồng Đội (${party.members.length}/${party.maxMembers}):**\n` +
        memberDetails.join('\n') + '\n\n' +
        `🎁 **Phần Thưởng Sau Khi Hạ Rồng (Dành Cho TẤT CẢ Thành Viên):**\n` +
        `• 🥚 **x1 Trứng Rồng (Dragon Egg)**\n` +
        `• 🪽 **x1 Cánh Cứng Elytra (Bay lượn trên trời)**\n` +
        `• 📦 **x2 Hộp Shulker Box**\n` +
        `• 💎 **x5 Kim Cương** & 🪙 **x1000 Xu**\n` +
        `• ⭐ **+15,000 EXP Khổng Lồ!**\n` +
        `• 🌌 Mở khóa Cổng End Gateway tới Thành Phố End & Tàu End!`
      )
      .setFooter({ text: 'Chủ đội bấm "Xuất Kích Săn Rồng" khi các thành viên đã tập hợp đủ!' })
      .setTimestamp();

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`party_join_${party.id}`)
        .setLabel(`Tham Gia Đội (${party.members.length}/${party.maxMembers})`)
        .setEmoji('⚔️')
        .setStyle(ButtonStyle.Success)
        .setDisabled(party.members.length >= party.maxMembers),
      new ButtonBuilder()
        .setCustomId(`party_leave_${party.id}`)
        .setLabel('Rời Đội')
        .setEmoji('🚪')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`party_invite_prompt_${party.id}`)
        .setLabel('Mời Bạn')
        .setEmoji('📩')
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`party_start_${party.id}`)
        .setLabel('Xuất Kích Săn Rồng! 🔥')
        .setEmoji('🐲')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`party_cancel_${party.id}`)
        .setLabel('Giải Tán Đội')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary)
    );

    const files = imageHelper.attachWorkImage(embed, 'dragon');
    return { embeds: [embed], components: [row1, row2], files };
  }

  /**
   * Tham gia đội
   */
  async joinParty(interaction, partyId, player) {
    const party = this.parties.get(partyId);
    if (!party || party.status !== 'waiting') {
      return interaction.reply({
        content: `<@${player.id}> ❌ Phòng đội này không tồn tại hoặc trận chiến đã bắt đầu!`,
        ephemeral: true
      });
    }

    if (party.members.includes(player.id)) {
      return interaction.reply({
        content: `<@${player.id}> Bạn đã có tên trong đội này rồi!`,
        ephemeral: true
      });
    }

    const currentParty = this.getPlayerParty(player.id);
    if (currentParty) {
      return interaction.reply({
        content: `<@${player.id}> ❌ Bạn đang ở trong một đội khác rồi! Hãy rời đội cũ trước khi gia nhập đội mới.`,
        ephemeral: true
      });
    }

    if (party.members.length >= party.maxMembers) {
      return interaction.reply({
        content: `<@${player.id}> ❌ Đội đã đủ ${party.maxMembers} thành viên!`,
        ephemeral: true
      });
    }

    party.members.push(player.id);

    const payload = this.buildLobbyMessage(party);
    await interaction.update(payload);

    await interaction.followUp({
      content: `🎉 <@${player.id}> đã gia nhập đội săn rồng của <@${party.leaderId}>! (${party.members.length}/${party.maxMembers})`
    });
  }

  /**
   * Rời đội
   */
  async leaveParty(interaction, partyId, player) {
    const party = this.parties.get(partyId);
    if (!party) {
      return interaction.reply({ content: `<@${player.id}> ❌ Không tìm thấy đội!`, ephemeral: true });
    }

    if (!party.members.includes(player.id)) {
      return interaction.reply({ content: `<@${player.id}> Bạn không có trong đội này!`, ephemeral: true });
    }

    // Nếu chủ đội rời: Giải tán đội hoặc chuyển quyền
    if (party.leaderId === player.id) {
      if (party.members.length === 1) {
        this.parties.delete(partyId);
        return interaction.update({
          content: `<@${player.id}> ❌ Đội săn rồng đã được giải tán do chủ đội rời phòng.`,
          embeds: [],
          components: []
        });
      } else {
        // Chuyển quyền cho thành viên tiếp theo
        party.members = party.members.filter(id => id !== player.id);
        party.leaderId = party.members[0];
        const payload = this.buildLobbyMessage(party);
        await interaction.update(payload);
        return interaction.followUp({
          content: `🚪 <@${player.id}> đã rời đội. Quyền chủ đội được chuyển cho <@${party.leaderId}>!`
        });
      }
    }

    // Thành viên thường rời
    party.members = party.members.filter(id => id !== player.id);
    const payload = this.buildLobbyMessage(party);
    await interaction.update(payload);
    return interaction.followUp({
      content: `🚪 <@${player.id}> đã rời khỏi đội săn rồng.`
    });
  }

  /**
   * Mời một người chơi đích danh vào đội
   */
  async invitePlayer(interaction, inviter, targetUser) {
    const party = this.getPlayerParty(inviter.id);
    if (!party) {
      return interaction.reply({
        content: `<@${inviter.id}> ❌ Bạn chưa tạo đội! Dùng lệnh \`/party create\` hoặc vào The End tạo đội trước.`,
        ephemeral: true
      });
    }

    if (party.members.length >= party.maxMembers) {
      return interaction.reply({
        content: `<@${inviter.id}> ❌ Đội của bạn đã đủ ${party.maxMembers} thành viên!`,
        ephemeral: true
      });
    }

    if (targetUser.bot) {
      return interaction.reply({ content: '❌ Không thể mời bot tham gia đội!', ephemeral: true });
    }

    if (party.members.includes(targetUser.id)) {
      return interaction.reply({ content: `❌ <@${targetUser.id}> đã có trong đội của bạn rồi!`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xa855f7)
      .setTitle('📩 LỜI MỜI GIA NHẬP ĐỘI SĂN RỒNG ENDER!')
      .setDescription(
        `Chào <@${targetUser.id}>!\n\n` +
        `<@${inviter.id}> đã gửi cho bạn một lời mời gia nhập **Đội Săn Rồng Ender (The End Raid)**!\n` +
        `Cùng kề vai sát cánh chiến đấu để nhận **Trứng Rồng**, **Cánh Cứng Elytra** và **15,000 EXP**!\n\n` +
        `Hãy bấm nút **[Chấp Nhận Gia Nhập ✅]** bên dưới để vào đội ngay:`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`party_accept_${party.id}`)
        .setLabel('Chấp Nhận Gia Nhập ✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`party_decline_${party.id}`)
        .setLabel('Từ Chối ❌')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: `<@${targetUser.id}> ơi, bạn có lời mời săn rồng từ <@${inviter.id}>!`,
      embeds: [embed],
      components: [row]
    });
  }

  /**
   * Bắt đầu trận chiến Co-op Raid săn Rồng Ender
   */
  async startRaid(interaction, partyId) {
    const party = this.parties.get(partyId);
    if (!party) {
      return interaction.reply({ content: '❌ Không tìm thấy đội săn rồng!', ephemeral: true });
    }

    if (interaction.user.id !== party.leaderId) {
      return interaction.reply({
        content: `<@${interaction.user.id}> ❌ Chỉ có Chủ Đội (<@${party.leaderId}>) mới có quyền bấm bắt đầu trận chiến!`,
        ephemeral: true
      });
    }

    // 1. Kiểm tra hồi chiêu 5 tiếng cho toàn bộ thành viên trong đội
    const cooldownMs = 5 * 3600 * 1000;
    const onCooldownMembers = [];
    for (const mId of party.members) {
      const p = db.getPlayer(mId);
      const diff = p.lastDragonFight ? Date.now() - p.lastDragonFight : Infinity;
      if (diff < cooldownMs) {
        const rem = cooldownMs - diff;
        const h = Math.floor(rem / 3600000);
        const m = Math.ceil((rem % 3600000) / 60000);
        onCooldownMembers.push(`<@${p.id}> (còn **${h}h ${m}m**)`);
      }
    }
    if (onCooldownMembers.length > 0) {
      return interaction.reply({
        content: `⏳ **Không thể bắt đầu săn Rồng!** Thành viên trong đội đang trong thời gian hồi chiêu săn Rồng Ender (5 tiếng/lần):\n` +
          onCooldownMembers.map(m => `• ${m}`).join('\n') +
          `\nVui lòng đợi hết thời gian hồi chiêu hoặc đổi thành viên khác!`,
        ephemeral: true
      });
    }

    // 2. Kiểm tra Cung tên và Mũi tên cho toàn bộ thành viên trong đội
    const noBowMembers = [];
    for (const mId of party.members) {
      const p = db.getPlayer(mId);
      const hasBow = (p.equipment && (p.equipment.bow === 'bow' || p.equipment.bow === 'crossbow')) || db.hasItem(p, 'bow') || db.hasItem(p, 'crossbow');
      const arrows = db.getItemCount(p, 'arrow');
      if (!hasBow || arrows <= 0) {
        noBowMembers.push(`<@${p.id}> (${!hasBow ? 'thiếu Cung tên' : 'hết Mũi tên'})`);
      }
    }
    if (noBowMembers.length > 0) {
      return interaction.reply({
        content: `🏹 **Không thể bắt đầu săn Rồng!** Rồng Ender bay trên không trung và 12 Pha Lê End ngự trên đỉnh các cột đá Obsidian! Các thành viên sau cần có **Cung tên (Bow/Crossbow)** và ít nhất **1 Mũi tên (Arrow)**:\n` +
          noBowMembers.map(m => `• ${m}`).join('\n'),
        ephemeral: true
      });
    }

    party.status = 'in_combat';

    // Tính toán máu và chỉ số của Rồng theo số lượng thành viên
    const memberCount = party.members.length;
    const baseDragon = mobSystem.spawnEnderDragon();

    const raidDragon = {
      id: 'ender_dragon',
      name: 'RỒNG ENDER (Ender Dragon)',
      emoji: '🐲',
      maxHp: 400 + (memberCount - 1) * 160,
      currentHp: 400 + (memberCount - 1) * 160,
      attack: 16 + memberCount * 2,
      defense: 6,
      crystalsLeft: 12, // 12 pha lê bảo vệ rồng
      crystalsHp: 25
    };

    // Khởi tạo trạng thái từng thành viên trong raid
    const raidMembers = new Map();
    for (const mId of party.members) {
      const p = db.getPlayer(mId);
      raidMembers.set(mId, {
        id: mId,
        name: p.name,
        level: p.level,
        currentHp: p.hp,
        maxHp: p.maxHp,
        isShielding: false,
        isDead: false,
        damageDealt: 0,
        potionsLeft: db.getItemCount(p, 'health_potion') || 2
      });
    }

    let battleLog = `🔥 **TRẬN CHIẾN BẮT ĐẦU!** Rồng Ender gầm thét trên bầu trời The End!\nCả đội gồm **${memberCount} chiến binh** cùng rút vũ khí sẵn sàng xung trận!`;

    // Tạo tin nhắn giao diện trận đấu Co-op
    const buildRaidScreen = () => {
      const dragonBar = this.getAsciiBar(raidDragon.currentHp, raidDragon.maxHp, 12, '🟪', '░');

      const memberStatuses = Array.from(raidMembers.values()).map(m => {
        const p = db.getPlayer(m.id);
        const totems = db.getItemCount(p, 'totem_of_undying');
        const hpBar = this.getAsciiBar(m.currentHp, m.maxHp, 8, '❤️', '░');
        const statusText = (m.isDead || m.currentHp <= 0)
          ? '💀 **ĐÃ TỬ VONG**'
          : m.isShielding
            ? '🛡️ *Đang giơ khiên đỡ*'
            : '⚔️ *Sẵn sàng*';

        return `<@${m.id}>: ${hpBar} **${Math.max(0, Math.round(m.currentHp))}/${m.maxHp} HP** | 🗿 x${totems} (${statusText}) | 💥 Sát thương: **${m.damageDealt}**`;
      });

      const crystalText = raidDragon.crystalsLeft > 0
        ? `🔮 Pha Lê End Còn Lại: **${raidDragon.crystalsLeft} cái** *(Rồng liên tục hồi máu!)*\n`
        : `✨ *Toàn bộ Pha Lê End đã bị phá vỡ! Rồng không còn khả năng hồi máu!*!\n`;

      const embed = new EmbedBuilder()
        .setColor(0x7e22ce)
        .setTitle('🐲 ĐẠI CHIẾN RỒNG ENDER (CO-OP RAID)')
        .setDescription(
          `**${raidDragon.emoji} ${raidDragon.name}**\n` +
          `Máu: ${dragonBar} **${Math.max(0, Math.round(raidDragon.currentHp))}/${raidDragon.maxHp}**\n` +
          `⚔️ Tấn công: **${raidDragon.attack}** | 🛡️ Giáp: **${raidDragon.defense}**\n` +
          crystalText +
          `\n👥 **Đội Ngũ Chiến Binh:**\n` +
          memberStatuses.join('\n') +
          `\n\n📋 **Nhật Ký Chiến Trận:**\n${battleLog}`
        )
        .setFooter({ text: '⏳ Thời gian đánh: 10 phút | Thất bại hồi chiêu: 1 tiếng | Bất kỳ thành viên nào cũng có thể chọn thao tác!' })
        .setTimestamp();

      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('raid_atk').setLabel('Chém Kiếm').setEmoji('⚔️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('raid_bow').setLabel('Bắn Cung').setEmoji('🏹').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('raid_crystal').setLabel(`Bắn Pha Lê (${raidDragon.crystalsLeft})`).setEmoji('🔮').setStyle(ButtonStyle.Primary).setDisabled(raidDragon.crystalsLeft <= 0),
        new ButtonBuilder().setCustomId('raid_shield').setLabel('Đỡ Khiên').setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('raid_heal').setLabel('Hồi Máu').setEmoji('🍖').setStyle(ButtonStyle.Success)
      );

      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('raid_flee').setLabel('Tháo Chạy (1:12)').setEmoji('🏃').setStyle(ButtonStyle.Danger)
      );

      const files = imageHelper.attachWorkImage(embed, 'dragon');
      return { embeds: [embed], components: [row1, row2], files };
    };

    const initialPayload = buildRaidScreen();
    let raidMessage;
    if (interaction.deferred || interaction.replied) {
      raidMessage = await interaction.editReply(initialPayload);
    } else {
      raidMessage = await interaction.update(initialPayload);
    }

    // Collector lắng nghe hành động từ tất cả thành viên trong đội
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => party.members.includes(i.user.id),
      time: 600000 // 10 phút tối đa cho trận raid
    });

    let actionCount = 0;

    collector.on('collect', async i => {
      const actorId = i.user.id;
      const actor = raidMembers.get(actorId);
      const actorPlayer = db.getPlayer(actorId);

      if (!actor) {
        return i.reply({ content: 'Bạn không phải là thành viên trong trận raid này!', ephemeral: true });
      }

      // Nếu người chơi đã tử vong
      if (actor.isDead || actor.currentHp <= 0) {
        return i.reply({
          content: `<@${actorId}> ☠️ Bạn đã tử vong trong trận chiến, không thể tiếp tục hành động!`,
          ephemeral: true
        });
      }

      let logEvent = '';

      // 1. Chém Kiếm
      if (i.customId === 'raid_atk') {
        const swordAim = db.getSwordAim(actorPlayer);
        const isHit = Math.random() * 100 < swordAim;
        actor.isShielding = false;
        if (!isHit) {
          logEvent = `💨 <@${actorId}> lao lên vung kiếm chém Rồng nhưng bị **HỤT** (Đánh trượt - Aim: ${swordAim}%)!`;
        } else {
          const atk = db.getTotalAttack(actorPlayer);
          const actualDmg = Math.max(3, atk - raidDragon.defense + Math.floor(Math.random() * 5));
          raidDragon.currentHp -= actualDmg;
          actor.damageDealt += actualDmg;
          logEvent = `⚔️ <@${actorId}> lao lên vung kiếm chém trúng Rồng (Aim: ${swordAim}%), gây **-${actualDmg} Sát Thương**!`;
        }
      }

      // 2. Bắn Cung
      if (i.customId === 'raid_bow') {
        const hasBow = (actorPlayer.equipment && (actorPlayer.equipment.bow === 'bow' || actorPlayer.equipment.bow === 'crossbow')) || db.hasItem(actorPlayer, 'bow') || db.hasItem(actorPlayer, 'crossbow');
        const arrowCount = db.getItemCount(actorPlayer, 'arrow');

        if (!hasBow) {
          return i.reply({
            content: `<@${actorId}> ❌ Bạn không có **Cung tên (Bow/Crossbow)** trong người! Hãy chọn **[Chém Kiếm ⚔️]** để đánh cận chiến.`,
            ephemeral: true
          });
        }
        if (arrowCount <= 0) {
          return i.reply({
            content: `<@${actorId}> ❌ Bạn đã **hết Mũi tên (Arrow)**! Không thể bắn cung.`,
            ephemeral: true
          });
        }

        db.removeItem(actorPlayer, 'arrow', 1);
        const bowAim = db.getBowAim(actorPlayer);
        const isHit = Math.random() * 100 < bowAim;
        actor.isShielding = false;
        if (!isHit) {
          logEvent = `💨 <@${actorId}> kéo căng cung bắn Rồng nhưng mũi tên đã bay **TRƯỢT** (-1 Mũi tên 🏹, Aim: ${bowAim}%)!`;
        } else {
          const isCrit = Math.random() < 0.35;
          const baseDmg = Math.floor(8 + Math.random() * 8);
          const actualDmg = isCrit ? Math.round(baseDmg * 1.5) : baseDmg;
          raidDragon.currentHp -= actualDmg;
          actor.damageDealt += actualDmg;
          logEvent = `🏹 <@${actorId}> kéo căng dây cung bắn ${isCrit ? '💥 **BẠO KÍCH VÀO MẮT RỒNG**' : 'trúng thân rồng'} (-1 Mũi tên 🏹, Aim: ${bowAim}%), gây **-${actualDmg} Sát Thương**!`;
        }
      }

      // 3. Bắn Pha Lê End Crystal
      if (i.customId === 'raid_crystal') {
        const hasBow = (actorPlayer.equipment && (actorPlayer.equipment.bow === 'bow' || actorPlayer.equipment.bow === 'crossbow')) || db.hasItem(actorPlayer, 'bow') || db.hasItem(actorPlayer, 'crossbow');
        const arrowCount = db.getItemCount(actorPlayer, 'arrow');

        if (!hasBow) {
          return i.reply({
            content: `<@${actorId}> ❌ Pha Lê End nằm tít trên đỉnh tháp Obsidian! Bạn cần có **Cung tên (Bow/Crossbow)** mới bắn tới được!`,
            ephemeral: true
          });
        }
        if (arrowCount <= 0) {
          return i.reply({
            content: `<@${actorId}> ❌ Bạn đã **hết Mũi tên (Arrow)**! Không thể bắn phá Pha Lê End.`,
            ephemeral: true
          });
        }

        if (raidDragon.crystalsLeft > 0) {
          db.removeItem(actorPlayer, 'arrow', 1);
          const bowAim = db.getBowAim(actorPlayer);
          const isHit = Math.random() * 100 < bowAim;
          actor.isShielding = false;
          if (isHit) {
            raidDragon.crystalsLeft -= 1;
            const explodeDmg = 25;
            raidDragon.currentHp -= explodeDmg;
            actor.damageDealt += explodeDmg;
            logEvent = `🔮 <@${actorId}> ngắm chuẩn bắn nổ tung một **Pha Lê End Crystal** (-1 Mũi tên 🏹, Aim: ${bowAim}%)! Sóng xung kích phát nổ gây **-${explodeDmg} Sát Thương** lên Rồng! *(Còn ${raidDragon.crystalsLeft}/12 pha lê)*`;
          } else {
            logEvent = `💨 <@${actorId}> ngắm bắn Pha Lê End Crystal nhưng mũi tên bay chệch hướng bị **TRƯỢT** (-1 Mũi tên 🏹, Aim Cung: ${bowAim}%)! Cầu hồi máu của Rồng vẫn còn nguyên! *(Còn ${raidDragon.crystalsLeft}/12 pha lê)*`;
          }
        } else {
          logEvent = `✨ Toàn bộ 12 Pha Lê End đã bị phá vỡ!`;
        }
      }

      // 4. Giơ Khiên
      if (i.customId === 'raid_shield') {
        actor.isShielding = true;
        logEvent = `🛡️ <@${actorId}> giơ cao Khiên kiên cố, chuẩn bị đỡ đòn và che chắn cho đồng đội!`;
      }

      // 5. Hồi Máu bằng thức ăn
      if (i.customId === 'raid_heal') {
        if (actor.currentHp >= actor.maxHp) {
          return i.reply({
            content: `<@${actorId}> ❤️ Máu của bạn đã đầy 100% (**${Math.round(actor.currentHp)}/${actor.maxHp} HP**)! Không cần hồi máu.`,
            ephemeral: true
          });
        }

        const availableFoods = (actorPlayer.inventory || []).filter(item => {
          if (!item || item.count <= 0) return false;
          const itemDef = config.ITEMS[item.itemId];
          return itemDef && ((itemDef.heal && itemDef.heal > 0) || itemDef.type === 'food');
        });

        if (availableFoods.length === 0) {
          return i.reply({
            content: `<@${actorId}> ❌ Bạn không có thức ăn hay thuốc hồi máu nào trong túi đồ!`,
            ephemeral: true
          });
        }

        const menuCustomId = `raid_food_${actorId}_${partyId}`;
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(menuCustomId)
          .setPlaceholder('Chọn món ăn để hồi máu...');

        availableFoods.slice(0, 25).forEach(invItem => {
          const itemDef = config.ITEMS[invItem.itemId];
          const healAmt = itemDef ? (itemDef.heal || 4) : 4;
          selectMenu.addOptions({
            label: `${itemDef.name} (Có: x${invItem.count})`,
            description: `Hồi phục: +${healAmt} ❤️ HP`,
            value: invItem.itemId,
            emoji: itemDef.emoji || '🍖'
          });
        });

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);
        await i.reply({
          content: `🍲 **Chọn món ăn để hồi máu:** (HP: ${Math.round(actor.currentHp)}/${actor.maxHp})`,
          components: [selectRow],
          ephemeral: true
        });

        this.pendingFoodSelects.set(actorId, {
          partyId,
          actor,
          actorPlayer,
          onFoodConsumed: async (foodLog) => {
            actor.isShielding = false;
            actionCount++;

            let dragonCounterLog = runDragonCounter();
            battleLog = foodLog + (dragonCounterLog ? `\n${dragonCounterLog}` : '');

            const allDeadAfterHeal = Array.from(raidMembers.values()).every(m => m.isDead || m.currentHp <= 0);
            if (allDeadAfterHeal) {
              collector.stop('party_wiped');
              party.status = 'finished';
              this.parties.delete(partyId);

              // Cài đặt thời gian hồi chiêu thất bại 1 tiếng cho cả đội
              for (const m of raidMembers.values()) {
                const p = db.getPlayer(m.id);
                p.lastDragonFight = Date.now() - (4 * 3600 * 1000); // 5h - 4h = còn 1 tiếng hồi chiêu
              }
              db.saveData();

              const defeatEmbed = new EmbedBuilder()
                .setColor(0x000000)
                .setTitle('☠️ CẢ ĐỘI ĐÃ BỊ RỒNG ENDER TIÊU DIỆT!')
                .setDescription(
                  `Tất cả chiến binh trong đội đều đã tử trận dưới móng vuốt của Rồng Ender!\n` +
                  `Tiếng gầm chiến thắng của Rồng vang vọng khắp bầu trời The End.\n\n` +
                  `⏳ *Toàn đội cần đợi 1 tiếng để hồi phục và tái chiến!*\n` +
                  `💡 *Hãy rèn trang bị mạnh hơn (Kiếm Kim Cương/Netherite, Phù Phép Sắc Bén & Bảo Vệ) trước khi tái chiến!*`
                );
              await raidMessage.edit({ embeds: [defeatEmbed], components: [] });
              return;
            }

            const nextPayload = buildRaidScreen();
            await raidMessage.edit(nextPayload);
          }
        });
        return;
      }

      // 6. Tháo Chạy (Tỉ lệ 1:12)
      if (i.customId === 'raid_flee') {
        const fleeRoll = Math.random();
        const fleeChance = 1 / 12; // Tỉ lệ kỳ tích 1:12 (~8.33%)
        if (fleeRoll < fleeChance) {
          collector.stop('party_fled');
          party.status = 'finished';
          this.parties.delete(partyId);

          // Cài đặt thời gian hồi chiêu 1 tiếng cho cả đội khi tháo chạy thành công
          for (const m of raidMembers.values()) {
            const p = db.getPlayer(m.id);
            p.lastDragonFight = Date.now() - (4 * 3600 * 1000); // 5h - 4h = còn 1 tiếng hồi chiêu
          }
          db.saveData();

          const fleeEmbed = new EmbedBuilder()
            .setColor(0x3b82f6)
            .setTitle('🏃 THÁO CHẠY THÀNH CÔNG KHỎI THE END! (Tỉ lệ 1:12)')
            .setDescription(
              `Kỳ tích xuất hiện! <@${actorId}> đã dẫn dắt toàn đội chớp lấy cơ hội ngàn vàng (**Tỉ lệ 1:12**) để nhảy thoát qua cổng dịch chuyển trở về Thế Giới Thực!\n\n` +
              `🛡️ **Bảo toàn tính mạng và toàn bộ trang bị (Không mất đồ)!**\n` +
              `⏳ *Toàn đội cần đợi 1 tiếng để hồi phục trước khi có thể thách đấu lại Rồng Ender!*`
            );
          return i.update({ embeds: [fleeEmbed], components: [] });
        } else {
          actor.isShielding = false;
          logEvent = `💨 <@${actorId}> hô hào toàn đội tháo chạy nhưng Rồng Ender đã quạt cánh tạo lốc xoáy chặn đứng đường lui (Thất bại - Tỉ lệ 1:12)!`;
        }
      }

      actionCount++;

      // Rồng phản kích sau mỗi 2 lượt hoặc khi rồng bị tấn công
      const runDragonCounter = () => {
        let dragonCounterLog = '';
        if (actionCount % 2 === 0 && raidDragon.currentHp > 0) {
          // Nếu còn pha lê, Rồng hồi phục một phần máu
          if (raidDragon.crystalsLeft > 0) {
            const healBonus = 12;
            raidDragon.currentHp = Math.min(raidDragon.maxHp, raidDragon.currentHp + healBonus);
            dragonCounterLog += `\n🔮 *Pha Lê End truyền ánh sáng hồi phục +${healBonus} Máu cho Rồng!*\n`;
          }

          const moveRoll = Math.random();

          // 40% Phun Hơi Thở Rồng (AoE toàn đội)
          if (moveRoll < 0.45) {
            dragonCounterLog += `💨 **Rồng Ender gầm vang, phun bão Axit Tím (Dragon Breath) quét qua toàn đội!**\n`;
            for (const m of raidMembers.values()) {
              if (!m.isDead && m.currentHp > 0) {
                let dmg = Math.floor(6 + Math.random() * 6);
                if (m.isShielding) {
                  dmg = Math.max(1, Math.round(dmg * 0.25));
                  m.isShielding = false;
                  dragonCounterLog += `• <@${m.id}> đỡ khiên chắn đòn thành công (mất ${dmg} HP)\n`;
                } else {
                  dragonCounterLog += `• <@${m.id}> trúng hơi thở axit (-${dmg} HP)\n`;
                }
                m.currentHp -= dmg;
                if (m.currentHp <= 0) {
                  const pObj = db.getPlayer(m.id);
                  const deathRes = deathSystem.handleDeath(pObj, 'bị Rồng Ender tiêu diệt');
                  if (deathRes.survived) {
                    m.currentHp = pObj.hp;
                    dragonCounterLog += `🗿 <@${m.id}>: **VẬT TỔ BẤT TỬ KÍCH HOẠT!** Hồi sinh thần kỳ (+${m.currentHp} HP)!\n`;
                  } else {
                    m.currentHp = 0;
                    m.isDead = true;
                    dragonCounterLog += `☠️ <@${m.id}> **ĐÃ TỬ VONG!** (Rơi mất đồ và hồi sinh tại Nhà)\n`;
                    if (interaction.channel && typeof interaction.channel.send === 'function') {
                      const deathEmbed = deathRes.embed || deathSystem.buildDeathEmbed(pObj, deathRes, 'Rồng Ender');
                      interaction.channel.send({ content: `☠️ <@${m.id}> **đã tử trận!**`, embeds: [deathEmbed] }).catch(() => {});
                    }
                  }
                }
              }
            }
          } else {
            // 55% Quật đuôi hoặc sà xuống cào xé 1 thành viên ngẫu nhiên còn sống
            const aliveMembers = Array.from(raidMembers.values()).filter(m => !m.isDead && m.currentHp > 0);
            if (aliveMembers.length > 0) {
              const target = aliveMembers[Math.floor(Math.random() * aliveMembers.length)];
              let dmg = Math.floor(raidDragon.attack + Math.random() * 6);
              if (target.isShielding) {
                dmg = Math.max(2, Math.round(dmg * 0.3));
                target.isShielding = false;
                dragonCounterLog += `🌪️ Rồng Ender quật đuôi như bão táp, nhưng <@${target.id}> kịp giơ khiên đỡ được đòn hiểm (mất ${dmg} HP)!`;
              } else {
                dragonCounterLog += `🌪️ Rồng Ender lao xuống quật đuôi cực mạnh trúng <@${target.id}>, gây **-${dmg} Sát Thương**!`;
              }
              target.currentHp -= dmg;
              if (target.currentHp <= 0) {
                const pObj = db.getPlayer(target.id);
                const deathRes = deathSystem.handleDeath(pObj, 'bị Rồng Ender tiêu diệt');
                if (deathRes.survived) {
                  target.currentHp = pObj.hp;
                  dragonCounterLog += `\n🗿 <@${target.id}>: **VẬT TỔ BẤT TỬ KÍCH HOẠT!** Hồi sinh thần kỳ (+${target.currentHp} HP)!`;
                } else {
                  target.currentHp = 0;
                  target.isDead = true;
                  dragonCounterLog += `\n☠️ <@${target.id}> **ĐÃ TỬ VONG!** (Rơi mất đồ và hồi sinh tại Nhà)`;
                  if (interaction.channel && typeof interaction.channel.send === 'function') {
                    const deathEmbed = deathRes.embed || deathSystem.buildDeathEmbed(pObj, deathRes, 'Rồng Ender');
                    interaction.channel.send({ content: `☠️ <@${target.id}> **đã tử trận!**`, embeds: [deathEmbed] }).catch(() => {});
                  }
                }
              }
            }
          }
        }
        return dragonCounterLog;
      };

      const dragonCounterLog = runDragonCounter();
      battleLog = logEvent + (dragonCounterLog ? `\n${dragonCounterLog}` : '');

      // Kiểm tra xem cả đội có bị tử vong hết không (Thất bại)
      const allDead = Array.from(raidMembers.values()).every(m => m.isDead || m.currentHp <= 0);
      if (allDead) {
        collector.stop('party_wiped');
        party.status = 'finished';
        this.parties.delete(partyId);

        // Cài đặt thời gian hồi chiêu thất bại 1 tiếng cho cả đội
        for (const m of raidMembers.values()) {
          const p = db.getPlayer(m.id);
          p.lastDragonFight = Date.now() - (4 * 3600 * 1000); // 5h - 4h = còn 1 tiếng hồi chiêu
        }
        db.saveData();

        const defeatEmbed = new EmbedBuilder()
          .setColor(0x000000)
          .setTitle('☠️ CẢ ĐỘI ĐÃ BỊ RỒNG ENDER TIÊU DIỆT!')
          .setDescription(
            `Tất cả chiến binh trong đội đều đã tử trận dưới móng vuốt của Rồng Ender!\n` +
            `Tiếng gầm chiến thắng của Rồng vang vọng khắp bầu trời The End.\n\n` +
            `⏳ *Toàn đội cần đợi 1 tiếng để hồi phục và tái chiến!*\n` +
            `💡 *Hãy rèn trang bị mạnh hơn (Kiếm Kim Cương/Netherite, Phù Phép Sắc Bén & Bảo Vệ) trước khi tái chiến!*`
          );

        return i.update({ embeds: [defeatEmbed], components: [] });
      }

      // Kiểm tra Rồng Ender đã chết chưa (Chiến Thắng)
      if (raidDragon.currentHp <= 0) {
        collector.stop('dragon_killed');
        party.status = 'finished';
        this.parties.delete(partyId);

        // Trao phần thưởng cho TẤT CẢ thành viên trong đội
        const rewardSummary = [];
        for (const m of raidMembers.values()) {
          const p = db.getPlayer(m.id);
          db.addItem(p, 'dragon_egg', 1);
          db.addItem(p, 'elytra', 1);
          db.addItem(p, 'shulker_box', 2);
          db.addItem(p, 'dragon_breath', 4);
          db.addItem(p, 'diamond_block', 2);
          db.addItem(p, 'netherite_ingot', 1);

          // Tỉ lệ 1:15 rơi Sách Phù Phép
          let bookBonus = '';
          if (Math.random() < (1 / 15)) {
            const bookPool = ['book_sharpness', 'book_protection', 'book_efficiency', 'book_power', 'book_unbreaking'];
            const chosenBook = bookPool[Math.floor(Math.random() * bookPool.length)];
            db.addItem(p, chosenBook, 1);
            const bookDef = config.ITEMS[chosenBook] || { name: 'Sách Phù Phép', emoji: '📖' };
            bookBonus = ` + ✨ ${bookDef.name}`;
          }

          p.coins = Math.round((p.coins + 3000) * 100) / 100;
          db.addExp(p, 15000);

          if (!p.stats) p.stats = {};
          p.stats.dragonKilled = (p.stats.dragonKilled || 0) + 1;
          p.lastDragonFight = Date.now(); // Hồi chiêu 5 tiếng khi diệt Rồng
          p.hp = p.maxHp; // Hồi đầy máu sau khi hạ trùm
          db.saveData();

          rewardSummary.push(`• <@${m.id}>: 💥 Sát thương: **${m.damageDealt}** (Cấp ${p.level})${bookBonus}`);
        }

        // Tìm MVP gây nhiều sát thương nhất
        const mvp = Array.from(raidMembers.values()).sort((a, b) => b.damageDealt - a.damageDealt)[0];

        const winEmbed = new EmbedBuilder()
          .setColor(0xf59e0b)
          .setTitle('🎉 RỒNG ENDER ĐÃ BỊ TIÊU DIỆT! CHIẾN THẮNG HOÀNG KIM! 🏆')
          .setDescription(
            `Rồng Ender gầm lên tiếng thét cuối cùng trước khi nổ tung thành những luồng sáng tím rực rỡ!\n` +
            `Cổng **End Gateway** khai mở dẫn đường tới **Thành Phố The End & Tàu End**!\n\n` +
            `👑 **CHIẾN BINH MVP XUẤT SẮC NHẤT:** <@${mvp.id}> với **${mvp.damageDealt} Sát Thương**!\n\n` +
            `👥 **Bảng Thành Tích Toàn Đội:**\n` +
            rewardSummary.join('\n') + '\n\n' +
            `🎁 **CHIẾN LỢI PHẨM ĐÃ TRAO CHO MỖI THÀNH VIÊN:**\n` +
            `• 🥚 **x1 TRỨNG RỒNG (DRAGON EGG) HUYỀN THOẠI** (Bán được 10.000 Xu tại /shop)\n` +
            `• 🪽 **x1 CÁNH CỨNG ELYTRA (Bay lượn trên trời)**\n` +
            `• 📦 **x2 Hộp Shulker Box (Tăng 8000 sức chứa túi đồ)**\n` +
            `• 🟣 **x4 Hơi Thở Rồng (Dragon Breath)**\n` +
            `• 💎 **x2 Khối Kim Cương (Diamond Block)**\n` +
            `• 🖤 **x1 Thỏi Netherite**\n` +
            `• 🪙 **+3,000 Tiền Xu**\n` +
            `• ⭐ **+15,000 EXP SIÊU CẤP!**\n\n` +
            `⏳ *Thời gian hồi chiêu săn Rồng tiếp theo: 5 tiếng.*`
          )
          .setFooter({ text: 'Giờ đây toàn đội có thể mở /menu -> The End -> Khám Phá Thành Phố End' });

        return i.update({ embeds: [winEmbed], components: [] });
      }

      // Tiếp tục trận đấu
      const nextPayload = buildRaidScreen();
      return i.update(nextPayload);
    });

    collector.on('end', (collected, reason) => {
      for (const mId of party.members) {
        this.pendingFoodSelects.delete(mId);
      }
      if (reason === 'time') {
        party.status = 'finished';
        this.parties.delete(partyId);

        // Hết 10 phút không hạ được Rồng: hồi chiêu 1 tiếng cho cả đội
        for (const mId of party.members) {
          const p = db.getPlayer(mId);
          p.lastDragonFight = Date.now() - (4 * 3600 * 1000);
        }
        db.saveData();

        interaction.followUp({ content: '⏳ Trận chiến săn Rồng đã hết thời gian (10 phút)! Rồng Ender đã bay mất. Toàn đội cần đợi 1 tiếng để tái đấu!' }).catch(() => {});
      }
    });
  }

  /**
   * Xử lý khi người chơi chọn món ăn từ StringSelectMenu trong trận Co-op Boss Raid
   */
  async handleFoodSelect(interaction) {
    const userId = interaction.user.id;
    const pending = this.pendingFoodSelects.get(userId);
    if (!pending) {
      return interaction.reply({
        content: '❌ Phiên chọn thức ăn đã hết hạn hoặc không tồn tại!',
        ephemeral: true
      });
    }

    const { actor, actorPlayer, onFoodConsumed } = pending;
    this.pendingFoodSelects.delete(userId);

    const chosenId = interaction.values[0];
    const itemDef = config.ITEMS[chosenId];

    const currentActor = db.getPlayer(userId);
    if (!db.hasItem(currentActor, chosenId)) {
      return interaction.update({
        content: `❌ Bạn không còn món này trong túi đồ!`,
        components: []
      }).catch(() => {});
    }

    db.removeItem(currentActor, chosenId, 1);
    const healAmt = itemDef ? (itemDef.heal || 4) : 4;
    const oldHp = actor.currentHp;
    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + healAmt);
    currentActor.hp = actor.currentHp;
    const actualHealed = Math.round(actor.currentHp - oldHp);
    db.saveData();

    await interaction.update({
      content: `✅ Đã dùng ${itemDef ? itemDef.emoji : '🍖'} **${itemDef ? itemDef.name : chosenId}** (+${actualHealed} ❤️ HP)! *(Tự đóng...)*`,
      components: []
    }).catch(() => {});

    setTimeout(() => {
      interaction.deleteReply().catch(() => {});
    }, 1500);

    const foodLog = `🍲 <@${userId}> đã ăn **${itemDef ? itemDef.name : chosenId}**, hồi phục **+${actualHealed} Máu ❤️**! (Hiện có: ${Math.round(actor.currentHp)} HP)`;
    if (onFoodConsumed) {
      await onFoodConsumed(foodLog);
    }
  }
}

module.exports = new PartySystem();
