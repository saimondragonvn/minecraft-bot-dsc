# 🎮 MINECRAFT RPG DISCORD BOT

Bot chơi game **Minecraft RPG** tương tác trực tiếp trên Discord qua hệ thống nút bấm (Buttons), Select Menus và Slash Commands, được thiết kế theo phong cách giao diện của **WoolWorld** (từ hình ảnh mẫu) cùng các tính năng sinh tồn chân thực như Minecraft chính gốc: **Chết mất đồ**, **Chu kỳ Ngày/Đêm**, **Xuống Nether**, **Tiến vào The End diệt Rồng**, **Quái vật spawn theo thời gian**, **PvP đấu trường sinh tử**, v.v.

---

## 🌟 TÍNH NĂNG NỔI BẬT

### 1. 📋 Giao Diện Menu Điều Khiển Trung Tâm (`/menu`)
- Tái hiện chính xác phong cách từ hình ảnh mẫu:
  - **📋 Thông tin:** Tạo thẻ đồ họa nhân vật (Profile Card) tự động bằng Canvas với Avatar tròn, Tên, Cấp độ, Huy hiệu Tiền vàng, và **3 thanh trạng thái bo góc trực quan**: Máu ❤️ (Đỏ), Mana 💧 (Xanh dương), Kinh nghiệm ⭐ (Tím).
  - **📊 Chi tiết chỉ số:** Xem Máu gốc, Sức mạnh tấn công (vũ khí + chỉ số), Phòng thủ giáp và % giảm sát thương, Tốc độ, Tỉ lệ chí mạng.
  - **🎒 Túi đồ (Inventory):** Danh sách vật phẩm có icon và số lượng, hiển thị **Sức chứa** (ví dụ: `34/4,608`), nút **Vứt đồ** / Sử dụng đồ ăn, thuốc hồi máu.
  - **⚔️ Trang bị (Equipment):** 8 ô trang bị đầy đủ (Cúp, Rìu, Kiếm, Cung, Mũ, Áo, Quần, Ủng).
  - **🗺️ Khu vực (Areas & Dimensions):** Nhà, Sàn giao dịch, Ngân hàng, Đấu giá, Thợ rèn, Rừng gỗ sồi, Hang đá, Hầm ngục, **Nether** và **The End**!
  - **⚙️ Cài đặt:** Đổi ngôn ngữ, Bật/tắt thông báo hao độ bền, Thông báo qua tin nhắn riêng (DM).

---

### 2. ☠️ Cơ Chế "Chết Mất Đồ" (Minecraft Death Mechanics)
- Khi Máu (HP) của bạn tụt về 0 (do quái đánh, Creeper nổ, ngã vào dung nham ở Nether, hoặc thua trận PvP Sinh Tử):
  - **Túi đồ cá nhân:** Toàn bộ vật phẩm trong ba lô sẽ rơi mất!
  - **Tiền mặt:** Mất 50% số tiền mặt đang mang theo người!
  - **Bảo toàn an toàn:** Đồ cất trong **Rương ở Nhà (Chest)** và tiền gửi trong **Ngân Hàng (Bank)** được an toàn 100%!
  - **Vật Tổ Bất Tử (Totem of Undying):** Nếu trong túi bạn có mang Totem of Undying, vật tổ sẽ tự động kích hoạt phát sáng hào quang vàng, cứu bạn thoát chết trong gang tấc (hồi phục máu và không bị rơi bất kỳ món đồ nào)!
  - Người chơi sau khi chết sẽ được hồi sinh tại **🏠 Nhà** với 20/20 Máu.

---

