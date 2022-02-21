const { SlashCommandBuilder } = require('@discordjs/builders');
const { totoTimeouts } = require('../data/timeouts');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Produces debug info'),
  async execute(interaction) {
    console.log('Toto Timeouts:');
    console.log(totoTimeouts);
    interaction.reply('Check the console!');
  },
};
