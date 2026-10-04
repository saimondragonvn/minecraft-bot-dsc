const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');
const deathSystem = require('./deathSystem');
const imageHelper = require('../utils/imageHelper');

class CombatSystem {
  constructor() {
    this.activeCombats = new Map(); // userId -> { mobName, mobEmoji, startTime }
    this.pendingFoodSelects = new Map(); // userId -> { executeRound, pData, actor, mob }
  }

  /**
   * Kiểm tra người chơi có đang trong trận chiến không
   */
  isInCombat(userId) {
    if (!this.activeCombats.has(userId)) return false;
    const combat = this.activeCombats.get(userId);
    // Tự động giải phóng nếu quá 140s (collector là 120s) để tránh bị kẹt
    if (Date.now() - (combat.startTime || 0) > 140000) {
      this.activeCombats.delete(userId);
      return false;
    }
    return true;
  }

  getCombatInfo(userId) {
    if (!this.isInCombat(userId)) return null;
    return this.activeCombats.get(userId);
  }

  setInCombat(userId, mob) {
    this.activeCombats.set(userId, {
      mobName: mob.name || 'Quái vật',
      mobEmoji: mob.emoji || '👾',
      startTime: Date.now()
    });
  }

  clearCombat(userId) {
    this.activeCombats.delete(userId);
  }

