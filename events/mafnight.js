const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const { mafiaRoles, getNightAction } = require('../data/mafville');

module.exports = {
  name: 'mafnight',
  once: false,
  async execute(client, users, gameChannel, mafChannel, dayCount) {
    let phaseCountdown = 35;
    const nightEmbed = new MessageEmbed()
      .setTitle(`Current Phase: Night ${dayCount}`)
      .setDescription(
        'Nobody can speak in Town. Mafia can speak in their own channel.\nPlayers with night actions can use them.'
      )
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

    users.forEach((user) => {
      gameChannel.permissionOverwrites.edit(user.user.id, {
        SEND_MESSAGES: false,
      });

      if (mafiaRoles.includes(user.role)) {
        mafChannel.permissionOverwrites.edit(user.user.id, {
          SEND_MESSAGES: true,
        });
      }
    });

    const actions = [];
    const nightMessageFilter = (i) => i.customId === 'opennightaction';

    const nightMessageCollector = nightMessage.createMessageComponentCollector({
      nightMessageFilter,
      time: 35000,
    });

    nightMessageCollector.on('collect', async (i) => {
      const playerObj = _.find(users, (user) => user.user === i.user);
      const nightActionRow = getNightAction(users, playerObj.role, i.user);

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

        const nightActionCollector =
          nightActionReply.createMessageComponentCollector({ max: 1 });

        nightActionCollector.on('collect', async (inte) => {
          const action = {
            playerObj,
            values: inte.values,
          };

          actions.push(action);

          i.editReply({
            content: `You have chosen to target <@${inte.values[0]} tonight.`,
          });
        });
      }
    });

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
      if (phaseCountdown === 0) {
        clearInterval(phaseCountdownInterval);
        client.emit(
          'maflogic',
          client,
          users,
          gameChannel,
          mafChannel,
          dayCount,
          actions
        );
      }
    }, 5000);
  },
};
