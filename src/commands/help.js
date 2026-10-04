const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Xem hướng dẫn toàn diện cách chơi Minecraft RPG Bot'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x3b82f6)
      .setTitle('📚 HƯỚNG DẪN CHƠI BOT MINECRAFT RPG')
      .setDescription(
        `Chào mừng bạn đến với thế giới Minecraft RPG trên Discord! Dưới đây là các tính năng và lệnh cơ bản:\n\n` +
        `🧭 **LỆNH CỐT LÕI:**\n` +
        `• \`/menu\`: Mở bảng điều khiển trung tâm (Xem Thông tin thẻ hình ảnh, Chỉ số, Túi đồ, Trang bị, Khu vực, Cài đặt).\n` +
        `• \`/explore\`: Đi dạo thám hiểm (Gặp Làng, Đền sa mạc, Tiền đồn, Xác tàu đắm, Rương báu, Boss Wither & Ravager).\n` +
        `• \`/mine\`: Đi đào khoáng sản trong Hang Đá (Than, Sắt, Vàng, Kim Cương, Obsidian).\n` +
        `• \`/chop\`: Chặt gỗ sồi, nhặt que và quả táo trong rừng.\n` +
        `• \`/hunt [area]\`: Đi săn bắt thú hiền (ngày) hoặc diệt quái vật hung hãn (đêm / Nether / The End).\n` +
        `• \`/pvp [target] [bet] [mode]\`: Thách đấu PvP với người chơi khác (Giao hữu hoặc Sinh tử chết mất đồ!).\n` +
        `• \`/sleep\`: Ngủ tại Nhà để hồi phục đầy máu & mana và tua nhanh qua ban đêm.\n` +
        `• \`/craft\`: Bàn chế tạo công cụ, vũ khí, áo giáp, bàn phù phép và vật phẩm.\n` +
        `• \`/enchant\`: Yểm bùa ma thuật (Sắc bén, Bảo vệ, Hiệu suất, Gia tài, Sức mạnh, Độ bền) bằng Lapis + EXP.\n` +
        `• \`/party [create/invite/leave/start/status]\`: Tổ đội săn Rồng Ender cùng bạn bè (Co-op Raid chia quà khủng)!\n` +
        `• \`/shop\`: Sàn giao dịch mua bán tài nguyên với cửa hàng.\n` +
        `• \`/sell\`: Bảng bán vật phẩm 1-Click hoặc bán nhanh quái rơi, đá gỗ kiếm Xu siêu tiện (\`!sell\`, \`!sell all\`, \`!sell mob\`).\n` +
        `• \`/daily\`: Điểm danh nhận quà sinh tồn mỗi ngày.\n` +
        `• \`/top\`: Bảng xếp hạng cao thủ máy chủ.\n` +
        `• \`/give\`, \`/setlevel\`, \`/admin\`: Bộ lệnh quản trị viên hệ thống (Admin).\n\n` +
        `🔥 **CÁC TÍNH NĂNG ĐẶC BIỆT CHUẨN MINECRAFT:**\n` +
        `• 📦 **Kho Đồ & Mở Rộng Slot:** Mặc định mỗi người có **32 Ô (Slot)**. Dùng **64 Block Gỗ** chế tạo **1 Rương** sẽ nhận thêm **+24 Ô chứa đồ**, có thể nâng cấp mở rộng vô hạn lần!\n` +
        `• 👥 **Tổ Đội Đánh Rồng Co-op:** Lập nhóm tối đa 4 người cùng sát cánh tiêu diệt Rồng Ender, phá pha lê End Crystal và cùng nhận Trứng Rồng, Cánh Cứng Elytra, Shulker Box & 15,000 EXP!\n` +
        `• ☠️ **Chết mất đồ:** Khi máu về 0, bạn sẽ rơi mất toàn bộ đồ trong túi và 50% tiền mặt! Đồ cất trong **Rương ở Nhà** và tiền gửi trong **Ngân Hàng** được bảo vệ an toàn 100%. Hãy tìm **Vật Tổ Bất Tử (Totem of Undying)** để được cứu mạng!\n` +
        `• ⏰ **Chu kỳ Ngày / Đêm:** Cứ mỗi 10 phút, thế giới sẽ chuyển đổi giữa Ban Ngày ☀️ và Ban Đêm 🌙.\n` +
        `• 🌋 **Thế Giới Nether:** Xây Cổng Nether bằng 10 Hắc diện thạch + 1 Bật lửa để tự do khai thác Thạch Anh, Bột Lửa, và Mảnh Vỡ Cổ Đại (Ancient Debris) để nâng cấp trang bị Netherite!\n` +
        `• 🌌 **Thế Giới The End:** Thu thập 12 Mắt Ender để mở cổng đến The End, khiêu chiến **Rồng Ender** đoạt **Trứng Rồng**, **Cánh Cứng Elytra** và **Hộp Shulker**!\n` +
        `• ⚔️ **PvP Đấu Trường:** Thử tài chiến thuật theo lượt với các nút: Chém Kiếm, Bắn Cung, Giơ Khiên, Dùng Táo Vàng!`
      )
      .setFooter({ text: 'Chúc bạn có những trải nghiệm sinh tồn tuyệt vời!' });

    await interaction.reply({ content: `<@${interaction.user.id}>`, embeds: [embed] });
  }
};
