const { AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

const WORK_IMAGES = {
  woodcutting: 'woodcutting.jpg',
  chop: 'woodcutting.jpg',
  forest: 'woodcutting.jpg',

  mining: 'mining.jpg',
  mine: 'mining.jpg',
  cave: 'mining.jpg',

  furnace: 'furnace.jpg',
  smelt: 'furnace.jpg',

  crafting: 'crafting.jpg',
  craft: 'crafting.jpg',

  nether: 'nether.jpg',
  nether_mine: 'nether.jpg',

  explore: 'explore.jpg',
  flight: 'explore.jpg',
  fly: 'explore.jpg',
  walk: 'walk.jpg',

  combat: 'combat.jpg',
  hunt: 'combat.jpg',

  dragon: 'dragon.jpg',
  ender_dragon: 'dragon.jpg',
  the_end: 'dragon.jpg',

  wither: 'wither.jpg',
  boss_wither: 'wither.jpg',
  wither_boss: 'wither.jpg',

  home: 'home.jpg',
  sleep: 'home.jpg',

  dungeon: 'dungeon.jpg',
  enchant: 'enchant.jpg'
};

const ASSETS_DIR = path.resolve(__dirname, '../../assets/work');

class ImageHelper {
  /**
   * Lấy AttachmentBuilder cho ảnh giai đoạn làm việc
   * @param {string} stage
   * @returns { { attachment: AttachmentBuilder, filename: string } | null }
   */
  getWorkAttachment(stage) {
    const filename = WORK_IMAGES[stage];
    if (!filename) return null;

    const fullPath = path.join(ASSETS_DIR, filename);
    if (!fs.existsSync(fullPath)) return null;

    return {
      attachment: new AttachmentBuilder(fullPath, { name: filename }),
      filename
    };
  }

  /**
   * Gắn ảnh giai đoạn làm việc vào Embed và trả về mảng files
   * @param {EmbedBuilder} embed
   * @param {string} stage
   * @returns {AttachmentBuilder[]}
   */
  attachWorkImage(embed, stage) {
    const result = this.getWorkAttachment(stage);
    if (!result || !embed) return [];

    embed.setImage(`attachment://${result.filename}`);
    return [result.attachment];
  }

  /**
   * Tạo payload hoàn chỉnh chứa Embed và Attachment ảnh giai đoạn
   * @param {Object} options
   * @param {EmbedBuilder} options.embed
   * @param {Array} [options.components]
   * @param {string} options.stage
   * @param {string} [options.content]
   * @returns {Object}
   */
  buildWorkPayload({ embed, components = [], stage, content = undefined }) {
    const files = this.attachWorkImage(embed, stage);
    const payload = { embeds: [embed], components, files };
    if (content) payload.content = content;
    return payload;
  }
}

module.exports = new ImageHelper();