### 3. ⏰ Chu Kỳ Thời Gian Ngày / Đêm (24h Minecraft)
- Hệ thống đồng hồ ảo Minecraft chu kỳ 20 phút thời gian thực (10 phút Ngày ☀️ / 10 phút Đêm 🌙):
  - **☀️ Ban Ngày (06:00 - 18:00):** Ánh nắng chan hòa, động vật ôn hòa xuất hiện ở Rừng (Gà 🐔, Heo 🐷, Bò 🐮), an toàn khai thác.
  - **🌙 Ban Đêm (18:00 - 06:00):** Bóng tối buông xuống! Quái vật Overworld hung tợn bắt đầu xuất hiện tràn ngập (Zombie 🧟, Skeleton 🏹, Nhện Spider 🕷️, Creeper 💥 nổ tung xé xác).
  - **🛏️ Cơ chế Đi Ngủ (Sleep):** Về Nhà hoặc dùng lệnh `/sleep` lúc trời tối để ngủ một giấc ngon lành, hồi phục 100% Máu & Mana và tua nhanh thời gian sang **☀️ Sáng hôm sau**!

---

### 4. 🌋 Thế Giới Nether (Địa Ngục) & Tự Do Ra Vào Miễn Phí
- **Điều kiện mở cổng:** Cần thu thập **10 Hắc diện thạch (Obsidian)** và **1 Bật lửa (Flint & Steel)**.
- **Tự do ra vào MIỄN PHÍ:** Một khi đã xây cổng thành công, người chơi được **tự do ra vào Địa Ngục hoàn toàn MIỄN PHÍ** vĩnh viễn!
- **Tỉ lệ khai thác khoáng sản Nether chuẩn xác:**
  - 🧱 **Đá Địa Ngục (Netherrack):** Tỉ lệ **1:1.2** (~83.3%) | Cần Cúp Cấp 1+
  - ▫️ **Thạch Anh (Quartz):** Tỉ lệ **1:7** (~14.3%) | Cần Cúp Cấp 1+
  - 🧱 **Mảnh Vỡ Cổ Đại (Ancient Debris):** Tỉ lệ **1:100** (1%) | **BẮT BUỘC có Cúp Kim Cương hoặc Cúp Netherite**! *(Cúp dưới kim cương không bao giờ đào ra!)*
- **Công trình kiến trúc dưới Nether:**
  - 🏰 **Pháo Đài Địa Ngục (Nether Fortress):** Canh giữ bởi Quỷ Lửa Blaze và Wither Skeleton, chứa Rương Pháo Đài (Que lửa, Bướu Nether, Yên ngựa, Đầu Wither, Kim cương).
  - 🏛️ **Phế Tích Bastion (Bastion Remnant):** Thành trì của tộc Piglin Brute, chứa Khối Vàng, Mảnh Vỡ Cổ Đại, Mảnh Vụn Netherite và **Đĩa nhạc Pigstep**!
  - 🦴 **Hóa Thạch Nether Cổ Đại (Nether Fossil):** Khai quật khối xương (Bone Block) và than đá hóa thạch giữa thung lũng cát linh hồn.

---

### 5. ⛏️ Hệ Thống Khai Thác Khoáng Sản & Bậc Cúp Chuẩn Xác
- **Yêu cầu bắt buộc:** Người chơi **phải có Cúp (Pickaxe)** mới có thể đào đá và quặng (dùng tay không không thể đào).
- **Tốc độ đào & sản lượng phụ thuộc vào vật liệu Cúp:**
  - Cúp Gỗ (Cấp 1): Tốc độ chậm (1-2 quặng/lượt)
  - Cúp Đá (Cấp 2): Tốc độ trung bình (2-3 quặng/lượt)
  - Cúp Sắt (Cấp 3): Tốc độ nhanh (3-5 quặng/lượt)
  - Cúp Kim Cương (Cấp 4): Tốc độ cực nhanh (4-8 quặng/lượt)
  - Cúp Netherite (Cấp 5): Tốc độ siêu tốc (6-12 quặng/lượt)
