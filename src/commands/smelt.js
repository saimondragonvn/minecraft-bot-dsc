const { SlashCommandBuilder } = require('discord.js');
const db = require('../database/db');
const smeltingSystem = require('../systems/smeltingSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('smelt')
    .setDescription('Lò Nung (Furnace): Nung quặng và nướng thịt (1 Than đá = 4 món)')
    .addStringOption(opt =>
      opt.setName('action')
        .setDescription('Chọn vật phẩm hoặc hành động muốn nung')
        .setRequired(false)
        .addChoices(
          { name: '🔥 Nung tất cả vật phẩm', value: 'all' },
          { name: '🥈 Nung quặng sắt ➔ Thỏi sắt', value: 'iron' },
          { name: '🥇 Nung quặng vàng ➔ Thỏi vàng', value: 'gold' },
          { name: '🥉 Nung quặng đồng ➔ Thỏi đồng', value: 'copper' },
          { name: '🪨 Nung Mảnh vỡ cổ đại ➔ Mảnh Netherite', value: 'ancient_debris' },
          { name: '🪨 Nung Đá cuội ➔ Đá nhẵn (Stone)', value: 'cobblestone' },
          { name: '🥩 Nướng thịt bò sống ➔ Bít tết chín', value: 'beef' },
          { name: '🍖 Nướng thịt heo sống ➔ Thịt heo nướng', value: 'pork' },
          { name: '🍗 Nướng thịt gà sống ➔ Thịt gà nướng', value: 'chicken' }
        )
    ),

  async execute(interaction) {
    const player = db.getPlayer(interaction.user.id, interaction.user.username);
    const action = interaction.options ? interaction.options.getString('action') : null;

    if (action === 'all') {
      return smeltingSystem.handleSmeltAll(interaction, player);
    } else if (action) {
      return smeltingSystem.handleSmeltRecipe(interaction, player, action);
    }

    const payload = smeltingSystem.buildFurnaceScreen(player);
    return interaction.reply(payload);
  }
};
