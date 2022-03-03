const { MessageEmbed } = require('discord.js');
const { mafiaRoles } = require('../data/mafville');

module.exports = {
  name: 'mafday',
  once: false,
  async execute(client, playerObjects, gameChannel, mafChannel, dayCount) {
    // Enable all living players to talk in game channel
    playerObjects
      .filter((playerObj) => !playerObj.isDead)
      .forEach((user) => {
        gameChannel.permissionOverwrites.edit(user.user.id, {
          SEND_MESSAGES: true,
        });
      });
    // Disable all mafia talk in mafia channel
    playerObjects
      .filter((playerObj) => mafiaRoles.includes(playerObj.role))
      .forEach((user) =>
        mafChannel.permissionOverwrites.edit(user.user.id, {
          SEND_MESSAGES: false,
        })
      );

    // Get list of dead players and role
    let deadPlayers = '';
    let deadRoles = '';
    playerObjects.forEach((playerObj) => {
      if (playerObj.isDead) {
        deadPlayers += `${playerObj.user}\n`;
        deadRoles += `${playerObj.role}\n`;
      }
    });

    // Send phase start message
    let phaseCountdown = 45;
    const dayEmbed = new MessageEmbed()
      .setTitle(`Current Phase: Day ${dayCount} Discussion`)
      .setDescription(
        'Living players can speak. Voting will begin after discussion phase.'
      )
      .addFields(
        { name: 'Deaths', value: deadPlayers || 'N/A', inline: true },
        { name: 'Roles', value: deadRoles || 'N/A', inline: true },
        {
          name: 'Voting phase starts in:',
          value: `${phaseCountdown} seconds`,
          inline: true,
        }
      );
    const dayMessage = await gameChannel.send({ embeds: [dayEmbed] });

    // Set Interval to countdown 45 seconds to start of voting phase
    const phaseCountdownInterval = setInterval(async () => {
      if (phaseCountdown > 0) {
        phaseCountdown -= 5;
        await dayMessage.edit({
          embeds: [
            dayEmbed.setFields(
              { name: 'Deaths', value: deadPlayers || 'N/A', inline: true },
              { name: 'Roles', value: deadRoles || 'N/A', inline: true },
              {
                name: 'Voting will start in:',
                value: `${phaseCountdown} seconds`,
                inline: true,
              }
            ),
          ],
        });
      }
      // Upon countdown end, clear interval and emit Voting event
      if (phaseCountdown === 0) {
        clearInterval(phaseCountdownInterval);
        client.emit(
          'mafvote',
          client,
          playerObjects,
          gameChannel,
          mafChannel,
          dayCount,
          0
        );
      }
    }, 5000);
  },
};
