const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const dayjs = require('dayjs');
const _ = require('lodash');
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
        .setName('forcedraw')
        .setDescription('Forces a draw to be conducted.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('info')
        .setDescription('Shows statistics about the ongoing TOTO draw.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ticket')
        .setDescription('Pick 6 numbers for your daily TOTO ticket.')
        .addStringOption((option) =>
          option
            .setName('numbers')
            .setDescription(
              'Enter 6 different numbers from 1 to 49, with a space between each of them!'
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('schedule')
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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('me')
        .setDescription('Shows your current TOTO ticket in this server.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('quickpick')
        .setDescription(
          'Let the system pick 6 numbers for your daily TOTO ticket.'
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'forcedraw') {
      interaction.client.emit(
        'draw',
        interaction.client,
        interaction.channelId,
        interaction.guildId,
        interaction.user.id
      );
      return interaction.reply({
        content: 'Forced a draw to be conducted!',
        ephemeral: true,
      });
    }
    if (subcommand === 'info') {
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
      let previousDrawAdditional = '```diff\n- N/A\n```';
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
        previousDrawAdditional = `\`\`\`diff\n+ ${
          previousDrawInInteractionGuild[0].results.split(',')[6]
        }\n\`\`\``;
        previousDrawTime = dayjs(previousDrawInInteractionGuild[0].date).format(
          'llll'
        );
        previousWinners = previousDrawInInteractionGuild[0].winners;
        previousWinnerTickets = previousDrawInInteractionGuild[0].winnerTickets;
      }

      const drawEmbed = new MessageEmbed()
        .setTitle('🎲 TOTO Draw Statistics! 🎲')
        .setThumbnail('https://media.giphy.com/media/dvgefaMHmaN2g/giphy.gif')
        .addField('Upcoming draws', scheduledDraws)
        .addFields(
          { name: 'Previous draw results', value: previousDraw, inline: true },
          {
            name: 'Additional',
            value: previousDrawAdditional,
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
      const results = interaction.options
        .getString('numbers')
        .trim()
        .split(' ')
        .filter((number) => number !== '')
        .map(Number);
      if (results.includes(NaN)) {
        return interaction.reply({
          content: "You entered something that isn't a number! Try again.",
          ephemeral: true,
        });
      }
      if (results.length !== 6) {
        return interaction.reply({
          content: 'You did not enter 6 numbers! Try again.',
          ephemeral: true,
        });
      }
      if (results.some((number) => number < 1 || number > 49)) {
        return interaction.reply({
          content: 'All numbers must be from 1 to 49! Try again.',
          ephemeral: true,
        });
      }
      if (!new Set(results).size === results.length) {
        return interaction.reply({
          content: 'You used the same number more than once! Try again.',
          ephemeral: true,
        });
      }

      const ticketsThatUserCreatedInInteractionGuild = await TotoTicket.findAll(
        {
          where: {
            userId: interaction.user.id,
            guildId: interaction.guildId,
          },
        }
      );
      if (ticketsThatUserCreatedInInteractionGuild.length > 0) {
        return interaction.reply({
          content: 'You have already bought a ticket today!',
          ephemeral: true,
        });
      }

      const sortedTicket = results.sort((a, b) => a - b);
      try {
        await TotoTicket.create({
          userId: interaction.user.id,
          numbers: sortedTicket,
          guildId: interaction.guildId,
        });
        return interaction.reply(
          'Your ticket has been registered successfully!'
        );
      } catch (error) {
        return interaction.reply({
          content: 'Ticket could not be added to the database!',
          ephemeral: true,
        });
      }
    }
    if (subcommand === 'schedule') {
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
        });
      } catch (error) {
        return interaction.reply({
          content: 'Error scheduling draw!',
          ephemeral: true,
        });
      }
    }
    if (subcommand === 'me') {
      const currentTicket = await TotoTicket.findAll({
        where: {
          userId: interaction.user.id,
          guildId: interaction.guildId,
        },
      });
      if (currentTicket.length === 0) {
        return interaction.reply({
          content:
            "You haven't bought a ticket today! Use the /toto ticket command to get one!",
          ephemeral: true,
        });
      }
      const currentTicketString = currentTicket[0].numbers.replaceAll(',', ' ');
      return interaction.reply({
        content: `Your current ticket is:\n\`${currentTicketString}\``,
        ephemeral: true,
      });
    }
    if (subcommand === 'quickpick') {
      const ticketsThatUserCreatedInInteractionGuild = await TotoTicket.findAll(
        {
          where: {
            userId: interaction.user.id,
            guildId: interaction.guildId,
          },
        }
      );
      if (ticketsThatUserCreatedInInteractionGuild.length > 0) {
        return interaction.reply({
          content: 'You have already bought a ticket today!',
          ephemeral: true,
        });
      }
      const array = _.range(1, 50);
      const sortedTicket = _.shuffle(array)
        .slice(0, 6)
        .sort((a, b) => a - b);

      try {
        await TotoTicket.create({
          userId: interaction.user.id,
          numbers: sortedTicket,
          guildId: interaction.guildId,
        });
        return interaction.reply(
          'Your ticket has been registered successfully!'
        );
      } catch (error) {
        return interaction.reply({
          content: 'Ticket could not be added to the database!',
          ephemeral: true,
        });
      }
    }
    return interaction.reply({
      content: 'Subcommand does not exist!',
      ephemeral: true,
    });
  },
};
