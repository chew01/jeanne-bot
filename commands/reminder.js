const { MessageEmbed, MessageButton, MessageActionRow } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const relativeTime = require('dayjs/plugin/relativeTime');
const calendar = require('dayjs/plugin/calendar');
const localizedFormat = require('dayjs/plugin/localizedFormat');

const { reminderTimeouts } = require('../data/timeouts');
const { Reminder } = require('../data/sequelize');

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(calendar);
dayjs.extend(localizedFormat);

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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('list')
        .setDescription("Receive a list of all the reminders you've set.")
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

      const scheduledTime = dayjs(
        `${dateRaw} ${timeRaw}`,
        dateRaw ? 'DD/MM/YY HHmm' : 'HHmm'
      ).toDate();
      const createdTime = Date.now();
      const duration = scheduledTime - createdTime;

      if (duration < 0) {
        return interaction.reply({
          content:
            "**Reminders can't be sent to the past!** Are you sure you typed the correct date and time?",
          ephemeral: true,
        });
      }
      if (duration <= 3000) {
        return interaction.reply({
          content:
            '**You asked for a reminder, you got it!** Reminders cannot be set less than 3 seconds in advance.',
          ephemeral: true,
        });
      }

      const message = interaction.options.getString('reminder');
      const userId = interaction.user.id;
      const { channelId } = interaction;
      const channel = interaction.client.channels.cache.get(channelId);
      const timeoutId = uuidv4();

      const messageEmbed = new MessageEmbed()
        .setTitle('✅ Reminder! ✅')
        .setColor('#ff62bb')
        .setThumbnail(
          'https://c.tenor.com/676zsRffINcAAAAi/kiryu-coco-alarm.gif'
        )
        .setFooter({
          text: `You created this reminder on ${dayjs(createdTime).format(
            'llll'
          )} (${dayjs(createdTime).from(scheduledTime)})`,
        })
        .addField(
          `${dayjs(scheduledTime).format('llll')}`,
          `\`\`\`fix\n${message}\n\`\`\``
        );

      try {
        reminderTimeouts[timeoutId] = setTimeout(() => {
          channel.send({
            content: `<@${userId}>`,
            embeds: [messageEmbed],
          });

          Reminder.destroy({
            where: { timeoutId },
          });
        }, duration);

        await Reminder.create({
          userId,
          scheduledTime,
          createdTime,
          message,
          timeoutId,
          channelId,
        });

        return interaction.reply({
          content: `Added a new reminder! It will arrive ${dayjs(
            scheduledTime
          ).from(createdTime)}`,
          ephemeral: true,
        });
      } catch (error) {
        return interaction.reply({
          content: 'Error setting reminder!',
          ephemeral: true,
        });
      }
    }
    if (subcommand === 'list') {
      const remindersMadeByInteractionUser = await Reminder.findAll({
        where: {
          userId: interaction.user.id,
        },
        order: [['createdAt', 'ASC']],
      });
      if (remindersMadeByInteractionUser.length === 0) {
        return interaction.reply({
          content: "You haven't set any reminders!",
          ephemeral: true,
        });
      }

      const previousButton = new MessageButton()
        .setCustomId('previousbtn')
        .setLabel('Previous')
        .setStyle('SECONDARY')
        .setEmoji('⏪');
      const deleteButton = new MessageButton()
        .setCustomId('deletebtn')
        .setLabel('Delete')
        .setStyle('DANGER')
        .setEmoji('🗑');
      const nextButton = new MessageButton()
        .setCustomId('nextbtn')
        .setLabel('Next')
        .setStyle('SECONDARY')
        .setEmoji('⏩');
      const buttonRow = new MessageActionRow().addComponents(
        previousButton,
        deleteButton,
        nextButton
      );

      const pages = [];
      let page = 0;

      remindersMadeByInteractionUser.forEach((reminder) => {
        const formatted = dayjs(reminder.scheduledTime).calendar(null, {
          sameDay: '[Today at] h:mm A',
          nextDay: '[Tomorrow at] h:mm A',
          nextWeek: 'dddd [at] h:mm A',
          lastDay: '[Yesterday at] h:mm A',
          lastWeek: '[Last] dddd [at] h:mm A',
          sameElse: 'DD/MM/YYYY',
        });
        const embed = new MessageEmbed()
          .setTitle(`⏰ ${interaction.user.username}'s Reminders ⏰`)
          .setThumbnail('https://c.tenor.com/FgiJeSZ3fE0AAAAC/sleep-anime.gif')
          .addField(formatted, `\`\`\`fix\n${reminder.message}\n\`\`\``);
        pages.push(embed);
      });

      if (interaction.deferred === false) {
        await interaction.deferReply();
      }

      const currentPage = await interaction.editReply({
        embeds: [
          pages[page].setFooter({
            text: `Entry ${page + 1} / ${pages.length}`,
          }),
        ],
        components: [buttonRow],
        fetchReply: true,
      });
      const filter = (i) =>
        i.user.id === interaction.user.id &&
        (i.customId === 'previousbtn' ||
          i.customId === 'deletebtn' ||
          i.customId === 'nextbtn');
      const collector = await currentPage.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on('collect', async (i) => {
        const { timeoutId } = remindersMadeByInteractionUser[page];
        switch (i.customId) {
          case 'previousbtn':
            page = page > 0 ? (page -= 1) : pages.length - 1;
            break;
          case 'nextbtn':
            page = page + 1 < pages.length ? (page += 1) : 0;
            break;
          case 'deletebtn':
            if (pages.length === 0) {
              break;
            }
            clearTimeout(reminderTimeouts[timeoutId]);
            Reminder.destroy({
              where: {
                timeoutId,
              },
            });
            remindersMadeByInteractionUser.splice(page, 1);
            pages.splice(page, 1);

            if (page === pages.length) {
              page -= 1;
            }
            break;
          default:
            break;
        }
        await i.deferUpdate();
        if (pages.length > 0) {
          await i.editReply({
            embeds: [
              pages[page].setFooter({
                text: `Entry ${page + 1} / ${pages.length}`,
              }),
            ],
            components: [buttonRow],
          });
          collector.resetTimer();
        } else {
          const noReminders = new MessageEmbed().setDescription(
            "You've deleted all your reminders!"
          );
          await i.editReply({
            embeds: [noReminders],
            components: [],
          });
        }
      });

      collector.on('end', (_, reason) => {
        if (pages.length > 0 && reason === 'time') {
          const disabledRow = new MessageActionRow().addComponents(
            previousButton.setDisabled(true),
            deleteButton.setDisabled(true),
            nextButton.setDisabled(true)
          );
          currentPage.edit({
            embeds: [
              pages[page].setFooter({
                text: `Entry ${page + 1} / ${pages.length}`,
              }),
            ],
            components: [disabledRow],
          });
        }
      });

      return currentPage;
    }
    return interaction.reply('No such subcommand!');
  },
};
