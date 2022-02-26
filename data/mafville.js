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

exports.movingRoles = ['Sheriff', 'Mafioso', 'Framer'];

exports.initializeRole = (user, role) => {
  if (role === 'Mafioso') {
    return {
      user,
      role,
      isDead: false,
      isSuspicious: true,
      defense: 0,
      visitedBy: [],
      lastWill: '',
      nightResults: '',
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
      lastWill: '',
      nightResults: '',
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
      lastWill: '',
      nightResults: '',
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
      lastWill: '',
      nightResults: '',
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
      lastWill: '',
      nightResults: '',
    };
  }

  return null;
};

exports.getNightAction = (users, role, actingPlayerObj) => {
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
      .filter((user) => user.user !== actingPlayerObj.user && !user.isDead)
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

  if (role === 'Veteran' && actingPlayerObj.alertLeft > 0) {
    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(role)
        .setPlaceholder('Choose to go on alert.')
        .addOptions(
          {
            label: 'Alert',
            value: 'alert',
          },
          { label: 'Not alert', value: 'not alert' }
        )
    );

    return row;
  }

  return null;
};

exports.getNightActionVerb = (role, target) => {
  if (role === 'Mafioso') {
    return `You have chosen to kill <@${target}> tonight.`;
  }
  if (role === 'Framer') {
    return `You have chosen to frame <@${target}> tonight.`;
  }
  if (role === 'Sheriff') {
    return `You have chosen to investigate <@${target}> for suspicious activity tonight.`;
  }
  if (role === 'Veteran') {
    return `You have decided to be ${target} tonight.`;
  }
  return null;
};

exports.getNightActionChangedVerb = (role, newTarget) => {
  if (role === 'Mafioso') {
    return `You have chosen to kill <@${newTarget}> instead.`;
  }
  if (role === 'Framer') {
    return `You have chosen to frame <@${newTarget}> instead.`;
  }
  if (role === 'Sheriff') {
    return `You have chosen to investigate <@${newTarget}> for suspicious activity instead.`;
  }
  if (role === 'Veteran') {
    return `You have decided to be ${newTarget} tonight.`;
  }
  return null;
};
