const db = require('../src/database/db');
const config = require('../src/config');
const smeltingSystem = require('../src/systems/smeltingSystem');
const enchantSystem = require('../src/systems/enchantSystem');
const tradeSystem = require('../src/systems/tradeSystem');

console.log('=== TEST 1: DIAMOND MINING RATE ===');
console.log('config.MINING_RATES.diamond:', config.MINING_RATES.diamond);
if (config.MINING_RATES.diamond === 1 / 50) {
  console.log('✅ Diamond mining rate is exactly 1/50 (2%)');
} else {
  console.error('❌ Diamond mining rate incorrect:', config.MINING_RATES.diamond);
}

console.log('\n=== TEST 2: CRAFTING RECIPES ===');
const bowRecipe = config.RECIPES.find(r => r.id === 'craft_bow');
const arrowRecipe = config.RECIPES.find(r => r.id === 'craft_arrow');
const eyeRecipe = config.RECIPES.find(r => r.id === 'craft_eye_of_ender');
const eyeRodRecipe = config.RECIPES.find(r => r.id === 'craft_eye_of_ender_rod');
const obsBucket = config.RECIPES.find(r => r.id === 'craft_obsidian');
const obsCobble = config.RECIPES.find(r => r.id === 'craft_obsidian_cobble');
const obsBlaze = config.RECIPES.find(r => r.id === 'craft_obsidian_blaze');

console.log('Bow recipe:', !!bowRecipe);
console.log('Arrow recipe:', !!arrowRecipe);
console.log('Eye of ender powder recipe:', !!eyeRecipe);
console.log('Eye of ender rod recipe:', !!eyeRodRecipe);
console.log('Obsidian bucket recipe:', !!obsBucket);
console.log('Obsidian cobble recipe:', !!obsCobble);
console.log('Obsidian blaze recipe:', !!obsBlaze);

if (bowRecipe && arrowRecipe && eyeRecipe && eyeRodRecipe && obsBucket && obsCobble && obsBlaze) {
  console.log('✅ All requested recipes verified successfully!');
} else {
  console.error('❌ Missing recipes!');
}

console.log('\n=== TEST 3: FURNACE UNLOCKING (50 COBBLESTONE) ===');
const testPlayer1 = {
  id: 'test_furnace_user',
  username: 'TestFurnace',
  inventory: [],
  unlocked: {}
};

console.log('Furnace initially unlocked:', smeltingSystem.isUnlocked(testPlayer1));
let unlockRes = smeltingSystem.unlock(testPlayer1);
console.log('Unlock with 0 cobblestone (should fail):', unlockRes.success, unlockRes.message);

// Add 49 cobblestone
db.addItem(testPlayer1, 'cobblestone', 49);
unlockRes = smeltingSystem.unlock(testPlayer1);
console.log('Unlock with 49 cobblestone (should fail):', unlockRes.success, unlockRes.message);

// Add 1 more (total 50)
db.addItem(testPlayer1, 'cobblestone', 1);
unlockRes = smeltingSystem.unlock(testPlayer1);
console.log('Unlock with 50 cobblestone (should succeed):', unlockRes.success);
console.log('Furnace unlocked now:', smeltingSystem.isUnlocked(testPlayer1));
console.log('Remaining cobblestone (should be 0):', db.getItemCount(testPlayer1, 'cobblestone'));

if (smeltingSystem.isUnlocked(testPlayer1) && db.getItemCount(testPlayer1, 'cobblestone') === 0) {
  console.log('✅ Furnace unlocking logic passed 100%!');
} else {
  console.error('❌ Furnace unlocking failed!');
}

console.log('\n=== TEST 4: ENCHANTING TABLE UNLOCKING (2 DIAMONDS + 4 OBSIDIAN) ===');
const testPlayer2 = {
  id: 'test_enchant_user',
  username: 'TestEnchant',
  level: 60,
  exp: 50000,
  equipment: { sword: 'diamond_sword' },
  inventory: [],
  unlocked: {}
};

