const { MessageEmbed, MessageSelectMenu } = require('discord.js');

exports.townRoleList = 'Sheriff 🔎\nVeteran 🗡️\nTownie 🤠';

exports.mafiaRoleList = 'Mafioso 🗡️\nFramer 🔧';

const Roster = new MessageEmbed()
  .setTitle('🤠 MafVille - Role Roster 📜')
  .setDescription(
    'There are a total of __**5 roles**__ available in this version.\n\n🗡️ **— Killing Roles**\n🔎 **— Investigative Roles**\n🔧 **— Support Roles**\n\nSelect a role in the dropdown menu to learn more!\nThis help command will expire in 30 seconds of inactivity. '
  )
  .addFields(
    { name: '🤠 Town Roles', value: this.townRoleList, inline: true },
    { name: '🕵️ Mafia Roles', value: this.mafiaRoleList, inline: true }
  )
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .setFooter({
    text: 'Current version: Beta v1.0 (Last updated on 3 March 2022)',
  });

const Sheriff = new MessageEmbed()
  .setTitle('MafVille - Sheriff (Role)')
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .addFields(
    {
      name: 'Attributes',
      value:
        '🛡️ Defense: 0\n⚔️ Attack: N/A\n🔎 Investigation by Sheriff:\n__Not suspicious__',
      inline: true,
    },
    { name: 'Alignment ⚖️', value: '🤠 Town\n🔎 Investigative', inline: true },
    {
      name: 'Abilities ✊',
      value:
        '__**(Night Action)**__ Choose a player to investigate.\n\nIf the target is a member of the Mafia/framed by a Framer, the Sheriff will know that they are **suspicious**.',
    }
  );

const Veteran = new MessageEmbed()
  .setTitle('MafVille - Veteran (Role)')
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .addFields(
    {
      name: 'Attributes',
      value:
        '🛡️ Defense: 0 (1)\n⚔️ Attack: N/A (2)\n🔎 Investigation by Sheriff:\n__Not suspicious__',
      inline: true,
    },
    { name: 'Alignment ⚖️', value: '🤠 Town\n🗡️ Killing', inline: true },
    {
      name: 'Abilities ✊',
      value:
        '__**(Night Action)**__ Go on alert with your trusty old rifle. While on alert:\n\n🛡️ Defense is increased to 1, and launch ⚔️ Attack (Lv2) on anyone who visits your house (including Townies).\nThis can be done a maximum of **1 time** per game.',
    }
  );

const Townie = new MessageEmbed()
  .setTitle('MafVille - Townie (Role)')
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .addFields(
    {
      name: 'Attributes',
      value:
        '🛡️ Defense: 0\n⚔️ Attack: N/A\n🔎 Investigation by Sheriff:\n__Not suspicious__',
      inline: true,
    },
    { name: 'Alignment ⚖️', value: '🤠 Town', inline: true },
    {
      name: 'Abilities ✊',
      value:
        '__**(No abilities)**__\n\nOne day, all players will have useful roles... 🥺',
    }
  );

const Mafioso = new MessageEmbed()
  .setTitle('MafVille - Mafioso (Role)')
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .addFields(
    {
      name: 'Attributes',
      value:
        '🛡️ Defense: 0\n⚔️ Attack: 1\n🔎 Investigation by Sheriff:\n__Suspicious!__',
      inline: true,
    },
    { name: 'Alignment ⚖️', value: '🕵️ Mafia\n🗡️ Killing', inline: true },
    {
      name: 'Abilities ✊',
      value:
        "__**(Night Action)**__ Choose a player to kill.\n\nThe target will be killed if they have a lower defense than the Mafioso's ⚔️ Attack.",
    }
  );

const Framer = new MessageEmbed()
  .setTitle('MafVille - Framer (Role)')
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .addFields(
    {
      name: 'Attributes',
      value:
        '🛡️ Defense: 0\n⚔️ Attack: N/A\n🔎 Investigation by Sheriff:\n__Suspicious!__',
      inline: true,
    },
    { name: 'Alignment ⚖️', value: '🕵️ Mafia\n🔧 Support', inline: true },
    {
      name: 'Abilities ✊',
      value:
        '__**(Night Action)**__ Choose a player to frame.\n\nThe target will be appear **Suspicious** when investigated by the Sheriff on that night.',
    }
  );

exports.mafvilleRoles = { Roster, Sheriff, Veteran, Townie, Mafioso, Framer };

exports.mafvilleRoleMenu = new MessageSelectMenu()
  .setCustomId('selectrole')
  .setPlaceholder('Select a role')
  .addOptions([
    { label: '📜 Role Roster', value: 'Roster' },
    { label: '🔎 Sheriff (Town/Investigative)', value: 'Sheriff' },
    { label: '🗡️ Veteran (Town/Killing)', value: 'Veteran' },
    { label: '🤠 Townie (Town)', value: 'Townie' },
    { label: '🗡️ Mafioso (Mafia/Killing)', value: 'Mafioso' },
    { label: '🔧 Framer (Mafia/Support)', value: 'Framer' },
  ]);
