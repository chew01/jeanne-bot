const { MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const { movingRoles, mafiaRoles } = require('../data/mafville');

module.exports = {
  name: 'maflogic',
  once: false,
  async execute(
    client,
    playerObjects,
    gameChannel,
    mafChannel,
    dayCount,
    actions
  ) {
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
            _.set(successfulAttacks, visitorPlayerObj.user.id, ['Veteran']);
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
          action.playerObj.nightResults += 'Your target is suspicious!';
        } else {
          action.playerObj.nightResults += 'Your target is not suspicious.';
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
        }
        _.set(successfulAttacks, targetPlayerObj.user.id, ['Veteran']);
      }
    });

    // If there are no more mafioso alive, turn a random mafia into mafioso. Notify mafia channel. If there are no more mafia members, trigger game over event.
    /*
    const mafiosoAlive = _.find(
      playerObjects,
      (playerObj) => playerObj.role === 'Mafioso' && !playerObj.isDead
    );
    if (!mafiosoAlive) {
      const randomMafiaAlivePlayerObj = _.find(
        playerObjects,
        (playerObj) => mafiaRoles.includes(playerObj.role) && !playerObj.isDead
      );
      if (!randomMafiaAlivePlayerObj) {
        client.emit('gameover');
      }
      randomMafiaAlivePlayerObj.role = 'Mafioso';
      randomMafiaAlivePlayerObj.nightResults +=
        'Your mafioso has died, so you will take his place from now on.';
    }
    */

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
      const attackedPlayerObj = _.find(
        playerObjects,
        (playerObj) => playerObj.user.id === successfulAttack[0]
      );
      publicNightResults += `<@${successfulAttack[0]}> died last night. They were killed by ${successfulAttack[1]}. This was their last will: ${attackedPlayerObj.lastWill}`;
    });
    if (!publicNightResults) {
      publicNightResults = 'Nothing happened last night.';
    }
    await gameChannel.send({ content: publicNightResults });

    client.emit(
      'mafday',
      client,
      playerObjects,
      gameChannel,
      mafChannel,
      dayCount + 1
    );
  },
};
