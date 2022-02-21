/* eslint-disable prefer-template */
const { MessageEmbed } = require('discord.js');
const _ = require('lodash');
const { TotoDraw, TotoTicket } = require('../data/sequelize');

module.exports = {
  name: 'draw',
  once: false,
  async execute(client, channelId, guildId, scheduledUserId) {
    const user = await client.users.fetch(scheduledUserId);
    const channel = await client.channels.fetch(channelId);
    // Generate 6 random numbers between 1 and 49
    const array = _.range(1, 50);
    const results = _.shuffle(array)
      .slice(0, 7)
      .sort((a, b) => a - b);

    // Calculate winners
    let highest = 0;
    let winners = {};

    const tickets = await TotoTicket.findAll();
    tickets.forEach((ticket) => {
      const { userId } = ticket;
      const numberArray = ticket.numbers.split(',').map(Number);
      const intersectionArray = _.intersection(numberArray, results);

      let winString = '';
      numberArray.forEach((number) => {
        if (intersectionArray.includes(number)) {
          winString += `**${number}** `;
        } else {
          winString += `${number} `;
        }
      });

      if (intersectionArray.length > highest) {
        highest = intersectionArray.length;
        winners = {};
        winners[userId] = winString;
      } else if (intersectionArray.length === highest) {
        winners[userId] = winString;
      }
    });

    let winnerString = '';
    let winnerTicketString = '';

    const winnerEntries = Object.entries(winners);
    winnerEntries.forEach((entry) => {
      winnerString += `<@${entry[0]}>\n`;
      winnerTicketString += `${entry[1].trim()}\n`;
    });

    if (highest === 0) {
      winnerString = 'N/A';
      winnerTicketString = 'N/A';
    }

    const drawsSoFarInServer = await TotoDraw.count({
      where: { guildId },
    });
    try {
      await TotoDraw.create({
        date: Date.now(),
        results,
        guildId,
        winners: winnerString,
        winnerTickets: winnerTicketString,
      });
      await TotoTicket.destroy({ truncate: true });
      const embed = new MessageEmbed()
        .setTitle(`TOTO - Draw #${drawsSoFarInServer + 1}`)
        .addFields(
          {
            name: 'Winning Numbers',
            value: `\`\`\`fix\n${results[0]} ${results[1]} ${results[2]} ${results[3]} ${results[4]} ${results[5]}\n\`\`\``,
            inline: true,
          },
          {
            name: 'Additional',
            value: `\`\`\`diff\n+ ${results[6]}\n\`\`\``,
            inline: true,
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true,
          }
        )
        .addField('The results are in!', `Highest number of hits: ${highest}`)
        .addFields(
          { name: 'Winner(s)', value: winnerString, inline: true },
          { name: 'Ticket(s)', value: winnerTicketString, inline: true }
        )
        .setThumbnail('https://media.giphy.com/media/dvgefaMHmaN2g/giphy.gif')
        .setTimestamp()
        .setFooter({
          text: `Draw scheduled by ${user.tag}`,
        });
      await channel.send({ embeds: [embed] });
    } catch (error) {
      await channel.send('There was an error conducting a draw.');
    }
  },
};
