const { SlashCommandBuilder } = require('@discordjs/builders');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const relativeTime = require('dayjs/plugin/relativeTime');
const { MessageEmbed } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const timeouts = require('../timeouts');

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Access reminder commands.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Set a reminder.')
        .addStringOption((option) =>
          option
            .setName('reminder')
            .setDescription('Set your reminder!')
            .setRequired(true)
        )

        .addStringOption((option) =>
          option
            .setName('time')
            .setDescription('Set the time for your reminder in 24 hour format.')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('date')
            .setDescription(
              'Set the date for your reminder in DD/MM/YY format. Leave blank if meant for today.'
            )
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'set') {
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

      const datetime = dayjs(
        `${dateRaw} ${timeRaw}`,
        dateRaw ? 'DD/MM/YY HHmm' : 'HHmm'
      );
      const now = dayjs();
      const duration = datetime - now;

      if (duration < 0) {
        return interaction.reply({
          content:
            "**Reminders can't be sent to the past!** Are you sure you typed the correct date and time?",
          ephemeral: true,
        });
      }

      const reminder = interaction.options.getString('reminder');
      const userId = interaction.user.id;
      const channel = interaction.client.channels.cache.get(
        interaction.channelId
      );
      const datetimeJS = datetime.toDate();
      const timeoutId = uuidv4();

      const messageEmbed = new MessageEmbed()
        .setTitle('Hey! Your reminder is here!')
        .setDescription(`You requested a reminder ${dayjs(now).fromNow()}.`)
        .addField('Description', reminder);

      timeouts[timeoutId] = setTimeout(() => {
        channel.send({
          content: `Guess what, <@${userId}>?`,
          embeds: [messageEmbed],
        });
      }, duration);

      return interaction.reply({
        content: `Added a new reminder! It will come ${dayjs(
          datetime
        ).fromNow()}`,
        ephemeral: true,
      });
    }
    return interaction.reply('No such subcommand!');
  },
};
