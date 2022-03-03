const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const _ = require('lodash');

exports.getRoles = (playerCount) => {
  let roles = [];
  switch (playerCount) {
    case 7:
      roles = [
        'Sheriff',
        'Veteran',
        'Townie',
        'Townie',
        'Townie',
        'Mafioso',
        'Framer',
      ];
      break;
    case 8:
      roles = [
        'Sheriff',
        'Veteran',
        'Townie',
        'Townie',
        'Townie',
        'Townie',
        'Mafioso',
        'Framer',
      ];
      break;
    case 9:
      roles = [
        'Sheriff',
        'Veteran',
        'Townie',
        'Townie',
        'Townie',
        'Townie',
        'Mafioso',
        'Mafioso',
        'Framer',
      ];
      break;
    case 10:
      roles = [
        'Sheriff',
        'Veteran',
        'Veteran',
        'Townie',
        'Townie',
        'Townie',
        'Mafioso',
        'Mafioso',
        'Framer',
      ];
      break;
    default:
      break;
  }
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

exports.checkMafiosoStatus = async (playerObjects, mafChannel) => {
  const mafiosoAlive = _.find(
    playerObjects,
    (playerObj) => playerObj.role === 'Mafioso' && !playerObj.isDead
  );
  if (!mafiosoAlive) {
    const randomMafiaAlivePlayerObj = _.find(
      playerObjects,
      (playerObj) =>
        this.mafiaRoles.includes(playerObj.role) && !playerObj.isDead
    );
    if (randomMafiaAlivePlayerObj) {
      randomMafiaAlivePlayerObj.role = 'Mafioso';
      await mafChannel.send({
        content: `The mafioso has died. ${randomMafiaAlivePlayerObj.user} will take their place from now on.`,
      });
    }
  }
};

exports.checkWinCondition = (playerObjects) => {
  const checkMafioso = playerObjects.filter(
    (playerObj) => !playerObj.isDead && this.mafiaRoles.includes(playerObj.role)
  );
  const checkTown = playerObjects.filter(
    (playerObj) =>
      !playerObj.isDead && !this.mafiaRoles.includes(playerObj.role)
  );

  if (checkMafioso.length === 0) {
    return 'town';
  }
  if (checkTown.length === 0) {
    return 'mafia';
  }
  return null;
};
