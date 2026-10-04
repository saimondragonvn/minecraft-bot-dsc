const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database/db');
const config = require('../config');

class TradeSystem {
  constructor() {
    this.activeTrades = new Map();
  }

  /**
   * Tạo phiên giao dịch giữa 2 người chơi (Bắt buộc Level 10+)
   */
  createTradeOffer({ seller, buyer, itemId, count = 1, price = 0 }) {
    const sellerLvl = seller.level || 1;
    const buyerLvl = buyer.level || 1;

    // Kiểm tra cấp độ tối thiểu Level 10+
    if (sellerLvl < 10) {
      return {
        success: false,
        message: `❌ **Cấp độ chưa đủ:** Bạn cần đạt tối thiểu **Cấp 10** mới có thể giao dịch (Hiện tại: Cấp ${sellerLvl}).`
      };
    }

    if (buyerLvl < 10) {
      return {
        success: false,
        message: `❌ **Người chơi chưa đủ cấp:** <@${buyer.id}> cần đạt tối thiểu **Cấp 10** mới có thể nhận giao dịch (Hiện tại: Cấp ${buyerLvl}).`
      };
    }

    if (seller.id === buyer.id) {
      return {
        success: false,
        message: '❌ Bạn không thể tự giao dịch với chính mình!'
      };
    }

    const itemDef = config.ITEMS[itemId];
    if (!itemDef) {
      return {
        success: false,
        message: `❌ Vật phẩm \`${itemId}\` không tồn tại trong thế giới Minecraft!`
      };
    }

    const sellerCount = db.getItemCount(seller, itemId);
    if (sellerCount < count) {
      return {
        success: false,
        message: `❌ Bạn không có đủ ${itemDef.emoji} **${itemDef.name}** để giao dịch! (Cần: **${count}**, Hiện có: **${sellerCount}**).`
      };
    }

    const safePrice = Math.max(0, parseInt(price) || 0);
    const tradeId = `tr_${Date.now()}_${seller.id.slice(-4)}`;

    const tradeData = {
      tradeId,
      sellerId: seller.id,
      sellerName: seller.username || seller.name,
      buyerId: buyer.id,
      buyerName: buyer.username || buyer.name,
      itemId,
      count,
      price: safePrice,
      createdAt: Date.now()
    };

    this.activeTrades.set(tradeId, tradeData);

    // Tự hủy sau 60 giây nếu không được chấp nhận
    setTimeout(() => {
      if (this.activeTrades.has(tradeId)) {
        this.activeTrades.delete(tradeId);
      }
    }, 60000);

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🤝 LỜI MỜI GIAO DỊCH (TRADE OFFER)')
      .setDescription(
        `<@${seller.id}> vừa gửi một lời mời giao dịch trực tiếp tới <@${buyer.id}>!\n\n` +
        `📦 **Vật phẩm giao dịch:** ${itemDef.emoji} **x${count} ${itemDef.name}**\n` +
        `🪙 **Giá yêu cầu:** **${safePrice > 0 ? `${safePrice.toLocaleString()} Xu` : '🎁 Miễn Phí (Tặng Quà)'}**\n\n` +
        `👤 **Người bán:** <@${seller.id}> (Cấp ${sellerLvl})\n` +
        `👤 **Người mua:** <@${buyer.id}> (Cấp ${buyerLvl}) | Số dư: **${(buyer.coins || 0).toLocaleString()} Xu**\n\n` +
        `⏳ *<@${buyer.id}> có 60 giây để bấm [Chấp Nhận] hoặc [Từ Chối] bên dưới:*`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`trade_accept_${tradeId}`)
        .setLabel('✅ Chấp Nhận Giao Dịch')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`trade_decline_${tradeId}`)
        .setLabel('❌ Từ Chối')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`trade_cancel_${tradeId}`)
        .setLabel('🚫 Hủy Lời Mời')
        .setStyle(ButtonStyle.Secondary)
    );

    return {
      success: true,
      tradeId,
      embed,
      row,
      content: `<@${buyer.id}> ơi, bạn có lời mời giao dịch từ <@${seller.id}>!`
    };
  }

  /**
   * Xử lý tương tác nút bấm giao dịch
   */
  async handleButton(interaction) {
    const customId = interaction.customId;
    const parts = customId.split('_');
    const action = parts[1]; // 'accept', 'decline', 'cancel'
    const tradeId = parts.slice(2).join('_');

    const trade = this.activeTrades.get(tradeId);
    if (!trade) {
      return interaction.reply({
        content: `❌ **Giao dịch này đã hoàn tất, bị hủy hoặc đã hết hạn (60s)!**`,
        ephemeral: true
      });
    }

    const seller = db.getPlayer(trade.sellerId, trade.sellerName);
    const buyer = db.getPlayer(trade.buyerId, trade.buyerName);
    const itemDef = config.ITEMS[trade.itemId] || { name: trade.itemId, emoji: '📦' };

    // 1. Hủy lời mời (chỉ người bán)
    if (action === 'cancel') {
      if (interaction.user.id !== trade.sellerId) {
        return interaction.reply({ content: `❌ Chỉ người khởi tạo giao dịch (<@${trade.sellerId}>) mới có quyền hủy!`, ephemeral: true });
      }
      this.activeTrades.delete(tradeId);

      const cancelEmbed = new EmbedBuilder()
        .setColor(0x6b7280)
        .setTitle('🚫 GIAO DỊCH ĐÃ BỊ HỦY')
        .setDescription(`<@${trade.sellerId}> đã hủy bỏ lời mời giao dịch vật phẩm ${itemDef.emoji} **x${trade.count} ${itemDef.name}**.`);

      return interaction.update({ content: `<@${trade.sellerId}>`, embeds: [cancelEmbed], components: [] });
    }

    // 2. Từ chối giao dịch (chỉ người mua)
    if (action === 'decline') {
      if (interaction.user.id !== trade.buyerId) {
        return interaction.reply({ content: `❌ Lời mời giao dịch này dành cho <@${trade.buyerId}>, không phải bạn!`, ephemeral: true });
      }
      this.activeTrades.delete(tradeId);

      const declineEmbed = new EmbedBuilder()
        .setColor(0xef4444)
        .setTitle('❌ GIAO DỊCH BỊ TỪ CHỐI')
        .setDescription(`<@${trade.buyerId}> đã từ chối nhận giao dịch ${itemDef.emoji} **x${trade.count} ${itemDef.name}** từ <@${trade.sellerId}>.`);

      return interaction.update({ content: `<@${trade.sellerId}>`, embeds: [declineEmbed], components: [] });
    }

    // 3. Chấp nhận giao dịch (chỉ người mua)
    if (action === 'accept') {
      if (interaction.user.id !== trade.buyerId) {
        return interaction.reply({ content: `❌ Lời mời giao dịch này dành cho <@${trade.buyerId}>, không phải bạn!`, ephemeral: true });
      }

      // Kiểm tra lại Level 10+
      if ((seller.level || 1) < 10 || (buyer.level || 1) < 10) {
        this.activeTrades.delete(tradeId);
        return interaction.reply({ content: `❌ Lỗi: Cả hai người chơi đều phải đạt cấp 10 trở lên!`, ephemeral: true });
      }

      // Kiểm tra người bán còn đủ vật phẩm không
      const curSellerCount = db.getItemCount(seller, trade.itemId);
      if (curSellerCount < trade.count) {
        this.activeTrades.delete(tradeId);
        return interaction.reply({
          content: `❌ **Giao dịch thất bại:** Người bán <@${trade.sellerId}> không còn đủ ${itemDef.emoji} **${itemDef.name}** (Chỉ còn ${curSellerCount}/${trade.count})!`,
          ephemeral: false
        });
      }

      // Kiểm tra người mua có đủ tiền không
      if (trade.price > 0 && (buyer.coins || 0) < trade.price) {
        return interaction.reply({
          content: `❌ **Không đủ tiền:** Bạn cần **${trade.price.toLocaleString()} Xu** để thanh toán (Hiện có: ${(buyer.coins || 0).toLocaleString()} Xu)!`,
          ephemeral: true
        });
      }

      // Kiểm tra kho đồ người mua
      const usedSlots = db.getUsedSlots(buyer);
      const maxSlots = db.getMaxSlots(buyer);
      if (usedSlots >= maxSlots && !db.hasInventorySpaceFor(buyer, trade.itemId, trade.count)) {
        return interaction.reply({
          content: `❌ **Kho đồ đầy:** Túi đồ của bạn đã kín (${usedSlots}/${maxSlots} Ô). Hãy dọn bớt đồ hoặc mở rộng rương trước!`,
          ephemeral: true
        });
      }

      // Tiến hành trao đổi an toàn
      db.removeItem(seller, trade.itemId, trade.count);
      db.addItem(buyer, trade.itemId, trade.count);

      if (trade.price > 0) {
        buyer.coins -= trade.price;
        seller.coins = (seller.coins || 0) + trade.price;
      }

      db.saveData();
      this.activeTrades.delete(tradeId);

      const successEmbed = new EmbedBuilder()
        .setColor(0x10b981)
        .setTitle('🎉 GIAO DỊCH THÀNH CÔNG!')
        .setDescription(
          `Giao dịch giữa <@${trade.sellerId}> và <@${trade.buyerId}> đã hoàn tất tốt đẹp!\n\n` +
          `• 📦 **Vật phẩm:** ${itemDef.emoji} **x${trade.count} ${itemDef.name}**\n` +
          `• 🪙 **Thanh toán:** **${trade.price > 0 ? `${trade.price.toLocaleString()} Xu` : '0 Xu (Quà tặng)'}**\n` +
          `• 👤 **Người bán:** <@${trade.sellerId}> nhận +${trade.price.toLocaleString()} Xu\n` +
          `• 👤 **Người mua:** <@${trade.buyerId}> nhận x${trade.count} ${itemDef.name}`
        )
        .setFooter({ text: 'Minecraft RPG Trade System • Yêu cầu Level 10+' });

      return interaction.update({
        content: `🎉 Giao dịch thành công giữa <@${trade.sellerId}> và <@${trade.buyerId}>!`,
        embeds: [successEmbed],
        components: []
      });
    }
  }
}

module.exports = new TradeSystem();
