const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  Permissions,
} = require('discord.js');
const _ = require('lodash');
const randomstring = require('randomstring');
const {
  townRoleList,
  mafiaRoleList,
  mafvilleRoleMenu,
  mafvilleRoles,
} = require('../data/mafvilleroles');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mv')
    .setDescription('Access MafVille commands.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('help')
        .setDescription(
          'Shows basic information about how the MafVille game works.'
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('start')
        .setDescription(
          'Start a game of MafVille with the specified number of players.'
        )
        .addIntegerOption((option) =>
          option
            .setName('players')
            .setDescription('Number of players (7-10) playing the game.')
            .setMinValue(7)
            .setMaxValue(10)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('roles')
        .setDescription(
          'Shows information about roles currently available in MafVille.'
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'help') {
      const helpEmbed = new MessageEmbed()
        .setTitle('🤠 MafVille - Game Manual 📒')
        .setDescription(
          'MafVille is an experimental social deduction game based on Mafia.'
        )
        .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
        .addFields(
          {
            name: '⚖️ Alignment',
            value:
              'Players of the game are split into two alignments: **Town** and **Mafia**.\n\n🤠 The __Town__ seeks to eliminate all evildoers.\n🕵️ The __Mafia__ seeks to kill everyone who stands in their way.',
          },
          {
            name: '📜 Roles',
            value:
              'Roles may have useful actions that allow one to aid their team, by providing valuable information or killing another player.\n\nAs of the current version, there are 5 roles available.\nUse the `/mv roles` command to find out more.',
          },
          {
            name: '🕑 Phases',
            value:
              'Each game takes place over a number of phases:\n\n☀️ __**Day Phases:**__ Each day is split into the following phases:\n\n1️⃣ __Discussion Phase__ (45 seconds) for living players to discuss.\n2️⃣ __Voting Phase__ (30 seconds) for living players to vote on suspects for lynching.\n3️⃣ __Judgment Phase__ (25 seconds) for players to discuss and decide on the fate of an accused player.\n(If a suspect is deemed innocent, the game will return to voting phase if __less than 3 players__ have been voted up.)\n\n🌙 __**Night Phase**__ (30 seconds) for players with Night Actions to perform their actions. Only Mafia may talk, in their own Mafia channel.',
          }
        )
        .setFooter({
          text: 'Current version: Beta v1.0 (Last updated on 3 March 2022)',
        });

      interaction.reply({ embeds: [helpEmbed] });
    }
    if (subcommand === 'start') {
      const playerCount = interaction.options.getInteger('players');
      const players = [];
      let timer = 60;
      let playerString = 'N/A';

      const embed = new MessageEmbed()
        .setTitle(
          `🤠 MafVille - New Game (${players.length}/${playerCount} players)`
        )
        .setDescription(`Game starting in ${timer} seconds...`)
        .addFields({ name: 'Players', value: playerString });

      const joinButton = new MessageButton()
        .setCustomId('join')
        .setLabel('Join')
        .setEmoji('🤠')
        .setStyle('SUCCESS');
      const leaveButton = new MessageButton()
        .setCustomId('leave')
        .setLabel('Leave')
        .setEmoji('🚪')
        .setStyle('DANGER');
      const startButton = new MessageButton()
        .setCustomId('forcestart')
        .setLabel('Start game')
        .setEmoji('⏩')
        .setStyle('SECONDARY');
      const row = new MessageActionRow().addComponents(joinButton, leaveButton);

      if (interaction.deferred === false) {
        await interaction.deferReply();
      }

      const lobby = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      const timerUpdater = setInterval(async () => {
        if (timer > 5) {
          timer -= 5;
          await interaction.editReply({
            embeds: [
              embed.setDescription(`Game starting in ${timer} seconds...`),
            ],
            components: [row],
          });
        }
      }, 5000);

      const filter = (i) =>
        i.customId === 'join' ||
        i.customId === 'leave' ||
        i.customId === 'forcestart';

      const collector = await lobby.createMessageComponentCollector({
        filter,
        time: 60000,
      });

      collector.on('collect', async (i) => {
        if (
          i.customId === 'join' &&
          !players.includes(i.user) &&
          players.length < playerCount
        ) {
          players.push(i.user);
          playerString = players.toString().replaceAll(',', '\n');
        }
        if (
          i.customId === 'leave' &&
          players.includes(i.user) &&
          players.length > 0
        ) {
          _.remove(players, (u) => u === i.user);
          playerString = players.toString().replaceAll(',', '\n');
        }
        if (i.customId === 'forcestart' && players.length === playerCount) {
          collector.stop();
        }
        if (players.length === 0) {
          playerString = 'N/A';
        }
        if (players.length < playerCount) {
          await i.deferUpdate();
          await i.editReply({
            embeds: [
              embed
                .setTitle(
                  `🤠 MafVille - New Game (${players.length}/${playerCount} players)`
                )
                .setFields({ name: 'Players', value: playerString }),
            ],
            components: [
              row.setComponents(joinButton.setDisabled(false), leaveButton),
            ],
          });
        }
        if (players.length === playerCount) {
          await i.deferUpdate();
          await i.editReply({
            embeds: [
              embed
                .setTitle(
                  `🤠 MafVille - New Game (${players.length}/${playerCount} players)`
                )
                .setFields({ name: 'Players', value: playerString }),
            ],
            components: [
              row.setComponents(
                joinButton.setDisabled(true),
                leaveButton,
                startButton
              ),
            ],
          });
        }
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' || reason === 'user') {
          clearInterval(timerUpdater);
          if (players.length < playerCount) {
            const endEmbed = new MessageEmbed()
              .setTitle('Insufficient players to start game.')
              .setDescription(
                'Game will be terminated. Type `/mv start` to start a new game!'
              );
            lobby.edit({ embeds: [endEmbed], components: [] });
          }
          if (players.length === playerCount) {
            const channelId = randomstring.generate(6);
            const gameChannel = await interaction.guild.channels.create(
              `MafVille Room #${channelId}`,
              {
                permissionOverwrites: [
                  {
                    id: interaction.guild.id,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL],
                  },
                  {
                    id: interaction.client.user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                  },
                ],
              }
            );
            const mafChannel = await interaction.guild.channels.create(
              `MafVille Mafia #${channelId}`,
              {
                permissionOverwrites: [
                  {
                    id: interaction.guild.id,
                    deny: [Permissions.FLAGS.VIEW_CHANNEL],
                  },
                  {
                    id: interaction.client.user.id,
                    allow: [Permissions.FLAGS.VIEW_CHANNEL],
                  },
                ],
              }
            );
            players.forEach((player) => {
              gameChannel.permissionOverwrites.edit(player.id, {
                VIEW_CHANNEL: true,
                CREATE_INSTANT_INVITE: false,
                CREATE_PUBLIC_THREADS: false,
                CREATE_PRIVATE_THREADS: false,
                EMBED_LINKS: false,
                ATTACH_FILES: false,
                ADD_REACTIONS: false,
                MANAGE_MESSAGES: false,
              });
            });

            const redirectEmbed = new MessageEmbed()
              .setTitle('🤠 Game ready!')
              .setDescription(
                `Join the game channel: ${gameChannel} (registered players only)`
              );

            interaction.client.emit(
              'mafinit',
              interaction.client,
              players,
              gameChannel,
              mafChannel
            );
            lobby.edit({ embeds: [redirectEmbed], components: [] });
          }
        }
      });
    }
    if (subcommand === 'roles') {
      if (interaction.deferred === false) {
        await interaction.deferReply();
      }

      const currentPage = await interaction.editReply({
        embeds: [mafvilleRoles.Roster],
        components: [new MessageActionRow().addComponents(mafvilleRoleMenu)],
      });

      const filter = (i) =>
        i.user.id === interaction.user.id && i.isSelectMenu();
      const collector = await currentPage.createMessageComponentCollector({
        filter,
        time: 30000,
      });

      collector.on('collect', async (i) => {
        await i.deferUpdate();
        await i.editReply({
          embeds: [
            mafvilleRoles[i.values[0]].setFooter({
              text: 'Current version: Beta v1.0 (Last updated on 3 March 2022)',
            }),
          ],
        });
        collector.resetTimer();
      });

      collector.on('end', (__, reason) => {
        if (reason === 'time') {
          currentPage.edit({
            components: [
              new MessageActionRow().addComponents(
                mafvilleRoleMenu
                  .setPlaceholder('Help command expired')
                  .setDisabled(true)
              ),
            ],
          });
        }
      });
    }
  },
};
