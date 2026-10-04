require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ActivityType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('./database/db');
const timeSystem = require('./systems/timeSystem');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
const commandsList = [];

// Tải tất cả các lệnh trong thư mục src/commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    commandsList.push(command.data.toJSON());
  } else {
    console.warn(`[Warning] Lệnh tại ${filePath} thiếu thuộc tính "data" hoặc "execute"!`);
  }
}

// Hàm triển khai Slash Commands cho Server cụ thể (Hiển thị tức thì 0s)
async function deployGuildCommands(guildId, guildName = '') {
  if (!process.env.CLIENT_ID || !process.env.DISCORD_TOKEN) return;
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      { body: commandsList }
    );
    console.log(`[Deploy] ✅ Đã đăng ký tức thời ${commandsList.length} commands cho Server: "${guildName || guildId}"!`);
  } catch (err) {
    console.error(`[Deploy] ❌ Lỗi đăng ký commands cho server ${guildId}:`, err.message);
  }
}

// Khi Bot sẵn sàng hoạt động
client.once('ready', async () => {
  console.log(`===============================================`);
  console.log(`🤖 Bot Minecraft RPG đã đăng nhập thành công: ${client.user.tag}`);
  console.log(`⏰ Chu kỳ thời gian Minecraft 24h đã kích hoạt!`);
  console.log(`===============================================`);

  // Cập nhật trạng thái Bot
  const updatePresence = () => {
    const timeInfo = timeSystem.getMinecraftTime();
    client.user.setPresence({
      activities: [{ name: `Minecraft RPG ${timeInfo.icon} [${timeInfo.timeString}] | /menu & !menu`, type: ActivityType.Playing }],
      status: 'online'
    });
  };

  updatePresence();
  setInterval(updatePresence, 30000);

  // Đăng ký Slash Commands
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  try {
    console.log(`[Deploy] Đang đăng ký ${commandsList.length} slash commands...`);

    if (process.env.CLIENT_ID) {
      // 1. Đăng ký TỨC THỜI cho tất cả các Server (Guilds) bot đang tham gia
      for (const [guildId, guild] of client.guilds.cache) {
        await deployGuildCommands(guildId, guild.name);
      }

      // Nếu có GUILD_ID trong .env mà chưa có trong cache thì nạp thêm
      if (process.env.GUILD_ID && !client.guilds.cache.has(process.env.GUILD_ID)) {
        await deployGuildCommands(process.env.GUILD_ID, 'Configured Guild');
      }

      // 2. Đăng ký Toàn cầu (Global)
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commandsList }
      );
      console.log(`[Deploy] ✅ Đã đăng ký thành công commands toàn cầu (Global)!`);
    } else {
      console.warn(`[Deploy] Chưa cấu hình CLIENT_ID trong file .env! Lệnh slash sẽ không được tự động đăng ký.`);
    }
  } catch (error) {
    console.error('[Deploy] Lỗi khi đăng ký slash commands:', error);
  }
});

// Tự động nạp commands ngay khi bot được thêm vào server mới
client.on('guildCreate', async guild => {
  console.log(`[Guild] Bot vừa được thêm vào server mới: "${guild.name}" (${guild.id})`);
  await deployGuildCommands(guild.id, guild.name);
});

// Kiểm tra người chơi có đang trong trạng thái chiến đấu (PVE, PVP, Raid Boss) không
function checkPlayerCombat(userId) {
  const combatSystem = require('./systems/combatSystem');
  const partySystem = require('./systems/partySystem');
  const pvpSystem = require('./systems/pvpSystem');

  if (combatSystem.isInCombat(userId)) {
    const info = combatSystem.getCombatInfo(userId);
    return {
      inCombat: true,
      target: info ? `${info.mobEmoji} ${info.mobName}` : 'Quái vật'
    };
  }

  const party = partySystem.getPlayerParty(userId);
  if (party && party.status === 'in_combat') {
    return {
      inCombat: true,
      target: '🐲 Rồng Ender (Tổ Đội Raid)'
    };
  }

  if (pvpSystem.isPlayerInPvP && pvpSystem.isPlayerInPvP(userId)) {
    return {
      inCombat: true,
      target: '⚔️ Đấu Trường PvP'
    };
  }

  return { inCombat: false };
}

