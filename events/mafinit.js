const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const _ = require('lodash');
const { getRoles, mafiaRoles, initializeRole } = require('../data/mafville');

module.exports = {
  name: 'mafinit',
  once: false,
  async execute(client, players, gameChannel, mafChannel) {
    let acknowledged = 0;
    const roles = getRoles();
    const users = [];

    let count = 0;
    players.forEach((user) => {
      const playerObj = initializeRole(user, roles[count]);
      users.push(playerObj);
      count += 1;
    });

    const confirmEmbed = new MessageEmbed()
      .setTitle('🤠 Welcome to MafVille (beta v1.0)')
      .addField(
        'Press the button below to get your role!',
        `Number of confirmed players: ${acknowledged}/${players.length}`
      );
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId('getrole')
        .setLabel('Get my role!')
        .setEmoji('📜')
        .setStyle('PRIMARY')
    );
    const confirmation = await gameChannel.send({
      embeds: [confirmEmbed],
      components: [row],
    });

    const confirmationFilter = (i) =>
      players.includes(i.user) && i.customId === 'getrole';
    const confirmationCollector =
      await confirmation.createMessageComponentCollector({
        confirmationFilter,
        maxUsers: players.length,
      });

    confirmationCollector.on('collect', async (i) => {
      const user = _.find(users, { user: i.user });
      const { role } = user;
      acknowledged += 1;

      if (mafiaRoles.includes(role)) {
        mafChannel.permissionOverwrites.edit(i.user.id, {
          VIEW_CHANNEL: true,
          CREATE_INSTANT_INVITE: false,
          CREATE_PUBLIC_THREADS: false,
          CREATE_PRIVATE_THREADS: false,
          EMBED_LINKS: false,
          ATTACH_FILES: false,
          ADD_REACTIONS: false,
          MANAGE_MESSAGES: false,
          SEND_MESSAGES: false,
        });
      }
      if (acknowledged < players.length) {
        await confirmation.edit({
          embeds: [
            confirmEmbed.setFields({
              name: 'Press the button below to get your role!',
              value: `Number of confirmed players: ${acknowledged}/${players.length}`,
            }),
          ],
        });
      }

      i.reply({ content: `Your role is ${role}.`, ephemeral: true });
    });

    confirmationCollector.on('end', async (collected, reason) => {
      if (reason === 'userLimit') {
        await confirmation.delete();
        let mafiaUserString = 'N/A';
        let mafiaRoleString = 'N/A';

        const mafiaUsers = _.filter(users, (user) =>
          mafiaRoles.includes(user.role)
        );
        mafiaUsers.forEach((user) => {
          mafiaUserString = '';
          mafiaRoleString = '';
          mafiaUserString += `${user.user}\n`;
          mafiaRoleString += `${user.role}\n`;
        });

        const mafiaEmbed = new MessageEmbed()
          .setTitle('🎩 Welcome to the mafia.')
          .setDescription(
            'Your goal is to kill anyone who will not submit to the Mafia (e.g. Town).\nYou will only be able to talk in this channel at night.'
          )
          .addFields(
            { name: 'Player', value: mafiaUserString, inline: true },
            { name: 'Role', value: mafiaRoleString, inline: true }
          );
        await mafChannel.send({ embeds: [mafiaEmbed] });
        client.emit('mafday1', client, users, gameChannel, mafChannel);
      }
    });
  },
};
