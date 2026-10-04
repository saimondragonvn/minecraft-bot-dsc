const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('[ADMIN] Tặng vật phẩm, tiền xu hoặc EXP cho người chơi')
    .addUserOption(opt => opt.setName('target').setDescription('Người chơi nhận quà').setRequired(true))
    .addStringOption(opt => opt.setName('item').setDescription('ID hoặc tên vật phẩm (vd: diamond, mace, elytra)').setRequired(false))
    .addIntegerOption(opt => opt.setName('count').setDescription('Số lượng vật phẩm (mặc định 1)').setRequired(false))
    .addNumberOption(opt => opt.setName('coins').setDescription('Số tiền xu muốn cộng thêm').setRequired(false))
    .addIntegerOption(opt => opt.setName('exp').setDescription('Số EXP muốn cộng thêm').setRequired(false))
    .addBooleanOption(opt => opt.setName('all').setDescription('Tặng mỗi loại vật phẩm trong game x64 cái').setRequired(false)),

  async execute(interaction) {
    const callerId = interaction.user.id;
    const caller = db.getPlayer(callerId, interaction.user.username, interaction.user.displayAvatarURL());

    const isAdmin = config.ADMIN_IDS.includes(callerId) || (caller && caller.isAdmin);
    if (!isAdmin) {
      return interaction.reply({
        content: `❌ **Bạn không có quyền Admin!** Lệnh này chỉ dành cho Admin của hệ thống (<@944428607642664972>).`,
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('target');
    const target = db.getPlayer(targetUser.id, targetUser.username, targetUser.displayAvatarURL());

    const itemId = interaction.options.getString('item');
    const count = interaction.options.getInteger('count') || 1;
    const coins = interaction.options.getNumber('coins') || 0;
    const exp = interaction.options.getInteger('exp') || 0;
    const giveAll = interaction.options.getBoolean('all') || false;

    const results = [];

    // Tặng tất cả vật phẩm x64
    if (giveAll) {
      for (const id of Object.keys(config.ITEMS)) {
        db.addItem(target, id, 64);
      }
      results.push(`📦 **Đã tặng x64 tất cả mọi vật phẩm trong Minecraft!**`);
    } else if (itemId) {
      // Tìm vật phẩm
      let foundKey = Object.keys(config.ITEMS).find(k => k.toLowerCase() === itemId.toLowerCase());
      if (!foundKey) {
        foundKey = Object.keys(config.ITEMS).find(k => config.ITEMS[k].name.toLowerCase().includes(itemId.toLowerCase()));
      }

      if (!foundKey) {
        return interaction.reply({
          content: `❌ Không tìm thấy vật phẩm nào khớp với "${itemId}"! Vui lòng kiểm tra lại ID vật phẩm.`,
          ephemeral: true
        });
      }

      db.addItem(target, foundKey, count);
      const itemDef = config.ITEMS[foundKey];
      results.push(`• ${itemDef.emoji} **x${count} ${itemDef.name}** (\`${foundKey}\`)`);
    }

    if (coins > 0) {
      target.coins = Math.round((target.coins + coins) * 100) / 100;
      results.push(`• 🪙 **+${coins} Xu** (Số dư: ${target.coins} Xu)`);
    }

    if (exp > 0) {
      const leveledUp = db.addExp(target, exp);
      results.push(`• ⭐ **+${exp} EXP**` + (leveledUp ? ` *(Lên Cấp ${target.level}!)*` : ''));
    }

    if (results.length === 0) {
      return interaction.reply({
        content: `⚠️ Bạn chưa chỉ định món đồ, tiền xu hoặc EXP nào để tặng!`,
        ephemeral: true
      });
    }

    db.saveData();

    const embed = new EmbedBuilder()
      .setColor(0x22c55e)
      .setTitle('🎁 LỆNH GIVE ADMIN THỰC THI THÀNH CÔNG!')
      .setDescription(
        `👑 **Admin thực hiện:** <@${callerId}>\n` +
        `🎯 **Người nhận:** <@${target.id}>\n\n` +
        `**Chi tiết phần quà đã trao:**\n` +
        results.join('\n')
      )
      .setTimestamp();

    await interaction.reply({ content: `<@${target.id}> <@${callerId}>`, embeds: [embed] });
  }
};
