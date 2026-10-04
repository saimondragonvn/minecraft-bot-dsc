const db = require('../src/database/db');
const config = require('../src/config');
const enchantSystem = require('../src/systems/enchantSystem');
const combatSystem = require('../src/systems/combatSystem');

console.log('=== STARTING COMPREHENSIVE TESTS ===');

// Setup mock player
const testUser = { id: 'test_user_enchant_verify', username: 'Tester', avatar: '' };
const player = db.getPlayer(testUser.id, testUser.username, testUser.avatar);

// 1. Check max personal slots is 24
console.log('\n--- TEST 1: Inventory slots ---');
const maxSlots = db.getMaxSlots(player);
console.log(`Personal max slots: ${maxSlots} (Expected: 24)`);
if (maxSlots !== 24) throw new Error('Personal max slots must be 24');

// 2. Check Home chest: starts at 0, expand with 64 logs -> 8 slots
console.log('\n--- TEST 2: Home Chest Expansion ---');
player.homeChestSlots = 0;
player.homeChest = [];
console.log(`Initial home chest max slots: ${db.getHomeChestMaxSlots(player)} (Expected: 0)`);
db.addItem(player, 'oak_log', 64);
const upRes = db.upgradeHomeChest(player);
console.log('Upgrade result:', upRes.message);
if (!upRes.success || db.getHomeChestMaxSlots(player) !== 8) {
  throw new Error('Upgrade home chest failed');
}

// Deposit and withdraw test
db.addItem(player, 'iron_ingot', 10);
const depRes = db.depositToHomeChest(player, 'iron_ingot', 5);
console.log('Deposit result:', depRes.message);
if (!depRes.success || db.getHomeChestUsedSlots(player) !== 1) {
  throw new Error('Deposit to home chest failed');
}

const witRes = db.withdrawFromHomeChest(player, 'iron_ingot', 5);
console.log('Withdraw result:', witRes.message);
if (!witRes.success || db.getHomeChestUsedSlots(player) !== 0) {
  throw new Error('Withdraw from home chest failed');
}

// 3. Durability & Breakage & Unbreaking
console.log('\n--- TEST 3: Durability & Breakage & Unbreaking ---');
player.equipment.sword = 'golden_sword'; // 32 durability
player.durability = { sword: 32 };
player.enchants = {};

// Consume 1
const d1 = db.consumeDurability(player, 'sword', 1);
console.log(`After 1 hit: ${d1.remaining}/${d1.max}, broken: ${d1.broken}`);
if (d1.remaining !== 31) throw new Error('Durability did not decrement correctly');

// Add unbreaking 3
player.enchants.sword = { unbreaking: 3 };
let hitsWithUnbreaking = 0;
for (let i = 0; i < 20; i++) {
  const cur = db.getDurability(player, 'sword').current;
  db.consumeDurability(player, 'sword', 1);
  const after = db.getDurability(player, 'sword').current;
  if (cur !== after) hitsWithUnbreaking++;
}
console.log(`Out of 20 hits with Unbreaking III, durability only dropped ${hitsWithUnbreaking} times (Expected: around 4-6 times due to 75% negation)`);

// Test item breaking when reaching 0 (clear unbreaking first so it doesn't ignore)
player.enchants.sword = {};
player.durability.sword = 1;
const breakRes = db.consumeDurability(player, 'sword', 1);
console.log(`Break check: broken=${breakRes.broken}, sword equipped=${player.equipment.sword}`);
if (!breakRes.broken || player.equipment.sword !== null) {
  throw new Error('Item should break and unequip when reaching 0 durability');
}

// 4. Mending repair with EXP
console.log('\n--- TEST 4: Mending Repair ---');
player.equipment.sword = 'diamond_sword'; // 1562 max
player.durability = { sword: 1000 };
player.enchants = { sword: { mending: 1 } };
const repaired = db.repairWithMending(player, 50); // 50 exp * 2 = 100 durability repaired
console.log(`Repaired durability: ${repaired}, current: ${player.durability.sword} (Expected: 1100)`);
if (player.durability.sword !== 1100) throw new Error('Mending did not repair properly');

// 5. Combine 2 items
console.log('\n--- TEST 5: Combine 2 Items ---');
player.equipment.sword = 'iron_sword'; // 251 max
player.durability.sword = 100;
db.addItem(player, 'iron_sword', 1);
const combRes = db.combineItems(player, 'sword', 'iron_sword');
console.log('Combine result:', combRes.message);
if (!combRes.success) throw new Error('Combine failed');
// 100 + 251 + 13 bonus = capped at 251
console.log(`Combined durability: ${player.durability.sword}/${config.ITEMS.iron_sword.maxDurability}`);

// 6. Enchanting Table restrictions
console.log('\n--- TEST 6: Enchanting Table restrictions ---');
if (!player.unlocked) player.unlocked = {};
player.unlocked.enchanting_table = true;
player.level = 60;
db.addItem(player, 'lapis', 10);

// Already has enchantment from step 5? Let's check
player.enchants.sword = { sharpness: 3 };
const gachaFail = enchantSystem.gachaEnchant(player, 'sword', 1);
console.log('Gacha on already-enchanted item result:', gachaFail.message);
if (gachaFail.success) throw new Error('Enchanting table must reject already enchanted items');

// Clear enchant to test clean item
player.enchants.sword = {};
const gachaSuccess = enchantSystem.gachaEnchant(player, 'sword', 1);
console.log('Gacha on clean item result:', gachaSuccess.message);
if (!gachaSuccess.success) throw new Error('Gacha should succeed on clean item');

// Check that Mending is never rolled in table
console.log('\n--- TEST 7: Mending exclusion & Tier 3 1:30 level 5 chance ---');
const applicableForTable = enchantSystem.getApplicableEnchants('sword', true);
const hasMendingInTable = applicableForTable.some(e => e.id === 'mending');
console.log(`Is Mending in table pool? ${hasMendingInTable} (Expected: false)`);
if (hasMendingInTable) throw new Error('Mending must NOT be in table enchant pool');

// 8. Check Shop book_mending
console.log('\n--- TEST 8: Shop book_mending ---');
const mendingDef = config.ITEMS.book_mending;
console.log(`book_mending buyPrice: ${mendingDef.buyPrice} (Expected: 50000)`);
if (mendingDef.buyPrice !== 50000) throw new Error('book_mending buyPrice must be 50000');

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