- **Cơ chế khóa bậc quặng:** Cúp nào đào được thì mới ra quặng đó, cúp không đủ cấp thì **KHÔNG BAO GIỜ RA**:
  - 🪨 **Đá cuội (Cobblestone):** Tỉ lệ **1:1.5** (~66.7%) | Cúp Gỗ trở lên
  - ⚫ **Than đá (Coal):** Tỉ lệ **1:5** (20%) | Cúp Gỗ trở lên
  - 🪙 **Quặng sắt (Iron Ore):** Tỉ lệ **1:10** (10%) | Cúp Đá trở lên
  - 🔷 **Ngọc lưu ly (Lapis Lazuli):** Tỉ lệ **1:10** (10%) | Cúp Đá trở lên
  - 🔴 **Bột đá đỏ (Redstone):** Tỉ lệ **1:10** (10%) | Cúp Sắt trở lên
  - 🪙 **Quặng vàng (Gold Ore):** Tỉ lệ **1:10** (10%) | Cúp Sắt trở lên
  - 💎 **Kim cương (Diamond):** Tỉ lệ **1:20** (5%) | Cúp Sắt trở lên

---

### 6. 🧭 Thám Hiểm, Hồ Nước, Hồ Dung Nham & Đúc Obsidian
- **Tỉ lệ gặp Công Trình (Làng, Đền sa mạc, Tiền đồn, Tàu đắm, Trial Chambers 1.21.1):**
  - **Đi bộ dưới đất:** **5%**
  - **Bay bằng Cánh Cứng Elytra + Pháo hoa:** **7%** (100% không gặp quái vật)
- **Tỉ lệ gặp Hồ tự nhiên khi đi dạo:**
  - 🌊 **Hồ Nước:** Tỉ lệ **1:10** (10%)
  - 🌋 **Hồ Dung Nham:** Tỉ lệ **1:15** (~6.67%)
- **Cơ chế Múc Nước & Đúc Hắc Diện Thạch (Obsidian):**
  1. Chế tạo **Xô Sắt (Bucket)** tại bàn chế tạo bằng **3 Thỏi Sắt**.
  2. Khi đi dạo gặp Hồ Nước hoặc Hồ Dung Nham, bấm nút **[💧 Múc Nước]** hoặc **[🌋 Múc Dung Nham]** để lấy **Xô Nước** và **Xô Dung Nham**.
  3. Đặt **1 Xô Nước + 1 Xô Dung Nham** vào Bàn Chế Tạo `/craft` để đúc ra **1 Hắc Diện Thạch (Obsidian)** và **nhận lại 2 Xô rỗng**!
  4. Thu thập đủ 10 Obsidian + 1 Bật lửa để mở Cổng Nether!

---

### 7. ⚔️ Đấu Trường PvP Giữa Người Chơi
- Lệnh: `/pvp target: @user bet: [tiền_cược] mode: [Giao hữu | Sinh tử]`
- **🤝 Chế độ Giao hữu:** Thắng nhận tiền cược, thua chỉ mất tiền cược, không mất đồ trong túi.
- **🔥 Chế độ Sinh tử (Hardcore PvP):** Kẻ bại trận bị **CHẾT MẤT HẾT ĐỒ**, toàn bộ vật phẩm rơi ra sẽ thuộc về người chiến thắng!
- Trận đấu theo lượt thời gian thực trên Discord với 4 nút hành động:
  - `[⚔️ Chém Kiếm]` - Gây sát thương dựa trên Kiếm và trang bị.
  - `[🏹 Bắn Cung]` - Tấn công tầm xa với tỉ lệ bắn trúng đầu chí mạng.
  - `[🛡️ Giơ Khiên]` - Giảm 75% sát thương nhận vào ở lượt tới.
  - `[🍏 Dùng Táo Vàng / Máu]` - Hồi phục máu ngay lập tức.

---

