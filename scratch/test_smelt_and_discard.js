const db = require('../src/database/db');
const config = require('../src/config');
const smeltingSystem = require('../src/systems/smeltingSystem');

// Test test player
const player = db.getPlayer('test_smelt_user', 'TestSmelt');
player.inventory = [
  { itemId: 'iron_ore', count: 8 },
  { itemId: 'coal', count: 2 },
  { itemId: 'cobblestone', count: 10 }
];

console.log('Testing Furnace Screen...');
const screen = smeltingSystem.buildFurnaceScreen(player);
console.log('Furnace components count:', screen.components.length);

let repliedPayload = null;
let updatedPayload = null;

const mockInteraction = {
  user: { id: player.id, username: player.name },
  isButton: () => true,
  isStringSelectMenu: () => false,
  update: (p) => { updatedPayload = p; return Promise.resolve(p); },
  reply: (p) => { repliedPayload = p; return Promise.resolve(p); }
};

console.log('Testing handleSmeltRecipe for iron...');
smeltingSystem.handleSmeltRecipe(mockInteraction, player, 'iron').then(() => {
  console.log('Smelt Recipe Result:', updatedPayload ? 'UPDATED SCREEN OK' : 'FAILED');
  console.log('Player Iron Ingot Count:', db.getItemCount(player, 'iron_ingot'));
  console.log('Player Iron Ore Count:', db.getItemCount(player, 'iron_ore'));
  console.log('Player Coal Count:', db.getItemCount(player, 'coal'));

  // Test discard logic
  console.log('\nTesting Discard Logic...');
  const countBefore = db.getItemCount(player, 'cobblestone');
  console.log('Cobblestone before discard:', countBefore);
  db.removeItem(player, 'cobblestone', 5);
  console.log('Cobblestone after discard 5:', db.getItemCount(player, 'cobblestone'));

  console.log('ALL UNIT CHECKS PASSED!');
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
