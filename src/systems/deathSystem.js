const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

class DeathSystem {
  /**
   * Tạo giao diện Embed Thông Báo Tử Vong đẹp mắt, chuẩn phong cách Minecraft
   */
  buildDeathEmbed(player, deathResult, killerName = null) {
    const embed = new EmbedBuilder()
      .setColor(0xb91c1c)
      .setTitle(`☠️ 📢 THÔNG BÁO TỬ VONG! (YOU DIED)`)
      .setThumbnail(player.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png');

    const causeText = deathResult.cause || (killerName ? `bị ${killerName} hạ gục` : 'bị tiêu diệt');

    embed.setDescription(
      `### 🪦 Dũng sĩ <@${player.id}> đã ngã xuống!\n` +
      `> ⚔️ **Nguyên nhân tử nạn:** **${causeText}**\n` +
      `> 📍 **Địa điểm hồi sinh:** **Nhà của bạn 🏠** (Hồi phục đầy đủ ${player.maxHp}/${player.maxHp} HP ❤️)`
    );

    // 1. Danh sách vật phẩm đã rơi mất chi tiết
    const drops = deathResult.droppedItems || [];
    if (drops.length > 0) {
      const itemLines = drops.map(i => {
        const id = i.itemId || i.id;
        const def = config.ITEMS[id];
        const emoji = def ? def.emoji : (i.emoji || '📦');
        const name = def ? def.name : (i.name || id);
        const count = i.count || 1;
        return `• ${emoji} **${name}** \`x${count}\``;
      });

      let dropDisplay = '';
      if (itemLines.length > 25) {
        dropDisplay = itemLines.slice(0, 25).join('\n') + `\n*... và còn ${itemLines.length - 25} loại vật phẩm khác!*`;
      } else {
        dropDisplay = itemLines.join('\n');
      }

      embed.addFields({
        name: `📦 CÁC VẬT PHẨM ĐÃ BỊ ĐÁNH RƠI (${deathResult.totalItemsLost || drops.length} món)`,
        value: dropDisplay,
        inline: false
      });
    } else {
      embed.addFields({
        name: `📦 VẬT PHẨM ĐÁNH RƠI`,
        value: `*(Không rơi vật phẩm nào do túi đồ rỗng lúc tử vong)*`,
        inline: false
      });
    }

    // 2. Tiền mặt rơi mất & Bảo hiểm an toàn
    embed.addFields(
      {
        name: `🪙 Tiền mặt thất thoát`,
        value: deathResult.coinsLost > 0
          ? `**-${deathResult.coinsLost.toLocaleString()} Xu**\n*(25% tiền mang theo)*`
          : `**0 Xu**\n*(Không có tiền mặt)*`,
        inline: true
      },
      {
        name: `🛡️ Bảo hiểm tài sản`,
        value: `🏠 Rương Nhà: **100% An Toàn**\n🏦 Ngân Hàng: **Không mất tiền**\n⚔️ Trang Bị Đang Mặc: **Giữ nguyên**`,
        inline: true
      }
    );

    embed.setFooter({ text: '💡 Mẹo sinh tồn: Hãy mang theo Vật Tổ Bất Tử (Totem of Undying) để tự hồi sinh khi cạn máu!' });
    embed.setTimestamp();

    return embed;
  }

  /**
   * Xử lý cái chết của người chơi (Minecraft Death Mechanics)
   * @param {Object} player - Đối tượng người chơi
   * @param {string} cause - Nguyên nhân tử vong
   * @returns {Object} Kết quả xử lý
   */
  handleDeath(player, cause = 'bị tiêu diệt') {
    // 1. Kiểm tra Vật Tổ Bất Tử (Totem of Undying)
    const totemIndex = player.inventory.findIndex(i => i.itemId === 'totem_of_undying');
    if (totemIndex !== -1) {
      // Tiêu thụ 1 Totem
      player.inventory[totemIndex].count -= 1;
      if (player.inventory[totemIndex].count <= 0) {
        player.inventory.splice(totemIndex, 1);
      }
      // Hồi sinh tức thì với hiệu ứng
      player.hp = Math.max(5, Math.floor(player.maxHp * 0.3));
      player.mana = Math.max(5, Math.floor(player.maxMana * 0.3));
      db.saveData();

      return {
        survived: true,
        reason: 'totem',
        message: `${config.EMOJIS.TOTEM} **VẬT TỔ BẤT TỬ KÍCH HOẠT!**\nÁnh sáng vàng rực bùng nổ khắp người bạn! Vật tổ vỡ tan nhưng đã cứu bạn thoát khỏi cái chết trong gang tấc! (Hồi phục ${player.hp} Máu, bảo toàn toàn bộ đồ đạc trong túi!)`
      };
    }

    // 2. Chết thật - Rơi mất đồ cá nhân (Minecraft Death Mechanics)
    const droppedItems = JSON.parse(JSON.stringify(player.inventory || []));
    const totalItemsLost = droppedItems.reduce((acc, cur) => acc + (cur.count || 1), 0);

    // Mất 25% số tiền mặt đang cầm trên người (tiền gửi Ngân hàng an toàn)
    const coinsLost = Math.round((player.coins * 0.25) * 100) / 100;
    player.coins = Math.max(0, Math.round((player.coins - coinsLost) * 100) / 100);

    // Xóa sạch túi đồ cá nhân khi chết (Trang bị và Rương Nhà an toàn)
    player.inventory = [];

    // Hồi sinh tại Nhà với đầy máu và mana
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    player.stats.deaths = (player.stats.deaths || 0) + 1;
    player.lastDeathReason = cause;

    db.saveData();

    // Soạn thông báo rơi đồ
    let dropSummary = '';
    if (droppedItems.length > 0) {
      dropSummary = droppedItems
        .map(i => {
          const itemDef = config.ITEMS[i.itemId];
          return `• ${itemDef ? itemDef.emoji : '📦'} x${i.count} ${itemDef ? itemDef.name : i.itemId}`;
        })
        .join('\n');
    } else {
      dropSummary = '(Túi đồ rỗng lúc chết)';
    }

    const result = {
      survived: false,
      droppedItems,
      totalItemsLost,
      coinsLost,
      dropSummary,
      cause,
      message: `☠️ **BẠN ĐÃ TỬ VONG!**\nNguyên nhân: **${cause}**\n\n${config.EMOJIS.CHEST} **Vật phẩm trong túi đã rơi mất:**\n${dropSummary}\n\n${config.EMOJIS.COIN} **Tiền mặt rơi mất:** ${coinsLost} Xu (25% tiền mặt mang theo)\n*(💡 Lưu ý: Đồ cất trong Rương tại Nhà 🏠 và Tiền gửi Ngân hàng 🏦 an toàn 100%)*\n\n🏠 *Bạn đã được hồi sinh tại Nhà an toàn với đầy đủ ${player.maxHp}/${player.maxHp} Máu.*`
    };

    result.embed = this.buildDeathEmbed(player, result);
    return result;
  }
}

module.exports = new DeathSystem();