  /**
   * Tạo tin nhắn giao diện trận đấu PVE hỗ trợ nhiều người chơi
   */
  createCombatMessage(player, mob, battleLog = '', participants = null) {
    const isBoss = mob.isBoss || mob.id === 'ender_dragon' || mob.id === 'wither' || mob.id === 'wither_boss' || (mob.name && mob.name.toLowerCase().includes('wither')) || (mob.name && mob.name.toLowerCase().includes('rồng'));
    const hpPercent = Math.max(0, Math.round((mob.currentHp / mob.maxHp) * 100));
    const mobHpBar = this.getAsciiBar(mob.currentHp, mob.maxHp, isBoss ? 12 : 10, isBoss ? '💜' : '💚');

    const embed = new EmbedBuilder();

    if (isBoss) {
      embed.setColor(0x7c3aed);
      embed.setTitle(`👑 ĐẠI CHIẾN TRÙM: ${mob.name.toUpperCase()} ${mob.emoji}`);

      let header = `❤️ **BOSS HP:** \`${mobHpBar}\` **${Math.max(0, mob.currentHp)}/${mob.maxHp}** (${hpPercent}%)\n` +
        `⚔️ Công: **${mob.attack}** | 🛡️ Giáp: **${mob.defense}**` +
        (mob.crystalsLeft ? ` | 🔮 Pha Lê End: **${mob.crystalsLeft}/12**` : '') + '\n';

      let teamText = `\n👥 **Đội hình săn Boss (${participants ? participants.size : 1}):**\n`;
      if (participants && participants.size > 0) {
        teamText += Array.from(participants.values()).map(pData => {
          const p = pData.player;
          const pBar = this.getAsciiBar(p.hp, p.maxHp, 5, '❤️');
          const shieldIcon = pData.isShielding ? ' 🛡️' : '';
          const qualifyIcon = (p.id === player.id || pData.damageDealt >= 10) ? '🎁' : '⚠️';
          const totems = db.getItemCount(p, 'totem_of_undying');
          const totemBadge = totems > 0 ? ` | 🗿 x${totems}` : ' | 🗿 0';
          return `• **${p.name || 'Chiến binh'}** \`${pBar}\` **${Math.max(0, Math.round(p.hp))}/${p.maxHp}**${totemBadge} • 💥 **${pData.damageDealt}** dame ${qualifyIcon}${shieldIcon}`;
        }).join('\n');
      } else {
        const pBar = this.getAsciiBar(player.hp, player.maxHp, 6, '❤️');
        const totems = db.getItemCount(player, 'totem_of_undying');
        const totemBadge = totems > 0 ? ` | 🗿 x${totems}` : ' | 🗿 0';
        teamText += `• **${player.name}** \`${pBar}\` **${Math.max(0, Math.round(player.hp))}/${player.maxHp}**${totemBadge} • ⚔️ Atk: ${db.getTotalAttack(player)}`;
      }

      let logText = '';
      if (battleLog) {
        const lines = battleLog.split('\n').map(l => l.trim()).filter(Boolean);
        const recent = lines.slice(-3).map(l => l.startsWith('>') ? l : `> ${l}`).join('\n');
        logText = `\n\n📜 **Nhật ký chiến trường:**\n${recent}`;
      }

      embed.setDescription(`${header}${teamText}${logText}`);
      embed.setFooter({ text: '⏳ Thời gian đánh Boss: 10 phút! Nếu không hạ được cần đợi 1 tiếng để tái đấu. 💡 Totem cứu mạng khi hết máu!' });
    } else {
      embed.setColor(0xef4444);
      embed.setTitle(`⚔️ Giao Chiến: ${mob.name} ${mob.emoji}`);

      let header = `❤️ **HP Quái:** \`${mobHpBar}\` **${Math.max(0, mob.currentHp)}/${mob.maxHp}** (${hpPercent}%)\n` +
        `⚔️ Tấn công: **${mob.attack}** | 🛡️ Giáp: **${mob.defense}**\n`;

      let teamText = `\n👥 **Chiến binh (${participants ? participants.size : 1}):**\n`;
      if (participants && participants.size > 0) {
        teamText += Array.from(participants.values()).map(pData => {
          const p = pData.player;
          const pBar = this.getAsciiBar(p.hp, p.maxHp, 5, '❤️');
          const shieldIcon = pData.isShielding ? ' 🛡️' : '';
          const totems = db.getItemCount(p, 'totem_of_undying');
          const totemBadge = totems > 0 ? ` | 🗿 x${totems}` : ' | 🗿 0';
          return `• **${p.name}** \`${pBar}\` **${Math.max(0, Math.round(p.hp))}/${p.maxHp}**${totemBadge} • 💥 **${pData.damageDealt}** dame${shieldIcon}`;
        }).join('\n');
      } else {
        const pBar = this.getAsciiBar(player.hp, player.maxHp, 6, '❤️');
        const totems = db.getItemCount(player, 'totem_of_undying');
        const totemBadge = totems > 0 ? ` | 🗿 x${totems}` : ' | 🗿 0';
        teamText += `• **${player.name}** \`${pBar}\` **${Math.max(0, Math.round(player.hp))}/${player.maxHp}**${totemBadge}`;
      }

      let logText = '';
      if (battleLog) {
        const lines = battleLog.split('\n').map(l => l.trim()).filter(Boolean);
        const recent = lines.slice(-3).map(l => l.startsWith('>') ? l : `> ${l}`).join('\n');
        logText = `\n\n📜 **Nhật ký:**\n${recent}`;
      }

      embed.setDescription(`${header}${teamText}${logText}`);
      embed.setFooter({ text: '⚔️ Bấm nút bên dưới để hành động!' });
    }

    // Hàng nút chiến đấu
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`combat_atk_${mob.id}`)
        .setLabel('Tấn Công')
        .setEmoji('⚔️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`combat_bow_${mob.id}`)
        .setLabel('Bắn Cung')
        .setEmoji('🏹')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`combat_shield_${mob.id}`)
        .setLabel('Đỡ Khiên')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`combat_heal_${mob.id}`)
        .setLabel('Hồi Máu')
        .setEmoji('🧪')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`combat_flee_${mob.id}`)
        .setLabel(isBoss ? 'Bỏ Chạy (1:12)' : 'Rút Lui')
        .setEmoji('🏃')
        .setStyle(isBoss ? ButtonStyle.Danger : ButtonStyle.Secondary)
    );

    // Nếu đánh rồng và còn pha lê, thêm nút bắn pha lê
    const rows = [row];
    if (mob.id === 'ender_dragon' && mob.crystalsLeft > 0) {
      const bossRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('combat_crystal_ender_dragon')
          .setLabel(`Bắn Pha Lê End (${mob.crystalsLeft}/12) 🔮`)
          .setStyle(ButtonStyle.Primary)
      );
      rows.unshift(bossRow);
    }

    // Chọn ảnh phù hợp: Rồng The End, Boss Wither hoặc Chiến đấu thông thường
    let combatStage = 'combat';
    if (mob.id === 'ender_dragon') {
      combatStage = 'dragon';
    } else if (mob.id === 'wither' || mob.id === 'wither_boss' || (mob.name && mob.name.toLowerCase().includes('wither'))) {
      combatStage = 'wither';
    }

    const files = imageHelper.attachWorkImage(embed, combatStage);
    return { embeds: [embed], components: rows, files };
  }

  // Vẽ thanh máu dạng văn bản ASCII
  getAsciiBar(current, max, length = 10, icon = '❤️') {
    const ratio = Math.max(0, Math.min(1, current / max));
    const filled = Math.round(ratio * length);
    const empty = length - filled;
    return '`[' + '█'.repeat(filled) + '░'.repeat(empty) + ']`';
  }

  /**
   * Bắt đầu một trận đấu và quản lý collector tương tác nhiều người chơi
   */
  async startCombat(interaction, player, mob, onFinish) {
    const participants = new Map(); // userId -> { player, damageDealt: 0, isShielding: false }
    participants.set(player.id, { player, damageDealt: 0, isShielding: false });
    this.setInCombat(player.id, mob);

    let battleLog = `Bạn đã bắt gặp **${mob.name}** ${mob.emoji}! Hãy chuẩn bị sẵn sàng chiến đấu! Mọi người chơi khác đều có thể bấm nút để vào phụ giúp!`;
    let creeperCountdown = 3;

    const isBoss = mob.isBoss || mob.id === 'ender_dragon' || mob.id === 'wither' || mob.id === 'wither_boss' || (mob.name && mob.name.toLowerCase().includes('wither')) || (mob.name && mob.name.toLowerCase().includes('rồng'));

    if (isBoss) {
      const now = Date.now();
      const failCooldown = 3600 * 1000; // 1 tiếng hồi chiêu (3,600,000 ms)
      const lastFail = player.lastBossFail || 0;
      if (now - lastFail < failCooldown) {
        const remainingMs = failCooldown - (now - lastFail);
        const remMinutes = Math.ceil(remainingMs / 60000);
        const cdEmbed = new EmbedBuilder()
          .setColor(0xef4444)
          .setTitle('⏳ BOSS ĐANG TRONG THỜI GIAN HỒI CHIÊU!')
          .setDescription(
            `⚔️ Bạn vừa chiến bại hoặc không hạ được Boss gần đây!\n` +
            `> 💡 **Thời gian hồi phục:** Hãy đợi thêm **${remMinutes} phút** nữa (Hồi chiêu 1 tiếng khi không đánh được Boss) để tái đấu!`
          );
        return interaction.deferred || interaction.replied
          ? interaction.editReply({ embeds: [cdEmbed], components: [] })
          : interaction.reply({ embeds: [cdEmbed], ephemeral: true });
      }
    }

    const combatBanner = isBoss
      ? `👑 **ĐẠI CHIẾN TRÙM (10 PHÚT):** <@${player.id}> đang khiêu chiến **${mob.name}** ${mob.emoji}!\n🤝 Bấm nút bên dưới để tham chiến Co-op! *(Gây >= 10 dame để nhận đồ)*`
      : `⚔️ **CHIẾN TRƯỜNG:** <@${player.id}> đang chiến đấu với **${mob.name}** ${mob.emoji}!\n🤝 Bấm nút bên dưới để phụ giúp!`;

    const messagePayload = this.createCombatMessage(player, mob, battleLog, participants);
    let msg;

    if (interaction.channel && typeof interaction.channel.send === 'function') {
      if (interaction.deferred || interaction.replied) {
        if (interaction.ephemeral) {
          interaction.editReply({ content: `⚔️ Bạn đang giao chiến với **${mob.name}**! Trận đấu đã mở công khai tại kênh chat bên dưới 👇 để mọi người phụ đánh!`, embeds: [], components: [] }).catch(() => {});
          msg = await interaction.channel.send({ ...messagePayload, content: combatBanner });
        } else {
          msg = await interaction.editReply({ ...messagePayload, content: combatBanner });
        }
      } else {
        msg = await interaction.channel.send({ ...messagePayload, content: combatBanner });
      }
    } else {
      if (interaction.deferred || interaction.replied) {
        msg = await interaction.editReply(messagePayload);
      } else {
        msg = await interaction.reply({ ...messagePayload, fetchReply: true });
      }
    }

    // Collector nhận tương tác từ TẤT CẢ người chơi trong server (Multiplayer Co-op)
    const combatTimeout = isBoss ? 600000 : 120000; // Boss 10 phút (600,000ms), quái thường 2 phút
    const collector = msg.createMessageComponentCollector({
      filter: (btnInt) => !btnInt.user.bot,
      time: combatTimeout
    });

    let turnLock = Promise.resolve();
    const executeRound = (actionLogs) => {
      turnLock = turnLock.then(async () => {
        const roundLog = [...actionLogs];

        // 2. Kiểm tra nếu quái chết
        if (mob.currentHp <= 0) {
          for (const pId of participants.keys()) this.clearCombat(pId);
          collector.stop('won');

          const totalDamage = Array.from(participants.values()).reduce((sum, p) => sum + p.damageDealt, 0);
          const rewardLines = [];

          for (const [pId, pInfo] of participants.entries()) {
            const p = pInfo.player;
            const pDmg = pInfo.damageDealt;
            p.stats.mobsKilled = (p.stats.mobsKilled || 0) + 1;

            const dmgRatio = totalDamage > 0 ? (pDmg / totalDamage) : 1;
            const isInitiator = (pId === player.id);
            // Quy tắc: Người khởi tạo hoặc người chơi phụ phải gây >= 10 dame mới được nhận vật phẩm
            const qualifyLoot = isInitiator || (pDmg >= 10);

            // Thưởng EXP theo đóng góp
            const baseExp = mob.exp || 20;
            const expEarned = Math.max(5, Math.round(baseExp * (0.5 + dmgRatio * 0.8)));
            const leveledUp = db.addExp(p, expEarned);

            // Bùa Tu Sửa (Mending): Hấp thụ EXP phục hồi độ bền
            const mendingRepairs = db.repairWithMending(p, expEarned);

            // Thưởng Tiền Xu (Quái thường: 10 - 50 Vàng, Boss: 2000 - 5000 Vàng)
            const coinMin = mob.coins ? mob.coins[0] : (mob.isBoss ? 2000 : 10);
            const coinMax = mob.coins ? mob.coins[1] : (mob.isBoss ? 5000 : 50);
            let baseCoins = Math.floor(coinMin + Math.random() * (coinMax - coinMin + 1));
            // Bùa Cướp bóc (Looting): Tăng 30% xu mỗi cấp
            const lootingLvl = (p.enchants && p.enchants.sword && p.enchants.sword.looting) || 0;
            if (lootingLvl > 0) {
              baseCoins = Math.round(baseCoins * (1 + lootingLvl * 0.35));
            }

            // Hiệu ứng Thuốc May Mắn (Luck Potion)
            const luckEff = db.hasEffect(p, 'luck');
            if (luckEff) {
              baseCoins = Math.round(baseCoins * 1.5);
            }

            const coinsEarned = participants.size === 1
              ? baseCoins
              : Math.max(1, Math.round(baseCoins * (0.2 + dmgRatio * 0.8)));
            p.coins = Math.round((p.coins + coinsEarned) * 100) / 100;

            if (qualifyLoot) {
              const pLootList = [];
              if (mob.drops) {
                for (const d of mob.drops) {
                  const bonusChance = Math.min(0.3, dmgRatio * 0.3);
                  const luckBonus = luckEff ? 0.25 : 0;
                  if (Math.random() <= (d.chance + bonusChance + luckBonus)) {
                    const baseCount = Math.floor(d.min + Math.random() * (d.max - d.min + 1));
                    const bonusMulti = 1 + Math.floor(dmgRatio * 2) + (luckEff ? 1 : 0);
                    const finalCount = Math.max(1, baseCount * bonusMulti);
                    db.addItem(p, d.item, finalCount);
                    const itemDef = config.ITEMS[d.item];
                    pLootList.push(`${itemDef ? itemDef.emoji : '📦'} x${finalCount} ${itemDef ? itemDef.name : d.item}${luckEff ? ' 🍀' : ''}`);
                  }
                }
              }

              if (mob.id === 'ender_dragon') {
                p.stats.dragonKilled = (p.stats.dragonKilled || 0) + 1;
                p.lastDragonFight = Date.now();
              }

              const bookChance = (1 / 15) * (luckEff ? 2 : 1);
              if (mob.isBoss && Math.random() < bookChance) {
                const bookPool = ['book_sharpness', 'book_protection', 'book_efficiency', 'book_power', 'book_unbreaking'];
                const chosenBook = bookPool[Math.floor(Math.random() * bookPool.length)];
                db.addItem(p, chosenBook, 1);
                const bookDef = config.ITEMS[chosenBook] || { name: 'Sách Phù Phép', emoji: '📖' };
                pLootList.push(`✨ ${bookDef.emoji} **x1 ${bookDef.name}**${luckEff ? ' 🍀' : ''}`);
              }

              rewardLines.push(
                `👤 **${p.name}** (💥 **${pDmg}** dame - ${(dmgRatio * 100).toFixed(0)}% đóng góp):\n` +
                `• ⭐ +${expEarned} EXP ${leveledUp ? '🎊 *(Lên Cấp!)*' : ''} | 🪙 +${coinsEarned} Xu\n` +
                `• 📦 **Vật phẩm:** ${pLootList.length > 0 ? pLootList.join(', ') : 'Không rơi đồ'}`
              );
            } else {
              rewardLines.push(
                `👤 **${p.name}** (💥 **${pDmg}** dame):\n` +
                `• ⭐ +${expEarned} EXP | 🪙 +${coinsEarned} Xu\n` +
                `• ⚠️ *Gây ${pDmg}/10 dame (Cần >= 10 dame để nhận vật phẩm)*`
              );
            }
          }

          db.saveData();

          const winEmbed = new EmbedBuilder()
            .setColor(0x22c55e)
            .setTitle(`🎉 ĐẠI THẮNG! Toàn đội đã hạ gục ${mob.name} ${mob.emoji}!`)
            .setDescription(
              `💥 **Tổng sát thương toàn đội:** **${totalDamage}** dame\n\n` +
              `🎁 **BẢNG CHIẾN TÍCH:**\n` +
              rewardLines.join('\n\n')
            );

          await msg.edit({ content: '', embeds: [winEmbed], components: [] });
          if (onFinish) onFinish({ won: true, participants });
          return;
        }

        // 3. Lượt phản công của Quái
        if (mob.id === 'ender_dragon' && mob.crystalsLeft > 0) {
          const heal = mob.crystalsLeft * 2;
          mob.currentHp = Math.min(mob.maxHp, mob.currentHp + heal);
          roundLog.push(`🔮 *${mob.crystalsLeft} Pha Lê End hồi +${heal} HP cho Rồng!*`);
        }

        if (mob.id === 'creeper') {
          creeperCountdown -= 1;
          if (creeperCountdown > 0) {
            roundLog.push(`⚠️ Creeper xì xì phồng to... **(${creeperCountdown} lượt nữa sẽ NỔ!)**`);
          } else {
            roundLog.push(`💥 **BOOOOOOOM!** Creeper phát nổ kinh hoàng lên toàn đội!`);
            for (const pInfo of participants.values()) {
              let expDmg = 28;
              if (pInfo.isShielding) expDmg = Math.round(expDmg * 0.2);
              pInfo.player.hp -= expDmg;
            }
          }
        } else {
          // Quái đánh thường / Boss AoE
          const isBossAoE = mob.id === 'ender_dragon' || mob.id === 'wither' || mob.id === 'wither_boss' || (mob.name && mob.name.toLowerCase().includes('wither')) || (mob.name && mob.name.toLowerCase().includes('rồng'));
          const livingParticipants = Array.from(participants.values()).filter(p => p.player.hp > 0);

          if (isBossAoE) {
            let totalDmg = 0;
            let shieldedCount = 0;
            for (const pInfo of livingParticipants) {
              let bossDmg = mob.attack || 16;
              const pDef = db.getTotalDefense(pInfo.player);
              const dmgRed = db.getDamageReduction(pDef);
              bossDmg = Math.max(1, Math.round(bossDmg * (1 - dmgRed / 100)));

              if (pInfo.isShielding) {
                bossDmg = Math.max(1, Math.round(bossDmg * 0.2));
                shieldedCount++;
              }
              pInfo.player.hp -= bossDmg;
              totalDmg += bossDmg;
              if (mob.witherEffect && Math.random() < 0.5) {
                pInfo.player.hp -= 2;
              }
              pInfo.isShielding = false;
            }
            const avgDmg = Math.round(totalDmg / (livingParticipants.length || 1));
            const shieldStr = shieldedCount > 0 ? ` *(🛡️ ${shieldedCount} người giơ khiên)*` : '';
            const witherStr = mob.witherEffect ? ' 🖤 Héo rũ' : '';
            roundLog.push(`🌋 **${mob.name}** quét đòn diện rộng gây ~**${avgDmg}** ST lên toàn đội!${shieldStr}${witherStr}`);
          } else {
            // Quái thường: Random ngẫu nhiên 1 người đánh
            if (livingParticipants.length > 0) {
              const targetInfo = livingParticipants[Math.floor(Math.random() * livingParticipants.length)];
              let mobDmg = mob.attack || 4;
              const pDef = db.getTotalDefense(targetInfo.player);
              const dmgRed = db.getDamageReduction(pDef);
              mobDmg = Math.max(1, Math.round(mobDmg * (1 - dmgRed / 100)));

              if (targetInfo.isShielding) {
                mobDmg = Math.max(1, Math.round(mobDmg * 0.2));
                roundLog.push(`🛡️ **${mob.name}** tấn công **${targetInfo.player.name}** nhưng bị khiên đỡ lại! (-${mobDmg} HP)`);
              } else {
                roundLog.push(`💥 **${mob.name}** tấn công **${targetInfo.player.name}**, gây **${mobDmg}** sát thương!`);
              }

              targetInfo.player.hp -= mobDmg;
              if (mob.witherEffect && Math.random() < 0.5) {
                targetInfo.player.hp -= 2;
                roundLog.push(`🖤 **${targetInfo.player.name}** bị dính Héo Rũ (-2 HP)!`);
              }
              targetInfo.isShielding = false;
            }
          }
        }

        // 4. Kiểm tra người chơi tử vong
        const deathEmbeds = [];
        for (const [pId, pInfo] of Array.from(participants.entries())) {
          if (pInfo.player.hp <= 0) {
            const deathResult = deathSystem.handleDeath(pInfo.player, `bị ${mob.name} tiêu diệt`);
            if (deathResult.survived) {
              roundLog.push(`🗿 **${pInfo.player.name}**: ${deathResult.message}`);
            } else {
              this.clearCombat(pId);
              if (isBoss) {
                pInfo.player.lastBossFail = Date.now();
              }
              participants.delete(pId);
              roundLog.push(`☠️ **${pInfo.player.name}** đã tử nạn và rơi mất đồ mang theo!`);
              const deathEmbed = deathResult.embed || deathSystem.buildDeathEmbed(pInfo.player, deathResult, mob.name);
              deathEmbeds.push(deathEmbed);
              if (interaction.channel && typeof interaction.channel.send === 'function') {
                interaction.channel.send({
                  content: `☠️ <@${pInfo.player.id}> **đã tử trận!**`,
                  embeds: [deathEmbed]
                }).catch(() => {});
              }
            }
          }
        }
        db.saveData();

        // Nếu toàn bộ người chơi đều chết / rời trận
        if (participants.size === 0) {
          collector.stop('all_died');
          if (isBoss) {
            player.lastBossFail = Date.now();
            db.saveData();
          }
          if (deathEmbeds.length > 0) {
            await msg.edit({
              content: `☠️ <@${player.id}> **đã tử trận và rơi toàn bộ vật phẩm trong túi!**`,
              embeds: deathEmbeds.slice(0, 5),
              components: []
            });
          } else {
            const defeatEmbed = new EmbedBuilder()
              .setColor(0x7f1d1d)
              .setTitle(`☠️ THẤT BẠI! TOÀN ĐỘI ĐÃ BỊ HẠ GỤC!`)
              .setDescription(`🪦 Không còn ai trụ lại trên chiến trường...\n> Quái thú **${mob.name}** ${mob.emoji} gầm lên đắc thắng rồi lẩn vào bóng tối!\n\n💡 *Tất cả chiến binh đã ngã xuống và được hồi sinh tại Nhà an toàn. Đồ trong rương nhà và tiền ngân hàng vẫn được bảo toàn 100%.*`);
            await msg.edit({ content: '', embeds: [defeatEmbed], components: [] });
          }
          if (onFinish) onFinish({ died: true });
          return;
        }

        // Cập nhật giao diện vòng đấu tiếp theo (content: null để không re-ping gây cuộn chat!)
        const nextPayload = this.createCombatMessage(player, mob, roundLog.join('\n'), participants);
        await msg.edit({ ...nextPayload, content: null });
      }).catch(err => console.error('Combat execution error:', err));
      return turnLock;
    };

    collector.on('collect', async i => {
      await i.deferUpdate().catch(() => {});
      const user = i.user;
      const actor = db.getPlayer(user.id, user.username, user.displayAvatarURL());

      // Kiểm tra người chơi đã gục ngã
      if (actor.hp <= 0) {
        return i.followUp({
          content: `❌ Bạn đã gục ngã, không thể hành động!`,
          ephemeral: true
        });
      }

      // Kiểm tra máu tối thiểu (Nếu <= 3 HP và KHÔNG phải đang bấm hồi máu thì cảnh báo)
      if (actor.hp <= 3 && !i.customId.startsWith('combat_heal')) {
        return i.followUp({
          content: `❌ Máu của bạn quá thấp (<= 3 HP), không thể chiến đấu! Hãy bấm nút **[🧪 Hồi Máu]** để dùng thức ăn.`,
          ephemeral: true
        });
      }

      let pData = participants.get(user.id);
      let newJoin = false;
      if (!pData) {
        pData = { player: actor, damageDealt: 0, isShielding: false };
        participants.set(user.id, pData);
        this.setInCombat(user.id, mob);
        newJoin = true;
      }

      let roundLog = [];
      if (newJoin) {
        roundLog.push(`🤝 **${actor.name}** đã tham chiến phụ đánh!`);
      }

      // 1. Lượt của người chơi bấm nút
      if (i.customId.startsWith('combat_atk')) {
        const swordAim = db.getSwordAim(actor);
        const isHit = Math.random() * 100 < swordAim;

        // Tiêu hao độ bền vũ khí
        const wepSlot = (actor.equipment && actor.equipment.sword) ? 'sword' : ((actor.equipment && actor.equipment.axe) ? 'axe' : null);
        let wepBrokenAlert = '';
        if (wepSlot) {
          const durRes = db.consumeDurability(actor, wepSlot, 1);
          if (durRes.broken) {
            wepBrokenAlert = ` *(💥 ${durRes.item.name} đã vỡ nát!)*`;
          }
        }

        if (!isHit) {
          roundLog.push(`💨 **${actor.name}** chém nhưng bị HỤT (Aim: ${swordAim}%)!${wepBrokenAlert}`);
        } else {
          let baseAtk = db.getTotalAttack(actor);
          const ench = (actor.enchants && wepSlot && actor.enchants[wepSlot]) || {};
          let bonusEnchDmg = 0;
          let enchMsg = '';
          const mobLower = (mob.id + ' ' + (mob.name || '')).toLowerCase();
          if (ench.smite && (mobLower.includes('zombie') || mobLower.includes('skeleton') || mobLower.includes('wither') || mobLower.includes('quỷ'))) {
            const smiteVal = ench.smite * 4;
            bonusEnchDmg += smiteVal;
            enchMsg += ` ⚡+${smiteVal}`;
          }
          if (ench.bane_of_arthropods && (mobLower.includes('spider') || mobLower.includes('nhện'))) {
            const baneVal = ench.bane_of_arthropods * 4;
            bonusEnchDmg += baneVal;
            enchMsg += ` 🕷️+${baneVal}`;
          }
          if (ench.fire_aspect) {
            const fireVal = ench.fire_aspect * 3;
            bonusEnchDmg += fireVal;
            enchMsg += ` 🔥+${fireVal}`;
          }

          const isCrit = Math.random() < 0.15;
          const multiplier = isCrit ? 1.5 : (0.9 + Math.random() * 0.3);
          const rawDamage = Math.max(1, Math.round((baseAtk + bonusEnchDmg) * multiplier));
          const finalDamage = Math.max(1, rawDamage - (mob.defense || 0));

          mob.currentHp -= finalDamage;
          pData.damageDealt += finalDamage;
          roundLog.push(`⚔️ **${actor.name}** chém gây **${finalDamage}** ST!${enchMsg}${isCrit ? ' 💥' : ''}${wepBrokenAlert}`);
        }
        await executeRound(roundLog);

      } else if (i.customId.startsWith('combat_bow')) {
        const hasBow = (actor.equipment && (actor.equipment.bow === 'bow' || actor.equipment.bow === 'crossbow')) || db.hasItem(actor, 'bow') || db.hasItem(actor, 'crossbow');
        const arrowCount = db.getItemCount(actor, 'arrow');

        if (!hasBow) {
          roundLog.push(`❌ **${actor.name}** không có Cung tên!`);
        } else if (arrowCount <= 0) {
          roundLog.push(`❌ **${actor.name}** đã hết Mũi tên!`);
        } else {
          db.removeItem(actor, 'arrow', 1);
          const bowAim = db.getBowAim(actor);
          const isHit = Math.random() * 100 < bowAim;

          let bowBrokenAlert = '';
          if (actor.equipment && (actor.equipment.bow === 'bow' || actor.equipment.bow === 'crossbow')) {
            const durRes = db.consumeDurability(actor, 'bow', 1);
            if (durRes.broken) {
              bowBrokenAlert = ` *(💥 Cung tên đã gãy!)*`;
            }
          }

          if (!isHit) {
            roundLog.push(`💨 **${actor.name}** bắn cung bị HỤT (Aim: ${bowAim}%)!${bowBrokenAlert}`);
          } else {
            let bowAtk = 9 + Math.floor(Math.random() * 5);
            const bowEnch = (actor.enchants && actor.enchants.bow) || {};
            if (bowEnch.power) {
              bowAtk += bowEnch.power * 3;
            }
            const isHeadshot = Math.random() < 0.25;
            const damage = isHeadshot ? bowAtk * 2 : bowAtk;
            mob.currentHp -= damage;
            pData.damageDealt += damage;
            roundLog.push(`🏹 **${actor.name}** bắn cung trúng gây **${damage}** ST!${isHeadshot ? ' 🎯' : ''}${bowBrokenAlert}`);
          }
        }
        await executeRound(roundLog);

      } else if (i.customId.startsWith('combat_shield')) {
        pData.isShielding = true;
        let shieldBroken = '';
        if (actor.equipment && actor.equipment.shield) {
          const durRes = db.consumeDurability(actor, 'shield', 1);
          if (durRes.broken) {
            shieldBroken = ` *(💥 Khiên đã vỡ!)*`;
          }
        }
        roundLog.push(`🛡️ **${actor.name}** giơ khiên phòng thủ (giảm 80% ST)!${shieldBroken}`);
        await executeRound(roundLog);

      } else if (i.customId.startsWith('combat_heal')) {
        if (actor.hp >= actor.maxHp) {
          return i.followUp({
            content: `❤️ Máu của bạn đã đầy 100% (**${Math.round(actor.hp)}/${actor.maxHp} HP**)!`,
            ephemeral: true
          });
        }

        const availableFoods = (actor.inventory || []).filter(item => {
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

        const menuCustomId = `combat_food_${user.id}_${Date.now()}`;
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(menuCustomId)
          .setPlaceholder('Chọn món ăn để hồi máu...');

        availableFoods.slice(0, 25).forEach(invItem => {
          const itemDef = config.ITEMS[invItem.itemId];
          const healAmt = itemDef.heal || 4;
          selectMenu.addOptions({
            label: `${itemDef.name} (Có: x${invItem.count})`,
            description: `Hồi phục: +${healAmt} ❤️ HP`,
            value: invItem.itemId,
            emoji: itemDef.emoji || '🍖'
          });
        });

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);
        await i.followUp({
          content: `🍲 **Chọn món ăn để hồi máu:** (HP: ${Math.round(actor.hp)}/${actor.maxHp})`,
          components: [selectRow],
          ephemeral: true
        });

        this.pendingFoodSelects.set(user.id, {
          executeRound,
          pData,
          actor,
          mob
        });
        return;
      } else if (i.customId === 'combat_crystal_ender_dragon') {
        const hasBow = (actor.equipment && (actor.equipment.bow === 'bow' || actor.equipment.bow === 'crossbow')) || db.hasItem(actor, 'bow') || db.hasItem(actor, 'crossbow');
        const arrowCount = db.getItemCount(actor, 'arrow');

        if (!hasBow) {
          roundLog.push(`❌ **${actor.name}** cần có Cung tên để bắn Pha Lê End!`);
        } else if (arrowCount <= 0) {
          roundLog.push(`❌ **${actor.name}** đã hết Mũi tên!`);
        } else {
          db.removeItem(actor, 'arrow', 1);
          const bowAim = db.getBowAim(actor);
          const isHit = Math.random() * 100 < bowAim;
          if (mob.crystalsLeft > 0) {
            if (isHit) {
              mob.crystalsLeft -= 1;
              mob.currentHp = Math.max(1, mob.currentHp - 25);
              pData.damageDealt += 25;
              roundLog.push(`💥 **BÙM!** **${actor.name}** bắn nổ 1 Pha Lê End (-25 HP Rồng, Aim: ${bowAim}%)! Còn ${mob.crystalsLeft}/12 🔮`);
            } else {
              roundLog.push(`💨 **${actor.name}** ngắm bắn Pha Lê End nhưng mũi tên bay trượt (Aim Cung: ${bowAim}%)! Cầu hồi máu của Rồng vẫn còn nguyên (${mob.crystalsLeft}/12 🔮)`);
            }
          } else {
            roundLog.push(`✨ Toàn bộ Pha Lê End đã bị phá hủy!`);
          }
        }
        await executeRound(roundLog);

      } else if (i.customId.startsWith('combat_flee')) {
        const isBossFight = isBoss || mob.isBoss;
        const fleeChance = isBossFight ? (1 / 12) : 0.65; // Boss tỉ lệ 1:12 (~8.33%), quái thường 65%

        if (user.id === player.id) {
          const fleeSuccess = Math.random() < fleeChance;
          if (fleeSuccess) {
            for (const pId of participants.keys()) {
              this.clearCombat(pId);
              if (isBossFight) {
                const p = db.getPlayer(pId);
                if (p) p.lastBossFail = Date.now();
              }
            }
            db.saveData();
            collector.stop('fled');
            const fleeEmbed = new EmbedBuilder()
              .setColor(isBossFight ? 0x7c3aed : 0x3b82f6)
              .setTitle(isBossFight ? '🏃 THÁO CHẠY THÀNH CÔNG KHỎI TRÙM!' : '🏃 Rút Lui An Toàn!')
              .setDescription(
                isBossFight
                  ? `💨 **${player.name}** và các chiến binh đã chớp lấy cơ hội ngàn vàng (**Tỉ lệ kỳ tích 1:12**) để trốn thoát an toàn khỏi **${mob.name} ${mob.emoji}** mà không một ai tử trận!\n\n` +
                    `⏳ *Toàn đội bảo toàn mạng sống và cần nghỉ ngơi 1 tiếng trước khi tái đấu.*`
                  : `**${player.name}** và các đồng đội đã rút lui thành công khỏi **${mob.name}**!`
              );
            await msg.edit({ content: '', embeds: [fleeEmbed], components: [] });
            if (onFinish) onFinish({ fled: true });
            return;
          } else {
            const failReason = isBossFight
              ? `🏃💨 **${actor.name}** liều mạng tìm đường tháo chạy nhưng đã bị Trùm **${mob.name}** chặn đầu (**Thất bại - Tỉ lệ 1:12**)! Trùm lập tức tung đòn trừng phạt!`
              : `🏃 **${actor.name}** cố gắng rút lui nhưng bị vấp ngã! Quái chớp thời cơ tấn công!`;
            roundLog.push(failReason);
            await executeRound(roundLog);
          }
        } else {
          // Người chơi phụ rút lui
          const fleeSuccess = Math.random() < fleeChance;
          if (fleeSuccess) {
            participants.delete(user.id);
            this.clearCombat(user.id);
            if (isBossFight) {
              actor.lastBossFail = Date.now();
              db.saveData();
            }
            roundLog.push(
              isBossFight
                ? `🏃 **${actor.name}** đã may mắn luồn lách thoát khỏi chiến trường Trùm thành công (Tỉ lệ 1:12)!`
                : `🏃 **${actor.name}** đã rút lui khỏi trận chiến!`
            );
            await executeRound(roundLog);
          } else {
            roundLog.push(
              isBossFight
                ? `🏃💨 **${actor.name}** định lén tháo chạy nhưng bị Trùm **${mob.name}** chặn lại (**Thất bại - Tỉ lệ 1:12**)!`
                : `🏃 **${actor.name}** cố gắng rút lui nhưng bị chặn lại!`
            );
            await executeRound(roundLog);
          }
        }
      }
    });

    collector.on('end', async (collected, reason) => {
      for (const pId of participants.keys()) {
        this.clearCombat(pId);
        this.pendingFoodSelects.delete(pId);
      }
      this.pendingFoodSelects.delete(player.id);
      if (reason === 'time') {
        if (isBoss) {
          player.lastBossFail = Date.now();
          for (const pId of participants.keys()) {
            const p = db.getPlayer(pId);
            if (p) p.lastBossFail = Date.now();
          }
          db.saveData();
        }
        const timeoutEmbed = new EmbedBuilder()
           .setColor(0x6b7280)
           .setTitle(isBoss ? '⌛ Hết Thời Gian Đánh Boss (10 phút)!' : '⌛ Hết Thời Gian Chiến Đấu!')
           .setDescription(
             isBoss
               ? `Trận chiến kéo dài quá **10 phút**! Trùm **${mob.name}** ${mob.emoji} gầm vang rồi biến mất vào hư vô!\n\n💡 *Do không hạ được Boss trong 10 phút quy định, bạn cần đợi **1 tiếng** để Boss hồi sinh và khiêu chiến lại.*`
               : `Trận chiến kéo dài quá lâu, **${mob.name}** đã biến mất vào bóng tối!`
           );
        await msg.edit({ content: '', embeds: [timeoutEmbed], components: [] }).catch(() => {});
        if (onFinish) onFinish({ timeout: true });
      }
    });
  }

  /**
   * Xử lý khi người chơi chọn món ăn từ StringSelectMenu trong trận đấu
   */
  async handleFoodSelect(interaction) {
    const userId = interaction.user.id;
    const pending = this.pendingFoodSelects.get(userId);
    if (!pending) {
      return interaction.reply({
        content: '❌ Phiên chọn thức ăn đã hết hạn hoặc trận đấu đã kết thúc!',
        ephemeral: true
      });
    }

    const { executeRound, pData, actor, mob } = pending;
    this.pendingFoodSelects.delete(userId);

    const chosenId = interaction.values[0];
    const itemDef = config.ITEMS[chosenId];

    if (mob.currentHp <= 0) {
      return interaction.update({
        content: `✨ Trận chiến đã kết thúc!`,
        components: []
      }).catch(() => {});
    }

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
    const actualHealed = Math.round(currentActor.hp - oldHp);
    db.saveData();

    // Cập nhật và tự xóa thông báo ephemeral của món ăn sau 1.5s
    await interaction.update({
      content: `✅ Đã dùng ${itemDef ? itemDef.emoji : '🍖'} **${itemDef ? itemDef.name : chosenId}** (+${actualHealed} ❤️ HP)! *(Tự đóng...)*`,
      components: []
    }).catch(() => {});

    setTimeout(() => {
      interaction.deleteReply().catch(() => {});
    }, 1500);

    pData.player = currentActor;

    const healLog = [`🍲 **${actor.name}** đã ăn **${itemDef ? itemDef.name : chosenId}** (+${actualHealed} ❤️ HP)!`];
    await executeRound(healLog);
  }
}

module.exports = new CombatSystem();
