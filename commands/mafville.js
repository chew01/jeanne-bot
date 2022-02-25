const { SlashCommandBuilder } = require('@discordjs/builders');
const {
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  Permissions,
} = require('discord.js');
const _ = require('lodash');
const randomstring = require('randomstring');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mv')
    .setDescription('Access MafVille commands.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('start')
        .setDescription(
          'Start a game of MafVille in this channel with a specified number of players.'
        )
        .addIntegerOption((option) =>
          option
            .setName('players')
            .setDescription('Number of players (7-15) playing the game.')
            // .setMinValue(7)
            // .setMaxValue(15)
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
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
  },
};
