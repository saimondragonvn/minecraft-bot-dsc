// Cấu hình game Minecraft RPG
module.exports = {
  // Danh sách ID Quản trị viên (Admin) - Mặc định có id: 944428607642664972
  ADMIN_IDS: [
    '944428607642664972'
  ],

  // Biểu tượng cảm xúc (Emojis)
  EMOJIS: {
    HEART: '❤️',
    MANA: '💧',
    STAR: '⭐',
    COIN: '🪙',
    CHEST: '📦',
    SWORD: '⚔️',
    PICKAXE: '⛏️',
    AXE: '🪓',
    BOW: '🏹',
    SHIELD: '🛡️',
    HELMET: '🪖',
    CHESTPLATE: '🥋',
    LEGGINGS: '👖',
    BOOTS: '👢',
    OAK_LOG: '🪵',
    STICK: '🥢',
    STONE: '🪨',
    IRON_ORE: '🪙',
    IRON_INGOT: '🥈',
    GOLD_ORE: '🪙',
    GOLD_INGOT: '🥇',
    DIAMOND: '💎',
    NETHERITE: '🖤',
    OBSIDIAN: '⬛',
    BLAZE_ROD: '🔥',
    ENDER_PEARL: '🔮',
    EYE_OF_ENDER: '👁️',
    TOTEM: '🗿',
    APPLE: '🍎',
    GOLDEN_APPLE: '🍏',
    RAW_CHICKEN: '🍗',
    RAW_PORK: '🥩',
    RAW_BEEF: '🥩',
    FEATHER: '🪶',
    WHEAT_SEEDS: '🌱',
    SUN: '☀️',
    MOON: '🌙',
    CLOCK: '⏰',
    SKULL: '☠️',
    FIRE: '🔥',
    DRAGON: '🐲',
    POTION: '🧪',
    HOME: '🏠',
    SHOP: '🛒',
    BANK: '🏦',
    AUCTION: '⚖️',
    ANVIL: '🔨',
    FOREST: '🪵',
    CAVE: '🪨',
    DUNGEON: '🧟',
    NETHER: '🌋',
    THE_END: '🌌'
  },

  // Danh sách vật phẩm trong Game (Items Database)
  ITEMS: {
    // Tài nguyên cơ bản (Basic Resources)
    oak_log: { id: 'oak_log', name: 'Gỗ sồi', emoji: '🪵', type: 'material', sellPrice: 12, buyPrice: null, stackSize: 64, weight: 1 },
    stick: { id: 'stick', name: 'Que gỗ', emoji: '🥢', type: 'material', sellPrice: 4, buyPrice: null, stackSize: 64, weight: 0.5 },
    feather: { id: 'feather', name: 'Lông gà', emoji: '🪶', type: 'material', sellPrice: 15, buyPrice: null, stackSize: 64, weight: 0.2 },
    apple: { id: 'apple', name: 'Táo', emoji: '🍎', type: 'food', heal: 4, sellPrice: 50, buyPrice: null, stackSize: 64, weight: 0.5 },
    golden_apple: { id: 'golden_apple', name: 'Táo vàng', emoji: '🍏', type: 'food', heal: 15, absorption: 10, sellPrice: 2000, buyPrice: null, stackSize: 16, weight: 1 },
    raw_chicken: { id: 'raw_chicken', name: 'Thịt gà sống', emoji: '🍗', type: 'food', heal: 2, sellPrice: 30, buyPrice: null, stackSize: 64, weight: 0.5 },
    raw_pork: { id: 'raw_pork', name: 'Thịt heo sống', emoji: '🥩', type: 'food', heal: 3, sellPrice: 40, buyPrice: null, stackSize: 64, weight: 0.8 },
    raw_beef: { id: 'raw_beef', name: 'Thịt bò sống', emoji: '🥩', type: 'food', heal: 4, sellPrice: 50, buyPrice: null, stackSize: 64, weight: 1 },
    cooked_beef: { id: 'cooked_beef', name: 'Bít tết bò chín', emoji: '🥩', type: 'food', heal: 8, sellPrice: 160, buyPrice: null, stackSize: 64, weight: 0.8 },
    cooked_porkchop: { id: 'cooked_porkchop', name: 'Thịt heo nướng', emoji: '🍖', type: 'food', heal: 8, sellPrice: 150, buyPrice: null, stackSize: 64, weight: 0.8 },
    cooked_chicken: { id: 'cooked_chicken', name: 'Thịt gà nướng', emoji: '🍗', type: 'food', heal: 6, sellPrice: 120, buyPrice: null, stackSize: 64, weight: 0.5 },
    raw_mutton: { id: 'raw_mutton', name: 'Thịt cừu sống', emoji: '🥩', type: 'food', heal: 3, sellPrice: 40, buyPrice: null, stackSize: 64, weight: 0.6 },
    cooked_mutton: { id: 'cooked_mutton', name: 'Thịt cừu nướng', emoji: '🍖', type: 'food', heal: 8, sellPrice: 150, buyPrice: null, stackSize: 64, weight: 0.6 },
    white_wool: { id: 'white_wool', name: 'Khối len trắng', emoji: '🧶', type: 'material', sellPrice: 60, buyPrice: null, stackSize: 64, weight: 0.3 },
    bed: { id: 'bed', name: 'Giường ngủ', emoji: '🛏️', type: 'special', sellPrice: 150, buyPrice: null, stackSize: 1, weight: 4, description: 'Dùng để ngủ tại Nhà để hồi phục đầy đủ Máu & Mana.' },
    wheat_seeds: { id: 'wheat_seeds', name: 'Hạt lúa mì', emoji: '🌱', type: 'material', sellPrice: 10, buyPrice: null, stackSize: 64, weight: 0.1 },
    bread: { id: 'bread', name: 'Bánh mì', emoji: '🥖', type: 'food', heal: 6, sellPrice: 60, buyPrice: null, stackSize: 64, weight: 0.3 },
    emerald: { id: 'emerald', name: 'Ngọc lục bảo', emoji: '🟢', type: 'currency', sellPrice: 400, buyPrice: null, stackSize: 64, weight: 0.5 },
    saddle: { id: 'saddle', name: 'Yên ngựa', emoji: '🪑', type: 'special', sellPrice: 1500, buyPrice: null, stackSize: 1, weight: 2 },
    tnt: { id: 'tnt', name: 'Thuốc nổ TNT', emoji: '🧨', type: 'special', sellPrice: 500, buyPrice: null, stackSize: 16, weight: 2 },
    nether_star: { id: 'nether_star', name: 'Sao Địa Ngục', emoji: '🌟', type: 'trophy', sellPrice: null, buyPrice: null, stackSize: 16, weight: 1, description: 'Nguyên liệu thần thoại rơi ra từ Trùm Wither 3 Đầu!' },
    beacon: { id: 'beacon', name: 'Đèn Hiệu (Beacon)', emoji: '🗼', type: 'relic', sellPrice: null, buyPrice: null, stackSize: 1, weight: 8, description: 'Thần khí tối thượng rơi từ Trùm Wither! Giữ trong túi đồ để nhận Hào Quang: +2 Công ⚔️, +2 Giáp 🛡️, +5 Max HP ❤️ và +25% May mắn khi Đào Khoáng/Chặt Cây!' },
    wither_rose: { id: 'wither_rose', name: 'Hoa Hồng Wither', emoji: '🥀', type: 'material', sellPrice: null, buyPrice: null, stackSize: 64, weight: 0.1, description: 'Bông hoa đen huyền bí mọc từ tàn tích của Wither.' },
    leather: { id: 'leather', name: 'Da thuộc', emoji: '🟫', type: 'material', sellPrice: 60, buyPrice: null, stackSize: 64, weight: 0.5 },

    // Khoáng sản (Ores & Minerals) - KHÔNG BÁN TẠI CỬA HÀNG (Người chơi phải tự đi đào)
    cobblestone: { id: 'cobblestone', name: 'Đá cuội', emoji: '🪨', type: 'material', isMineral: true, sellPrice: 12, buyPrice: null, stackSize: 64, weight: 1 },
    stone: { id: 'stone', name: 'Đá nhẵn (Stone)', emoji: '🪨', type: 'material', isMineral: true, sellPrice: 25, buyPrice: null, stackSize: 64, weight: 1 },
    coal: { id: 'coal', name: 'Than đá', emoji: '⚫', type: 'material', isMineral: true, sellPrice: 45, buyPrice: null, stackSize: 64, weight: 1 },
    iron_ore: { id: 'iron_ore', name: 'Quặng sắt', emoji: '🪙', type: 'material', isMineral: true, sellPrice: 75, buyPrice: null, stackSize: 64, weight: 2 },
    iron_ingot: { id: 'iron_ingot', name: 'Thỏi sắt', emoji: '🥈', type: 'material', isMineral: true, sellPrice: 150, buyPrice: null, stackSize: 64, weight: 2 },
    gold_ore: { id: 'gold_ore', name: 'Quặng vàng', emoji: '🪙', type: 'material', isMineral: true, sellPrice: 150, buyPrice: null, stackSize: 64, weight: 2 },
    gold_ingot: { id: 'gold_ingot', name: 'Thỏi vàng', emoji: '🥇', type: 'material', isMineral: true, sellPrice: 300, buyPrice: null, stackSize: 64, weight: 2 },
    copper_ore: { id: 'copper_ore', name: 'Quặng đồng', emoji: '🪙', type: 'material', isMineral: true, sellPrice: 50, buyPrice: null, stackSize: 64, weight: 2 },
    copper_ingot: { id: 'copper_ingot', name: 'Thỏi đồng', emoji: '🥉', type: 'material', isMineral: true, sellPrice: 100, buyPrice: null, stackSize: 64, weight: 2 },
    copper_block: { id: 'copper_block', name: 'Khối đồng', emoji: '🧱', type: 'material', isMineral: true, sellPrice: 900, buyPrice: null, stackSize: 64, weight: 10 },
    redstone: { id: 'redstone', name: 'Bột đá đỏ', emoji: '🔴', type: 'material', isMineral: true, sellPrice: 60, buyPrice: null, stackSize: 64, weight: 0.5 },
    lapis: { id: 'lapis', name: 'Ngọc lưu ly', emoji: '🔷', type: 'material', isMineral: true, sellPrice: 90, buyPrice: null, stackSize: 64, weight: 0.8 },
    diamond: { id: 'diamond', name: 'Kim cương', emoji: '💎', type: 'material', isMineral: true, sellPrice: 1200, buyPrice: null, stackSize: 64, weight: 1 },
    obsidian: { id: 'obsidian', name: 'Hắc diện thạch', emoji: '⬛', type: 'material', isMineral: true, sellPrice: 400, buyPrice: null, stackSize: 64, weight: 5 },
    netherrack: { id: 'netherrack', name: 'Đá địa ngục', emoji: '🧱', type: 'material', isMineral: true, sellPrice: 15, buyPrice: null, stackSize: 64, weight: 1 },
    quartz: { id: 'quartz', name: 'Thạch anh Nether', emoji: '▫️', type: 'material', isMineral: true, sellPrice: 80, buyPrice: null, stackSize: 64, weight: 0.5 },
    ancient_debris: { id: 'ancient_debris', name: 'Mảnh vỡ cổ đại', emoji: '🧱', type: 'material', isMineral: true, sellPrice: null, buyPrice: null, stackSize: 64, weight: 4 },
    netherite_scrap: { id: 'netherite_scrap', name: 'Mảnh vụn Netherite', emoji: '🪨', type: 'material', isMineral: true, sellPrice: null, buyPrice: null, stackSize: 64, weight: 3 },
    netherite_ingot: { id: 'netherite_ingot', name: 'Thỏi Netherite', emoji: '🖤', type: 'material', isMineral: true, sellPrice: null, buyPrice: null, stackSize: 64, weight: 5 },
    iron_block: { id: 'iron_block', name: 'Khối sắt', emoji: '🥈', type: 'material', isMineral: true, sellPrice: 1350, buyPrice: null, stackSize: 64, weight: 18 },
    gold_block: { id: 'gold_block', name: 'Khối vàng', emoji: '🥇', type: 'material', isMineral: true, sellPrice: 2700, buyPrice: null, stackSize: 64, weight: 18 },
    diamond_block: { id: 'diamond_block', name: 'Khối kim cương', emoji: '💎', type: 'material', isMineral: true, sellPrice: 10800, buyPrice: null, stackSize: 64, weight: 10 },
    netherite_block: { id: 'netherite_block', name: 'Khối netherite', emoji: '🖤', type: 'material', isMineral: true, sellPrice: null, buyPrice: null, stackSize: 64, weight: 30 },

    // Vật phẩm quái rơi (Mob Drops) - Tự săn bắt
    rotten_flesh: { id: 'rotten_flesh', name: 'Thịt thối rữa', emoji: '🍖', type: 'food', heal: 2, sellPrice: 25, buyPrice: null, stackSize: 64, weight: 0.5 },
    bone: { id: 'bone', name: 'Xương', emoji: '🦴', type: 'material', sellPrice: 35, buyPrice: null, stackSize: 64, weight: 0.5 },
    arrow: { id: 'arrow', name: 'Mũi tên', emoji: '🏹', type: 'ammo', damage: 3, sellPrice: 20, buyPrice: null, stackSize: 64, weight: 0.1 },
    string: { id: 'string', name: 'Sợi chỉ', emoji: '🧵', type: 'material', sellPrice: 35, buyPrice: null, stackSize: 64, weight: 0.1 },
    spider_eye: { id: 'spider_eye', name: 'Mắt nhện', emoji: '👁️', type: 'material', sellPrice: 50, buyPrice: null, stackSize: 64, weight: 0.3 },
    gunpowder: { id: 'gunpowder', name: 'Thuốc súng', emoji: '💣', type: 'material', sellPrice: 100, buyPrice: null, stackSize: 64, weight: 0.5 },
    ender_pearl: { id: 'ender_pearl', name: 'Ngọc Ender', emoji: '🔮', type: 'material', sellPrice: 500, buyPrice: null, stackSize: 16, weight: 1 },

    // Vật phẩm Nether
    glowstone_dust: { id: 'glowstone_dust', name: 'Bột đá phát sáng', emoji: '✨', type: 'material', sellPrice: 100, buyPrice: null, stackSize: 64, weight: 0.3 },
    blaze_rod: { id: 'blaze_rod', name: 'Que lửa Blaze', emoji: '🔥', type: 'material', sellPrice: 500, buyPrice: null, stackSize: 64, weight: 1 },
    blaze_powder: { id: 'blaze_powder', name: 'Bột lửa', emoji: '💥', type: 'material', sellPrice: 250, buyPrice: null, stackSize: 64, weight: 0.5 },
    wither_skeleton_skull: { id: 'wither_skeleton_skull', name: 'Đầu Wither Skeleton', emoji: '💀', type: 'material', sellPrice: null, buyPrice: null, stackSize: 64, weight: 3 },
    ghast_tear: { id: 'ghast_tear', name: 'Nước mắt Ghast', emoji: '💧', type: 'material', sellPrice: 1200, buyPrice: null, stackSize: 64, weight: 0.5 },
    nether_wart: { id: 'nether_wart', name: 'Bướu Nether', emoji: '🍄', type: 'material', sellPrice: 100, buyPrice: null, stackSize: 64, weight: 0.2 },
    bone_block: { id: 'bone_block', name: 'Khối xương', emoji: '🦴', type: 'material', sellPrice: 300, buyPrice: null, stackSize: 64, weight: 4.5 },
    music_disc_pigstep: { id: 'music_disc_pigstep', name: 'Đĩa nhạc Pigstep', emoji: '💿', type: 'special', sellPrice: null, buyPrice: null, stackSize: 1, weight: 1 },

    // Vật phẩm The End
    eye_of_ender: { id: 'eye_of_ender', name: 'Mắt Ender', emoji: '👁️', type: 'quest', sellPrice: 500, buyPrice: null, stackSize: 16, weight: 1 },
    shulker_shell: { id: 'shulker_shell', name: 'Vỏ Shulker', emoji: '🐚', type: 'material', sellPrice: null, buyPrice: null, stackSize: 64, weight: 2 },
    shulker_box: { id: 'shulker_box', name: 'Hộp Shulker', emoji: '📦', type: 'special', capacityBonus: 4000, sellPrice: null, buyPrice: null, stackSize: 1, weight: 5 },
    dragon_egg: { id: 'dragon_egg', name: 'Trứng Rồng Ender', emoji: '🥚', type: 'trophy', sellPrice: null, buyPrice: null, stackSize: 1, weight: 10, description: 'Chiến lợi phẩm tối thượng khi hạ gục Rồng Ender! Biểu tượng vinh quang của dũng sĩ diệt rồng.' },
    dragon_breath: { id: 'dragon_breath', name: 'Hơi Thở Rồng (Dragon Breath)', emoji: '🟣', type: 'material', sellPrice: null, buyPrice: null, stackSize: 64, weight: 1, description: 'Làn khói tím ma thuật thu thập từ Rồng Ender, nguyên liệu luyện thần dược!' },
    elytra: { id: 'elytra', name: 'Cánh cứng Elytra', emoji: '🪽', type: 'chestplate', defense: 6, speedBonus: 40, durability: 432, maxDurability: 432, sellPrice: null, buyPrice: null, stackSize: 1, weight: 3 },

    // Vật phẩm Đặc biệt & Dược Phẩm (Bán tại Shop với tỉ lệ 1 kiếm : 20 mua)
    totem_of_undying: { id: 'totem_of_undying', name: 'Vật Tổ Bất Tử (Totem)', emoji: '🗿', type: 'special', sellPrice: 2500, buyPrice: 50000, stackSize: 1, weight: 2, description: 'Cứu sống bạn khi máu về 0 và giữ an toàn túi đồ! Tỉ lệ 1:20.' },
    flint_and_steel: { id: 'flint_and_steel', name: 'Bật lửa', emoji: '🔥', type: 'tool', sellPrice: 100, buyPrice: null, stackSize: 1, weight: 1 },
    health_potion: { id: 'health_potion', name: 'Bình thuốc hồi máu', emoji: '🧪', type: 'potion', heal: 12, sellPrice: 50, buyPrice: 1000, stackSize: 16, weight: 1, description: 'Dược phẩm ma thuật hồi phục ngay 12 Máu (HP)! Giá bán 50 Xu - Giá mua 1,000 Xu (1:20).' },
    mana_potion: { id: 'mana_potion', name: 'Bình thuốc Mana', emoji: '🧪', type: 'potion', manaHeal: 10, sellPrice: 50, buyPrice: 1000, stackSize: 16, weight: 1, description: 'Hồi phục ngay 10 Mana ma thuật! Giá bán 50 Xu - Giá mua 1,000 Xu (1:20).' },
    strength_potion: { id: 'strength_potion', name: 'Thuốc Sức Mạnh (Strength)', emoji: '💪', type: 'potion', effectType: 'strength', effectValue: 6, durationMinutes: 10, sellPrice: 150, buyPrice: 3000, stackSize: 16, weight: 1, description: 'Uống để tăng +6 Sát Thương (Công) trong 10 phút! Giá bán 150 Xu - Giá mua 3,000 Xu (1:20).' },
    resistance_potion: { id: 'resistance_potion', name: 'Thuốc Kháng Cự (Resistance)', emoji: '🛡️', type: 'potion', effectType: 'resistance', effectValue: 5, durationMinutes: 10, sellPrice: 150, buyPrice: 3000, stackSize: 16, weight: 1, description: 'Uống để tăng +5 Phòng Thủ (Giáp) trong 10 phút! Giá bán 150 Xu - Giá mua 3,000 Xu (1:20).' },
    luck_potion: { id: 'luck_potion', name: 'Thuốc May Mắn (Luck)', emoji: '🍀', type: 'potion', effectType: 'luck', effectValue: 1, durationMinutes: 10, sellPrice: 300, buyPrice: 6000, stackSize: 16, weight: 1, description: 'Uống để tăng 2x tỉ lệ đào trúng Kim Cương/Quặng quý & rơi đồ trong 10 phút! Giá bán 300 Xu - Giá mua 6,000 Xu (1:20).' },
    sugar_cane: { id: 'sugar_cane', name: 'Mía đường', emoji: '🎋', type: 'material', sellPrice: 3, buyPrice: null, stackSize: 64, weight: 0.2 },
    paper: { id: 'paper', name: 'Giấy', emoji: '📜', type: 'material', sellPrice: 4, buyPrice: null, stackSize: 64, weight: 0.1 },
    firework_rocket: { id: 'firework_rocket', name: 'Pháo hoa (Dùng bay với Cánh Cứng)', emoji: '🚀', type: 'special', sellPrice: null, buyPrice: null, stackSize: 64, weight: 0.3 },
    heavy_core: { id: 'heavy_core', name: 'Khối Lõi Nặng (Heavy Core 1.21.1)', emoji: '🪨', type: 'material', sellPrice: null, buyPrice: null, stackSize: 16, weight: 8 },
    breeze_rod: { id: 'breeze_rod', name: 'Que Breeze (1.21.1)', emoji: '🌀', type: 'material', sellPrice: null, buyPrice: null, stackSize: 64, weight: 1 },
    wind_charge: { id: 'wind_charge', name: 'Đạn Gió (Wind Charge 1.21.1)', emoji: '💨', type: 'special', damage: 6, sellPrice: null, buyPrice: null, stackSize: 64, weight: 0.2 },
    trial_key: { id: 'trial_key', name: 'Chìa Khóa Trial Key (1.21.1)', emoji: '🗝️', type: 'special', sellPrice: null, buyPrice: null, stackSize: 16, weight: 0.5 },
    crafter: { id: 'crafter', name: 'Bàn Chế Tạo Tự Động (Crafter 1.21.1)', emoji: '⚙️', type: 'special', sellPrice: null, buyPrice: null, stackSize: 64, weight: 4 },
    lightning_rod: { id: 'lightning_rod', name: 'Cột thu lôi', emoji: '⚡', type: 'special', sellPrice: 150, buyPrice: null, stackSize: 64, weight: 2 },
    spyglass: { id: 'spyglass', name: 'Kính viễn vọng', emoji: '🔭', type: 'special', sellPrice: 200, buyPrice: null, stackSize: 1, weight: 1 },
    mace: { id: 'mace', name: 'Chùy (Mace 1.21.1)', emoji: '🔨', type: 'sword', attack: 18, durability: 500, maxDurability: 500, sellPrice: null, buyPrice: null, stackSize: 1, weight: 8 },
    crafting_table: { id: 'crafting_table', name: 'Bàn chế tạo', emoji: '🪑', type: 'special', sellPrice: 20, buyPrice: null, stackSize: 64, weight: 2 },
    book: { id: 'book', name: 'Sách', emoji: '📖', type: 'material', sellPrice: 20, buyPrice: 400, stackSize: 64, weight: 0.5 },
    // SÁCH PHÙ PHÉP (ENCHANTED BOOKS) TỪ CẤP I ĐẾN CẤP V
    // 1. Sắc Bén (Sharpness I - V) - Kiếm / Rìu
    // SÁCH PHÙ PHÉP (ENCHANTED BOOKS) TỪ CẤP I ĐẾN CẤP V (Tỉ lệ 1 kiếm : 20 mua)
    // 1. Sắc Bén (Sharpness I - V) - Kiếm / Rìu
    book_sharpness_1: { id: 'book_sharpness_1', name: 'Sách Phù Phép: Sắc Bén I', emoji: '📕', type: 'book', enchantId: 'sharpness', level: 1, targetSlot: ['sword', 'axe'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_sharpness_2: { id: 'book_sharpness_2', name: 'Sách Phù Phép: Sắc Bén II', emoji: '📕', type: 'book', enchantId: 'sharpness', level: 2, targetSlot: ['sword', 'axe'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_sharpness_3: { id: 'book_sharpness_3', name: 'Sách Phù Phép: Sắc Bén III', emoji: '📕', type: 'book', enchantId: 'sharpness', level: 3, targetSlot: ['sword', 'axe'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_sharpness_4: { id: 'book_sharpness_4', name: 'Sách Phù Phép: Sắc Bén IV', emoji: '📕', type: 'book', enchantId: 'sharpness', level: 4, targetSlot: ['sword', 'axe'], sellPrice: 2000, buyPrice: 40000, stackSize: 16, weight: 1 },
    book_sharpness_5: { id: 'book_sharpness_5', name: 'Sách Phù Phép: Sắc Bén V', emoji: '📕', type: 'book', enchantId: 'sharpness', level: 5, targetSlot: ['sword', 'axe'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },
    book_sharpness: { id: 'book_sharpness', name: 'Sách Phù Phép: Sắc Bén V', emoji: '📕', type: 'book', enchantId: 'sharpness', level: 5, targetSlot: ['sword', 'axe'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },

    // 2. Trừng Phạt / Hại Thây Ma (Smite I - V) - Kiếm / Rìu
    book_smite_1: { id: 'book_smite_1', name: 'Sách Phù Phép: Hại Thây Ma I (Smite)', emoji: '⚡', type: 'book', enchantId: 'smite', level: 1, targetSlot: ['sword', 'axe'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_smite_2: { id: 'book_smite_2', name: 'Sách Phù Phép: Hại Thây Ma II (Smite)', emoji: '⚡', type: 'book', enchantId: 'smite', level: 2, targetSlot: ['sword', 'axe'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_smite_3: { id: 'book_smite_3', name: 'Sách Phù Phép: Hại Thây Ma III (Smite)', emoji: '⚡', type: 'book', enchantId: 'smite', level: 3, targetSlot: ['sword', 'axe'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_smite_4: { id: 'book_smite_4', name: 'Sách Phù Phép: Hại Thây Ma IV (Smite)', emoji: '⚡', type: 'book', enchantId: 'smite', level: 4, targetSlot: ['sword', 'axe'], sellPrice: 2000, buyPrice: 40000, stackSize: 16, weight: 1 },
    book_smite_5: { id: 'book_smite_5', name: 'Sách Phù Phép: Hại Thây Ma V (Smite)', emoji: '⚡', type: 'book', enchantId: 'smite', level: 5, targetSlot: ['sword', 'axe'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },
    book_smite: { id: 'book_smite', name: 'Sách Phù Phép: Hại Thây Ma V (Smite)', emoji: '⚡', type: 'book', enchantId: 'smite', level: 5, targetSlot: ['sword', 'axe'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },

    // 3. Hại Chân Đốt (Bane of Arthropods I - V) - Kiếm / Rìu
    book_bane_of_arthropods_1: { id: 'book_bane_of_arthropods_1', name: 'Sách Phù Phép: Hại Chân Đốt I', emoji: '🕷️', type: 'book', enchantId: 'bane_of_arthropods', level: 1, targetSlot: ['sword', 'axe'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_bane_of_arthropods_2: { id: 'book_bane_of_arthropods_2', name: 'Sách Phù Phép: Hại Chân Đốt II', emoji: '🕷️', type: 'book', enchantId: 'bane_of_arthropods', level: 2, targetSlot: ['sword', 'axe'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_bane_of_arthropods_3: { id: 'book_bane_of_arthropods_3', name: 'Sách Phù Phép: Hại Chân Đốt III', emoji: '🕷️', type: 'book', enchantId: 'bane_of_arthropods', level: 3, targetSlot: ['sword', 'axe'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_bane_of_arthropods_4: { id: 'book_bane_of_arthropods_4', name: 'Sách Phù Phép: Hại Chân Đốt IV', emoji: '🕷️', type: 'book', enchantId: 'bane_of_arthropods', level: 4, targetSlot: ['sword', 'axe'], sellPrice: 2000, buyPrice: 40000, stackSize: 16, weight: 1 },
    book_bane_of_arthropods_5: { id: 'book_bane_of_arthropods_5', name: 'Sách Phù Phép: Hại Chân Đốt V', emoji: '🕷️', type: 'book', enchantId: 'bane_of_arthropods', level: 5, targetSlot: ['sword', 'axe'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },
    book_bane_of_arthropods: { id: 'book_bane_of_arthropods', name: 'Sách Phù Phép: Hại Chân Đốt V', emoji: '🕷️', type: 'book', enchantId: 'bane_of_arthropods', level: 5, targetSlot: ['sword', 'axe'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },

    // 4. Hiệu Suất (Efficiency I - V) - Cúp / Rìu
    book_efficiency_1: { id: 'book_efficiency_1', name: 'Sách Phù Phép: Hiệu Suất I', emoji: '📙', type: 'book', enchantId: 'efficiency', level: 1, targetSlot: ['pickaxe', 'axe'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_efficiency_2: { id: 'book_efficiency_2', name: 'Sách Phù Phép: Hiệu Suất II', emoji: '📙', type: 'book', enchantId: 'efficiency', level: 2, targetSlot: ['pickaxe', 'axe'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_efficiency_3: { id: 'book_efficiency_3', name: 'Sách Phù Phép: Hiệu Suất III', emoji: '📙', type: 'book', enchantId: 'efficiency', level: 3, targetSlot: ['pickaxe', 'axe'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_efficiency_4: { id: 'book_efficiency_4', name: 'Sách Phù Phép: Hiệu Suất IV', emoji: '📙', type: 'book', enchantId: 'efficiency', level: 4, targetSlot: ['pickaxe', 'axe'], sellPrice: 2000, buyPrice: 40000, stackSize: 16, weight: 1 },
    book_efficiency_5: { id: 'book_efficiency_5', name: 'Sách Phù Phép: Hiệu Suất V', emoji: '📙', type: 'book', enchantId: 'efficiency', level: 5, targetSlot: ['pickaxe', 'axe'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },
    book_efficiency: { id: 'book_efficiency', name: 'Sách Phù Phép: Hiệu Suất V', emoji: '📙', type: 'book', enchantId: 'efficiency', level: 5, targetSlot: ['pickaxe', 'axe'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },

    // 5. Sức Mạnh Cung (Power I - V) - Cung tên
    book_power_1: { id: 'book_power_1', name: 'Sách Phù Phép: Sức Mạnh I', emoji: '📗', type: 'book', enchantId: 'power', level: 1, targetSlot: ['bow'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_power_2: { id: 'book_power_2', name: 'Sách Phù Phép: Sức Mạnh II', emoji: '📗', type: 'book', enchantId: 'power', level: 2, targetSlot: ['bow'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_power_3: { id: 'book_power_3', name: 'Sách Phù Phép: Sức Mạnh III', emoji: '📗', type: 'book', enchantId: 'power', level: 3, targetSlot: ['bow'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_power_4: { id: 'book_power_4', name: 'Sách Phù Phép: Sức Mạnh IV', emoji: '📗', type: 'book', enchantId: 'power', level: 4, targetSlot: ['bow'], sellPrice: 2000, buyPrice: 40000, stackSize: 16, weight: 1 },
    book_power_5: { id: 'book_power_5', name: 'Sách Phù Phép: Sức Mạnh V', emoji: '📗', type: 'book', enchantId: 'power', level: 5, targetSlot: ['bow'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },
    book_power: { id: 'book_power', name: 'Sách Phù Phép: Sức Mạnh V', emoji: '📗', type: 'book', enchantId: 'power', level: 5, targetSlot: ['bow'], sellPrice: 4000, buyPrice: 80000, stackSize: 16, weight: 1 },

    // 6. Bảo Vệ (Protection I - IV) - Áo giáp
    book_protection_1: { id: 'book_protection_1', name: 'Sách Phù Phép: Bảo Vệ I', emoji: '📘', type: 'book', enchantId: 'protection', level: 1, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_protection_2: { id: 'book_protection_2', name: 'Sách Phù Phép: Bảo Vệ II', emoji: '📘', type: 'book', enchantId: 'protection', level: 2, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_protection_3: { id: 'book_protection_3', name: 'Sách Phù Phép: Bảo Vệ III', emoji: '📘', type: 'book', enchantId: 'protection', level: 3, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_protection_4: { id: 'book_protection_4', name: 'Sách Phù Phép: Bảo Vệ IV', emoji: '📘', type: 'book', enchantId: 'protection', level: 4, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 2000, buyPrice: 40000, stackSize: 16, weight: 1 },
    book_protection: { id: 'book_protection', name: 'Sách Phù Phép: Bảo Vệ IV', emoji: '📘', type: 'book', enchantId: 'protection', level: 4, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 2000, buyPrice: 40000, stackSize: 16, weight: 1 },

    // 7. Góc Nhìn Lửa (Fire Aspect I - II) - Kiếm
    book_fire_aspect_1: { id: 'book_fire_aspect_1', name: 'Sách Phù Phép: Góc Nhìn Lửa I (Fire Aspect)', emoji: '🔥', type: 'book', enchantId: 'fire_aspect', level: 1, targetSlot: ['sword'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_fire_aspect_2: { id: 'book_fire_aspect_2', name: 'Sách Phù Phép: Góc Nhìn Lửa II (Fire Aspect)', emoji: '🔥', type: 'book', enchantId: 'fire_aspect', level: 2, targetSlot: ['sword'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_fire_aspect: { id: 'book_fire_aspect', name: 'Sách Phù Phép: Góc Nhìn Lửa II (Fire Aspect)', emoji: '🔥', type: 'book', enchantId: 'fire_aspect', level: 2, targetSlot: ['sword'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },

    // 8. Cướp Bóc (Looting I - III) - Kiếm
    book_looting_1: { id: 'book_looting_1', name: 'Sách Phù Phép: Cướp Bóc I (Looting)', emoji: '💰', type: 'book', enchantId: 'looting', level: 1, targetSlot: ['sword'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_looting_2: { id: 'book_looting_2', name: 'Sách Phù Phép: Cướp Bóc II (Looting)', emoji: '💰', type: 'book', enchantId: 'looting', level: 2, targetSlot: ['sword'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_looting_3: { id: 'book_looting_3', name: 'Sách Phù Phép: Cướp Bóc III (Looting)', emoji: '💰', type: 'book', enchantId: 'looting', level: 3, targetSlot: ['sword'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_looting: { id: 'book_looting', name: 'Sách Phù Phép: Cướp Bóc III (Looting)', emoji: '💰', type: 'book', enchantId: 'looting', level: 3, targetSlot: ['sword'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },

    // 9. Gai Phản Đòn (Thorns I - III) - Giáp
    book_thorns_1: { id: 'book_thorns_1', name: 'Sách Phù Phép: Gai I (Thorns)', emoji: '🌵', type: 'book', enchantId: 'thorns', level: 1, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_thorns_2: { id: 'book_thorns_2', name: 'Sách Phù Phép: Gai II (Thorns)', emoji: '🌵', type: 'book', enchantId: 'thorns', level: 2, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_thorns_3: { id: 'book_thorns_3', name: 'Sách Phù Phép: Gai III (Thorns)', emoji: '🌵', type: 'book', enchantId: 'thorns', level: 3, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_thorns: { id: 'book_thorns', name: 'Sách Phù Phép: Gai III (Thorns)', emoji: '🌵', type: 'book', enchantId: 'thorns', level: 3, targetSlot: ['helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },

    // 10. Chậm Hỏng (Unbreaking I - III) - Mọi trang bị
    book_unbreaking_1: { id: 'book_unbreaking_1', name: 'Sách Phù Phép: Chậm Hỏng I (Unbreaking)', emoji: '🔨', type: 'book', enchantId: 'unbreaking', level: 1, targetSlot: ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_unbreaking_2: { id: 'book_unbreaking_2', name: 'Sách Phù Phép: Chậm Hỏng II (Unbreaking)', emoji: '🔨', type: 'book', enchantId: 'unbreaking', level: 2, targetSlot: ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_unbreaking_3: { id: 'book_unbreaking_3', name: 'Sách Phù Phép: Chậm Hỏng III (Unbreaking)', emoji: '🔨', type: 'book', enchantId: 'unbreaking', level: 3, targetSlot: ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_unbreaking: { id: 'book_unbreaking', name: 'Sách Phù Phép: Chậm Hỏng III (Unbreaking)', emoji: '🔨', type: 'book', enchantId: 'unbreaking', level: 3, targetSlot: ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },

    // 11. Gia Tài (Fortune I - III) - Cúp
    book_fortune_1: { id: 'book_fortune_1', name: 'Sách Phù Phép: Gia Tài I (Fortune)', emoji: '💎', type: 'book', enchantId: 'fortune', level: 1, targetSlot: ['pickaxe'], sellPrice: 250, buyPrice: 5000, stackSize: 16, weight: 1 },
    book_fortune_2: { id: 'book_fortune_2', name: 'Sách Phù Phép: Gia Tài II (Fortune)', emoji: '💎', type: 'book', enchantId: 'fortune', level: 2, targetSlot: ['pickaxe'], sellPrice: 500, buyPrice: 10000, stackSize: 16, weight: 1 },
    book_fortune_3: { id: 'book_fortune_3', name: 'Sách Phù Phép: Gia Tài III (Fortune)', emoji: '💎', type: 'book', enchantId: 'fortune', level: 3, targetSlot: ['pickaxe'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },
    book_fortune: { id: 'book_fortune', name: 'Sách Phù Phép: Gia Tài III (Fortune)', emoji: '💎', type: 'book', enchantId: 'fortune', level: 3, targetSlot: ['pickaxe'], sellPrice: 1000, buyPrice: 20000, stackSize: 16, weight: 1 },

    // 12. Tu Sửa (Mending I) - Chỉ có Cấp 1
    book_mending: { id: 'book_mending', name: 'Sách Phù Phép: Tu Sửa I (Mending)', emoji: '✨', type: 'book', enchantId: 'mending', level: 1, targetSlot: ['sword', 'pickaxe', 'axe', 'bow', 'shield', 'helmet', 'chestplate', 'leggings', 'boots'], sellPrice: 2500, buyPrice: 50000, stackSize: 16, weight: 1, description: 'Bùa tu sửa quý hiếm nhất: Tự hồi phục độ bền trang bị khi hấp thu EXP! Tỉ lệ 1:20.' },
    anvil: { id: 'anvil', name: 'Cái Đe (Anvil)', emoji: '🔨', type: 'special', sellPrice: 6500, buyPrice: null, stackSize: 1, weight: 25, description: 'Dụng cụ rèn dùng để ép Sách Phù Phép và Ghép Sửa Chữa 2 Vũ Khí / Giáp cùng loại thành 1! Chế tạo bằng 3 Khối Sắt + 4 Thỏi Sắt.' },
    enchanting_table: { id: 'enchanting_table', name: 'Bàn Phù Phép (Enchanting Table)', emoji: '🔮', type: 'special', sellPrice: 15000, buyPrice: null, stackSize: 1, weight: 12 },
    furnace: { id: 'furnace', name: 'Lò nung', emoji: '🧱', type: 'material', sellPrice: 50, buyPrice: null, stackSize: 64, weight: 4 },
    chest: { id: 'chest', name: 'Rương Tại Nhà (+8 Ô Rương An Toàn)', emoji: '📦', type: 'special', sellPrice: 350, buyPrice: null, stackSize: 64, weight: 3 },
    torch: { id: 'torch', name: 'Đuốc', emoji: '🕯️', type: 'material', sellPrice: 5, buyPrice: null, stackSize: 64, weight: 0.1 },
    bucket: { id: 'bucket', name: 'Xô sắt', emoji: '🪣', type: 'material', sellPrice: 150, buyPrice: null, stackSize: 16, weight: 2 },
    water_bucket: { id: 'water_bucket', name: 'Xô nước', emoji: '💧', type: 'special', sellPrice: 200, buyPrice: null, stackSize: 1, weight: 3 },
    lava_bucket: { id: 'lava_bucket', name: 'Xô dung nham', emoji: '🌋', type: 'special', sellPrice: 300, buyPrice: null, stackSize: 1, weight: 4 },
    crossbow: { id: 'crossbow', name: 'Nỏ', emoji: '🏹', type: 'bow', attack: 12, durability: 465, maxDurability: 465, sellPrice: 400, buyPrice: null, stackSize: 1, weight: 3 },
    end_crystal: { id: 'end_crystal', name: 'Tinh thể End', emoji: '🔮', type: 'special', sellPrice: 2000, buyPrice: null, stackSize: 16, weight: 2 },
    golden_sword: { id: 'golden_sword', name: 'Kiếm vàng', emoji: '🗡️', type: 'sword', attack: 5, durability: 32, maxDurability: 32, sellPrice: 150, buyPrice: null, stackSize: 1, weight: 3 },
    golden_pickaxe: { id: 'golden_pickaxe', name: 'Cúp vàng', emoji: '⛏️', type: 'pickaxe', miningPower: 3, durability: 32, maxDurability: 32, sellPrice: 180, buyPrice: null, stackSize: 1, weight: 3 },
    golden_axe: { id: 'golden_axe', name: 'Rìu vàng', emoji: '🪓', type: 'axe', choppingPower: 3, attack: 6, durability: 32, maxDurability: 32, sellPrice: 180, buyPrice: null, stackSize: 1, weight: 3 },
    golden_helmet: { id: 'golden_helmet', name: 'Mũ vàng', emoji: '🪖', type: 'helmet', defense: 2, durability: 77, maxDurability: 77, sellPrice: 300, buyPrice: null, stackSize: 1, weight: 3 },
    golden_chestplate: { id: 'golden_chestplate', name: 'Áo vàng', emoji: '🥋', type: 'chestplate', defense: 5, durability: 112, maxDurability: 112, sellPrice: 600, buyPrice: null, stackSize: 1, weight: 6 },
    golden_leggings: { id: 'golden_leggings', name: 'Quần vàng', emoji: '👖', type: 'leggings', defense: 3, durability: 105, maxDurability: 105, sellPrice: 500, buyPrice: null, stackSize: 1, weight: 5 },
    golden_boots: { id: 'golden_boots', name: 'Ủng vàng', emoji: '👢', type: 'boots', defense: 1, durability: 91, maxDurability: 91, sellPrice: 250, buyPrice: null, stackSize: 1, weight: 3 },

    // Dụng cụ & Trang bị (Equipment & Tools) - BẮT BUỘC TỰ CHẾ TẠO, KHÔNG BÁN TẠI SHOP
    // Cúp (Pickaxes)
    wooden_pickaxe: { id: 'wooden_pickaxe', name: 'Cúp gỗ', emoji: '⛏️', type: 'pickaxe', miningPower: 1, durability: 60, maxDurability: 60, sellPrice: 15, buyPrice: null, stackSize: 1, weight: 2 },
    stone_pickaxe: { id: 'stone_pickaxe', name: 'Cúp đá', emoji: '⛏️', type: 'pickaxe', miningPower: 2, durability: 132, maxDurability: 132, sellPrice: 40, buyPrice: null, stackSize: 1, weight: 3 },
    iron_pickaxe: { id: 'iron_pickaxe', name: 'Cúp sắt', emoji: '⛏️', type: 'pickaxe', miningPower: 3, durability: 251, maxDurability: 251, sellPrice: 350, buyPrice: null, stackSize: 1, weight: 4 },
    diamond_pickaxe: { id: 'diamond_pickaxe', name: 'Cúp kim cương', emoji: '⛏️', type: 'pickaxe', miningPower: 4, durability: 1562, maxDurability: 1562, sellPrice: null, buyPrice: null, stackSize: 1, weight: 4 },
    netherite_pickaxe: { id: 'netherite_pickaxe', name: 'Cúp Netherite', emoji: '⛏️', type: 'pickaxe', miningPower: 5, durability: 2032, maxDurability: 2032, sellPrice: null, buyPrice: null, stackSize: 1, weight: 5 },

    // Rìu (Axes)
    wooden_axe: { id: 'wooden_axe', name: 'Rìu gỗ', emoji: '🪓', type: 'axe', choppingPower: 1, attack: 3, durability: 60, maxDurability: 60, sellPrice: 15, buyPrice: null, stackSize: 1, weight: 2 },
    stone_axe: { id: 'stone_axe', name: 'Rìu đá', emoji: '🪓', type: 'axe', choppingPower: 2, attack: 5, durability: 132, maxDurability: 132, sellPrice: 40, buyPrice: null, stackSize: 1, weight: 3 },
    iron_axe: { id: 'iron_axe', name: 'Rìu sắt', emoji: '🪓', type: 'axe', choppingPower: 3, attack: 7, durability: 251, maxDurability: 251, sellPrice: 350, buyPrice: null, stackSize: 1, weight: 4 },
    diamond_axe: { id: 'diamond_axe', name: 'Rìu kim cương', emoji: '🪓', type: 'axe', choppingPower: 4, attack: 9, durability: 1562, maxDurability: 1562, sellPrice: null, buyPrice: null, stackSize: 1, weight: 4 },
    netherite_axe: { id: 'netherite_axe', name: 'Rìu Netherite', emoji: '🪓', type: 'axe', choppingPower: 5, attack: 11, durability: 2032, maxDurability: 2032, sellPrice: null, buyPrice: null, stackSize: 1, weight: 5 },

    // Kiếm (Swords)
    wooden_sword: { id: 'wooden_sword', name: 'Kiếm gỗ', emoji: '🗡️', type: 'sword', attack: 4, durability: 60, maxDurability: 60, sellPrice: 15, buyPrice: null, stackSize: 1, weight: 2 },
    stone_sword: { id: 'stone_sword', name: 'Kiếm đá', emoji: '🗡️', type: 'sword', attack: 6, durability: 132, maxDurability: 132, sellPrice: 40, buyPrice: null, stackSize: 1, weight: 3 },
    iron_sword: { id: 'iron_sword', name: 'Kiếm sắt', emoji: '🗡️', type: 'sword', attack: 8, durability: 251, maxDurability: 251, sellPrice: 350, buyPrice: null, stackSize: 1, weight: 4 },
    diamond_sword: { id: 'diamond_sword', name: 'Kiếm kim cương', emoji: '🗡️', type: 'sword', attack: 12, durability: 1562, maxDurability: 1562, sellPrice: null, buyPrice: null, stackSize: 1, weight: 4 },
    netherite_sword: { id: 'netherite_sword', name: 'Kiếm Netherite', emoji: '🗡️', type: 'sword', attack: 16, durability: 2032, maxDurability: 2032, sellPrice: null, buyPrice: null, stackSize: 1, weight: 5 },

    // Cung & Khiên (Bow & Shield)
    bow: { id: 'bow', name: 'Cung', emoji: '🏹', type: 'bow', attack: 10, durability: 384, maxDurability: 384, sellPrice: 400, buyPrice: null, stackSize: 1, weight: 2 },
    shield: { id: 'shield', name: 'Khiên gỗ sắt', emoji: '🛡️', type: 'shield', blockRate: 0.75, durability: 336, maxDurability: 336, sellPrice: 400, buyPrice: null, stackSize: 1, weight: 3 },

    // Mũ (Helmets)
    leather_helmet: { id: 'leather_helmet', name: 'Mũ da', emoji: '🪖', type: 'helmet', defense: 1, durability: 56, maxDurability: 56, sellPrice: 30, buyPrice: null, stackSize: 1, weight: 1 },
    iron_helmet: { id: 'iron_helmet', name: 'Mũ sắt', emoji: '🪖', type: 'helmet', defense: 3, durability: 166, maxDurability: 166, sellPrice: 300, buyPrice: null, stackSize: 1, weight: 3 },
    diamond_helmet: { id: 'diamond_helmet', name: 'Mũ kim cương', emoji: '🪖', type: 'helmet', defense: 5, durability: 364, maxDurability: 364, sellPrice: null, buyPrice: null, stackSize: 1, weight: 4 },
    netherite_helmet: { id: 'netherite_helmet', name: 'Mũ Netherite', emoji: '🪖', type: 'helmet', defense: 7, durability: 408, maxDurability: 408, sellPrice: null, buyPrice: null, stackSize: 1, weight: 5 },

    // Áo (Chestplates)
    leather_chestplate: { id: 'leather_chestplate', name: 'Áo da', emoji: '🥋', type: 'chestplate', defense: 3, durability: 81, maxDurability: 81, sellPrice: 50, buyPrice: null, stackSize: 1, weight: 2 },
    iron_chestplate: { id: 'iron_chestplate', name: 'Áo sắt', emoji: '🥋', type: 'chestplate', defense: 6, durability: 241, maxDurability: 241, sellPrice: 600, buyPrice: null, stackSize: 1, weight: 5 },
    diamond_chestplate: { id: 'diamond_chestplate', name: 'Áo kim cương', emoji: '🥋', type: 'chestplate', defense: 10, durability: 529, maxDurability: 529, sellPrice: null, buyPrice: null, stackSize: 1, weight: 6 },
    netherite_chestplate: { id: 'netherite_chestplate', name: 'Áo Netherite', emoji: '🥋', type: 'chestplate', defense: 13, durability: 593, maxDurability: 593, sellPrice: null, buyPrice: null, stackSize: 1, weight: 8 },

    // Quần (Leggings)
    leather_leggings: { id: 'leather_leggings', name: 'Quần da', emoji: '👖', type: 'leggings', defense: 2, durability: 76, maxDurability: 76, sellPrice: 40, buyPrice: null, stackSize: 1, weight: 2 },
    iron_leggings: { id: 'iron_leggings', name: 'Quần sắt', emoji: '👖', type: 'leggings', defense: 5, durability: 226, maxDurability: 226, sellPrice: 500, buyPrice: null, stackSize: 1, weight: 4 },
    diamond_leggings: { id: 'diamond_leggings', name: 'Quần kim cương', emoji: '👖', type: 'leggings', defense: 8, durability: 496, maxDurability: 496, sellPrice: null, buyPrice: null, stackSize: 1, weight: 5 },
    netherite_leggings: { id: 'netherite_leggings', name: 'Quần Netherite', emoji: '👖', type: 'leggings', defense: 11, durability: 556, maxDurability: 556, sellPrice: null, buyPrice: null, stackSize: 1, weight: 6 },

    // Ủng (Boots)
    leather_boots: { id: 'leather_boots', name: 'Ủng da', emoji: '👢', type: 'boots', defense: 1, durability: 66, maxDurability: 66, sellPrice: 30, buyPrice: null, stackSize: 1, weight: 1 },
    iron_boots: { id: 'iron_boots', name: 'Ủng sắt', emoji: '👢', type: 'boots', defense: 2, durability: 196, maxDurability: 196, sellPrice: 250, buyPrice: null, stackSize: 1, weight: 3 },
    diamond_boots: { id: 'diamond_boots', name: 'Ủng kim cương', emoji: '👢', type: 'boots', defense: 4, durability: 430, maxDurability: 430, sellPrice: null, buyPrice: null, stackSize: 1, weight: 3 },
    netherite_boots: { id: 'netherite_boots', name: 'Ủng Netherite', emoji: '👢', type: 'boots', defense: 6, durability: 482, maxDurability: 482, sellPrice: null, buyPrice: null, stackSize: 1, weight: 4 }
  },

  // Danh sách Quái vật (Mobs Database)
  MOBS: {
    // Thú hiền Overworld ban ngày
    chicken: { id: 'chicken', name: 'Gà', emoji: '🐔', hp: 8, maxHp: 8, attack: 0, defense: 0, exp: 5, coins: [2, 5], isHostile: false, drops: [{ item: 'raw_chicken', min: 1, max: 2, chance: 1.0 }, { item: 'feather', min: 1, max: 3, chance: 0.8 }] },
    pig: { id: 'pig', name: 'Heo', emoji: '🐷', hp: 15, maxHp: 15, attack: 0, defense: 0, exp: 8, coins: [3, 6], isHostile: false, drops: [{ item: 'raw_pork', min: 1, max: 3, chance: 1.0 }] },
    cow: { id: 'cow', name: 'Bò', emoji: '🐮', hp: 20, maxHp: 20, attack: 0, defense: 0, exp: 10, coins: [4, 8], isHostile: false, drops: [{ item: 'raw_beef', min: 1, max: 3, chance: 1.0 }, { item: 'leather', min: 1, max: 2, chance: 0.6 }] },
    sheep: { id: 'sheep', name: 'Cừu', emoji: '🐑', hp: 16, maxHp: 16, attack: 0, defense: 0, exp: 8, coins: [3, 6], isHostile: false, drops: [{ item: 'raw_mutton', min: 1, max: 3, chance: 1.0 }, { item: 'white_wool', min: 1, max: 2, chance: 1.0 }] },

    // Quái Overworld ban đêm & Hang đá (Mặc định 40 HP, 10 - 50 Vàng)
    zombie: { id: 'zombie', name: 'Zombie', emoji: '🧟', hp: 40, maxHp: 40, attack: 5, defense: 2, exp: 35, coins: [10, 50], isHostile: true, drops: [{ item: 'rotten_flesh', min: 1, max: 3, chance: 1.0 }, { item: 'iron_ingot', min: 1, max: 1, chance: 0.1 }] },
    skeleton: { id: 'skeleton', name: 'Bộ Xương Skeleton', emoji: '🏹', hp: 40, maxHp: 40, attack: 6, defense: 1, exp: 40, coins: [10, 50], isHostile: true, drops: [{ item: 'bone', min: 1, max: 3, chance: 1.0 }, { item: 'arrow', min: 2, max: 5, chance: 0.8 }, { item: 'bow', min: 1, max: 1, chance: 0.05 }] },
    spider: { id: 'spider', name: 'Nhện Khổng Lồ', emoji: '🕷️', hp: 40, maxHp: 40, attack: 5, defense: 1, exp: 30, coins: [10, 50], isHostile: true, drops: [{ item: 'string', min: 1, max: 2, chance: 0.9 }, { item: 'spider_eye', min: 1, max: 1, chance: 0.5 }] },
    creeper: { id: 'creeper', name: 'Creeper', emoji: '💥', hp: 40, maxHp: 40, attack: 14, defense: 0, exp: 45, coins: [10, 50], isHostile: true, isExplosive: true, drops: [{ item: 'gunpowder', min: 1, max: 3, chance: 0.9 }] },
    enderman: { id: 'enderman', name: 'Enderman', emoji: '👁️', hp: 40, maxHp: 40, attack: 8, defense: 3, exp: 60, coins: [10, 50], isHostile: true, drops: [{ item: 'ender_pearl', min: 1, max: 2, chance: 0.7 }] },

    // Quái Nether (Mặc định 40 HP, 10 - 50 Vàng)
    blaze: { id: 'blaze', name: 'Quỷ Lửa Blaze', emoji: '🔥', hp: 40, maxHp: 40, attack: 7, defense: 2, exp: 50, coins: [10, 50], isHostile: true, drops: [{ item: 'blaze_rod', min: 1, max: 2, chance: 0.8 }, { item: 'glowstone_dust', min: 1, max: 3, chance: 0.5 }] },
    wither_skeleton: { id: 'wither_skeleton', name: 'Wither Skeleton', emoji: '💀', hp: 40, maxHp: 40, attack: 9, defense: 3, exp: 65, coins: [10, 50], isHostile: true, witherEffect: true, drops: [{ item: 'bone', min: 1, max: 2, chance: 1.0 }, { item: 'coal', min: 1, max: 2, chance: 0.6 }, { item: 'wither_skeleton_skull', min: 1, max: 1, chance: 1 / 100 }] },
    ghast: { id: 'ghast', name: 'Bóng Ma Ghast', emoji: '👻', hp: 40, maxHp: 40, attack: 11, defense: 0, exp: 70, coins: [10, 50], isHostile: true, drops: [{ item: 'gunpowder', min: 2, max: 4, chance: 0.9 }, { item: 'ghast_tear', min: 1, max: 1, chance: 0.4 }] },
    piglin: { id: 'piglin', name: 'Piglin Địa Ngục', emoji: '🐷', hp: 40, maxHp: 40, attack: 6, defense: 2, exp: 45, coins: [10, 50], isHostile: true, drops: [{ item: 'gold_ingot', min: 1, max: 2, chance: 0.8 }, { item: 'arrow', min: 3, max: 8, chance: 0.6 }] },
    piglin_brute: { id: 'piglin_brute', name: 'Chiến Binh Piglin Brute', emoji: '🐗', hp: 50, maxHp: 50, attack: 11, defense: 4, exp: 120, coins: [150, 300], isHostile: true, isBoss: true, drops: [{ item: 'gold_block', min: 1, max: 2, chance: 0.7 }, { item: 'golden_axe', min: 1, max: 1, chance: 0.4 }] },

    // Quái The End (Mặc định 40 HP, 10 - 50 Vàng)
    shulker: { id: 'shulker', name: 'Shulker', emoji: '🐚', hp: 40, maxHp: 40, attack: 6, defense: 8, exp: 80, coins: [10, 50], isHostile: true, drops: [{ item: 'shulker_shell', min: 1, max: 2, chance: 0.75 }] },

    // Quái vật & Boss Thám Hiểm Thế Giới (Mặc định 40 HP)
    witch: { id: 'witch', name: 'Mụ Phù Thủy (Witch)', emoji: '🧙‍♀️', hp: 40, maxHp: 40, attack: 6, defense: 1, exp: 80, coins: [10, 50], isHostile: true, drops: [{ item: 'health_potion', min: 1, max: 2, chance: 0.8 }, { item: 'glowstone_dust', min: 2, max: 4, chance: 0.9 }, { item: 'redstone', min: 2, max: 5, chance: 0.9 }] },
    pillager_captain: { id: 'pillager_captain', name: 'Đội Trưởng Kẻ Cướp (Raid Captain)', emoji: '🏹', hp: 45, maxHp: 45, attack: 8, defense: 2, exp: 120, coins: [10, 50], isHostile: true, drops: [{ item: 'emerald', min: 1, max: 3, chance: 1.0 }, { item: 'arrow', min: 5, max: 12, chance: 1.0 }] },
    ravager: { id: 'ravager', name: 'Quái Thú Ravager', emoji: '🐂', hp: 90, maxHp: 90, attack: 12, defense: 4, exp: 350, coins: [150, 350], isHostile: true, isBoss: true, drops: [{ item: 'saddle', min: 1, max: 1, chance: 0.85 }, { item: 'emerald', min: 3, max: 8, chance: 1.0 }] },
    wither_boss: { id: 'wither_boss', name: 'TRÙM WITHER 3 ĐẦU', emoji: '💀', hp: 400, maxHp: 400, attack: 15, defense: 5, exp: 6000, coins: [2000, 5000], isHostile: true, isBoss: true, witherEffect: true, drops: [{ item: 'nether_star', min: 1, max: 1, chance: 1.0 }, { item: 'beacon', min: 1, max: 1, chance: 1.0 }, { item: 'wither_rose', min: 1, max: 2, chance: 1.0 }, { item: 'diamond', min: 5, max: 10, chance: 1.0 }] },
    breeze: { id: 'breeze', name: 'Quái Gió Breeze (1.21.1)', emoji: '🌀', hp: 40, maxHp: 40, attack: 7, defense: 2, exp: 90, coins: [10, 50], isHostile: true, drops: [{ item: 'breeze_rod', min: 1, max: 2, chance: 1.0 }, { item: 'wind_charge', min: 2, max: 5, chance: 0.9 }, { item: 'trial_key', min: 1, max: 1, chance: 0.3 }] },

    // TRÙM CUỐI (Boss: 2000 - 5000 Vàng)
    ender_dragon: {
      id: 'ender_dragon',
      name: 'RỒNG ENDER (Ender Dragon)',
      emoji: '🐲',
      hp: 400,
      maxHp: 400,
      attack: 16,
      defense: 6,
      crystals: 12, // 12 Pha Lê End bảo vệ rồng
      exp: 15000,
      coins: [2000, 5000],
      isHostile: true,
      isBoss: true,
      drops: [
        { item: 'dragon_egg', min: 1, max: 1, chance: 1.0 },
        { item: 'elytra', min: 1, max: 1, chance: 1.0 },
        { item: 'shulker_box', min: 1, max: 2, chance: 1.0 },
        { item: 'dragon_breath', min: 3, max: 6, chance: 1.0 },
        { item: 'diamond_block', min: 1, max: 3, chance: 1.0 },
        { item: 'netherite_ingot', min: 1, max: 2, chance: 0.7 }
      ]
    }
  },

  // Công thức Chế tạo (Crafting Recipes)
  RECIPES: [
    // Gỗ & Que
    { id: 'craft_stick', result: 'stick', count: 4, materials: { oak_log: 1 }, name: 'Que gỗ' },
    // Dụng cụ gỗ
    { id: 'craft_wooden_pickaxe', result: 'wooden_pickaxe', count: 1, materials: { oak_log: 3, stick: 2 }, name: 'Cúp gỗ' },
    { id: 'craft_wooden_axe', result: 'wooden_axe', count: 1, materials: { oak_log: 3, stick: 2 }, name: 'Rìu gỗ' },
    { id: 'craft_wooden_sword', result: 'wooden_sword', count: 1, materials: { oak_log: 2, stick: 1 }, name: 'Kiếm gỗ' },
    // Dụng cụ đá
    { id: 'craft_stone_pickaxe', result: 'stone_pickaxe', count: 1, materials: { cobblestone: 3, stick: 2 }, name: 'Cúp đá' },
    { id: 'craft_stone_axe', result: 'stone_axe', count: 1, materials: { cobblestone: 3, stick: 2 }, name: 'Rìu đá' },
    { id: 'craft_stone_sword', result: 'stone_sword', count: 1, materials: { cobblestone: 2, stick: 1 }, name: 'Kiếm đá' },
    // Dụng cụ sắt
    { id: 'craft_iron_pickaxe', result: 'iron_pickaxe', count: 1, materials: { iron_ingot: 3, stick: 2 }, name: 'Cúp sắt' },
    { id: 'craft_iron_axe', result: 'iron_axe', count: 1, materials: { iron_ingot: 3, stick: 2 }, name: 'Rìu sắt' },
    { id: 'craft_iron_sword', result: 'iron_sword', count: 1, materials: { iron_ingot: 2, stick: 1 }, name: 'Kiếm sắt' },
    { id: 'craft_shield', result: 'shield', count: 1, materials: { oak_log: 4, iron_ingot: 1 }, name: 'Khiên' },
    // Dụng cụ kim cương
    { id: 'craft_diamond_pickaxe', result: 'diamond_pickaxe', count: 1, materials: { diamond: 3, stick: 2 }, name: 'Cúp kim cương' },
    { id: 'craft_diamond_axe', result: 'diamond_axe', count: 1, materials: { diamond: 3, stick: 2 }, name: 'Rìu kim cương' },
    { id: 'craft_diamond_sword', result: 'diamond_sword', count: 1, materials: { diamond: 2, stick: 1 }, name: 'Kiếm kim cương' },
    // Cung & Tên
    { id: 'craft_bow', result: 'bow', count: 1, materials: { stick: 3, string: 3 }, name: 'Cung bắn tên' },
    { id: 'craft_arrow', result: 'arrow', count: 4, materials: { stick: 1, feather: 1, cobblestone: 1 }, name: 'Mũi tên x4' },
    // Giáp Sắt
    { id: 'craft_iron_helmet', result: 'iron_helmet', count: 1, materials: { iron_ingot: 5 }, name: 'Mũ sắt' },
    { id: 'craft_iron_chestplate', result: 'iron_chestplate', count: 1, materials: { iron_ingot: 8 }, name: 'Áo sắt' },
    { id: 'craft_iron_leggings', result: 'iron_leggings', count: 1, materials: { iron_ingot: 7 }, name: 'Quần sắt' },
    { id: 'craft_iron_boots', result: 'iron_boots', count: 1, materials: { iron_ingot: 4 }, name: 'Ủng sắt' },
    // Giáp Kim Cương
    { id: 'craft_diamond_helmet', result: 'diamond_helmet', count: 1, materials: { diamond: 5 }, name: 'Mũ kim cương' },
    { id: 'craft_diamond_chestplate', result: 'diamond_chestplate', count: 1, materials: { diamond: 8 }, name: 'Áo kim cương' },
    { id: 'craft_diamond_leggings', result: 'diamond_leggings', count: 1, materials: { diamond: 7 }, name: 'Quần kim cương' },
    { id: 'craft_diamond_boots', result: 'diamond_boots', count: 1, materials: { diamond: 4 }, name: 'Ủng kim cương' },
    // Cái Đe (Anvil) - Yêu cầu 3 Block Sắt và 4 Phôi Sắt
    { id: 'craft_anvil', result: 'anvil', count: 1, materials: { iron_block: 3, iron_ingot: 4 }, name: 'Cái Đe (Anvil - Dùng ép Sách Phù Phép vào Trang Bị)' },
    // Luyện Kim & Đặc biệt
    { id: 'craft_flint_and_steel', result: 'flint_and_steel', count: 1, materials: { iron_ingot: 1, cobblestone: 1 }, name: 'Bật lửa' },
    { id: 'craft_golden_apple', result: 'golden_apple', count: 1, materials: { apple: 1, gold_ingot: 8 }, name: 'Táo vàng' },
    { id: 'craft_blaze_powder', result: 'blaze_powder', count: 2, materials: { blaze_rod: 1 }, name: 'Bột lửa x2' },
    { id: 'craft_eye_of_ender', result: 'eye_of_ender', count: 1, materials: { ender_pearl: 1, blaze_powder: 1 }, name: 'Mắt Ender (1 Ngọc Ender + 1 Bột lửa)' },
    { id: 'craft_eye_of_ender_rod', result: 'eye_of_ender', count: 2, materials: { ender_pearl: 2, blaze_rod: 1 }, name: 'Mắt Ender x2 (2 Ngọc Ender + 1 Que quỷ lửa)' },
    { id: 'craft_eye_of_ender_bulk', result: 'eye_of_ender', count: 6, materials: { ender_pearl: 6, blaze_rod: 3 }, name: 'Mắt Ender x6 (6 Ngọc Ender + 3 Que quỷ lửa)' },
    { id: 'craft_eye_of_ender_12', result: 'eye_of_ender', count: 12, materials: { ender_pearl: 12, blaze_rod: 6 }, name: 'Trọn Bộ 12 Mắt Ender (Mở Cổng The End)' },
    { id: 'craft_eye_of_ender_alt', result: 'eye_of_ender', count: 1, materials: { ender_pearl: 1, redstone: 4, coal: 2 }, name: 'Luyện Mắt Ender Ma Thuật (1 Ngọc Ender + 4 Đá đỏ + 2 Than)' },
    { id: 'craft_netherite_scrap', result: 'netherite_scrap', count: 1, materials: { ancient_debris: 1, coal: 2 }, name: 'Nung Mảnh vụn Netherite' },
    { id: 'craft_netherite_ingot', result: 'netherite_ingot', count: 1, materials: { netherite_scrap: 4, gold_ingot: 4 }, name: 'Thỏi Netherite' },
    // Nâng cấp Netherite
    { id: 'upgrade_netherite_sword', result: 'netherite_sword', count: 1, materials: { diamond_sword: 1, netherite_ingot: 1 }, name: 'Rèn Kiếm Netherite' },
    { id: 'upgrade_netherite_pickaxe', result: 'netherite_pickaxe', count: 1, materials: { diamond_pickaxe: 1, netherite_ingot: 1 }, name: 'Rèn Cúp Netherite' },
    { id: 'upgrade_netherite_axe', result: 'netherite_axe', count: 1, materials: { diamond_axe: 1, netherite_ingot: 1 }, name: 'Rèn Rìu Netherite' },
    { id: 'upgrade_netherite_helmet', result: 'netherite_helmet', count: 1, materials: { diamond_helmet: 1, netherite_ingot: 1 }, name: 'Rèn Mũ Netherite' },
    { id: 'upgrade_netherite_chestplate', result: 'netherite_chestplate', count: 1, materials: { diamond_chestplate: 1, netherite_ingot: 1 }, name: 'Rèn Áo Netherite' },
    { id: 'upgrade_netherite_leggings', result: 'netherite_leggings', count: 1, materials: { diamond_leggings: 1, netherite_ingot: 1 }, name: 'Rèn Quần Netherite' },
    { id: 'upgrade_netherite_boots', result: 'netherite_boots', count: 1, materials: { diamond_boots: 1, netherite_ingot: 1 }, name: 'Rèn Ủng Netherite' },

    // Dụng cụ & Giáp Vàng
    { id: 'craft_golden_sword', result: 'golden_sword', count: 1, materials: { gold_ingot: 2, stick: 1 }, name: 'Kiếm vàng' },
    { id: 'craft_golden_pickaxe', result: 'golden_pickaxe', count: 1, materials: { gold_ingot: 3, stick: 2 }, name: 'Cúp vàng' },
    { id: 'craft_golden_axe', result: 'golden_axe', count: 1, materials: { gold_ingot: 3, stick: 2 }, name: 'Rìu vàng' },
    { id: 'craft_golden_helmet', result: 'golden_helmet', count: 1, materials: { gold_ingot: 5 }, name: 'Mũ vàng' },
    { id: 'craft_golden_chestplate', result: 'golden_chestplate', count: 1, materials: { gold_ingot: 8 }, name: 'Áo vàng' },
    { id: 'craft_golden_leggings', result: 'golden_leggings', count: 1, materials: { gold_ingot: 7 }, name: 'Quần vàng' },
    { id: 'craft_golden_boots', result: 'golden_boots', count: 1, materials: { gold_ingot: 4 }, name: 'Ủng vàng' },

    // CÔNG THỨC MINECRAFT 1.21.1 (TRICKY TRIALS)
    { id: 'craft_mace', result: 'mace', count: 1, materials: { heavy_core: 1, breeze_rod: 1 }, name: 'Chùy (Mace 1.21.1 - Vũ khí đập cực mạnh)' },
    { id: 'craft_wind_charge', result: 'wind_charge', count: 4, materials: { breeze_rod: 1 }, name: 'Đạn Gió x4 (Wind Charge 1.21.1)' },
    { id: 'craft_crafter', result: 'crafter', count: 1, materials: { iron_ingot: 5, crafting_table: 1, redstone: 2 }, name: 'Bàn Chế Tạo Tự Động (Crafter 1.21.1)' },
    { id: 'smelt_copper', result: 'copper_ingot', count: 1, materials: { copper_ore: 1, coal: 1 }, name: 'Nung Thỏi Đồng' },
    { id: 'craft_copper_block', result: 'copper_block', count: 1, materials: { copper_ingot: 9 }, name: 'Khối Đồng' },
    { id: 'craft_lightning_rod', result: 'lightning_rod', count: 1, materials: { copper_ingot: 3 }, name: 'Cột Thu Lôi' },
    { id: 'craft_spyglass', result: 'spyglass', count: 1, materials: { copper_ingot: 2, quartz: 1 }, name: 'Kính Viễn Vọng (Spyglass)' },

    // CÔNG THỨC BAY CÁNH CỨNG & PHÁO HOA
    { id: 'craft_paper', result: 'paper', count: 3, materials: { sugar_cane: 3 }, name: 'Giấy x3' },
    { id: 'craft_firework_rocket', result: 'firework_rocket', count: 3, materials: { paper: 1, gunpowder: 1 }, name: 'Pháo hoa x3 (Dùng bay với Cánh Cứng Elytra)' },

    // CÔNG THỨC CƠ BẢN & KHỐI
    { id: 'craft_crafting_table', result: 'crafting_table', count: 1, materials: { oak_log: 1 }, name: 'Bàn Chế Tạo' },
    { id: 'craft_furnace', result: 'furnace', count: 1, materials: { cobblestone: 8 }, name: 'Lò Nung' },
    { id: 'craft_chest', result: 'chest', count: 1, materials: { oak_log: 64 }, name: 'Rương Tại Nhà (+8 Ô Rương An Toàn)' },
    { id: 'craft_torch', result: 'torch', count: 4, materials: { coal: 1, stick: 1 }, name: 'Đuốc x4' },
    { id: 'craft_bucket', result: 'bucket', count: 1, materials: { iron_ingot: 3 }, name: 'Xô Sắt' },
    { id: 'craft_crossbow', result: 'crossbow', count: 1, materials: { stick: 3, iron_ingot: 1, string: 2 }, name: 'Nỏ (Crossbow)' },
    { id: 'craft_bread', result: 'bread', count: 1, materials: { wheat_seeds: 3 }, name: 'Bánh Mì' },
    { id: 'craft_tnt', result: 'tnt', count: 1, materials: { gunpowder: 5, cobblestone: 4 }, name: 'Thuốc Nổ TNT' },
    { id: 'craft_beacon', result: 'beacon', count: 1, materials: { nether_star: 1, obsidian: 3, quartz: 5 }, name: 'Hải Đăng (Beacon Ma Thuật)' },
    { id: 'craft_end_crystal', result: 'end_crystal', count: 1, materials: { eye_of_ender: 1, ghast_tear: 1, quartz: 7 }, name: 'Tinh Thể End' },

    // Khối Khoáng Sản (9 Thỏi -> 1 Khối)
    { id: 'craft_iron_block', result: 'iron_block', count: 1, materials: { iron_ingot: 9 }, name: 'Khối Sắt' },
    { id: 'craft_gold_block', result: 'gold_block', count: 1, materials: { gold_ingot: 9 }, name: 'Khối Vàng' },
    { id: 'craft_diamond_block', result: 'diamond_block', count: 1, materials: { diamond: 9 }, name: 'Khối Kim Cương' },
    { id: 'craft_netherite_block', result: 'netherite_block', count: 1, materials: { netherite_ingot: 9 }, name: 'Khối Netherite' },

    // Hộp Shulker & Totem
    { id: 'craft_shulker_box', result: 'shulker_box', count: 1, materials: { shulker_shell: 2, oak_log: 4 }, name: 'Hộp Shulker (Tăng 4000 sức chứa)' },
    { id: 'craft_totem', result: 'totem_of_undying', count: 1, materials: { gold_ingot: 4, emerald: 1, feather: 2 }, name: 'Vật Tổ Bất Tử' },

    // Chế tạo Hắc Diện Thạch (Obsidian) bằng nhiều phương pháp để mở Cổng Nether & Bàn Phù Phép
    { id: 'craft_obsidian', result: 'obsidian', count: 1, materials: { water_bucket: 1, lava_bucket: 1 }, returns: { bucket: 2 }, name: 'Đúc Hắc diện thạch (1 Xô nước + 1 Xô dung nham)' },
    { id: 'craft_obsidian_lava', result: 'obsidian', count: 4, materials: { cobblestone: 4, lava_bucket: 1 }, returns: { bucket: 1 }, name: 'Đúc Hắc Diện Thạch x4 (4 Đá cuội + 1 Xô dung nham)' },
    { id: 'craft_obsidian_cobble', result: 'obsidian', count: 2, materials: { cobblestone: 4, coal: 2, redstone: 2 }, name: 'Luyện Hắc Diện Thạch x2 (4 Đá cuội + 2 Than + 2 Đá đỏ)' },
    { id: 'craft_obsidian_blaze', result: 'obsidian', count: 4, materials: { cobblestone: 4, blaze_rod: 1 }, name: 'Luyện Hắc Diện Thạch x4 (4 Đá cuội + 1 Que quỷ lửa)' },
    { id: 'craft_obsidian_fire', result: 'obsidian', count: 2, materials: { cobblestone: 8, flint_and_steel: 1 }, name: 'Nung Hắc Diện Thạch x2 (8 Đá cuội + 1 Bật lửa)' },
    { id: 'craft_obsidian_10', result: 'obsidian', count: 10, materials: { cobblestone: 20, redstone: 10, coal: 10 }, name: 'Trọn Bộ 10 Hắc Diện Thạch (Mở Cổng Nether)' },
    { id: 'craft_bone_block', result: 'bone_block', count: 1, materials: { bone: 9 }, name: 'Khối Xương (Bone Block)' },
    { id: 'craft_book', result: 'book', count: 1, materials: { paper: 3, leather: 1 }, name: 'Sách (Book)' },
    { id: 'craft_enchanting_table', result: 'enchanting_table', count: 1, materials: { book: 1, diamond: 2, obsidian: 4 }, name: 'Bàn Phù Phép (Enchanting Table)' },
    { id: 'craft_bed', result: 'bed', count: 1, materials: { white_wool: 3, oak_log: 3 }, name: 'Chế tạo Giường Ngủ (3 Len trắng + 3 Gỗ sồi)' }
  ],

  // Cooldown Chặt Gỗ: Tay không 5s, Rìu cao cấp giảm dần min 1.5s
  AXE_COOLDOWNS: {
    none: 5000,
    wooden_axe: 4000,
    stone_axe: 3200,
    iron_axe: 2500,
    diamond_axe: 2000,
    netherite_axe: 1500
  },

  // Cooldown Đào Đá: Mặc định cúp gỗ 8s, Cúp cao cấp giảm dần min 2.0s
  PICKAXE_COOLDOWNS: {
    none: 8000,
    wooden_pickaxe: 8000,
    stone_pickaxe: 6500,
    golden_pickaxe: 5000,
    iron_pickaxe: 4500,
    diamond_pickaxe: 3000,
    netherite_pickaxe: 2000
  },

  // Bậc Cúp & Sức mạnh khai thác
  PICKAXE_TIERS: {
    wooden_pickaxe: { tier: 1, name: 'Cúp gỗ', minOres: 1, maxOres: 2, speedDesc: 'Chậm' },
    stone_pickaxe: { tier: 2, name: 'Cúp đá', minOres: 2, maxOres: 3, speedDesc: 'Trung bình' },
    golden_pickaxe: { tier: 2, name: 'Cúp vàng', minOres: 2, maxOres: 4, speedDesc: 'Nhanh' },
    iron_pickaxe: { tier: 3, name: 'Cúp sắt', minOres: 3, maxOres: 5, speedDesc: 'Rất nhanh' },
    diamond_pickaxe: { tier: 4, name: 'Cúp kim cương', minOres: 4, maxOres: 8, speedDesc: 'Cực nhanh' },
    netherite_pickaxe: { tier: 5, name: 'Cúp Netherite', minOres: 6, maxOres: 12, speedDesc: 'Siêu tốc' }
  },

  // Cấp cúp tối thiểu để đào được từng loại quặng (Nếu không đủ cấp thì không bao giờ ra hoặc vỡ vụn)
  ORE_REQUIREMENTS: {
    cobblestone: 1,    // Cúp gỗ trở lên
    coal: 1,           // Cúp gỗ trở lên
    copper_ore: 2,     // Cúp đá trở lên
    iron_ore: 2,       // Cúp đá trở lên
    lapis: 2,          // Cúp đá trở lên
    redstone: 3,       // Cúp sắt trở lên
    gold_ore: 3,       // Cúp sắt trở lên
    diamond: 3,        // Cúp sắt trở lên
    obsidian: 4,       // Cúp kim cương trở lên
    netherrack: 1,     // Cúp gỗ trở lên
    quartz: 1,         // Cúp gỗ trở lên
    ancient_debris: 4  // BẮT BUỘC: Cúp kim cương trở lên! Cúp dưới kim cương không bao giờ ra
  },

  // Tỉ lệ xuất hiện quặng Overworld theo đúng yêu cầu:
  // Đá: 1:1.5 (~66.7%)
  // Than: 1:5 (20%)
  // Sắt: 1:10 (10%)
  // Lưu ly: 1:10 (10%)
  // Đá đỏ: 1:10 (10%)
  // Vàng: 1:10 (10%)
  // Kim cương: 1:50 (2%)
  MINING_RATES: {
    cobblestone: 1 / 1.5,
    coal: 1 / 5,
    iron_ore: 1 / 10,
    lapis: 1 / 10,
    redstone: 1 / 10,
    gold_ore: 1 / 10,
    diamond: 1 / 50,
    obsidian: 1 / 25
  },

  // Tỉ lệ xuất hiện quặng Nether theo đúng yêu cầu:
  // Netherrack: 1:1.2 (~83.3%)
  // Thạch anh: 1:7 (~14.3%)
  // Ancient Debris: 1:130 (~0.77%)
  NETHER_MINING_RATES: {
    netherrack: 1 / 1.2,
    quartz: 1 / 7,
    ancient_debris: 1 / 130
  },

  // Công thức Lò Nung (Furnace): 1 Than đá nung được 4 món
  SMELTING_RATIO: 4, // 1 coal = 4 items
  SMELTING_RECIPES: [
    { id: 'smelt_iron', input: 'iron_ore', output: 'iron_ingot', name: 'Nung Quặng Sắt ➔ Thỏi Sắt', emoji: '🥈' },
    { id: 'smelt_gold', input: 'gold_ore', output: 'gold_ingot', name: 'Nung Quặng Vàng ➔ Thỏi Vàng', emoji: '🥇' },
    { id: 'smelt_copper', input: 'copper_ore', output: 'copper_ingot', name: 'Nung Quặng Đồng ➔ Thỏi Đồng', emoji: '🥉' },
    { id: 'smelt_debris', input: 'ancient_debris', output: 'netherite_scrap', name: 'Nung Mảnh Vỡ Cổ Đại ➔ Mảnh Netherite', emoji: '🪨' },
    { id: 'smelt_stone', input: 'cobblestone', output: 'stone', name: 'Nung Đá Cuội ➔ Đá Nhẵn (Stone)', emoji: '🪨' },
    { id: 'smelt_beef', input: 'raw_beef', output: 'cooked_beef', name: 'Nướng Thịt Bò ➔ Bít Tết Bò Chín', emoji: '🥩' },
    { id: 'smelt_pork', input: 'raw_pork', output: 'cooked_porkchop', name: 'Nướng Thịt Heo ➔ Thịt Heo Nướng', emoji: '🍖' },
    { id: 'smelt_chicken', input: 'raw_chicken', output: 'cooked_chicken', name: 'Nướng Thịt Gà ➔ Thịt Gà Nướng', emoji: '🍗' },
    { id: 'smelt_mutton', input: 'raw_mutton', output: 'cooked_mutton', name: 'Nướng Thịt Cừu ➔ Thịt Cừu Nướng', emoji: '🍖' }
  ],

  // Tỉ lệ sự kiện khi Đi Dạo / Khám Phá:
  // Bình thường: Công trình 5%
  // Có cánh (Bay): Công trình 7% (100% không gặp quái)
  // Hồ nước: 1:10 (10%)
  // Hồ lava: 1:15 (~6.67%)
  // Rương kho báu: 1:150 (~0.67%)
  EXPLORATION_RATES: {
    WALK_STRUCTURE: 0.05,
    FLY_STRUCTURE: 0.07,
    WATER_LAKE: 1 / 10,
    LAVA_POOL: 1 / 15,
    CHEST: 1 / 150
  },

  // Danh sách Công Trình Nether
  NETHER_STRUCTURES: [
    {
      id: 'nether_fortress',
      name: 'Pháo Đài Địa Ngục (Nether Fortress)',
      emoji: '🏰',
      description: 'Cầu gạch đỏ sẫm vươn dài trên biển lửa, canh gác bởi Quỷ Lửa Blaze và Wither Skeleton!'
    },
    {
      id: 'bastion_remnant',
      name: 'Phế Tích Bastion (Bastion Remnant)',
      emoji: '🏛️',
      description: 'Thành lũy đá đen khổng lồ chứa kho báu vàng của tộc Piglin Brute!'
    },
    {
      id: 'nether_fossil',
      name: 'Hóa Thạch Nether Cổ Đại (Nether Fossil)',
      emoji: '🦴',
      description: 'Bộ xương quái thú khổng lồ hóa thạch ngàn năm vùi trong cát linh hồn!'
    }
  ],

  // Cấu hình Chu kỳ Thời gian Ngày/Đêm (20 phút = 1200 giây)
  TIME: {
    CYCLE_DURATION_SECONDS: 1200, // 20 phút mỗi chu kỳ Minecraft
    DAY_DURATION_SECONDS: 600,     // 10 phút ban ngày (0 - 600s)
    NIGHT_DURATION_SECONDS: 600    // 10 phút ban đêm (600s - 1200s)
  }
};
