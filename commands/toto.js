const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const dayjs = require('dayjs');
const localizedFormat = require('dayjs/plugin/localizedFormat');
const calendar = require('dayjs/plugin/calendar');
const { v4: uuidv4 } = require('uuid');
const { TotoTicket, TotoDrawSchedule, TotoDraw } = require('../data/sequelize');
const { totoTimeouts } = require('../data/timeouts');

dayjs.extend(localizedFormat);
dayjs.extend(calendar);

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
            .setName('time')
            .setDescription('Set the draw time in 24 hour format.')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('date')
            .setDescription(
              'Set the draw date in DD/MM/YY format. Leave blank if meant for today.'
            )
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'conductdraw') {
      interaction.client.emit(
        'draw',
        interaction.client,
        interaction.channelId,
        interaction.guildId,
        interaction.user.id
      );
    }
    if (subcommand === 'draw') {
      // Scheduled draws
      const scheduledDrawsInInteractionGuild = await TotoDrawSchedule.findAll({
        where: {
          guildId: interaction.guildId,
        },
      });
      let scheduledDraws = '```diff\n';
      scheduledDrawsInInteractionGuild.forEach((drawschedule) => {
        const formatDate = dayjs(drawschedule.scheduledTime).format('llll');
        const calendarDate = dayjs(drawschedule.scheduledTime).calendar(null, {
          sameDay: '[Today at] h:mm A',
          nextDay: '[Tomorrow at] h:mm A',
          nextWeek: 'dddd [at] h:mm A',
          lastDay: '[Yesterday at] h:mm A',
          lastWeek: '[Last] dddd [at] h:mm A',
          sameElse: 'DD/MM/YYYY',
        });
        scheduledDraws += `+ ${formatDate} (${calendarDate})\n`;
      });
      scheduledDraws += '```';
      if (scheduledDrawsInInteractionGuild.length === 0) {
        scheduledDraws = '```diff\n- There are no scheduled draws.\n```';
      }

      // Previous draw
      const previousDrawInInteractionGuild = await TotoDraw.findAll({
        where: {
          guildId: interaction.guildId,
        },
        order: [['date', 'DESC']],
      });
      let previousDraw = '```fix\n';
      let previousDrawTime = 'N/A';
      let previousWinners = 'N/A';
      let previousWinnerTickets = 'N/A';
      if (previousDrawInInteractionGuild.length === 0) {
        previousDraw =
          '```diff\n- No draws have been conducted in this server.\n```';
      } else {
        previousDrawInInteractionGuild[0].results
          .split(',')
          .slice(0, 6)
          .forEach((number) => {
            previousDraw += `${number} `;
          });
        previousDraw += '\n```';
        previousDrawTime = dayjs(previousDrawInInteractionGuild[0].date).format(
          'llll'
        );
        previousWinners = previousDrawInInteractionGuild[0].winners;
        previousWinnerTickets = previousDrawInInteractionGuild[0].winnerTickets;
      }

      const drawEmbed = new MessageEmbed()
        .setTitle('TOTO Draw Statistics!')
        .setThumbnail('https://media.giphy.com/media/dvgefaMHmaN2g/giphy.gif')
        .addField('Upcoming draws', scheduledDraws)
        .addFields(
          { name: 'Previous draw results', value: previousDraw, inline: true },
          {
            name: 'Additional',
            value: `\`\`\`diff\n+ ${
              previousDrawInInteractionGuild[0].results.split(',')[6]
            }\n\`\`\``,
            inline: true,
          },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: 'Previous winner(s)', value: previousWinners, inline: true },
          {
            name: 'Ticket(s)',
            value: previousWinnerTickets,
            inline: true,
          },
          { name: '\u200B', value: '\u200B', inline: true }
        )
        .setFooter({ text: `Last draw was conducted at: ${previousDrawTime}` });
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
      const sortedTicket = results.sort((a, b) => a - b);
      try {
        await TotoTicket.create({
          userId: interaction.user.id,
          numbers: sortedTicket,
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
      const timeRaw = interaction.options.getString('time');
      const dateRaw = interaction.options.getString('date');

      if (!dayjs(timeRaw, 'HHmm', true).isValid()) {
        return interaction.reply({
          content:
            '**Time was not in the correct format!** Did you use the **24-hour (e.g. 2359)** format?',
          ephemeral: true,
        });
      }
      if (dateRaw && !dayjs(dateRaw, 'DD/MM/YY', true).isValid()) {
        return interaction.reply({
          content:
            '**Date was not in the correct format!** Did you use the **DD/MM/YY (e.g. 25/12/22)** format?',
          ephemeral: true,
        });
      }

      const scheduledTime = dayjs(
        `${dateRaw} ${timeRaw}`,
        dateRaw ? 'DD/MM/YY HHmm' : 'HHmm'
      ).toDate();
      const duration = scheduledTime - Date.now();

      if (duration < 0) {
        return interaction.reply({
          content:
            "**Draws can't be scheduled in the past!** Are you sure you typed the correct date and time?",
          ephemeral: true,
        });
      }
      if (duration <= 3000) {
        return interaction.reply({
          content:
            '**Whoa, the bookies need to get ready!** Draws cannot be scheduled less than 3 seconds in advance.',
          ephemeral: true,
        });
      }

      const userId = interaction.user.id;
      const { channelId, guildId } = interaction;
      const timeoutId = uuidv4();

      try {
        totoTimeouts[timeoutId] = setTimeout(() => {
          interaction.client.emit(
            'draw',
            interaction.client,
            channelId,
            guildId,
            userId
          );

          TotoDrawSchedule.destroy({
            where: { timeoutId },
          });
        }, duration);

        await TotoDrawSchedule.create({
          scheduledTime,
          timeoutId,
          channelId,
          userId,
          guildId,
        });

        return interaction.reply({
          content: `Scheduled a new draw ${dayjs(scheduledTime).from(
            new Date()
          )}`,
          ephemeral: true,
        });
      } catch (error) {
        return interaction.reply({
          content: 'Error scheduling draw!',
          ephemeral: true,
        });
      }
    }
    return interaction.reply({
      content: 'Forced a draw to be conducted!',
      ephemeral: true,
    });
  },
};
