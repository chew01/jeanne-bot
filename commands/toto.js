const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { Ticket } = require('../data/sequelize');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toto')
    .setDescription('Access TOTO commands.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('conductdraw')
        .setDescription('Forces a draw to be conducted.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('draw')
        .setDescription('Shows statistics about the ongoing TOTO draw.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ticket')
        .setDescription('Pick 6 numbers for your daily TOTO ticket.')
        .addIntegerOption((option) =>
          option
            .setName('first_number')
            .setDescription('First number to be added')
            .setMinValue(1)
            .setMaxValue(49)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('second_number')
            .setDescription('Second number to be added')
            .setMinValue(1)
            .setMaxValue(49)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('third_number')
            .setDescription('Third number to be added')
            .setMinValue(1)
            .setMaxValue(49)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('fourth_number')
            .setDescription('Fourth number to be added')
            .setMinValue(1)
            .setMaxValue(49)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('fifth_number')
            .setDescription('Fifth number to be added')
            .setMinValue(1)
            .setMaxValue(49)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('sixth_number')
            .setDescription('Sixth number to be added')
            .setMinValue(1)
            .setMaxValue(49)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('scheduledraw')
        .setDescription('Schedules a TOTO draw.')
        .addStringOption((option) =>
          option
            .setName('date')
            .setDescription('Date in DD/MM/YY format e.g. 25/12/22')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('time')
            .setDescription('Time in 24hr format e.g. 1800')
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'conductdraw') {
      return interaction.client.emit('draw', interaction);
    }
    if (subcommand === 'draw') {
      const drawEmbed = new MessageEmbed()
        .setTitle('TOTO Draw Statistics!')
        .setDescription('Draw No. 1')
        .setThumbnail('https://media.giphy.com/media/dvgefaMHmaN2g/giphy.gif');
      return interaction.reply({ embeds: [drawEmbed] });
    }
    if (subcommand === 'ticket') {
      const params = [
        'first_number',
        'second_number',
        'third_number',
        'fourth_number',
        'fifth_number',
        'sixth_number',
      ];
      const results = params.map((number) =>
        interaction.options.getInteger(number)
      );
      if (!new Set(results).size === results.length) {
        return interaction.reply(
          'You used the same number more than once! Try again.'
        );
      }
      try {
        await Ticket.create({
          userID: interaction.user.id,
          numbers: results,
        });
        return interaction.reply(
          'Your ticket has been registered successfully!'
        );
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          return interaction.reply('You have already bought a ticket today!');
        }
        return interaction.reply('Ticket could not be added to the database!');
      }
    }
    if (subcommand === 'scheduledraw') {
      interaction.reply('Error scheduling TOTO draw.');
    }
    return interaction.reply('No such subcommand!');
  },
};