### 8. 🔨 Toàn Bộ Hệ Thống Chế Tạo Minecraft 1.21.1 & Kinh Điển
- **Tính năng độc quyền 1.21.1 (Tricky Trials):**
  - **Chùy (Mace 1.21.1) 🔨:** Vũ khí đập cực mạnh (Công 18) rèn từ **Khối Lõi Nặng (Heavy Core)** + **Que Breeze (Breeze Rod)**!
  - **Đạn Gió (Wind Charge 1.21.1) 💨:** Chế từ Que Breeze, phóng gió bật lùi đối thủ.
  - **Bàn Chế Tạo Tự Động (Crafter 1.21.1) ⚙️:** Chế từ Sắt + Bàn chế tạo + Redstone.
  - **Đồng & Thiết Bị:** Quặng đồng, Thỏi đồng, Khối đồng, Cột thu lôi (Lightning Rod), Kính viễn vọng (Spyglass).
- **Bộ Dụng Cụ, Vũ Khí & Giáp Đầy Đủ:**
  - Gỗ, Đá, Sắt, Vàng, Kim Cương, Netherite (đầy đủ Mũ, Áo, Quần, Ủng, Cúp, Rìu, Kiếm).
  - Cung, Nỏ (Crossbow), Mũi tên, Khiên chắn, Bật lửa, Đuốc, Xô sắt.
  - Hải Đăng (Beacon Ma Thuật), Tinh Thể End, Bánh Mì, Thuốc Nổ TNT, Táo Vàng, Hộp Shulker, Vật Tổ Bất Tử.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY BOT

### Bước 1: Tạo Bot trên Discord Developer Portal
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications).
2. Bấm nút **New Application** ở góc trên bên phải, đặt tên cho Bot (ví dụ: `Minecraft RPG`) và bấm **Create**.
3. Vào tab **Bot** (ở menu bên trái):
   - Bấm nút **Reset Token** để lấy mã **Token của Bot** (hãy sao chép lại).
   - Cuộn xuống mục **Privileged Gateway Intents**, bật cả 3 mục:
     - ✅ **PRESENCE INTENT**
     - ✅ **SERVER MEMBERS INTENT**
     - ✅ **MESSAGE CONTENT INTENT**
   - Bấm **Save Changes**.
4. Vào tab **General Information**, sao chép dòng **Application ID** (đây chính là `CLIENT_ID`).

---

### Bước 2: Mời Bot vào Server Discord của bạn
1. Vào tab **OAuth2** ➔ **URL Generator** trên Developer Portal.
2. Tại mục **SCOPES**, tích chọn:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Tại mục **BOT PERMISSIONS**, tích chọn:
   - ✅ `Administrator` (hoặc tối thiểu: Send Messages, Embed Links, Attach Files, Read Message History, Use Slash Commands).
4. Sao chép đường link ở cuối trang, dán vào trình duyệt để mời Bot vào server Discord của bạn.

---

### Bước 3: Cấu hình file `.env`
Mở file `.env` trong thư mục dự án và điền Token cùng Client ID của bạn vào:

```env
DISCORD_TOKEN=dien_token_cua_bot_vao_day
CLIENT_ID=dien_application_id_cua_bot_vao_day
# GUILD_ID=dien_id_server_neu_muon_lenh_cap_nhat_ngay_lap_tuc
```

---

### Bước 4: Khởi động Bot
Mở PowerShell hoặc Command Prompt tại thư mục dự án và chạy lệnh:

```bash
npm start
```

Khi màn hình hiển thị:
```
🤖 Bot Minecraft RPG đã đăng nhập thành công: ...
⏰ Chu kỳ thời gian Minecraft 24h đã kích hoạt!
[Deploy] Đã đăng ký thành công commands toàn cầu (Global)!
```
Nghĩa là Bot đã sẵn sàng 100% để phục vụ người chơi trong server Discord của bạn!

---

## 📜 DANH SÁCH LỆNH SLASH COMMANDS

