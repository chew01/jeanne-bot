const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const { checkMafiosoStatus, checkWinCondition } = require('../data/mafville');

module.exports = {
  name: 'mafgallows',
  once: false,
  async execute(
    client,
    playerObjects,
    gameChannel,
    mafChannel,
    dayCount,
    votesSoFar,
    accused
  ) {
    // Send phase start message with buttons for judging inno/guilty/abstain
    let phaseCountdown = 25;
    const gallowsEmbed = new MessageEmbed()
      .setTitle(`Current Phase: Day ${dayCount} Judgment`)
      .setDescription(
        'Living players can speak. You may judge whether the accused is innocent or guilty.\nIf there are more guilty votes than innocent votes, the accused will be hanged.'
      )
      .addFields(
        { name: 'Accused', value: `${accused}`, inline: true },
        {
          name: 'Votes will be counted in:',
          value: `${phaseCountdown} seconds`,
          inline: true,
        }
      );
    const judgmentRow = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('guilty')
        .setLabel('Guilty')
        .setEmoji('😈')
        .setStyle('DANGER'),
      new MessageButton()
        .setCustomId('abstain')
        .setLabel('Abstain')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId('innocent')
        .setLabel('Innocent')
        .setEmoji('👼')
        .setStyle('SUCCESS')
    );
    const gallowsMessage = await gameChannel.send({
      embeds: [gallowsEmbed],
      components: [judgmentRow],
    });

    // Create collector for judgment buttons, time out in 25 seconds
    const judgments = {};
    const judgmentFilter = (i) =>
      i.customId === 'guilty' ||
      i.customId === 'abstain' ||
      i.customId === 'innocent';
    const judgmentCollector = gallowsMessage.createMessageComponentCollector({
      judgmentFilter,
      time: 25000,
    });

    // On collect, return error msg if interaction initiated by accused/dead player, otherwise add into judgment object
    judgmentCollector.on('collect', async (i) => {
      if (i.user === accused) {
        return i.reply({ content: 'You are on the stand!', ephemeral: true });
      }
      if (
        _.find(playerObjects, (playerObj) => playerObj.user === i.user).isDead
      ) {
        return i.reply({ content: 'You are already dead!', ephemeral: true });
      }
      judgments[i.user.id] = i.customId;
      return i.reply({
        content: `You have chosen "${i.customId}".`,
        ephemeral: true,
      });
    });

    // On timeout, filter through player objects that are not accused/dead. For each user, sort their votes and push into an array. No vote = abstain = pushed into array as 'abstain'
    judgmentCollector.on('end', async (collected, reason) => {
      if (reason === 'time') {
        const selectionArray = [];
        let selectionString = '';
        playerObjects
          .filter((playerObj) => playerObj.user !== accused)
          .filter((playerObj) => !playerObj.isDead)
          .forEach((playerObj) => {
            const selection = judgments[playerObj.user.id];
            switch (selection) {
              case 'guilty':
                selectionArray.push('guilty');
                selectionString += `${playerObj.user} voted **Guilty.**\n`;
                break;
              case 'innocent':
                selectionArray.push('innocent');
                selectionString += `${playerObj.user} voted **Innocent.**\n`;
                break;
              default:
                selectionArray.push('abstain');
                selectionString += `${playerObj.user} chose to **Abstain.**\n`;
                break;
            }
          });
        // Count guilties and innocents
        const guiltyCount = selectionArray.filter(
          (selection) => selection === 'guilty'
        ).length;
        const innocentCount = selectionArray.filter(
          (selection) => selection === 'innocent'
        ).length;
        const guiltyEmbed = new MessageEmbed()
          .setTitle('The accused has been hanged!')
          .setDescription(
            `The accused, ${accused}, has been deemed guilty by ${guiltyCount} Guilty against ${innocentCount} Innocent.`
          )
          .addFields({ name: '\u200B', value: selectionString || 'N/A' });
        const innocentEmbed = new MessageEmbed()
          .setTitle('The accused walks off the gallows!')
          .setDescription(
            `The accused, ${accused}, has been deemed innocent by ${innocentCount} Innocent against ${guiltyCount} Guilty.`
          )
          .addFields({ name: '\u200B', value: selectionString || 'N/A' });
        const accusedPlayerObj = _.find(
          playerObjects,
          (playerObj) => playerObj.user === accused
        );
        // If more guilties than innocents, set accused player object isDead to true, and send guilty verdict embed. Wait 5 seconds before emitting night phase event
        if (guiltyCount > innocentCount) {
          accusedPlayerObj.isDead = true;
          gameChannel.send({ embeds: [guiltyEmbed] });
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

          setTimeout(() => {
            client.emit(
              'mafnight',
              client,
              playerObjects,
              gameChannel,
              mafChannel,
              dayCount
            );
          }, 5000);
        }
        // If less guilties or tie, send innocent verdict embed and wait 5 seconds before emitting vote event
        if (guiltyCount <= innocentCount) {
          gameChannel.send({ embeds: [innocentEmbed] });
          setTimeout(() => {
            client.emit(
              'mafvote',
              client,
              playerObjects,
              gameChannel,
              mafChannel,
              dayCount,
              votesSoFar
            );
          }, 5000);
        }
      }
    });

    // Set interval to countdown 25 seconds, with 5 seconds interval in updating embed
    const phaseCountdownInterval = setInterval(async () => {
      if (phaseCountdown > 0) {
        phaseCountdown -= 5;
        await gallowsMessage.edit({
          embeds: [
            gallowsEmbed.setFields(
              { name: 'Accused', value: `${accused}`, inline: true },
              {
                name: 'Votes will be counted in:',
                value: `${phaseCountdown} seconds`,
                inline: true,
              }
            ),
          ],
        });
      }
      if (phaseCountdown === 0) {
        clearInterval(phaseCountdownInterval);
        gallowsMessage.edit({ embeds: [gallowsEmbed], components: [] });
      }
    }, 5000);
  },
};