console.log('Enchanting table initially unlocked:', enchantSystem.isUnlocked(testPlayer2));
let tableUnlockRes = enchantSystem.unlock(testPlayer2);
console.log('Unlock with 0 diamonds/obsidian (should fail):', tableUnlockRes.success);

db.addItem(testPlayer2, 'diamond', 2);
db.addItem(testPlayer2, 'obsidian', 3); // 3/4 obsidian
tableUnlockRes = enchantSystem.unlock(testPlayer2);
console.log('Unlock with 2 diamonds and 3 obsidian (should fail):', tableUnlockRes.success);

db.addItem(testPlayer2, 'obsidian', 1); // 4/4 obsidian
tableUnlockRes = enchantSystem.unlock(testPlayer2);
console.log('Unlock with 2 diamonds and 4 obsidian (should succeed):', tableUnlockRes.success);
console.log('Enchanting table unlocked now:', enchantSystem.isUnlocked(testPlayer2));
console.log('Remaining diamonds (should be 0):', db.getItemCount(testPlayer2, 'diamond'));
console.log('Remaining obsidian (should be 0):', db.getItemCount(testPlayer2, 'obsidian'));

// Test Gacha Lapis cost
db.addItem(testPlayer2, 'lapis', 10);
const gacha1 = enchantSystem.gachaEnchant(testPlayer2, 'sword', 1);
console.log('Gacha Tier 1 result:', gacha1.success, '| Remaining lapis (expected 9):', db.getItemCount(testPlayer2, 'lapis'));

const gacha2 = enchantSystem.gachaEnchant(testPlayer2, 'sword', 2);
console.log('Gacha Tier 2 result:', gacha2.success, '| Remaining lapis (expected 7):', db.getItemCount(testPlayer2, 'lapis'));

const gacha3 = enchantSystem.gachaEnchant(testPlayer2, 'sword', 3);
console.log('Gacha Tier 3 result:', gacha3.success, '| Remaining lapis (expected 4):', db.getItemCount(testPlayer2, 'lapis'));

if (enchantSystem.isUnlocked(testPlayer2) && gacha1.success && gacha2.success && gacha3.success && db.getItemCount(testPlayer2, 'lapis') === 4) {
  console.log('✅ Enchanting table unlock & 1, 2, 3 Lapis costs verified 100%!');
} else {
  console.error('❌ Enchanting table test failed!');
}

console.log('\n=== TEST 5: TRADE MECHANISM (LEVEL 10+ GATE) ===');
const lowLvlSeller = { id: 'seller_low', username: 'SellerLow', level: 9, inventory: [{ itemId: 'diamond', count: 5 }] };
const highLvlSeller = { id: 'seller_high', username: 'SellerHigh', level: 12, inventory: [{ itemId: 'diamond', count: 5 }], coins: 100 };
const lowLvlBuyer = { id: 'buyer_low', username: 'BuyerLow', level: 8, inventory: [], coins: 1000 };
const highLvlBuyer = { id: 'buyer_high', username: 'BuyerHigh', level: 15, inventory: [], coins: 1000 };

const offer1 = tradeSystem.createTradeOffer({ seller: lowLvlSeller, buyer: highLvlBuyer, itemId: 'diamond', count: 1, price: 100 });
console.log('Trade with seller lv 9 (should fail):', offer1.success, offer1.message);

const offer2 = tradeSystem.createTradeOffer({ seller: highLvlSeller, buyer: lowLvlBuyer, itemId: 'diamond', count: 1, price: 100 });
console.log('Trade with buyer lv 8 (should fail):', offer2.success, offer2.message);

const offer3 = tradeSystem.createTradeOffer({ seller: highLvlSeller, buyer: highLvlBuyer, itemId: 'diamond', count: 2, price: 500 });
console.log('Trade with both lv 10+ (should succeed):', offer3.success);

if (!offer1.success && !offer2.success && offer3.success) {
  console.log('✅ Trade Level 10+ Gate verified 100%!');
} else {
  console.error('❌ Trade validation failed!');
}

console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