// Xử lý các tương tác người dùng (Slash Commands, Buttons, Select Menus)
client.on('interactionCreate', async interaction => {
  try {
    // 1. Lệnh gõ (/menu, /mine, /chop, /pvp, /hunt, /party, /give, ...)
    if (interaction.isChatInputCommand()) {
      const commandName = interaction.commandName;

      // Chặn dùng các lệnh khác khi đang đánh quái/boss
      const isAllowedDuringCombat = ['admin'].includes(commandName);
      if (!isAllowedDuringCombat) {
        const combat = checkPlayerCombat(interaction.user.id);
        if (combat.inCombat) {
          return interaction.reply({
            content: `⚔️ **Bạn đang trong trận chiến với ${combat.target}!**\n❌ Không thể dùng lệnh \`/${commandName}\` để làm việc khác lúc này!\nHãy hoàn thành trận chiến hoặc chọn **Bỏ Chạy** (\`🏃\`).`,
            ephemeral: true
          });
        }
      }

      const command = client.commands.get(commandName);
      if (!command) return;

      await command.execute(interaction);
      return;
    }

    // 2. Tương tác Nút bấm Menu, Khu vực & Tổ Đội Săn Rồng
    if (interaction.isButton()) {
      const customId = interaction.customId;
      const isCombatButton = customId.startsWith('combat_') ||
                             customId.startsWith('pvp_') ||
                             customId.startsWith('raid_') ||
                             customId.startsWith('party_combat_') ||
                             customId.startsWith('party_action_');

      if (!isCombatButton) {
        const combat = checkPlayerCombat(interaction.user.id);
        if (combat.inCombat) {
          return interaction.reply({
            content: `⚔️ **Bạn đang trong trận chiến với ${combat.target}!**\n❌ Không thể thao tác menu hay làm việc khác lúc này! Hãy tập trung vào trận đấu.`,
            ephemeral: true
          });
        }
      }

      if (customId.startsWith('trade_')) {
        const tradeSystem = require('./systems/tradeSystem');
        await tradeSystem.handleButton(interaction);
        return;
      }

      if (customId.startsWith('craft_list_')) {
        const craftCommand = client.commands.get('craft');
        if (craftCommand && craftCommand.handleButton) {
          await craftCommand.handleButton(interaction);
          return;
        }
      }

      const menuCommand = client.commands.get('menu');
      if (menuCommand && menuCommand.handleButton) {
        const menuPrefixes = [
          'menu_', 'info_', 'inv_', 'area_', 'home_', 'forest_', 'cave_',
          'dungeon_', 'nether_', 'end_', 'setting_', 'bank_', 'explore_',
          'party_', 'equip_', 'unequip_', 'enchant_', 'anvil_', 'eat_',
          'furnace_', 'stat_', 'sell_', 'shop_', 'craft_tab_', 'disenchant_'
        ];
        if (menuPrefixes.some(prefix => customId.startsWith(prefix))) {
          await menuCommand.handleButton(interaction);
          return;
        }
      }
    }

    // 3. Tương tác Select Menu (chọn món đồ để dùng / chế tạo / phù phép / mặc đồ trong menu chính)
    if (interaction.isStringSelectMenu()) {
      const customId = interaction.customId;
      const isCombatSelect = customId.startsWith('combat_') || customId.startsWith('pvp_') || customId.startsWith('raid_');
      if (!isCombatSelect) {
        const combat = checkPlayerCombat(interaction.user.id);
        if (combat.inCombat) {
          return interaction.reply({
            content: `⚔️ **Bạn đang trong trận chiến với ${combat.target}!**\n❌ Không thể chọn menu thao tác khác lúc này!`,
            ephemeral: true
          });
        }
      }

      if (customId.startsWith('combat_food_')) {
        const combatSystem = require('./systems/combatSystem');
        await combatSystem.handleFoodSelect(interaction);
        return;
      }

      if (customId.startsWith('pvp_food_')) {
        const pvpSystem = require('./systems/pvpSystem');
        await pvpSystem.handleFoodSelect(interaction);
        return;
      }

      if (customId.startsWith('raid_food_')) {
        const partySystem = require('./systems/partySystem');
        await partySystem.handleFoodSelect(interaction);
        return;
      }

      const menuCommand = client.commands.get('menu');
      if (menuCommand && menuCommand.handleSelectMenu) {
        const menuSelectPrefixes = ['inv_', 'enchant_', 'craft_', 'equip_', 'unequip_', 'eat_', 'anvil_', 'furnace_', 'home_', 'combine_', 'sell_', 'shop_', 'disenchant_'];
        if (menuSelectPrefixes.some(prefix => customId.startsWith(prefix))) {
          await menuCommand.handleSelectMenu(interaction);
          return;
        }
      }
    }
  } catch (error) {
    console.error('[Interaction] Lỗi xử lý sự kiện tương tác:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Đã có lỗi xảy ra khi thực thi lệnh này!', ephemeral: true }).catch(() => {});
    }
  }
});

