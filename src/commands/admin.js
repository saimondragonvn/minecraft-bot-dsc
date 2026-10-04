const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Bảng lệnh quản trị viên hệ thống Minecraft RPG')
    .addSubcommand(sub =>
      sub.setName('give')
        .setDescription('Tặng vật phẩm / tiền / exp cho người chơi')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi nhận').setRequired(true))
        .addStringOption(opt => opt.setName('item').setDescription('ID vật phẩm (hoặc "all" để nhận tất cả)').setRequired(false))
        .addIntegerOption(opt => opt.setName('count').setDescription('Số lượng').setRequired(false))
        .addNumberOption(opt => opt.setName('coins').setDescription('Tiền xu').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('setlevel')
        .setDescription('Đặt cấp độ cho người chơi')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi').setRequired(true))
        .addIntegerOption(opt => opt.setName('level').setDescription('Cấp độ mới (1-1000)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('setcoins')
        .setDescription('Đặt số tiền xu cho người chơi')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi').setRequired(true))
        .addNumberOption(opt => opt.setName('coins').setDescription('Số tiền xu mới').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('heal')
        .setDescription('Hồi 100% máu và mana cho người chơi')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('resetdragon')
        .setDescription('Xóa thời gian hồi chiêu 5 tiếng săn Rồng Ender để khiêu chiến lại ngay lập tức')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi (để trống nếu là bản thân)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('resetplayer')
        .setDescription('Reset người chơi về vạch xuất phát: Cấp 1, 0 Xu, túi đồ rỗng 0 món, khóa lại toàn bộ khu vực')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi muốn reset (để trống nếu là bản thân)').setRequired(false))
    )
    .addSubcommand(sub =>
      sub.setName('resetall')
        .setDescription('🚨 NGUY HIỂM: Reset toàn bộ người chơi trong server về Cấp 1 và xóa sạch data')
        .addBooleanOption(opt => opt.setName('confirm').setDescription('Xác nhận chắc chắn muốn xóa toàn bộ').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('unlockall')
        .setDescription('Mở khóa toàn bộ Cổng Nether & The End cho người chơi')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('sethp')
        .setDescription('Đặt Máu Tối Đa (Max HP) cho người chơi (Lệnh Admin cheat máu)')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi').setRequired(true))
        .addIntegerOption(opt => opt.setName('hp').setDescription('Số lượng máu tối đa mới').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('addadmin')
        .setDescription('Thêm một người chơi vào danh sách Admin')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('viewplayer')
        .setDescription('Xem toàn bộ hồ sơ chi tiết người chơi (Tin nhắn riêng tư chỉ Admin thấy)')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi muốn xem').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('inspect')
        .setDescription('Xem toàn bộ hồ sơ chi tiết người chơi (Tin nhắn riêng tư chỉ Admin thấy)')
        .addUserOption(opt => opt.setName('target').setDescription('Người chơi muốn xem').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('listitems')
        .setDescription('Xem danh sách tất cả ID vật phẩm trong game để give')
    )
    .addSubcommand(sub =>
      sub.setName('help')
        .setDescription('Xem hướng dẫn toàn bộ lệnh Admin (Slash commands & Chat commands)')
    ),

  async execute(interaction) {
    const callerId = interaction.user.id;
    const caller = db.getPlayer(callerId, interaction.user.username, interaction.user.displayAvatarURL());

    const isOwner = interaction.guild && interaction.guild.ownerId === callerId;
    const hasAdminPerm = interaction.member && interaction.member.permissions && interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
    const isAdmin = config.ADMIN_IDS.includes(callerId) || (caller && caller.isAdmin) || isOwner || hasAdminPerm;

    if (!isAdmin) {
      return interaction.reply({
        content: `❌ **Bạn không có quyền Admin!** Lệnh này chỉ dành cho Quản trị viên hệ thống hoặc Chủ Server.`,
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'help') {
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('👑 BẢNG LỆNH QUẢN TRỊ VIÊN (ADMIN CHEATS)')
        .setDescription(
          `Chào sếp! Dưới đây là toàn bộ danh sách lệnh quản trị viên hệ thống:\n\n` +
          `⚡ **1. LỆNH DẠNG SLASH (\`/admin ...\`):**\n` +
          `• \`/admin viewplayer target:@user\`: **Xem toàn bộ hồ sơ người chơi** (Túi đồ, trang bị, máu, xu, lịch sử tử vong - **Chỉ Admin thấy**)\n` +
          `• \`/admin give target:@user item:[id] count:[số] coins:[tiền]\`: Tặng đồ hoặc tiền cho người chơi (gõ item: \`all\` để nhận x64 tất cả đồ).\n` +
          `• \`/admin setlevel target:@user level:[cấp]\`: Đặt cấp độ tùy thích cho người chơi.\n` +
          `• \`/admin setcoins target:@user coins:[tiền]\`: Đặt số dư xu cho người chơi.\n` +
          `• \`/admin heal target:@user\`: Hồi 100% máu và mana cho người chơi.\n` +
          `• \`/admin resetdragon [target:@user]\`: **Xóa hồi chiêu 5 tiếng săn Rồng**, cho phép vào đập Rồng ngay tức khắc!\n` +
          `• \`/admin resetplayer [target:@user]\`: Xóa sạch đồ và reset về Cấp 1, 0 Xu, khóa các chiều không gian (để trống target nếu tự reset bản thân).\n` +
          `• \`/admin resetall confirm:True\`: **🚨 RESET TOÀN BỘ SERVER**, đưa tất cả người chơi về vạch xuất phát ban đầu.\n` +
          `• \`/admin unlockall target:@user\`: Mở khóa cả 2 cổng Nether 🌋 & The End 🌌 miễn phí.\n` +
          `• \`/admin addadmin target:@user\`: Cấp quyền admin vĩnh viễn cho một người chơi.\n` +
          `• \`/admin listitems\`: Xem toàn bộ ID các vật phẩm để give.\n\n` +
          `💬 **2. LỆNH DẠNG CHAT TEXT NHANH (\`!... \`):**\n` +
          `*(Admin có thể gõ trực tiếp vào khung chat không cần chờ gợi ý slash)*\n` +
          `• \`!viewplayer @user\` hoặc \`!inspect @user\`: **Gửi toàn bộ hồ sơ chi tiết vào DM tin nhắn riêng của Admin**\n` +
          `• \`!give @user all 64\`: Tặng full 64 cái tất cả mọi món đồ trong game!\n` +
          `• \`!give @user [tên_món] [số_lượng]\`: Tặng món đồ (vd: \`!give @user diamond 64\`)\n` +
          `• \`!give @user coins [số_tiền]\`: Tặng tiền (vd: \`!give @user coins 50000\`)\n` +
          `• \`!give @user exp [số_exp]\`: Tặng exp (vd: \`!give @user exp 5000\`)\n` +
          `• \`!setlevel @user [cấp]\` hoặc \`!setlv @user [cấp]\`: Đặt level (vd: \`!setlevel @user 50\`)\n` +
          `• \`!heal @user\`: Hồi 100% máu mana\n` +
          `• \`!resetdragon [@user]\`: Reset hồi chiêu săn Rồng Ender\n` +
          `• \`!resetplayer [@user]\`: Reset người chơi về Cấp 1, 0 Xu, túi đồ rỗng, khóa Nether & End\n` +
          `• \`!resetall\`: Reset toàn bộ người chơi trong server về đầu\n` +
          `• \`!clear @user all\`: Dọn sạch túi đồ của người chơi\n` +
          `• \`!admin\`: Mở lại bảng hướng dẫn này`
        )
        .setFooter({ text: 'Quyền hạn: Admin BOT & Chủ Server Discord' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'listitems') {
      const list = Object.keys(config.ITEMS).map(k => `• \`${k}\`: ${config.ITEMS[k].emoji} ${config.ITEMS[k].name}`);
      const chunkSize = 35;
      const firstChunk = list.slice(0, chunkSize).join('\n');
      const secondChunk = list.slice(chunkSize, chunkSize * 2).join('\n');
      return interaction.reply({
        embeds: [
          new EmbedBuilder().setColor(0x3b82f6).setTitle('📦 Danh Sách ID Vật Phẩm (Trang 1)').setDescription(firstChunk),
          new EmbedBuilder().setColor(0x3b82f6).setTitle('📦 Danh Sách ID Vật Phẩm (Trang 2)').setDescription(secondChunk)
        ],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('target') || interaction.user;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());

    // Xem thông tin chi tiết người chơi (Chỉ Admin thấy - Ephemeral)
    if (sub === 'viewplayer' || sub === 'inspect') {
      const embed = this.buildInspectEmbed(target);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'resetdragon') {
      target.lastDragonFight = 0;
      db.saveData();
      return interaction.reply({
        content: `<@${target.id}>`,
        embeds: [new EmbedBuilder().setColor(0x22c55e).setTitle('🐲 Reset Hồi Chiêu Rồng Ender').setDescription(`Đã xóa thời gian hồi chiêu 5 tiếng cho <@${target.id}>! Người chơi có thể khiêu chiến hoặc lập đội săn Rồng ngay lập tức!`)]
      });
    }

    if (sub === 'resetplayer') {
      db.resetPlayer(target);
      return interaction.reply({
        content: `<@${target.id}>`,
        embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('🔄 Reset Người Chơi').setDescription(`Đã đưa <@${target.id}> trở về vạch xuất phát: Cấp 1, 0 Xu, Túi đồ rỗng 0 món, 40 HP cơ bản và khóa lại toàn bộ Nether & The End!`)]
      });
    }

    if (sub === 'resetall') {
      const confirm = interaction.options.getBoolean('confirm');
      if (!confirm) {
        return interaction.reply({ content: `❌ Bạn chưa xác nhận! Cần chọn confirm: True để thực hiện reset toàn bộ server.`, ephemeral: true });
      }
      const count = db.resetAllPlayers();
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('🚨 RESET TOÀN BỘ SERVER THÀNH CÔNG').setDescription(`Đã đưa toàn bộ **${count} người chơi** trở về vạch xuất phát ban đầu:\n• Toàn bộ Cấp độ: Lv 1, 0 EXP\n• Số dư: 0 Xu, 0 Bank\n• Xóa sạch toàn bộ túi đồ, rương nhà và trang bị\n• Khóa lại toàn bộ Chiều Không Gian (Nether, The End) và khu vực (Lò nung, Bàn phù phép)!`)]
      });
    }

    if (sub === 'give') {
      const itemId = interaction.options.getString('item');
      const count = interaction.options.getInteger('count') || 1;
      const coins = interaction.options.getNumber('coins') || 0;

      const msgs = [];
      if (itemId) {
        if (itemId.toLowerCase() === 'all') {
          for (const k of Object.keys(config.ITEMS)) {
            db.addItem(target, k, count || 64);
          }
          msgs.push(`• Đã tặng x${count || 64} **TẤT CẢ VẬT PHẨM TRONG GAME** 🌟`);
        } else {
          let found = Object.keys(config.ITEMS).find(k => k.toLowerCase() === itemId.toLowerCase());
          if (!found) {
            found = Object.keys(config.ITEMS).find(k => config.ITEMS[k].name.toLowerCase().includes(itemId.toLowerCase()));
          }
          if (found) {
            db.addItem(target, found, count);
            msgs.push(`• ${config.ITEMS[found].emoji} x${count} **${config.ITEMS[found].name}**`);
          } else {
            msgs.push(`• ❌ Không tìm thấy món đồ: "${itemId}" (dùng \`/admin listitems\` để xem ID)`);
          }
        }
      }
      if (coins > 0) {
        target.coins = Math.round((target.coins + coins) * 100) / 100;
        msgs.push(`• 🪙 +${coins} Xu`);
      }
      db.saveData();
      return interaction.reply({ content: `<@${target.id}>`, embeds: [new EmbedBuilder().setColor(0x22c55e).setTitle('🎁 Admin Give').setDescription(`Đã trao cho <@${target.id}>:\n` + msgs.join('\n'))] });
    }

    if (sub === 'setlevel') {
      const lvl = interaction.options.getInteger('level');
      target.level = lvl;
      target.maxExp = Math.round(lvl * 200 * 1.2);
      target.exp = 0;
      target.maxHp = db.getMaxHp(target);
      target.hp = target.maxHp;
      target.maxMana = 10 + (lvl - 1) * 2;
      target.mana = target.maxMana;
      db.saveData();
      return interaction.reply({ content: `<@${target.id}>`, embeds: [new EmbedBuilder().setColor(0x8b5cf6).setTitle('⭐ Admin Set Level').setDescription(`Đã đặt cấp độ của <@${target.id}> thành Cấp **${lvl}**! (HP: ${target.maxHp}, Mana: ${target.maxMana})`)] });
    }

    if (sub === 'sethp') {
      const hp = interaction.options.getInteger('hp');
      if (hp <= 0) {
        return interaction.reply({ content: `❌ Số lượng máu phải lớn hơn 0!`, ephemeral: true });
      }
      target.customMaxHp = hp;
      target.maxHp = hp;
      target.hp = hp;
      db.saveData();
      return interaction.reply({
        content: `<@${target.id}>`,
        embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('❤️ Admin Set HP').setDescription(`Đã đặt Máu Tối Đa của <@${target.id}> thành **${hp} HP**!`)]
      });
    }

    if (sub === 'setcoins') {
      const c = interaction.options.getNumber('coins');
      target.coins = c;
      db.saveData();
      return interaction.reply({ content: `<@${target.id}>`, embeds: [new EmbedBuilder().setColor(0xeab308).setTitle('🪙 Admin Set Coins').setDescription(`Đã đặt số dư của <@${target.id}> thành **${c} Xu**!`)] });
    }

    if (sub === 'heal') {
      target.hp = target.maxHp;
      target.mana = target.maxMana;
      db.saveData();
      return interaction.reply({ content: `<@${target.id}>`, embeds: [new EmbedBuilder().setColor(0x06b6d4).setTitle('❤️ Admin Heal').setDescription(`Đã hồi phục 100% Máu và Mana cho <@${target.id}>!`)] });
    }

    if (sub === 'unlockall') {
      if (!target.unlocked) target.unlocked = {};
      target.unlocked.nether = true;
      target.unlocked.the_end = true;
      db.saveData();
      return interaction.reply({ content: `<@${target.id}>`, embeds: [new EmbedBuilder().setColor(0xec4899).setTitle('🔓 Admin Unlock All').setDescription(`Đã mở khóa Cổng Nether 🌋 và Cổng The End 🌌 cho <@${target.id}>!`)] });
    }

    if (sub === 'addadmin') {
      target.isAdmin = true;
      if (!config.ADMIN_IDS.includes(target.id)) {
        config.ADMIN_IDS.push(target.id);
      }
      db.saveData();
      return interaction.reply({ content: `<@${target.id}>`, embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('👑 Trao Quyền Admin').setDescription(`Đã trao quyền Admin cho <@${target.id}>!`)] });
    }
  },

  /**
   * Tạo Embed hiển thị toàn bộ hồ sơ chi tiết của người chơi
   */
  buildInspectEmbed(target) {
    const eq = target.equipment || {};
    const formatSlot = (itemId) => {
      if (!itemId) return '*Trống*';
      const itemDef = config.ITEMS[itemId];
      return itemDef ? `${itemDef.emoji} **${itemDef.name}**` : itemId;
    };

    const usedSlots = db.getUsedSlots(target);
    const maxSlots = db.getMaxSlots(target);
    const totalDef = db.getTotalDefense(target);
    const totalAtk = db.getTotalAttack(target);
    const dmgRed = db.getDamageReduction(totalDef);

    // 1. Format túi đồ
    let invText = '';
    if (!target.inventory || target.inventory.length === 0) {
      invText = '*(Túi đồ rỗng 0 món)*';
    } else {
      const itemsList = target.inventory.map(i => {
        const def = config.ITEMS[i.itemId];
        const emoji = def ? def.emoji : '📦';
        const name = def ? def.name : i.itemId;
        return `• ${emoji} **${name}**: x${i.count}`;
      });
      if (itemsList.length <= 25) {
        invText = itemsList.join('\n');
      } else {
        invText = itemsList.slice(0, 25).join('\n') + `\n*...và ${itemsList.length - 25} loại vật phẩm khác*`;
      }
    }

    // 2. Format rương an toàn tại nhà
    let chestText = '';
    if (!target.chest || target.chest.length === 0) {
      chestText = '*(Rương tại Nhà rỗng)*';
    } else {
      chestText = target.chest.slice(0, 15).map(i => {
        const def = config.ITEMS[i.itemId];
        return `• ${def ? def.emoji : '📦'} **${def ? def.name : i.itemId}**: x${i.count}`;
      }).join('\n');
      if (target.chest.length > 15) {
        chestText += `\n*...và ${target.chest.length - 15} món khác*`;
      }
    }

    // 3. Format bùa phép enchants
    let enchantText = '';
    if (target.enchants && Object.keys(target.enchants).length > 0) {
      const lines = [];
      for (const [slot, encObj] of Object.entries(target.enchants)) {
        const encList = Object.entries(encObj).map(([encId, lv]) => `${encId} Lv.${lv}`).join(', ');
        lines.push(`• **${slot}**: ${encList}`);
      }
      enchantText = lines.join('\n');
    } else {
      enchantText = '*Chưa có bùa phù phép nào*';
    }

    const embed = new EmbedBuilder()
      .setColor(0x6366f1)
      .setTitle(`🔍 HỒ SƠ CHI TIẾT NGƯỜI CHƠI: ${target.name}`)
      .setThumbnail(target.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png')
      .setDescription(
        `👤 **Tài khoản:** <@${target.id}> (ID: \`${target.id}\`)\n` +
        `⭐ **Cấp độ:** Cấp **${target.level}** (EXP: **${Math.round(target.exp)}/${target.maxExp}**)\n` +
        `❤️ **Máu:** **${Math.round(target.hp)}/${target.maxHp} HP** | 💧 **Mana:** **${Math.round(target.mana)}/${target.maxMana}**\n` +
        `🪙 **Tiền mặt:** **${target.coins} Xu** | 🏦 **Ngân hàng:** **${target.bank || 0} Xu**\n` +
        `🎒 **Sức chứa:** **${usedSlots}/${maxSlots} Ô (Slot)** (Rương đã chế: **${target.chestsCrafted || 0}**)\n` +
        `⚔️ **Tổng Công:** **${totalAtk}** | 🛡️ **Tổng Giáp:** **${totalDef}** (Giảm **${dmgRed}%** ST)\n` +
        `🎯 **Khéo léo:** Cấp **${db.getDexterity(target)}/25** (Aim Kiếm: **${db.getSwordAim(target)}%**, Aim Cung: **${db.getBowAim(target)}%**)`
      )
      .addFields(
        {
          name: '🛡️ Trang Bị Đang Mặc',
          value:
            `• Kiếm: ${formatSlot(eq.sword)}\n` +
            `• Cúp: ${formatSlot(eq.pickaxe)}\n` +
            `• Rìu: ${formatSlot(eq.axe)}\n` +
            `• Cung: ${formatSlot(eq.bow)}\n` +
            `• Khiên: ${eq.shield ? '🛡️ Khiên Chắn' : '*Trống*'}\n` +
            `• Mũ: ${formatSlot(eq.helmet)} | Áo: ${formatSlot(eq.chestplate)}\n` +
            `• Quần: ${formatSlot(eq.leggings)} | Giày: ${formatSlot(eq.boots)}`,
          inline: true
        },
        {
          name: '📊 Thống Kê & Lịch Sử Tử Vong',
          value:
            `• ☠️ Số lần tử vong: **${target.stats?.deaths || 0} lần**\n` +
            `• ⚰️ Chết gần nhất: **${target.lastDeathReason || 'Chưa từng tử vong'}**\n` +
            `• 👾 Quái đã diệt: **${target.stats?.mobsKilled || 0} con**\n` +
            `• 🐲 Rồng đã hạ: **${target.stats?.dragonKilled || 0} lần**\n` +
            `• ⚔️ PvP Thắng/Thua: **${target.stats?.pvpWins || 0}W / ${target.stats?.pvpLosses || 0}L**\n` +
            `• 🩸 Máu PvP cướp: **${target.pvpHpStolen || 0}/50 HP**\n` +
            `• 🌋 Nether: **${target.unlocked?.nether ? '✅ Đã mở' : '❌ Chưa'}** | 🌌 The End: **${target.unlocked?.the_end ? '✅ Đã mở' : '❌ Chưa'}**`,
          inline: true
        },
        {
          name: '✨ Phù Phép (Enchantments)',
          value: enchantText,
          inline: false
        },
        {
          name: `🎒 Chi Tiết Túi Đồ (${target.inventory ? target.inventory.length : 0} loại vật phẩm)`,
          value: invText,
          inline: false
        },
        {
          name: `🏠 Rương An Toàn Tại Nhà (${target.chest ? target.chest.length : 0} món)`,
          value: chestText,
          inline: false
        }
      )
      .setFooter({ text: '🔒 Tin nhắn riêng tư chỉ có Bạn (Admin) nhìn thấy' })
      .setTimestamp();

    return embed;
  }
};
