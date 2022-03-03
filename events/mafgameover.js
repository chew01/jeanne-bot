const { MessageEmbed } = require('discord.js');
const { mafiaRoles } = require('../data/mafville');

module.exports = {
  name: 'mafgameover',
  once: false,
  async execute(client, playerObjects, gameChannel, mafChannel, winner) {
    await mafChannel.delete();
    playerObjects.forEach((user) => {
      gameChannel.permissionOverwrites.edit(user.user.id, {
        SEND_MESSAGES: true,
      });
    });

    const townMembers = playerObjects.filter(
      (playerObj) => !mafiaRoles.includes(playerObj.role)
    );
    const mafiaMembers = playerObjects.filter((playerObj) =>
      mafiaRoles.includes(playerObj.role)
    );
    let townString = '';
    let mafiaString = '';
    townMembers.forEach((member) => {
      townString += `${member.user}\n`;
    });
    mafiaMembers.forEach((member) => {
      mafiaString += `${member.user}\n`;
    });

    const townEmbed = new MessageEmbed()
      .setTitle('🤠 Town wins!')
      .setDescription('The town has eliminated all evil criminals!')
      .addFields({ name: 'Congratulations to:', value: townString || 'N/A' });
    const mafiaEmbed = new MessageEmbed()
      .setTitle('🕵️ Mafia wins!')
      .setDescription('The mafia has prevailed over all their enemies!')
      .addFields({ name: 'Congratulations to:', value: mafiaString || 'N/A' });

    if (winner === 'town') {
      return gameChannel.send({ embeds: [townEmbed] });
    }
    return gameChannel.send({ embeds: [mafiaEmbed] });
  },
};
