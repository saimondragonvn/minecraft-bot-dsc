const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');
const deathSystem = require('./deathSystem');

class PvPSystem {
  constructor() {
    this.activeDuels = new Map(); // Lưu các trận đấu đang diễn ra
    this.pendingFoodSelects = new Map(); // userId -> pending duel food selection
  }

  isPlayerInPvP(userId) {
    for (const [id, duel] of this.activeDuels.entries()) {
      if (Date.now() - (duel.startTime || 0) > 120000) {
        this.activeDuels.delete(id);
        continue;
      }
      if (duel.p1 && duel.p2 && (duel.p1.id === userId || duel.p2.id === userId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Tạo giao diện bảng điều khiển trận PvP
   */
  createPvPMessage(p1, p2, turnPlayerId, battleLog = '', mode = 'friendly', bet = 0) {
    const isP1Turn = turnPlayerId === p1.id;
    const currentTurnUser = isP1Turn ? p1.name : p2.name;

    const p1HpBar = this.getAsciiBar(p1.hp, p1.maxHp, 8);
    const p2HpBar = this.getAsciiBar(p2.hp, p2.maxHp, 8);

    const embed = new EmbedBuilder()
      .setColor(mode === 'hardcore' ? 0xdc2626 : 0x3b82f6)
      .setTitle(`⚔️ ĐẤU TRƯỜNG PVP: ${p1.name} VS ${p2.name}`)
      .setDescription(
        `🏆 **Chế độ:** ${mode === 'hardcore' ? '🔥 **SINH TỬ (Chết Mất Đồ!)**' : '🤝 Giao hữu'}\n` +
        `🪙 **Tiền cược:** **${bet} Xu** mỗi bên\n\n` +
        `**${p1.name}**\n` +
        `Máu: ${p1HpBar} **${Math.max(0, Math.round(p1.hp))}/${p1.maxHp}** | ⚔️ Công: **${db.getTotalAttack(p1)}** | 🛡️ Giáp: **${db.getTotalDefense(p1)}**\n\n` +
        `**${p2.name}**\n` +
        `Máu: ${p2HpBar} **${Math.max(0, Math.round(p2.hp))}/${p2.maxHp}** | ⚔️ Công: **${db.getTotalAttack(p2)}** | 🛡️ Giáp: **${db.getTotalDefense(p2)}**\n\n` +
        `👉 **LƯỢT CỦA:** <@${turnPlayerId}> (**${currentTurnUser}**)\n` +
        (battleLog ? `\n📋 **Nhật ký:**\n${battleLog}` : '')
      )
      .setFooter({ text: 'Mỗi lượt có 30 giây để đưa ra quyết định!' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pvp_sword')
        .setLabel('Chém Kiếm')
        .setEmoji('⚔️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('pvp_bow')
        .setLabel('Bắn Cung')
        .setEmoji('🏹')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('pvp_shield')
        .setLabel('Giơ Khiên')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('pvp_heal')
        .setLabel('Hồi Máu/Táo')
        .setEmoji('🍏')
        .setStyle(ButtonStyle.Success)
    );

    return { embeds: [embed], components: [row] };
  }

  getAsciiBar(current, max, length = 8) {
    const ratio = Math.max(0, Math.min(1, current / max));
    const filled = Math.round(ratio * length);
    const empty = length - filled;
    return '`[' + '█'.repeat(filled) + '░'.repeat(empty) + ']`';
  }

  /**
   * Bắt đầu trận đấu PvP giữa 2 người chơi
   */
  async startDuel(channel, p1, p2, bet = 0, mode = 'friendly') {
    // Trừ tiền cược trước
    if (bet > 0) {
      p1.coins -= bet;
      p2.coins -= bet;
      db.saveData();
    }

    let turnPlayerId = Math.random() < 0.5 ? p1.id : p2.id;
    let p1Shield = false;
    let p2Shield = false;

    const initialMsg = this.createPvPMessage(p1, p2, turnPlayerId, 'Trận chiến bắt đầu! Hãy tung chiêu!', mode, bet);
    const msg = await channel.send(initialMsg);

    const duelId = `${p1.id}_${p2.id}_${Date.now()}`;
    const duelState = { msg, p1, p2, turnPlayerId, bet, mode };
    this.activeDuels.set(duelId, duelState);

    const collector = msg.createMessageComponentCollector({
      filter: i => i.user.id === p1.id || i.user.id === p2.id,
      time: 180000 // 3 phút tối đa
    });

    collector.on('collect', async i => {
      // Chỉ cho phép người có lượt bấm nút
      if (i.user.id !== turnPlayerId) {
        return i.reply({ content: '❌ Chưa tới lượt của bạn! Hãy kiên nhẫn chờ đối thủ.', ephemeral: true });
      }

      await i.deferUpdate();

      const attacker = turnPlayerId === p1.id ? p1 : p2;
      const defender = turnPlayerId === p1.id ? p2 : p1;
      const defenderIsShielding = turnPlayerId === p1.id ? p2Shield : p1Shield;

      let actionLog = '';

      if (i.customId === 'pvp_sword') {
        const swordAim = db.getSwordAim(attacker);
        const isHit = Math.random() * 100 < swordAim;

        if (!isHit) {
          actionLog = `💨 **${attacker.name}** vung kiếm chém nhưng đã bị **HỤT (Đánh trượt - Aim: ${swordAim}%)**! **${defender.name}** né đòn thành công!`;
        } else {
          const baseAtk = db.getTotalAttack(attacker);
          const isCrit = Math.random() < 0.15;
          let dmg = Math.round(baseAtk * (isCrit ? 1.5 : (0.9 + Math.random() * 0.3)));
          const def = db.getTotalDefense(defender);
          const red = db.getDamageReduction(def);
          dmg = Math.max(1, Math.round(dmg * (1 - red / 100)));

          let extraLog = '';
          const weaponSlot = attacker.equipment.sword ? 'sword' : (attacker.equipment.axe ? 'axe' : null);
          if (weaponSlot) {
            const res = db.consumeDurability(attacker, weaponSlot, 1);
            if (res.broken) extraLog += `\n💥 **${res.emoji} ${res.name} của ${attacker.name} đã bị GÃY NÁT do hết độ bền!**`;
          }

          // Hiệu ứng Góc Nhìn Lửa (Fire Aspect)
          const fireLvl = (attacker.enchants && attacker.enchants.sword && attacker.enchants.sword.fire_aspect) || 0;
          if (fireLvl > 0) {
            const fireDmg = fireLvl * 3;
            dmg += fireDmg;
            extraLog += ` 🔥 *(+${fireDmg} ST Lửa)*`;
          }

          // Tiêu hao độ bền giáp của người phòng thủ
          if (defenderIsShielding && defender.equipment.shield) {
            const sRes = db.consumeDurability(defender, 'shield', 1);
            if (sRes.broken) extraLog += `\n💥 **Khiên của ${defender.name} đã bị vỡ tung!**`;
          }
          const armorSlots = ['helmet', 'chestplate', 'leggings', 'boots'].filter(s => defender.equipment[s]);
          if (armorSlots.length > 0) {
            const hitSlot = armorSlots[Math.floor(Math.random() * armorSlots.length)];
            const aRes = db.consumeDurability(defender, hitSlot, 1);
            if (aRes.broken) extraLog += `\n💥 **${aRes.emoji} ${aRes.name} của ${defender.name} đã vỡ vụn!**`;
          }

          // Hiệu ứng Gai (Thorns) phản sát thương
          let thornsDmg = 0;
          ['helmet', 'chestplate', 'leggings', 'boots'].forEach(s => {
            const tLvl = (defender.enchants && defender.enchants[s] && defender.enchants[s].thorns) || 0;
            if (tLvl > 0 && Math.random() < 0.15 * tLvl) {
              thornsDmg += Math.floor(Math.random() * 3) + 1;
            }
          });
          if (thornsDmg > 0) {
            attacker.hp -= thornsDmg;
            extraLog += ` 🌵 *(Gai Thorns phản ${thornsDmg} ST)*`;
          }

          if (defenderIsShielding) {
            dmg = Math.max(1, Math.round(dmg * 0.25));
            actionLog = `🛡️ **${defender.name}** dùng Khiên chặn được đòn chém! Chỉ mất **${dmg}** Máu.${extraLog}`;
          } else {
            actionLog = `⚔️ **${attacker.name}** vung kiếm chém trúng **${defender.name}**, gây **${dmg}** sát thương!${isCrit ? ' 💥 **CHÍ MẠNG!**' : ''}${extraLog}`;
          }
          defender.hp -= dmg;
        }

      } else if (i.customId === 'pvp_bow') {
        const hasBow = attacker.equipment.bow || db.hasItem(attacker, 'bow');
        const hasArrow = db.hasItem(attacker, 'arrow');

        if (!hasBow || !hasArrow) {
          actionLog = `🏹 **${attacker.name}** định bắn cung nhưng phát hiện không có Cung hoặc Mũi tên! Lượt đánh bị lãng phí.`;
        } else {
          db.removeItem(attacker, 'arrow', 1);
          let extraLog = '';
          if (attacker.equipment.bow) {
            const bRes = db.consumeDurability(attacker, 'bow', 1);
            if (bRes.broken) extraLog += `\n💥 **Cung tên của ${attacker.name} đã bị đứt dây gãy nát!**`;
          }

          const bowAim = db.getBowAim(attacker);
          const isHit = Math.random() * 100 < bowAim;

          if (!isHit) {
            actionLog = `💨 **${attacker.name}** bắn cung nhưng mũi tên đã bị **HỤT (Bắn trượt - Aim: ${bowAim}%)**! Mũi tên cắm xuống đất.${extraLog}`;
          } else {
            let bowDmg = 8 + Math.floor(Math.random() * 6);
            const powerLvl = (attacker.enchants && attacker.enchants.bow && attacker.enchants.bow.power) || 0;
            if (powerLvl > 0) {
              const pBonus = powerLvl * 3;
              bowDmg += pBonus;
              extraLog += ` 📗 *(+${pBonus} ST Sức Mạnh)*`;
            }

            if (defenderIsShielding) bowDmg = Math.max(1, Math.round(bowDmg * 0.25));
            defender.hp -= bowDmg;
            actionLog = `🏹 **${attacker.name}** bắn một mũi tên xuyên qua giáp **${defender.name}**, gây **${bowDmg}** sát thương!${extraLog}`;
          }
        }

      } else if (i.customId === 'pvp_shield') {
        if (attacker.id === p1.id) p1Shield = true;
        else p2Shield = true;
        actionLog = `🛡️ **${attacker.name}** thủ thế giơ khiên, giảm 75% sát thương nhận vào ở lượt tới!`;

      } else if (i.customId === 'pvp_heal') {
        if (attacker.hp >= attacker.maxHp) {
          return i.followUp({
            content: `❤️ Máu của bạn đã đầy 100% (**${Math.round(attacker.hp)}/${attacker.maxHp} HP**)! Không cần hồi máu.`,
            ephemeral: true
          });
        }

        const availableFoods = (attacker.inventory || []).filter(item => {
          if (!item || item.count <= 0) return false;
          const itemDef = config.ITEMS[item.itemId];
          return itemDef && ((itemDef.heal && itemDef.heal > 0) || itemDef.type === 'food');
        });

        if (availableFoods.length === 0) {
          return i.followUp({
            content: `❌ Bạn không có thức ăn hay thuốc hồi máu nào trong túi đồ!`,
            ephemeral: true
          });
        }

        const menuCustomId = `pvp_food_${attacker.id}_${duelId}`;
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(menuCustomId)
          .setPlaceholder('Chọn món ăn để hồi máu trong đấu trường...');

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
        await i.followUp({
          content: `🍲 **Chọn món ăn để hồi máu:** (HP: ${Math.round(attacker.hp)}/${attacker.maxHp})`,
          components: [selectRow],
          ephemeral: true
        });

        this.pendingFoodSelects.set(attacker.id, {
          duelId,
          attacker,
          defender,
          onFoodConsumed: async (chosenDef, actualHealed, chosenId) => {
            if (attacker.id === p1.id) p2Shield = false;
            else p1Shield = false;

            const actionLog = `${chosenDef ? chosenDef.emoji : '🍲'} **${attacker.name}** đã dùng **${chosenDef ? chosenDef.name : chosenId}**, hồi phục **+${actualHealed}** Máu ❤️! (HP: ${Math.round(attacker.hp)}/${attacker.maxHp})`;

            turnPlayerId = defender.id;
            const nextMsg = this.createPvPMessage(p1, p2, turnPlayerId, actionLog, mode, bet);
            await msg.edit(nextMsg);
          }
        });
        return;
      }

      // Xóa trạng thái khiên của lượt cũ nếu phòng thủ đã trải qua lượt
      if (attacker.id === p1.id) p2Shield = false;
      else p1Shield = false;

      // Kiểm tra người thua cuộc
      if (defender.hp <= 0) {
        collector.stop('finished');
        this.activeDuels.delete(duelId);

        const winner = attacker;
        const loser = defender;

        winner.stats.pvpWins = (winner.stats.pvpWins || 0) + 1;
        loser.stats.pvpLosses = (loser.stats.pvpLosses || 0) + 1;

        const totalPrize = bet * 2;
        if (totalPrize > 0) {
          winner.coins += totalPrize;
        }

        db.addExp(winner, 50);

        if (winner.pvpHpStolen === undefined) winner.pvpHpStolen = 0;
        let hpGainText = '';
        if (winner.pvpHpStolen < 50) {
          winner.pvpHpStolen += 1;
          winner.maxHp = db.getMaxHp(winner);
          winner.hp = Math.min(winner.maxHp, winner.hp + 1);
          hpGainText = `❤️ **Chiến tích Cướp Máu PvP:** Cướp được **+1 Máu Tối Đa** từ đối thủ! (Hiện có: **${winner.pvpHpStolen}/50 HP** cướp được)\n`;
        } else {
          hpGainText = `❤️ **Chiến tích Cướp Máu PvP:** Đã đạt giới hạn tối đa **50 HP** cướp được từ PvP!\n`;
        }

        let resultDesc = `🎉 **${winner.name}** ĐÃ CHIẾN THẮNG TRẬN PVP ĐẦY KỊCH TÍNH!\n` +
          `🪙 **Phần thưởng cược:** +${totalPrize} Xu\n` +
          `⭐ **EXP nhận được:** +50 EXP\n` +
          hpGainText + '\n';

        if (mode === 'hardcore') {
          // Chết mất đồ thật sự!
          const deathResult = deathSystem.handleDeath(loser, `bị ${winner.name} chém gục trong Đấu Trường Sinh Tử`);
          if (deathResult.survived) {
            resultDesc += `🗿 **${loser.name}** đã được cứu sống bởi **Vật Tổ Bất Tử** nên không bị rơi đồ!\n`;
          } else {
            // Chuyển toàn bộ đồ rơi của kẻ thua sang túi của người thắng!
            if (deathResult.droppedItems && deathResult.droppedItems.length > 0) {
              for (const item of deathResult.droppedItems) {
                db.addItem(winner, item.itemId, item.count);
              }
              resultDesc += `☠️ **${loser.name} ĐÃ BỊ CHẾT MẤT HẾT ĐỒ!**\n🎁 Toàn bộ vật phẩm rơi của **${loser.name}** đã được trao lại cho **${winner.name}**!\n`;
            }
          }
        } else {
          // Chế độ giao hữu: hồi máu lại
          loser.maxHp = db.getMaxHp(loser);
          loser.hp = loser.maxHp;
          winner.maxHp = db.getMaxHp(winner);
          winner.hp = winner.maxHp;
        }

        db.saveData();

        const endEmbed = new EmbedBuilder()
          .setColor(0x22c55e)
          .setTitle(`🏆 KẾT THÚC TRẬN ĐẤU: ${winner.name} CHIẾN THẮNG!`)
          .setDescription(resultDesc);

        await msg.edit({ embeds: [endEmbed], components: [] });
        return;
      }

      // Đổi lượt
      turnPlayerId = defender.id;
      const nextMsg = this.createPvPMessage(p1, p2, turnPlayerId, actionLog, mode, bet);
      await msg.edit(nextMsg);
    });

    collector.on('end', async (collected, reason) => {
      this.pendingFoodSelects.delete(p1.id);
      this.pendingFoodSelects.delete(p2.id);
      if (reason === 'time') {
        this.activeDuels.delete(duelId);
        // Trả lại tiền cược
        if (bet > 0) {
          p1.coins += bet;
          p2.coins += bet;
          db.saveData();
        }
        const cancelEmbed = new EmbedBuilder()
          .setColor(0x6b7280)
          .setTitle('⌛ Trận Đấu Bị Hủy!')
          .setDescription('Đã quá thời gian chờ, trận PvP đã tự động kết thúc và hoàn trả tiền cược.');
        await msg.edit({ embeds: [cancelEmbed], components: [] }).catch(() => {});
      }
    });
  }

  /**
   * Xử lý khi người chơi chọn món ăn từ StringSelectMenu trong Đấu Trường PvP
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

    const { attacker, onFoodConsumed } = pending;
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
    const oldHp = currentActor.hp;
    currentActor.hp = Math.min(currentActor.maxHp, currentActor.hp + healAmt);
    attacker.hp = currentActor.hp;
    const actualHealed = Math.round(attacker.hp - oldHp);
    db.saveData();

    await interaction.update({
      content: `✅ Đã dùng ${itemDef ? itemDef.emoji : '🍖'} **${itemDef ? itemDef.name : chosenId}** (+${actualHealed} ❤️ HP)! *(Tự đóng...)*`,
      components: []
    }).catch(() => {});

    setTimeout(() => {
      interaction.deleteReply().catch(() => {});
    }, 1500);

    if (onFoodConsumed) {
      await onFoodConsumed(itemDef, actualHealed, chosenId);
    }
  }
}

module.exports = new PvPSystem();
