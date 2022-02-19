/* eslint-disable prefer-template */
const { MessageEmbed } = require('discord.js');
const _ = require('lodash');
const { Draw } = require('../sequelize');

module.exports = {
  name: 'draw',
  once: false,
  async execute(interaction) {
    const array = _.range(1, 50);
    const results = _.shuffle(array).slice(0, 6);
    try {
      const draw = await Draw.create({
        date: Date.now(),
        results,
      });
      const embed = new MessageEmbed()
        .setTitle(`TOTO - Draw #${draw.id}`)
        .setDescription(
          '```\nNumbers: \n' +
            results[0] +
            ' ' +
            results[1] +
            ' ' +
            results[2] +
            ' ' +
            results[3] +
            ' ' +
            results[4] +
            ' ' +
            results[5] +
            ' ' +
            '\n```'
        )
        .setThumbnail('https://media.giphy.com/media/dvgefaMHmaN2g/giphy.gif');
      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      return interaction.reply('There was an error conducting a draw.');
    }
  },
};
