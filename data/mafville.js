const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const _ = require('lodash');

exports.getRoles = (playerCount) => {
  const roles = [
    'Sheriff',
    'Veteran',
    'Townie',
    'Townie',
    'Townie',
    'Mafioso',
    'Framer',
  ];
  const shuffledRoles = _.shuffle(roles);

  return shuffledRoles;
};

exports.mafiaRoles = ['Mafioso', 'Framer'];

exports.initializeRole = (user, role) => {
  if (role === 'Mafioso') {
    return {
      user,
      role,
      isDead: false,
      isSuspicious: true,
      defense: 0,
      visitedBy: [],
      attackedBy: [],
    };
  }
  if (role === 'Framer') {
    return {
      user,
      role,
      isDead: false,
      isSuspicious: true,
      defense: 0,
      visitedBy: [],
      attackedBy: [],
    };
  }
  if (role === 'Sheriff') {
    return {
      user,
      role,
      isDead: false,
      isSuspicious: false,
      defense: 0,
      visitedBy: [],
      attackedBy: [],
    };
  }
  if (role === 'Veteran') {
    return {
      user,
      role,
      isDead: false,
      isSuspicious: false,
      defense: 0,
      visitedBy: [],
      attackedBy: [],
      alertLeft: 1,
    };
  }
  if (role === 'Townie') {
    return {
      user,
      role,
      isDead: false,
      isSuspicious: false,
      defense: 0,
      visitedBy: [],
      attackedBy: [],
    };
  }

  return null;
};

exports.getNightAction = (users, role, playerActing) => {
  if (role === 'Mafioso') {
    const pickable = users
      .filter((user) => !this.mafiaRoles.includes(user.role) && !user.isDead)
      .map((user) => ({
        label: `${user.user.username}#${user.user.discriminator}`,
        value: user.user.id,
      }));
    if (pickable.length === 0) return null;
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(role)
        .setPlaceholder('Pick someone to kill.')
        .addOptions(pickable)
    );
    return row;
  }

  if (role === 'Framer') {
    const pickable = users
      .filter((user) => !this.mafiaRoles.includes(user.role) && !user.isDead)
      .map((user) => ({
        label: `${user.user.username}#${user.user.discriminator}`,
        value: user.user.id,
      }));
    if (pickable.length === 0) return null;
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(role)
        .setPlaceholder('Pick someone to frame.')
        .addOptions(pickable)
    );
    return row;
  }

  if (role === 'Sheriff') {
    const pickable = users
      .filter((user) => user.user !== playerActing && !user.isDead)
      .map((user) => ({
        label: `${user.user.username}#${user.user.discriminator}`,
        value: user.user.id,
      }));
    if (pickable.length === 0) return null;
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(role)
        .setPlaceholder('Pick someone to investigate.')
        .addOptions(pickable)
    );
    return row;
  }

  if (role === 'Veteran') {
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(role)
        .setPlaceholder('Choose to go on alert.')
        .addOptions({
          label: 'Alert',
          value: 'alert',
        })
    );

    return row;
  }

  return null;
};
