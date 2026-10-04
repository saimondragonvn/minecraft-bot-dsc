const assert = require('assert');
const partySystem = require('../src/systems/partySystem');
const combatSystem = require('../src/systems/combatSystem');
const pvpSystem = require('../src/systems/pvpSystem');
const eatCmd = require('../src/commands/eat');
const db = require('../src/database/db');
const config = require('../src/config');
const deathSystem = require('../src/systems/deathSystem');

console.log('--- TEST 1: Kiểm tra eatCmd và các loại thức ăn ---');
const testPlayer = {
  id: 'test_user_eat_1',
  name: 'TestEater',
  level: 5,
  hp: 10,
  maxHp: 20,
  inventory: [
    { itemId: 'cooked_mutton', count: 2 },
    { itemId: 'apple', count: 1 }
  ]
};

const resMutton = eatCmd.consumeFood(testPlayer, 'cooked_mutton');
assert.strictEqual(resMutton.success, true, 'Ăn thịt cừu nướng thành công');
assert.strictEqual(resMutton.actualHealed, 8, 'Hồi đúng 8 máu');
assert.strictEqual(testPlayer.hp, 18, 'HP tăng lên 18');
assert.strictEqual(testPlayer.inventory.find(i => i.itemId === 'cooked_mutton').count, 1, 'Trừ 1 thịt cừu');
console.log('✅ TEST 1 PASSED: Ăn món ăn hoạt động chuẩn xác.');

console.log('--- TEST 2: Kiểm tra combatSystem.handleFoodSelect ---');
assert.ok(combatSystem.pendingFoodSelects instanceof Map, 'pendingFoodSelects phải là Map');
let executeRoundCalled = false;
let roundLogReceived = null;

combatSystem.pendingFoodSelects.set('test_combat_user', {
  executeRound: async (log) => {
    executeRoundCalled = true;
    roundLogReceived = log;
  },
  pData: { player: testPlayer },
  actor: testPlayer,
  mob: { currentHp: 50, maxHp: 50 }
});

// Giả lập db.getPlayer và hasItem/removeItem
const originalGetPlayer = db.getPlayer;
const originalHasItem = db.hasItem;
const originalRemoveItem = db.removeItem;

db.getPlayer = () => testPlayer;
db.hasItem = (p, id) => p.inventory.some(i => i.itemId === id && i.count > 0);
db.removeItem = (p, id, qty) => {
  const item = p.inventory.find(i => i.itemId === id);
  if (item) item.count -= qty;
};

let replyContent = '';
let replyClosed = false;
const mockCombatInteraction = {
  user: { id: 'test_combat_user' },
  values: ['apple'],
  update: async (opts) => {
    replyContent = opts.content;
    replyClosed = true;
  },
  deleteReply: async () => {}
};

combatSystem.handleFoodSelect(mockCombatInteraction).then(() => {
  assert.strictEqual(executeRoundCalled, true, 'executeRound phải được gọi sau khi ăn trong combat');
  assert.ok(replyContent.includes('Đã dùng'), 'Phải phản hồi đã dùng thức ăn');
  assert.strictEqual(combatSystem.pendingFoodSelects.has('test_combat_user'), false, 'Phải xóa pendingFoodSelects');
  console.log('✅ TEST 2 PASSED: combatSystem.handleFoodSelect hoạt động chuẩn.');

  console.log('--- TEST 3: Kiểm tra pvpSystem.handleFoodSelect ---');
  assert.ok(pvpSystem.pendingFoodSelects instanceof Map, 'pendingFoodSelects trong pvpSystem phải là Map');
  let pvpOnFoodCalled = false;
  pvpSystem.pendingFoodSelects.set('test_pvp_user', {
    attacker: testPlayer,
    onFoodConsumed: async (itemDef, healed, id) => {
      pvpOnFoodCalled = true;
    }
  });

  testPlayer.hp = 10;
  testPlayer.inventory.push({ itemId: 'apple', count: 1 });
  const mockPvpInteraction = {
    user: { id: 'test_pvp_user' },
    values: ['apple'],
    update: async () => {},
    deleteReply: async () => {}
  };

  pvpSystem.handleFoodSelect(mockPvpInteraction).then(() => {
    assert.strictEqual(pvpOnFoodCalled, true, 'onFoodConsumed trong pvpSystem phải được gọi');
    assert.strictEqual(pvpSystem.pendingFoodSelects.has('test_pvp_user'), false, 'Phải xóa pending');
    console.log('✅ TEST 3 PASSED: pvpSystem.handleFoodSelect hoạt động chuẩn.');

    console.log('--- TEST 4: Kiểm tra partySystem không còn isDowned và có handleFoodSelect ---');
    assert.ok(partySystem.pendingFoodSelects instanceof Map, 'pendingFoodSelects trong partySystem phải là Map');
    
    // Đọc mã nguồn partySystem để kiểm tra tuyệt đối không còn isDowned
    const fs = require('fs');
    const partyCode = fs.readFileSync(require.resolve('../src/systems/partySystem'), 'utf8');
    assert.strictEqual(partyCode.includes('isDowned'), false, 'Mã nguồn partySystem KHÔNG được chứa isDowned');
    assert.strictEqual(partyCode.includes('Cứu Bạn'), false, 'Mã nguồn partySystem KHÔNG được chứa Cứu Bạn');
    assert.ok(partyCode.includes('deathSystem.handleDeath'), 'Mã nguồn partySystem PHẢI gọi deathSystem.handleDeath khi chết');

    let partyOnFoodCalled = false;
    partySystem.pendingFoodSelects.set('test_party_user', {
      actor: { currentHp: 5, maxHp: 20 },
      actorPlayer: testPlayer,
      onFoodConsumed: async (log) => {
        partyOnFoodCalled = true;
      }
    });

    const mockPartyInteraction = {
      user: { id: 'test_party_user' },
      values: ['apple'],
      update: async () => {},
      deleteReply: async () => {}
    };

    partySystem.handleFoodSelect(mockPartyInteraction).then(() => {
      assert.strictEqual(partyOnFoodCalled, true, 'onFoodConsumed trong partySystem phải được gọi');
      assert.strictEqual(partySystem.pendingFoodSelects.has('test_party_user'), false, 'Phải xóa pending');
      console.log('✅ TEST 4 PASSED: partySystem loại bỏ triệt để cứu bạn và chọn món ăn chuẩn xác.');

      console.log('🎉 TOÀN BỘ CÁC BÀI TEST ĐÃ VƯỢT QUA 100%!');
      process.exit(0);
    });
  });
});
