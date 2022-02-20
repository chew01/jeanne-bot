const { SlashCommandBuilder } = require('@discordjs/builders');
const { reminderTimeouts } = require('../data/timeouts');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Produces debug info'),
  async execute(interaction) {
    console.log('Reminder Timeouts:');
    console.log(reminderTimeouts);
    interaction.reply('Check the console!');
  },
};
