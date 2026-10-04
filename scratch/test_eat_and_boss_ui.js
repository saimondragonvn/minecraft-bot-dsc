const db = require('../src/database/db');
const eatCmd = require('../src/commands/eat');
const combatSystem = require('../src/systems/combatSystem');

console.log('=== TESTING EAT & BOSS UI OVERHAUL ===');

const player = db.getPlayer('test_user_ui', 'TesterUser', '');
player.hp = 20;
player.maxHp = 40;
db.addItem(player, 'bread', 3);

// Test eating
console.log('\n--- 1. Testing consumeFood ---');
const eatResult = eatCmd.consumeFood(player, 'bread');
console.log('Eat result:', eatResult.success, 'Food:', eatResult.foodInfo.name, 'Healed:', eatResult.actualHealed, 'New HP:', player.hp);
if (!eatResult.success || !eatResult.foodInfo || eatResult.actualHealed <= 0) {
  throw new Error('consumeFood test failed');
}

// Test Boss UI rendering
console.log('\n--- 2. Testing Boss Combat UI Rendering ---');
const witherMob = {
  id: 'wither_boss',
  name: 'TRÙM WITHER 3 ĐẦU',
  emoji: '💀',
  currentHp: 350,
  maxHp: 400,
  attack: 15,
  defense: 5,
  isBoss: true
};

const participants = new Map();
participants.set(player.id, { player, damageDealt: 45, isShielding: false });

const bossMsg = combatSystem.createCombatMessage(player, witherMob, '🌋 TRÙM WITHER 3 ĐẦU quét đòn diện rộng gây ~12 ST lên toàn đội!\n⚔️ TesterUser chém gây 18 ST!\n🍲 TesterUser ăn Bánh mì (+6 HP)!', participants);
const embed = bossMsg.embeds[0];
console.log('Boss Title:', embed.data.title);
console.log('Boss Description:\n' + embed.data.description);
console.log('Footer:', embed.data.footer.text);

if (!embed.data.title.includes('ĐẠI CHIẾN TRÙM')) {
  throw new Error('Boss title missing ĐẠI CHIẾN TRÙM');
}

// Test Regular Mob UI rendering
console.log('\n--- 3. Testing Regular Mob UI Rendering ---');
const zombieMob = {
  id: 'zombie',
  name: 'Thây ma',
  emoji: '🧟',
  currentHp: 20,
  maxHp: 20,
  attack: 4,
  defense: 1,
  isBoss: false
};
const mobMsg = combatSystem.createCombatMessage(player, zombieMob, '⚔️ TesterUser chém gây 8 ST!', participants);
console.log('Mob Title:', mobMsg.embeds[0].data.title);
console.log('Mob Description:\n' + mobMsg.embeds[0].data.description);

// Clean up
delete db.players['test_user_ui'];
db.saveData();

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
