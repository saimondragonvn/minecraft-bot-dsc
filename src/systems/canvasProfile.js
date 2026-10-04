const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const fs = require('fs');

// Đăng ký font hệ thống có hỗ trợ tiếng Việt trên Windows
const fontCandidates = [
  'C:\\Windows\\Fonts\\segoeui.ttf',
  'C:\\Windows\\Fonts\\segoeuib.ttf',
  'C:\\Windows\\Fonts\\arial.ttf',
  'C:\\Windows\\Fonts\\arialbd.ttf',
  'C:\\Windows\\Fonts\\tahoma.ttf'
];

for (const fontPath of fontCandidates) {
  try {
    if (fs.existsSync(fontPath)) {
      GlobalFonts.registerFromPath(fontPath);
    }
  } catch {
    // Bỏ qua nếu không nạp được
  }
}

const FONT_FAMILY = '"Segoe UI", Arial, Tahoma, sans-serif';

// Hàm vẽ hình chữ nhật bo tròn góc
function roundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * Tạo hình ảnh thẻ thông tin người chơi (Profile Card) chuẩn không bị lỗi font
 */
async function generateProfileCard(player) {
  const width = 480;
  const height = 240;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Nền bo góc toàn bộ thẻ (Dark modern card)
  ctx.save();
  roundRect(ctx, 4, 4, width - 8, height - 8, 16);
  ctx.fillStyle = '#171821';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#27293d';
  ctx.stroke();
  ctx.restore();

  // 1. Vẽ Avatar người chơi hình tròn
  const avatarX = 28;
  const avatarY = 24;
  const avatarSize = 54;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();

  try {
    if (player.avatar) {
      const avatarImg = await loadImage(player.avatar);
      ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
    } else {
      throw new Error('No avatar');
    }
  } catch {
    // Vẽ avatar mặc định nếu không tải được ảnh
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 24px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((player.name || 'P').charAt(0).toUpperCase(), avatarX + avatarSize / 2, avatarY + avatarSize / 2);
  }
  ctx.restore();

  // Viền avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#3b4261';
  ctx.stroke();
  ctx.restore();

  // 2. Tên người chơi & Cấp độ (Dùng font sạch không kèm emoji)
  const displayName = player.name && player.name.length > 14 ? player.name.slice(0, 14) + '...' : (player.name || 'Steve');
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 20px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(displayName, 96, 48);

  ctx.fillStyle = '#9ca3af';
  ctx.font = `14px ${FONT_FAMILY}`;
  ctx.fillText(`Level ${player.level || 1}`, 96, 70);

  // 3. Pill hiển thị Tiền vàng (góc trên bên phải)
  const coinText = `${Number(player.coins || 0).toFixed(2)}`;
  ctx.font = `bold 15px ${FONT_FAMILY}`;
  const coinTextWidth = ctx.measureText(coinText).width;
  const pillWidth = Math.max(90, coinTextWidth + 36);
  const pillHeight = 32;
  const pillX = width - 28 - pillWidth;
  const pillY = 28;

  ctx.save();
  roundRect(ctx, pillX, pillY, pillWidth, pillHeight, 8);
  ctx.fillStyle = '#222332';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#32344a';
  ctx.stroke();
  ctx.restore();

  // Chữ tiền
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 15px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText(coinText, pillX + 12, pillY + 21);

  // Biểu tượng tiền vàng
  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(pillX + pillWidth - 14, pillY + 16, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.arc(pillX + pillWidth - 14, pillY + 16, 4, 0, Math.PI * 2);
  ctx.fill();

  // 4. Các thanh trạng thái (HP, MANA, EXP - Tránh nhét emoji trực tiếp vào fillText để không bị lỗi Skia)
  const barX = 28;
  const barWidth = width - 56;
  const barHeight = 10;
  const barsStartY = 105;
  const spacing = 42;

  const barData = [
    {
      badgeColor: '#e04343',
      label: 'HP (Mau)',
      current: Math.max(0, player.hp || 0),
      max: player.maxHp || 20,
      color: '#e04343',
      format: `${Math.round(player.hp || 0)} / ${player.maxHp || 20}`
    },
    {
      badgeColor: '#3b82f6',
      label: 'MANA',
      current: Math.max(0, player.mana || 0),
      max: player.maxMana || 10,
      color: '#3b82f6',
      format: `${Math.round(player.mana || 0)} / ${player.maxMana || 10}`
    },
    {
      badgeColor: '#a855f7',
      label: 'EXP (Kinh nghiem)',
      current: Math.max(0, player.exp || 0),
      max: player.maxExp || 100,
      color: '#a855f7',
      format: `${Number(player.exp || 0).toFixed(1)} / ${player.maxExp || 100}`
    }
  ];

  barData.forEach((bar, index) => {
    const y = barsStartY + index * spacing;

    // Vẽ icon chấm tròn màu sắc bên cạnh nhãn
    ctx.fillStyle = bar.badgeColor;
    ctx.beginPath();
    ctx.arc(barX + 4, y - 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Nhãn thanh bên trái
    ctx.fillStyle = '#e2e8f0';
    ctx.font = `14px ${FONT_FAMILY}`;
    ctx.textAlign = 'left';
    ctx.fillText(bar.label, barX + 14, y);

    // Giá trị hiển thị bên phải
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.fillText(bar.format, barX + barWidth, y);

    // Thanh nền (rãnh trượt)
    const trackY = y + 8;
    ctx.save();
    roundRect(ctx, barX, trackY, barWidth, barHeight, 5);
    ctx.fillStyle = '#26283b';
    ctx.fill();
    ctx.restore();

    // Thanh tiến độ có màu
    const fillRatio = Math.min(1, Math.max(0, bar.current / bar.max));
    if (fillRatio > 0) {
      const fillW = Math.max(barHeight, barWidth * fillRatio);
      ctx.save();
      roundRect(ctx, barX, trackY, fillW, barHeight, 5);
      ctx.fillStyle = bar.color;
      ctx.fill();
      ctx.restore();
    }
  });

  return canvas.toBuffer('image/png');
}

module.exports = {
  generateProfileCard
};
