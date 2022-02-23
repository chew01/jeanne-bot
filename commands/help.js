const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Help command to navigate the bot.'),
  async execute(interaction) {
    const mainPage = new MessageEmbed()
      .setAuthor({
        name: "Jeanne's Commands",
        iconURL: 'https://i.imgur.com/RtX8ezH.jpeg',
      })
      .setDescription('Choose a category below for more help!')
      .setFields(
        { name: '🔖 General Commands', value: '`whisper`' },
        { name: '⏰ Reminders', value: '`set` `list`' },
        {
          name: '🎲 TOTO',
          value: '`info` `ticket` `quickpick` `me` `schedule` `forcedraw`',
        }
      )
      .setFooter({
        text: 'This help command will expire in 30 seconds without interaction!',
      });

    const general = new MessageEmbed()
      .setTitle('🔖 General Commands')
      .addFields({
        name: 'whisper',
        value:
          '**/whisper**\n\nWhispers to another user without DM-ing them. Other users will be able to see that you whispered, but will not be able to access the message.\n\nUsage:\n`/whisper <@user> <message>`',
        inline: true,
      })
      .setFooter({
        text: 'This help command will expire in 30 seconds without interaction!',
      });

    const reminder = new MessageEmbed()
      .setTitle('⏰ Reminders')
      .addFields(
        {
          name: 'set',
          value:
            '**/reminder set**\n\nSets a reminder with a specified time and message. You will be pinged in the same channel.\n\nUsage:\n`/reminder set <message>`\n`<time> (24h format)`\n`<date> (optional, DD/MM/YY format)`',
          inline: true,
        },
        {
          name: 'list',
          value:
            '**/reminder list**\n\nLists all the reminders you have set. You can delete reminders from the list.\n\nUsage:\n`/reminder list`',
          inline: true,
        }
      )
      .setFooter({
        text: 'This help command will expire in 30 seconds without interaction!',
      });

    const toto = new MessageEmbed()
      .setTitle('🎲 TOTO')
      .addFields(
        {
          name: 'info',
          value:
            '**/toto info**\n\nShows statistics about previous and scheduled TOTO draws in this server.\n\nUsage:\n`/toto info`',
          inline: true,
        },
        {
          name: 'ticket',
          value:
            '**/toto ticket**\n\nPick 6 numbers from 1 to 49 to create a TOTO ticket for the next draw in this server.\n\nUsage:\n`/toto ticket`\n`<6 numbers> (separated by space)`',
          inline: true,
        },
        {
          name: 'quickpick',
          value:
            '**/toto quickpick**\n\nLet the system pick 6 numbers for your TOTO ticket in this server.\n\nUsage:\n`/toto quickpick`',
          inline: true,
        },
        {
          name: 'me',
          value:
            '**/toto me**\n\nShows your current TOTO ticket in this server.\n\nUsage:\n`/toto me`',
          inline: true,
        },
        {
          name: 'schedule',
          value:
            '**/toto schedule**\n\nSchedules a TOTO draw in this server.\n\nUsage:\n`/toto schedule`\n`<time> (24h format)`\n`<date> (optional, DD/MM/YY format)`',
          inline: true,
        },
        {
          name: 'forcedraw',
          value:
            '**/toto forcedraw**\n\nForces a TOTO draw to be conducted in this server.\n\nUsage:\n`/toto forcedraw`',
          inline: true,
        }
      )
      .setFooter({
        text: 'This help command will expire in 30 seconds without interaction!',
      });

    const menu = new MessageSelectMenu()
      .setCustomId('select')
      .setPlaceholder('Choose a category')
      .addOptions([
        { label: '🔖 General Commands', value: 'general' },
        { label: '⏰ Reminders', value: 'reminder' },
        { label: '🎲 TOTO', value: 'toto' },
      ]);

    const gallery = { general, reminder, toto };

    if (interaction.deferred === false) {
      await interaction.deferReply();
    }

    const currentPage = await interaction.editReply({
      embeds: [mainPage],
      components: [new MessageActionRow().addComponents(menu)],
    });

    const filter = (i) => i.user.id === interaction.user.id && i.isSelectMenu();
    const collector = await currentPage.createMessageComponentCollector({
      filter,
      time: 30000,
    });

    collector.on('collect', async (i) => {
      await i.deferUpdate();
      await i.editReply({ embeds: [gallery[i.values[0]]] });
      collector.resetTimer();
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        currentPage.edit({
          components: [
            new MessageActionRow().addComponents(
              menu.setPlaceholder('Help command expired').setDisabled(true)
            ),
          ],
        });
      }
    });
  },
};