| Lệnh | Mô tả |
| :--- | :--- |
| `/menu` | **Menu chính tương tác:** Thẻ thông tin, chỉ số, túi đồ, trang bị, khu vực, cài đặt |
| `/explore` | **Đi dạo thám hiểm:** Gặp công trình (Làng, Đền sa mạc, Tiền đồn, Tàu đắm), Rương báu, Boss Wither & Ravager |
| `/mine` | Đi đào khoáng sản trong Hang Đá (Than, Sắt, Vàng, Kim Cương, Obsidian) |
| `/chop` | Chặt cây lấy Gỗ Sồi, Que Gỗ và Quả Táo trong Rừng |
| `/hunt [area]` | Săn thú hiền hoặc chiến đấu với quái vật theo khu vực (Rừng, Hang, Nether, The End) |
| `/pvp [target] [bet] [mode]` | Khiêu chiến người chơi khác với tiền cược và chế độ Giao Hữu / Sinh Tử |
| `/sleep` | Ngủ tại Nhà hồi đầy Máu/Mana và tua nhanh qua ban đêm |
| `/craft [recipe]` | Bàn chế tạo công cụ, vũ khí, áo giáp, cổng Nether, Mắt Ender |
| `/shop [list\|buy\|sell]` | Sàn giao dịch mua bán tài nguyên với cửa hàng |
| `/daily` | Điểm danh nhận quà sinh tồn miễn phí mỗi ngày (100 Xu, Táo, Thịt bò, EXP) |
| `/top [category]` | Bảng xếp hạng cao thủ (Cấp độ, Tài phú, Đấu sĩ PvP, Diệt Rồng) |
| `/help` | Hướng dẫn chi tiết cách chơi game |

---

## 📁 CẤU TRÚC DỰ ÁN

```
minecraft-rgp/
├── .env                  # Cấu hình Token & Client ID
├── .env.example          # Mẫu cấu hình
├── package.json          # Quản lý dependencies (discord.js, @napi-rs/canvas, dotenv)
├── README.md             # Hướng dẫn chi tiết toàn bộ dự án
├── anhgoiylambot/        # Hình ảnh giao diện mẫu người dùng cung cấp
├── src/
│   ├── index.js          # File chạy chính của Bot, khởi tạo và router
│   ├── config.js         # Dữ liệu vật phẩm, quái vật, công thức chế tạo, emoji
│   ├── database/
│   │   └── db.js         # Quản lý dữ liệu người chơi, túi đồ, rương an toàn, tự động lưu
│   ├── systems/
│   │   ├── timeSystem.js      # Chu kỳ Ngày/Đêm 20 phút Minecraft
│   │   ├── canvasProfile.js   # Vẽ ảnh thẻ nhân vật Profile Card bằng Canvas
│   │   ├── deathSystem.js     # Cơ chế chết mất đồ, rơi tiền, Vật Tổ Bất Tử Totem
│   │   ├── mobSystem.js       # Quái vật spawn theo ngày/đêm & biome, Boss Rồng Ender
│   │   ├── combatSystem.js    # Trận đấu PVE theo lượt bằng nút tương tác Discord
│   │   ├── pvpSystem.js       # Đấu trường PvP giữa 2 người chơi (Giao hữu & Sinh tử)
│   │   ├── dimensionSystem.js # Cổng Nether & Cổng The End
│   │   └── craftingSystem.js  # Hệ thống chế tạo & rèn đồ
│   ├── commands/              # Các lệnh Slash Commands
│   │   ├── menu.js       # Lệnh /menu trung tâm
│   │   ├── mine.js       # /mine
│   │   ├── chop.js       # /chop
│   │   ├── hunt.js       # /hunt
│   │   ├── pvp.js        # /pvp
│   │   ├── sleep.js      # /sleep
│   │   ├── shop.js       # /shop
│   │   ├── craft.js      # /craft
│   │   ├── daily.js      # /daily
│   │   ├── top.js        # /top
│   │   └── help.js       # /help
│   └── utils/
│       └── uiHelper.js   # Xây dựng các Embed và Buttons chuẩn giao diện ảnh mẫu
└── data/
    └── players.json      # File lưu trữ cơ sở dữ liệu người chơi
```
