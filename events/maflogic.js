/* eslint-disable no-param-reassign */
const { MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const {
  movingRoles,
  checkMafiosoStatus,
  checkWinCondition,
} = require('../data/mafville');

module.exports = {
  name: 'maflogic',
  once: false,
  async execute(
    client,
    playerObjects,
    gameChannel,
    mafChannel,
    dayCount,
    actionsObj
  ) {
    const actions = Object.values(actionsObj);
    const successfulAttacks = {};
    // Resolve movements
    actions.forEach((action) => {
      const actingRole = action.playerObj.role;
      if (
        movingRoles.includes(actingRole) &&
        action.targets[0] !== action.playerObj.user.id
      ) {
        const visitedPlayer = _.find(
          playerObjects,
          (playerObj) => playerObj.user.id === action.targets[0]
        );
        visitedPlayer.visitedBy.push(action.playerObj.user.id);
      }
    });

    // Veteran (if alert, decrease number of alerts remaining, defense lv1 for one night, deals attack lv2 to all visitors)
    actions.forEach((action) => {
      if (
        action.playerObj.role === 'Veteran' &&
        !action.playerObj.isDead &&
        action.targets[0] === 'alert'
      ) {
        action.playerObj.alertLeft -= 1;
        action.playerObj.defense = 1; // Veteran defense lv1
        const visitors = action.playerObj.visitedBy;
        visitors.forEach((visitor) => {
          const visitorPlayerObj = _.find(
            playerObjects,
            (playerObj) => playerObj.user.id === visitor
          );
          if (visitorPlayerObj.defense < 2) {
            visitorPlayerObj.isDead = true; // Kills visitors below defense lv 2
            visitorPlayerObj.nightResults += 'You were killed by a Veteran!\n';
            action.playerObj.nightResults += 'You attacked a visitor!';
            if (successfulAttacks[visitorPlayerObj.user.id]) {
              successfulAttacks[visitorPlayerObj.user.id].push('Veteran');
            } else {
              successfulAttacks[visitorPlayerObj.user.id] = ['Veteran'];
            }
          }
        });
      }
    });

    // Framer (set isSuspicious of target to true for one night)
    actions.forEach((action) => {
      if (action.playerObj.role === 'Framer' && !action.playerObj.isDead) {
        const targetId = action.targets[0];
        const targetPlayerObj = _.find(
          playerObjects,
          (playerObj) => playerObj.user.id === targetId
        );
        targetPlayerObj.isSuspicious = true;
      }
    });

    // Sheriff (checks isSuspicious of target)
    actions.forEach((action) => {
      if (action.playerObj.role === 'Sheriff' && !action.playerObj.isDead) {
        const targetId = action.targets[0];
        const targetPlayerObj = _.find(
          playerObjects,
          (playerObj) => playerObj.user.id === targetId
        );
        if (targetPlayerObj.isSuspicious) {
          action.playerObj.nightResults += 'Your target is suspicious!\n';
        } else {
          action.playerObj.nightResults += 'Your target is not suspicious.\n';
        }
      }
    });

    // Mafioso (deals attack lv 1 to target)
    actions.forEach((action) => {
      if (action.playerObj.role === 'Mafioso' && !action.playerObj.isDead) {
        const targetId = action.targets[0];
        const targetPlayerObj = _.find(
          playerObjects,
          (playerObj) => playerObj.user.id === targetId
        );
        if (targetPlayerObj.defense < 1) {
          targetPlayerObj.isDead = true;
          targetPlayerObj.nightResults +=
            'You were killed by a member of the Mafia!\n';
          action.playerObj.nightResults += 'You killed your target.\n';
        }
        if (successfulAttacks[targetPlayerObj.user.id]) {
          successfulAttacks[targetPlayerObj.user.id].push('Mafioso');
        } else {
          successfulAttacks[targetPlayerObj.user.id] = ['Mafioso'];
        }
      }
    });

    // Night result button
    const nightResultRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('nightresult')
        .setLabel('Get night messages')
        .setEmoji('📰')
        .setStyle('PRIMARY')
    );
    const nightResultMessage = await gameChannel.send({
      components: [nightResultRow],
    });

    // Create collector for night result button, with user limit based on number of players in the game
    const nightResultFilter = (i) => i.customId === 'nightresult';
    const nightResultCollector =
      nightResultMessage.createMessageComponentCollector({
        nightResultFilter,
        maxUsers: playerObjects.length,
      });

    // On collect, send ephemeral message with night results (if applicable)
    nightResultCollector.on('collect', async (i) => {
      const collectedPlayerObj = _.find(
        playerObjects,
        (playerObj) => playerObj.user === i.user
      );
      if (collectedPlayerObj.nightResults) {
        i.reply({ content: collectedPlayerObj.nightResults, ephemeral: true });
      } else {
        i.reply({ content: 'You had no results last night.', ephemeral: true });
      }
    });

    // Send public night results (death messages and last wills)
    let publicNightResults = '';
    const successfulAttackEntries = Object.entries(successfulAttacks);
    successfulAttackEntries.forEach((successfulAttack) => {
      publicNightResults += `<@${successfulAttack[0]}> died last night. They were killed by ${successfulAttack[1]}.\n`;
    });
    if (!publicNightResults) {
      publicNightResults = 'Nothing happened last night.';
    }
    await gameChannel.send({ content: publicNightResults });

    await checkMafiosoStatus(playerObjects, mafChannel);
    const winCondition = checkWinCondition(playerObjects);
    if (winCondition === 'mafia') {
      return client.emit(
        'mafgameover',
        client,
        playerObjects,
        gameChannel,
        mafChannel,
        'mafia'
      );
    }
    if (winCondition === 'town') {
      return client.emit(
        'mafgameover',
        client,
        playerObjects,
        gameChannel,
        mafChannel,
        'town'
      );
    }

    // Emit day event after 5 seconds wait
    return setTimeout(() => {
      client.emit(
        'mafday',
        client,
        playerObjects,
        gameChannel,
        mafChannel,
        dayCount + 1
      );
    }, 5000);
  },
};
