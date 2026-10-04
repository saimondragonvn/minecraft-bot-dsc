const db = require('../database/db');
const config = require('../config');

class CraftingSystem {
  /**
   * Lấy danh sách toàn bộ công thức chế tạo
   */
  getRecipes() {
    return config.RECIPES;
  }

  /**
   * Kiểm tra người chơi có đủ nguyên liệu để chế tạo món đồ không
   */
  canCraft(player, recipeId) {
    const recipe = config.RECIPES.find(r => r.id === recipeId);
    if (!recipe) return { possible: false, reason: 'Công thức không tồn tại' };

    for (const [matId, neededCount] of Object.entries(recipe.materials)) {
      const currentCount = db.getItemCount(player, matId);
      if (currentCount < neededCount) {
        const matDef = config.ITEMS[matId];
        return {
          possible: false,
          missing: matDef ? matDef.name : matId,
          needed: neededCount,
          have: currentCount
        };
      }
    }

    return { possible: true, recipe };
  }

  /**
   * Tiến hành chế tạo vật phẩm
   */
  craft(player, recipeId) {
    const check = this.canCraft(player, recipeId);
    if (!check.possible) {
      return {
        success: false,
        message: `❌ Không đủ nguyên liệu! Cần ${check.needed} ${check.missing} (Bạn chỉ có ${check.have}).`
      };
    }

    const recipe = check.recipe;

    // Tiêu thụ nguyên liệu
    for (const [matId, neededCount] of Object.entries(recipe.materials)) {
      db.removeItem(player, matId, neededCount);
    }

    // Thêm vật phẩm thành phẩm
    db.addItem(player, recipe.result, recipe.count || 1);

    // Hoàn trả xô rỗng hoặc vật phẩm phụ nếu có (ví dụ: đúc obsidian hoàn trả 2 xô sắt rỗng)
    let returnMsg = '';
    if (recipe.returns) {
      for (const [retId, retCount] of Object.entries(recipe.returns)) {
        db.addItem(player, retId, retCount);
        const retDef = config.ITEMS[retId];
        const retName = retDef ? retDef.name : retId;
        const retEmoji = retDef ? retDef.emoji : '📦';
        returnMsg += `\n🔄 *Hoàn lại túi đồ: ${retEmoji} x${retCount} ${retName}*`;
      }
    }

    // Nếu chế tạo Rương tại Nhà (+8 slot/rương)
    let chestExpandMsg = '';
    if (recipe.result === 'chest' || recipe.id === 'craft_chest') {
      const addedSlots = 8 * (recipe.count || 1);
      player.homeChestSlots = (player.homeChestSlots || 0) + addedSlots;
      chestExpandMsg = `\n✨ **Rương an toàn tại Nhà được tăng thêm +${addedSlots} Slot!** (Tổng sức chứa rương tại nhà: **${db.getHomeChestMaxSlots(player)} Ô**)`;
    }

    db.addExp(player, 10);
    db.saveData();

    const resultDef = config.ITEMS[recipe.result];
    const emoji = resultDef ? resultDef.emoji : '📦';
    const name = resultDef ? resultDef.name : recipe.result;

    return {
      success: true,
      result: recipe.result,
      count: recipe.count || 1,
      message: `🎉 **Chế tạo thành công:** ${emoji} x${recipe.count || 1} **${name}**! (+10 EXP)${returnMsg}${chestExpandMsg}`
    };
  }
}

module.exports = new CraftingSystem();
