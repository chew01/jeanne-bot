const { MessageEmbed } = require('discord.js');

module.exports = {
  name: 'mafday1',
  once: false,
  async execute(client, users, gameChannel, mafChannel) {
    const dayCount = 1;
    let roleString = '';
    users.forEach((user) => {
      roleString += `${user.role}\n`;
      gameChannel.permissionOverwrites.edit(user.user.id, {
        SEND_MESSAGES: true,
      });
    });

    let phaseCountdown = 15;
    const day1Embed = new MessageEmbed()
      .setTitle(`Current Phase: Day ${dayCount}`)
      .setDescription('Everyone can speak. No voting can be done today.')
      .addFields(
        { name: 'Roles', value: roleString, inline: true },
        {
          name: 'Night will fall in:',
          value: `${phaseCountdown} seconds`,
          inline: true,
        }
      );

    const day1Message = await gameChannel.send({ embeds: [day1Embed] });

    const phaseCountdownInterval = setInterval(async () => {
      if (phaseCountdown > 0) {
        phaseCountdown -= 5;
        await day1Message.edit({
          embeds: [
            day1Embed.setFields(
              { name: 'Roles', value: roleString, inline: true },
              {
                name: 'Night will fall in:',
                value: `${phaseCountdown} seconds`,
                inline: true,
              }
            ),
          ],
        });
      }
      if (phaseCountdown === 0) {
        clearInterval(phaseCountdownInterval);
        client.emit(
          'mafnight',
          client,
          users,
          gameChannel,
          mafChannel,
          dayCount
        );
      }
    }, 5000);
  },
};