// Hỗ trợ lệnh tiền tố text dạng ! (!menu, !give, !setlv, !party, !chop, !mine, !help, ...)
// Giúp người chơi gõ được ngay lập tức 100% không lo bị delay cache của Discord
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Chặn lệnh text khi đang trong trận chiến (ngoại trừ lệnh admin)
  const isAllowedTextDuringCombat = ['admin', 'give', 'setlevel', 'setlv', 'resetdragon', 'resetplayer', 'resetall', 'reset', 'resetmyplayer', 'heal', 'unlockall', 'listitems', 'items', 'viewplayer', 'inspect', 'checkplayer'].includes(commandName);
  if (!isAllowedTextDuringCombat) {
    const combat = checkPlayerCombat(message.author.id);
    if (combat.inCombat) {
      return message.reply({
        content: `⚔️ <@${message.author.id}> **Bạn đang trong trận chiến với ${combat.target}!**\n❌ Không thể gõ lệnh \`!${commandName}\` để làm việc khác! Hãy quay lại tin nhắn chiến đấu và hoàn thành trận đấu (Tấn công hoặc Bỏ chạy \`🏃\`).`
      });
    }
  }

  const player = db.getPlayer(message.author.id, message.author.username, message.author.displayAvatarURL());

  // !menu
  if (commandName === 'menu') {
    const uiHelper = require('./utils/uiHelper');
    const payload = uiHelper.buildMainMenu(player);
    return message.reply(payload);
  }

  // !help
  if (commandName === 'help') {
    const cmd = client.commands.get('help');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !chop
  if (commandName === 'chop') {
    const cmd = client.commands.get('chop');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !mine
  if (commandName === 'mine') {
    const cmd = client.commands.get('mine');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !explore
  if (commandName === 'explore') {
    const cmd = client.commands.get('explore');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: { getString: () => args[0] || null },
        deferred: false,
        replied: false,
        reply: (payload) => message.reply(payload),
        editReply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !party hoặc !raid
  if (commandName === 'party' || commandName === 'raid') {
    const partySystem = require('./systems/partySystem');
    const sub = args[0] ? args[0].toLowerCase() : 'status';

    if (sub === 'create') {
      const mockInteraction = {
        channelId: message.channel.id,
        reply: (payload) => message.reply(payload)
      };
      return partySystem.createParty(mockInteraction, player);
    }

    if (sub === 'invite') {
      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        return message.reply({ content: `<@${player.id}> Vui lòng tag người chơi muốn mời: \`!party invite @người_chơi\`` });
      }
      const mockInteraction = {
        reply: (payload) => message.reply(payload)
      };
      return partySystem.invitePlayer(mockInteraction, player, targetUser);
    }

    if (sub === 'leave') {
      const currentParty = partySystem.getPlayerParty(player.id);
      if (!currentParty) {
        return message.reply({ content: `<@${player.id}> ❌ Bạn hiện không ở trong đội nào!` });
      }
      const mockInteraction = {
        reply: (payload) => message.reply(payload),
        update: (payload) => message.channel.send(payload),
        followUp: (payload) => message.channel.send(payload)
      };
      return partySystem.leaveParty(mockInteraction, currentParty.id, player);
    }

    if (sub === 'start') {
      const currentParty = partySystem.getPlayerParty(player.id);
      if (!currentParty) {
        return message.reply({ content: `<@${player.id}> ❌ Bạn chưa ở trong đội nào!` });
      }
      if (currentParty.leaderId !== player.id) {
        return message.reply({ content: `<@${player.id}> ❌ Chỉ có chủ đội mới có quyền bắt đầu trận chiến!` });
      }
      const mockInteraction = {
        user: message.author,
        channel: message.channel,
        reply: (payload) => message.reply(payload),
        update: (payload) => message.channel.send(payload),
        editReply: (payload) => message.channel.send(payload),
        deferred: false,
        replied: false
      };
      return partySystem.startRaid(mockInteraction, currentParty.id);
    }

    // Mặc định status
    const currentParty = partySystem.getPlayerParty(player.id);
    if (!currentParty) {
      return message.reply({ content: `<@${player.id}> Bạn chưa ở trong đội nào. Dùng \`!party create\` hoặc \`/party create\` để tạo đội săn rồng!` });
    }
    const payload = partySystem.buildLobbyMessage(currentParty);
    return message.reply({ content: `<@${player.id}>`, ...payload });
  }

  // Lệnh Admin trợ giúp & kiểm tra quyền
  const isMsgAdmin = () => {
    const config = require('./config');
    const isOwner = message.guild && message.guild.ownerId === message.author.id;
    const hasAdminPerm = message.member && message.member.permissions && message.member.permissions.has && message.member.permissions.has(PermissionsBitField.Flags.Administrator);
    return config.ADMIN_IDS.includes(message.author.id) || (player && player.isAdmin) || isOwner || hasAdminPerm;
  };

  // !admin
  if (commandName === 'admin') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin! (Chỉ dành cho Admin BOT và Chủ/Quản trị viên Server)` });
    }
    const sub = args[0] ? args[0].toLowerCase() : 'help';
    if (sub === 'help') {
      const embed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('👑 BẢNG LỆNH QUẢN TRỊ VIÊN (ADMIN CHEATS)')
        .setDescription(
          `Chào Admin <@${message.author.id}>! Dưới đây là danh sách đầy đủ các lệnh Admin:\n\n` +
          `💬 **LỆNH GÕ NHANH BẰNG DẤU CHẤM THAN (\`!\`):**\n` +
          `• \`!give @user all 64\`: Tặng x64 tất cả vật phẩm cho người chơi (hoặc \`!give all 64\` cho bản thân)\n` +
          `• \`!give @user [món_đồ] [số_lượng]\`: Tặng vật phẩm (vd: \`!give @user diamond 64\`)\n` +
          `• \`!give @user coins [số_tiền]\`: Tặng tiền (vd: \`!give @user coins 50000\`)\n` +
          `• \`!give @user exp [số_exp]\`: Tặng EXP (vd: \`!give @user exp 5000\`)\n` +
          `• \`!setlevel @user [cấp]\` hoặc \`!setlv [cấp]\`: Đặt cấp độ người chơi\n` +
          `• \`!heal [@user]\`: Hồi 100% máu và mana\n` +
          `• \`!resetdragon [@user]\`: **Xóa hồi chiêu 5 tiếng săn Rồng**, vào đập rồng ngay!\n` +
          `• \`!resetplayer @user\`: Reset người chơi về vạch xuất phát: Cấp 1, 0 Xu, túi đồ rỗng\n` +
          `• \`!unlockall [@user]\`: Mở khóa Cổng Nether & The End\n` +
          `• \`!listitems\`: Xem toàn bộ ID các vật phẩm để give\n` +
          `• \`!clear @user all\`: Dọn sạch túi đồ người chơi\n\n` +
          `⚡ **LỆNH SLASH (\`/admin ...\`):**\n` +
          `• \`/admin help\` | \`/admin give\` | \`/admin resetdragon\` | \`/admin resetplayer\` | \`/admin setlevel\` | \`/admin setcoins\` | \`/admin heal\` | \`/admin unlockall\` | \`/admin listitems\``
        )
        .setFooter({ text: 'Quyền: Discord Administrator, Server Owner, hoặc Admin Bot' });
      return message.reply({ embeds: [embed] });
    }
  }

  // !viewplayer hoặc !inspect hoặc !checkplayer (Chỉ Admin thấy qua DM bí mật)
  if (commandName === 'viewplayer' || commandName === 'inspect' || commandName === 'checkplayer' || (commandName === 'admin' && (args[0] === 'view' || args[0] === 'viewplayer' || args[0] === 'inspect'))) {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const targetUser = message.mentions.users.first() || message.author;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    const adminCmd = require('./commands/admin');
    const embed = adminCmd.buildInspectEmbed(target);

    try {
      await message.author.send({ embeds: [embed] });
      const confirmMsg = await message.reply({
        content: `🔒 <@${message.author.id}> Đã gửi toàn bộ hồ sơ chi tiết của <@${target.id}> vào **Tin nhắn riêng (DM)** của bạn để bảo mật!`
      });
      setTimeout(() => {
        confirmMsg.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 7000);
    } catch (dmErr) {
      const tempMsg = await message.reply({
        content: `⚠️ <@${message.author.id}> Bot không thể gửi DM do bạn đã đóng tin nhắn riêng! Dưới đây là hồ sơ chi tiết (sẽ tự hủy sau 30 giây để bảo mật):`,
        embeds: [embed]
      });
      setTimeout(() => {
        tempMsg.delete().catch(() => {});
        message.delete().catch(() => {});
      }, 30000);
    }
    return;
  }

  // !trade @user [món_đồ] [số_lượng] [giá_xu] (Yêu cầu Cấp 10+)
  if (commandName === 'trade') {
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      return message.reply({
        content: `❌ **Cú pháp:** \`!trade @người_chơi [món_đồ] [số_lượng] [giá_xu]\`\n*(Ví dụ: \`!trade @Player diamond 5 500\` để bán 5 kim cương giá 500 Xu, hoặc \`!trade @Player diamond 1 0\` để tặng)*\n*(Yêu cầu cả 2 đạt Cấp 10+)*`
      });
    }

    const nonMentionArgs = args.filter(a => !a.startsWith('<@'));
    const itemId = nonMentionArgs[0] ? nonMentionArgs[0].toLowerCase().trim() : null;
    const count = parseInt(nonMentionArgs[1], 10) || 1;
    const price = parseInt(nonMentionArgs[2], 10) || 0;

    if (!itemId) {
      return message.reply({ content: `❌ Vui lòng nhập ID vật phẩm muốn giao dịch! (Ví dụ: \`diamond\`, \`iron_ingot\`)` });
    }

    const tradeSystem = require('./systems/tradeSystem');
    const seller = db.getPlayer(message.author.id, message.author.username, message.author.displayAvatarURL());
    const buyer = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());

    const result = tradeSystem.createTradeOffer({
      seller,
      buyer,
      itemId,
      count,
      price
    });

    if (!result.success) {
      return message.reply({ content: `<@${message.author.id}> ${result.message}` });
    }

    return message.reply({
      content: result.content,
      embeds: [result.embed],
      components: [result.row]
    });
  }

  // !resetdragon
  if (commandName === 'resetdragon') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const targetUser = message.mentions.users.first() || message.author;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    target.lastDragonFight = 0;
    db.saveData();
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0x22c55e).setTitle('🐲 Reset Hồi Chiêu Rồng Ender').setDescription(`Đã xóa thời gian hồi chiêu 5 tiếng cho <@${target.id}>! Người chơi có thể khiêu chiến hoặc lập đội săn Rồng ngay lập tức!`)]
    });
  }

  // !resetplayer
  if (commandName === 'resetplayer') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin! (Dùng \`!reset\` nếu muốn tự reset nhân vật của chính bạn)` });
    }
    const targetUser = message.mentions.users.first() || message.author;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    db.resetPlayer(target);
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('🔄 Reset Người Chơi').setDescription(`Đã đưa <@${target.id}> trở về vạch xuất phát: Cấp 1, 0 Xu, Túi đồ rỗng 0 món, 40 HP cơ bản và khóa lại toàn bộ Nether & The End!`)]
    });
  }

  // !resetall (Dành cho Admin - Reset toàn bộ server)
  if (commandName === 'resetall') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const count = db.resetAllPlayers();
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('🚨 RESET TOÀN BỘ SERVER THÀNH CÔNG').setDescription(`Đã đưa toàn bộ **${count} người chơi** trở về vạch xuất phát ban đầu:\n• Toàn bộ Cấp độ: Lv 1, 0 EXP\n• Số dư: 0 Xu, 0 Bank\n• Xóa sạch toàn bộ túi đồ, rương nhà và trang bị\n• Khóa lại toàn bộ Chiều Không Gian (Nether, The End) và khu vực (Lò nung, Bàn phù phép)!`)]
    });
  }

  // !reset hoặc !resetmyplayer (Dành cho bất kỳ người chơi nào muốn tự làm lại từ đầu)
  if (commandName === 'reset' || commandName === 'resetmyplayer') {
    db.resetPlayer(player);
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0xef4444).setTitle('🔄 Khởi Động Lại Từ Đầu').setDescription(`Đã reset tài khoản <@${message.author.id}> về vạch xuất phát ban đầu:\n• Cấp độ: Lv 1 (0 EXP)\n• Số dư: 0 Xu\n• Túi đồ & Rương: Rỗng 0 món\n• Khóa lại toàn bộ Chiều Không Gian (Nether, The End) và khu vực (Lò nung, Bàn phù phép)!`)]
    });
  }

  // !heal
  if (commandName === 'heal') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const targetUser = message.mentions.users.first() || message.author;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    target.hp = target.maxHp;
    target.mana = target.maxMana;
    db.saveData();
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0x06b6d4).setTitle('❤️ Hồi Phục Sinh Lực').setDescription(`Đã hồi phục 100% HP (${target.maxHp}) và Mana (${target.maxMana}) cho <@${target.id}>!`)]
    });
  }

  // !unlockall
  if (commandName === 'unlockall') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const targetUser = message.mentions.users.first() || message.author;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    if (!target.unlocked) target.unlocked = {};
    target.unlocked.nether = true;
    target.unlocked.the_end = true;
    db.saveData();
    return message.reply({
      embeds: [new EmbedBuilder().setColor(0xec4899).setTitle('🔓 Mở Khóa Chiều Không Gian').setDescription(`Đã mở khóa Cổng Nether 🌋 và The End 🌌 cho <@${target.id}>!`)]
    });
  }

  // !listitems
  if (commandName === 'listitems' || commandName === 'items') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const config = require('./config');
    const list = Object.keys(config.ITEMS).map(k => `• \`${k}\`: ${config.ITEMS[k].emoji} ${config.ITEMS[k].name}`);
    const chunkSize = 35;
    const firstChunk = list.slice(0, chunkSize).join('\n');
    const secondChunk = list.slice(chunkSize, chunkSize * 2).join('\n');
    return message.reply({
      embeds: [
        new EmbedBuilder().setColor(0x3b82f6).setTitle('📦 Danh Sách ID Vật Phẩm (Trang 1)').setDescription(firstChunk),
        new EmbedBuilder().setColor(0x3b82f6).setTitle('📦 Danh Sách ID Vật Phẩm (Trang 2)').setDescription(secondChunk)
      ]
    });
  }

  // !give [admin]
  if (commandName === 'give') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const config = require('./config');
    const mentioned = message.mentions.users.first();
    const targetUser = mentioned || message.author;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());

    const itemArg = mentioned ? (args[1] ? args[1].toLowerCase() : null) : (args[0] ? args[0].toLowerCase() : null);
    const countArg = mentioned ? (parseInt(args[2]) || 64) : (parseInt(args[1]) || 64);

    if (!itemArg) {
      return message.reply({ content: `⚠️ Cú pháp: \`!give [@user] <tên_món|all> [số_lượng]\` hoặc \`!give [@user] coins 1000\`` });
    }

    if (itemArg === 'all') {
      for (const id of Object.keys(config.ITEMS)) {
        db.addItem(target, id, countArg || 64);
      }
      db.saveData();
      return message.reply({ content: `🎁 <@${message.author.id}> đã tặng x${countArg || 64} tất cả vật phẩm cho <@${target.id}>!` });
    }

    if (itemArg === 'coins' || itemArg === 'xu' || itemArg === 'money') {
      const amt = parseFloat(mentioned ? args[2] : args[1]) || 1000;
      target.coins = Math.round((target.coins + amt) * 100) / 100;
      db.saveData();
      return message.reply({ content: `🪙 <@${message.author.id}> đã tặng **+${amt} Xu** cho <@${target.id}> (Số dư: ${target.coins} Xu)!` });
    }

    if (itemArg === 'exp') {
      const amt = parseInt(mentioned ? args[2] : args[1]) || 500;
      db.addExp(target, amt);
      db.saveData();
      return message.reply({ content: `⭐ <@${message.author.id}> đã tặng **+${amt} EXP** cho <@${target.id}>!` });
    }

    let found = Object.keys(config.ITEMS).find(k => k.toLowerCase() === itemArg);
    if (!found) {
      found = Object.keys(config.ITEMS).find(k => config.ITEMS[k].name.toLowerCase().includes(itemArg));
    }
    if (found) {
      db.addItem(target, found, countArg);
      db.saveData();
      return message.reply({ content: `🎁 <@${message.author.id}> đã tặng x${countArg} **${config.ITEMS[found].name}** ${config.ITEMS[found].emoji} cho <@${target.id}>!` });
    } else {
      return message.reply({ content: `❌ Không tìm thấy vật phẩm "${itemArg}"! Gõ \`!listitems\` để xem danh sách ID.` });
    }
  }

  // !setlevel hoặc !setlv
  if (commandName === 'setlevel' || commandName === 'setlv') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const mentioned = message.mentions.users.first();
    const targetUser = mentioned || message.author;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    const lvl = mentioned ? parseInt(args[1]) : (parseInt(args[0]) || parseInt(args[1]));
    if (!lvl || lvl < 1) {
      return message.reply({ content: `⚠️ Cú pháp: \`!setlevel [@user] [cấp_độ]\` (vd: \`!setlevel 50\` hoặc \`!setlevel @user 50\`)` });
    }
    target.level = lvl;
    target.maxExp = Math.round(lvl * 200 * 1.2);
    target.exp = 0;
    target.maxHp = db.getMaxHp(target);
    target.hp = target.maxHp;
    target.maxMana = 10 + (lvl - 1) * 2;
    target.mana = target.maxMana;
    db.saveData();
    return message.reply({ content: `⭐ Đã đặt cấp độ của <@${target.id}> thành Cấp **${lvl}**! (HP: ${target.maxHp}, Mana: ${target.maxMana})` });
  }

  // !sethp (Admin đặt máu tối đa tùy ý)
  if (commandName === 'sethp') {
    if (!isMsgAdmin()) {
      return message.reply({ content: `❌ Bạn không có quyền Admin!` });
    }
    const mentioned = message.mentions.users.first();
    const targetUser = mentioned || message.author;
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    const hp = mentioned ? parseInt(args[1]) : (parseInt(args[0]) || parseInt(args[1]));
    if (!hp || hp <= 0) {
      return message.reply({ content: `⚠️ Cú pháp: \`!sethp [@user] [số_máu]\` (vd: \`!sethp 100\` hoặc \`!sethp @user 200\`)` });
    }
    target.customMaxHp = hp;
    target.maxHp = hp;
    target.hp = hp;
    db.saveData();
    return message.reply({ content: `❤️ Đã đặt Máu Tối Đa của <@${target.id}> thành **${hp} HP**!` });
  }

  // !clear (dọn sạch túi đồ hoặc xóa món đồ)
  if (commandName === 'clear') {
    const cmd = client.commands.get('clear');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: (name) => {
            if (name === 'item') {
              if (args[0] && !args[0].startsWith('<@')) return args[0];
              if (args[1]) return args[1];
              return null;
            }
            return null;
          },
          getUser: (name) => {
            if (name === 'target') {
              return message.mentions.users.first() || null;
            }
            return null;
          }
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !enchant
  if (commandName === 'enchant') {
    const cmd = client.commands.get('enchant');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: (name) => {
            if (name === 'slot') return args[0] || null;
            if (name === 'enchant') return args[1] || null;
            return null;
          }
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !disenchant hoặc !grindstone hoặc !taybua
  if (commandName === 'disenchant' || commandName === 'grindstone' || commandName === 'taybua') {
    const cmd = client.commands.get('disenchant');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: (name) => {
            if (name === 'slot') return args[0] || null;
            return null;
          }
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !smelt hoặc !furnace
  if (commandName === 'smelt' || commandName === 'furnace') {
    const cmd = client.commands.get('smelt');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: (name) => {
            if (name === 'action') return args[0] || null;
            return null;
          }
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !equip
  if (commandName === 'equip') {
    const cmd = client.commands.get('equip');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: (name) => {
            if (name === 'item') return args.join(' ') || null;
            return null;
          }
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !unequip
  if (commandName === 'unequip') {
    const cmd = client.commands.get('unequip');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: (name) => {
            if (name === 'slot') return args[0] || null;
            return null;
          }
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !eat
  if (commandName === 'eat') {
    const cmd = client.commands.get('eat');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: (name) => {
            if (name === 'food') return args.join('_') || null;
            return null;
          }
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !anvil
  if (commandName === 'anvil' || commandName === 'de') {
    const cmd = client.commands.get('anvil');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: (name) => {
            if (name === 'book') return args[0] || null;
            if (name === 'slot') return args[1] || null;
            return null;
          }
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !shop
  if (commandName === 'shop') {
    const cmd = client.commands.get('shop');
    if (cmd) {
      const sub = args[0] ? args[0].toLowerCase() : 'list';
      const mockInteraction = {
        user: message.author,
        channel: message.channel,
        options: {
          getSubcommand: () => (['buy', 'sell'].includes(sub) ? sub : 'list'),
          getString: (name) => {
            if (name === 'item') return args[1] || null;
            return null;
          },
          getInteger: (name) => {
            if (name === 'amount') return parseInt(args[2]) || 1;
            return 1;
          }
        },
        reply: async (payload) => {
          if (payload.ephemeral) {
            try {
              await message.author.send(payload);
              const notice = await message.reply('🔒 *Bảng shop / thông tin cá nhân đã được gửi riêng vào Tin Nhắn Riêng (DM) của bạn!*');
              setTimeout(() => notice.delete().catch(() => {}), 6000);
            } catch (err) {
              const fallback = await message.reply({ ...payload, content: `🔒 *(Chỉ bạn - Tin nhắn tự huỷ sau 20s)*\n${payload.content || ''}` });
              setTimeout(() => fallback.delete().catch(() => {}), 20000);
            }
          } else {
            // Mua thành công mới báo lên kênh chat!
            return message.channel.send(payload);
          }
        }
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !sell hoặc !ban
  if (commandName === 'sell' || commandName === 'ban') {
    const sellCmd = client.commands.get('sell');
    if (sellCmd) {
      const targetParam = args[0] ? args[0].toLowerCase() : null;
      const amountParam = args[1] ? parseInt(args[1]) : null;
      const mockInteraction = {
        user: message.author,
        channel: message.channel,
        options: {
          getBoolean: (name) => {
            if (name === 'all') return targetParam === 'all';
            return false;
          },
          getString: (name) => {
            if (name === 'item') return targetParam;
            return null;
          },
          getInteger: (name) => {
            if (name === 'amount') return amountParam;
            return null;
          }
        },
        reply: async (payload) => {
          return message.reply(payload);
        }
      };
      return sellCmd.execute(mockInteraction);
    }
  }

  // !wither
  if (commandName === 'wither') {
    const cmd = client.commands.get('wither');
    if (cmd) {
      const mockInteraction = {
        user: message.author,
        options: {
          getString: () => null
        },
        reply: (payload) => message.reply(payload)
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !craft
  if (commandName === 'craft') {
    const cmd = client.commands.get('craft');
    if (cmd) {
      const sub = (args[0] && args[0].toLowerCase() === 'list') ? 'list' : (args[0] ? 'item' : 'list');
      const itemQuery = sub === 'item' ? args.join(' ') : null;
      const catQuery = sub === 'list' && args[1] ? args[1].toLowerCase() : 'all';
      const mockInteraction = {
        user: message.author,
        channel: message.channel,
        options: {
          getSubcommand: () => sub,
          getString: (name) => {
            if (name === 'name' || name === 'recipe') return itemQuery;
            if (name === 'category') return catQuery;
            return null;
          }
        },
        reply: async (payload) => {
          if (payload.ephemeral) {
            try {
              await message.author.send(payload);
              const notice = await message.reply('🔒 *Bảng công thức chế tạo đã được gửi riêng vào Tin Nhắn Riêng (DM) của bạn!*');
              setTimeout(() => notice.delete().catch(() => {}), 6000);
            } catch (err) {
              const fallback = await message.reply({ ...payload, content: `🔒 *(Chỉ bạn - Tin nhắn tự huỷ sau 30s)*\n${payload.content || ''}` });
              setTimeout(() => fallback.delete().catch(() => {}), 30000);
            }
          } else {
            return message.reply(payload);
          }
        }
      };
      return cmd.execute(mockInteraction);
    }
  }

  // !status / !upgrade
  if (commandName === 'status' || commandName === 'upgrade') {
    const player = db.getPlayer(message.author.id, message.author.username, message.author.displayAvatarURL());
    const uiHelper = require('./utils/uiHelper');
    const payload = uiHelper.buildStatsScreen(player);
    return message.reply(payload);
  }
});

// Bắt lỗi toàn cục để bot không bị crash bất ngờ khi Discord API lỗi
process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err?.message || err);
});

// Xử lý an toàn khi tắt bot
process.on('SIGINT', () => {
  console.log('\n[Shutdown] Đang lưu cơ sở dữ liệu trước khi thoát...');
  db.saveData();
  console.log('[Shutdown] Hoàn tất. Tạm biệt!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.saveData();
  process.exit(0);
});

// Web Server phục vụ Health Check & Uptime Ping (Dành cho Render, Koyeb, Fly.io, UptimeRobot)
const http = require('http');
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    status: 'ok',
    bot: client.user ? client.user.tag : 'initializing',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, () => {
  console.log(`[Web Server] HTTP Health Check & Keep-Alive server đang lắng nghe tại port ${PORT}`);
}).on('error', (err) => {
  console.warn(`[Web Server] Không thể mở cổng ${PORT} (${err.message}) - Bot Discord vẫn hoạt động bình thường.`);
});

// Đăng nhập Bot nếu có Token
if (process.env.DISCORD_TOKEN) {
  client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('[Login] Đăng nhập thất bại! Vui lòng kiểm tra lại DISCORD_TOKEN trong file .env:\n', err.message);
  });
} else {
  console.log('⚠️ [Notice] Chưa tìm thấy DISCORD_TOKEN trong file .env. Vui lòng mở file .env và điền Token của Bot vào!');
}
