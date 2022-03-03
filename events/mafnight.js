/* eslint-disable no-param-reassign */
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const {
  mafiaRoles,
  getNightAction,
  getNightActionVerb,
  getNightActionChangedVerb,
} = require('../data/mafville');

module.exports = {
  name: 'mafnight',
  once: false,
  async execute(client, playerObjects, gameChannel, mafChannel, dayCount) {
    // Reset changed status from last night (visitedBy, defense, isSuspicious)
    playerObjects.forEach((playerObj) => {
      if (!mafiaRoles.includes(playerObj.role)) {
        playerObj.isSuspicious = false;
      }
      playerObj.defense = 0;
      playerObj.visitedBy = [];
      playerObj.nightResults = '';
    });

    // Send phase start message with a button to get access to night action
    let phaseCountdown = 35;
    const nightEmbed = new MessageEmbed()
      .setTitle(`Current Phase: Night ${dayCount}`)
      .setDescription(
        'Nobody can speak in Town. Mafia can speak in their own channel.\nPlayers with night actions can use them.'
      )
      .setColor('#433b9c')
      .setThumbnail('https://freesvg.org/img/weather-few-clouds-night.png')
      .addFields({
        name: 'The sun will rise in:',
        value: `${phaseCountdown} seconds`,
      });
    const nightActionOpener = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('opennightaction')
        .setLabel('Perform night action')
        .setEmoji('🌙')
        .setStyle('PRIMARY')
    );
    const nightMessage = await gameChannel.send({
      embeds: [nightEmbed],
      components: [nightActionOpener],
    });

    // Remove all players permissions to talk in game channel, while enabling living mafia members to talk in mafia channel
    playerObjects.forEach((user) => {
      gameChannel.permissionOverwrites.edit(user.user.id, {
        SEND_MESSAGES: false,
      });

      if (mafiaRoles.includes(user.role) && !user.isDead) {
        mafChannel.permissionOverwrites.edit(user.user.id, {
          SEND_MESSAGES: true,
        });
      }
    });

    // Create collector for night action access button
    const nightMessageFilter = (i) => i.customId === 'opennightaction';
    const nightMessageCollector = nightMessage.createMessageComponentCollector({
      nightMessageFilter,
      time: 35000,
    });

    const actions = {};

    // On collect, get night action of the interacting user
    nightMessageCollector.on('collect', async (i) => {
      const playerObj = _.find(playerObjects, (user) => user.user === i.user);
      if (playerObj.isDead) {
        return i.reply({ content: 'You are already dead!', ephemeral: true });
      }
      const nightActionRow = getNightAction(
        playerObjects,
        playerObj.role,
        playerObj
      );

      if (!nightActionRow) {
        await i.reply({
          content: 'You have no night action, or have no eligible targets!',
          ephemeral: true,
        });
      } else {
        const nightActionReply = await i.reply({
          components: [nightActionRow],
          ephemeral: true,
          fetchReply: true,
        });

        // Create collector for night action, maximum 1 collect, time out in 35 seconds
        const nightActionCollector =
          nightActionReply.createMessageComponentCollector({
            max: 1,
            time: 35000,
          });

        // On collect, create action object with player object and selected target, if action already exists, replace it, else add the new action to actions array
        nightActionCollector.on('collect', async (inte) => {
          const existingAction = actions[inte.user.id];
          if (existingAction) {
            actions[inte.user.id] = { playerObj, targets: inte.values };
            i.editReply({
              content: getNightActionChangedVerb(
                playerObj.role,
                inte.values[0]
              ),
              components: [],
            });
          } else {
            actions[inte.user.id] = { playerObj, targets: inte.values };
            i.editReply({
              content: getNightActionVerb(playerObj.role, inte.values[0]),
              components: [],
            });
          }
        });
      }
    });

    nightMessageCollector.on('end', (collected, reason) => {
      if (reason === 'time') {
        nightMessage.edit({
          embeds: [
            nightEmbed.setFields({
              name: 'The sun will rise in:',
              value: `${phaseCountdown} seconds`,
            }),
          ],
          components: [],
        });
      }
    });

    // Set Interval to countdown 35 seconds to dawn, with interval of 5 seconds
    const phaseCountdownInterval = setInterval(async () => {
      if (phaseCountdown > 0) {
        phaseCountdown -= 5;
        await nightMessage.edit({
          embeds: [
            nightEmbed.setFields({
              name: 'The sun will rise in:',
              value: `${phaseCountdown} seconds`,
            }),
          ],
        });
      }
      // Upon countdown end, clear interval and emit Logic event
      if (phaseCountdown === 0) {
        clearInterval(phaseCountdownInterval);
        client.emit(
          'maflogic',
          client,
          playerObjects,
          gameChannel,
          mafChannel,
          dayCount,
          actions
        );
      }
    }, 5000);
  },
};
