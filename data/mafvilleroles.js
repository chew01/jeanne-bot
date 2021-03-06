const { MessageEmbed, MessageSelectMenu } = require('discord.js');

exports.townRoleList = 'Sheriff š\nVeteran š”ļø\nTownie š¤ ';

exports.mafiaRoleList = 'Mafioso š”ļø\nFramer š§';

const Roster = new MessageEmbed()
  .setTitle('š¤  MafVille - Role Roster š')
  .setDescription(
    'There are a total of __**5 roles**__ available in this version.\n\nš”ļø **ā Killing Roles**\nš **ā Investigative Roles**\nš§ **ā Support Roles**\n\nSelect a role in the dropdown menu to learn more!\nThis help command will expire in 30 seconds of inactivity. '
  )
  .addFields(
    { name: 'š¤  Town Roles', value: this.townRoleList, inline: true },
    { name: 'šµļø Mafia Roles', value: this.mafiaRoleList, inline: true }
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
        'š”ļø Defense: 0\nāļø Attack: N/A\nš Investigation by Sheriff:\n__Not suspicious__',
      inline: true,
    },
    { name: 'Alignment āļø', value: 'š¤  Town\nš Investigative', inline: true },
    {
      name: 'Abilities ā',
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
        'š”ļø Defense: 0 (1)\nāļø Attack: N/A (2)\nš Investigation by Sheriff:\n__Not suspicious__',
      inline: true,
    },
    { name: 'Alignment āļø', value: 'š¤  Town\nš”ļø Killing', inline: true },
    {
      name: 'Abilities ā',
      value:
        '__**(Night Action)**__ Go on alert with your trusty old rifle. While on alert:\n\nš”ļø Defense is increased to 1, and launch āļø Attack (Lv2) on anyone who visits your house (including Townies).\nThis can be done a maximum of **1 time** per game.',
    }
  );

const Townie = new MessageEmbed()
  .setTitle('MafVille - Townie (Role)')
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .addFields(
    {
      name: 'Attributes',
      value:
        'š”ļø Defense: 0\nāļø Attack: N/A\nš Investigation by Sheriff:\n__Not suspicious__',
      inline: true,
    },
    { name: 'Alignment āļø', value: 'š¤  Town', inline: true },
    {
      name: 'Abilities ā',
      value:
        '__**(No abilities)**__\n\nOne day, all players will have useful roles... š„ŗ',
    }
  );

const Mafioso = new MessageEmbed()
  .setTitle('MafVille - Mafioso (Role)')
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .addFields(
    {
      name: 'Attributes',
      value:
        'š”ļø Defense: 0\nāļø Attack: 1\nš Investigation by Sheriff:\n__Suspicious!__',
      inline: true,
    },
    { name: 'Alignment āļø', value: 'šµļø Mafia\nš”ļø Killing', inline: true },
    {
      name: 'Abilities ā',
      value:
        "__**(Night Action)**__ Choose a player to kill.\n\nThe target will be killed if they have a lower defense than the Mafioso's āļø Attack.",
    }
  );

const Framer = new MessageEmbed()
  .setTitle('MafVille - Framer (Role)')
  .setThumbnail('https://freesvg.org/img/Adventurer-Girl.png')
  .addFields(
    {
      name: 'Attributes',
      value:
        'š”ļø Defense: 0\nāļø Attack: N/A\nš Investigation by Sheriff:\n__Suspicious!__',
      inline: true,
    },
    { name: 'Alignment āļø', value: 'šµļø Mafia\nš§ Support', inline: true },
    {
      name: 'Abilities ā',
      value:
        '__**(Night Action)**__ Choose a player to frame.\n\nThe target will be appear **Suspicious** when investigated by the Sheriff on that night.',
    }
  );

exports.mafvilleRoles = { Roster, Sheriff, Veteran, Townie, Mafioso, Framer };

exports.mafvilleRoleMenu = new MessageSelectMenu()
  .setCustomId('selectrole')
  .setPlaceholder('Select a role')
  .addOptions([
    { label: 'š Role Roster', value: 'Roster' },
    { label: 'š Sheriff (Town/Investigative)', value: 'Sheriff' },
    { label: 'š”ļø Veteran (Town/Killing)', value: 'Veteran' },
    { label: 'š¤  Townie (Town)', value: 'Townie' },
    { label: 'š”ļø Mafioso (Mafia/Killing)', value: 'Mafioso' },
    { label: 'š§ Framer (Mafia/Support)', value: 'Framer' },
  ]);
