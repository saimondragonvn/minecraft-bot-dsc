const config = require('../config');
const timeSystem = require('./timeSystem');

class MobSystem {
  /**
   * Tạo ngẫu nhiên một con quái/thú dựa trên Khu vực và Thời gian (Ngày/Đêm)
   * @param {string} area - 'forest', 'cave', 'dungeon', 'nether', 'the_end'
   * @returns {Object} Mob instance với HP riêng biệt
   */
  spawnMob(area) {
    const isDay = timeSystem.isDay();
    let candidates = [];

    switch (area) {
      case 'animals':
      case 'farm':
      case 'meadow':
        // Khu vực Đồng cỏ & Nông trại: Luôn luôn 100% xuất hiện Thú hiền (Heo, Bò, Cừu, Gà)
        candidates = [
          { id: 'cow', weight: 25 },
          { id: 'pig', weight: 25 },
          { id: 'sheep', weight: 25 },
          { id: 'chicken', weight: 25 }
        ];
        break;

      case 'forest':
      case 'overworld':
        if (isDay) {
          // Ban ngày: Động vật ôn hòa (Bò, Heo, Cừu, Gà)
          candidates = [
            { id: 'cow', weight: 25 },
            { id: 'pig', weight: 25 },
            { id: 'sheep', weight: 25 },
            { id: 'chicken', weight: 25 }
          ];
        } else {
          // Ban đêm: Quái vật rùng rợn Overworld (70%) + Thú hoang đi lạc trong rừng (30%)
          candidates = [
            { id: 'zombie', weight: 20 },
            { id: 'skeleton', weight: 15 },
            { id: 'spider', weight: 15 },
            { id: 'creeper', weight: 12 },
            { id: 'enderman', weight: 8 },
            { id: 'cow', weight: 8 },
            { id: 'pig', weight: 8 },
            { id: 'sheep', weight: 7 },
            { id: 'chicken', weight: 7 }
          ];
        }
        break;

      case 'cave':
        // Hang đá ngầm tối tăm: Quái vật luôn xuất hiện
        candidates = [
          { id: 'zombie', weight: 30 },
          { id: 'skeleton', weight: 30 },
          { id: 'spider', weight: 20 },
          { id: 'creeper', weight: 15 },
          { id: 'enderman', weight: 5 }
        ];
        break;

      case 'dungeon':
        // Hầm ngục nguy hiểm
        candidates = [
          { id: 'zombie', weight: 25 },
          { id: 'skeleton', weight: 30 },
          { id: 'spider', weight: 20 },
          { id: 'creeper', weight: 15 },
          { id: 'enderman', weight: 10 }
        ];
        break;

      case 'nether':
        // Địa ngục rực lửa
        candidates = [
          { id: 'blaze', weight: 40 },
          { id: 'wither_skeleton', weight: 35 },
          { id: 'ghast', weight: 25 }
        ];
        break;

      case 'the_end':
        // Vùng đất tận cùng
        candidates = [
          { id: 'enderman', weight: 60 },
          { id: 'shulker', weight: 40 }
        ];
        break;

      default:
        candidates = [{ id: 'zombie', weight: 100 }];
    }

    // Chọn ngẫu nhiên theo trọng số
    const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
    let rand = Math.random() * totalWeight;
    let chosenId = candidates[0].id;

    for (const c of candidates) {
      if (rand < c.weight) {
        chosenId = c.id;
        break;
      }
      rand -= c.weight;
    }

    return this.createMobInstance(chosenId);
  }

  /**
   * Tạo một bản thể quái vật để chiến đấu
   */
  createMobInstance(mobId) {
    const template = config.MOBS[mobId] || config.MOBS.zombie;
    return {
      ...template,
      currentHp: template.hp,
      maxHp: template.maxHp,
      crystalsLeft: template.crystals || 0 // Dành cho Rồng Ender
    };
  }

  /**
   * Tạo riêng Boss Rồng Ender
   */
  spawnEnderDragon() {
    return this.createMobInstance('ender_dragon');
  }
}

module.exports = new MobSystem();
