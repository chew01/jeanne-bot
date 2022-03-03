/* eslint-disable no-param-reassign */
const _ = require('lodash');
const {
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
} = require('discord.js');

module.exports = {
  name: 'mafvote',
  once: false,
  async execute(
    client,
    playerObjects,
    gameChannel,
    mafChannel,
    dayCount,
    votesSoFar
  ) {
    // Proceed with voting only if no more than 2 players have been put on the stand
    if (votesSoFar < 3) {
      // Create list of possible lynch targets
      const voteOptions = playerObjects
        .filter((playerObj) => !playerObj.isDead)
        .map((playerObj) => ({
          label: `${playerObj.user.username}#${playerObj.user.discriminator}`,
          value: playerObj.user.id,
        }));

      // Establish number of votes required to nominate player for lynch (>50% of living players)
      const numberOfPlayers = playerObjects.filter(
        (playerObj) => !playerObj.isDead
      ).length;
      const votesRequired =
        numberOfPlayers % 2
          ? (numberOfPlayers + 1) / 2
          : numberOfPlayers / 2 + 1;

      // Send phase start message with embed fields for players/votes currently being voted up and dropdown menu with player choices
      let votedPlayerString = '';
      let votesString = '';
      let phaseCountdown = 30;
      const votingEmbed = new MessageEmbed()
        .setTitle(`Current Phase: Day ${dayCount} Voting`)
        .setDescription(
          `Living players can speak. You may vote to lynch someone using the dropdown bar below. ${votesRequired} votes are required to lynch someone.`
        )
        .setColor('#ffbd38')
        .setThumbnail('https://freesvg.org/img/gramzon_Ballot_box.png')
        .addFields(
          { name: 'Players', value: votedPlayerString || 'N/A', inline: true },
          { name: 'Votes', value: votesString || 'N/A', inline: true },
          {
            name: 'Night will fall in:',
            value: `${phaseCountdown} seconds`,
            inline: true,
          }
        );
      const votingRow = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId('vote')
          .setPlaceholder('Vote to lynch someone.')
          .addOptions(voteOptions, { label: 'Abstain', value: 'abstain' })
      );
      const votingMessage = await gameChannel.send({
        embeds: [votingEmbed],
        components: [votingRow],
      });

      // Set interval to countdown 30 seconds.
      const phaseCountdownInterval = setInterval(async () => {
        if (phaseCountdown > 0) {
          phaseCountdown -= 5;
          await votingMessage.edit({
            embeds: [
              votingEmbed.setFields(
                {
                  name: 'Players',
                  value: votedPlayerString || 'N/A',
                  inline: true,
                },
                { name: 'Votes', value: votesString || 'N/A', inline: true },
                {
                  name: 'Night will fall in:',
                  value: `${phaseCountdown} seconds`,
                  inline: true,
                }
              ),
            ],
          });
        }
        // Upon countdown end, clear interval and emit Night event
        if (phaseCountdown === 0) {
          clearInterval(phaseCountdownInterval);
          gameChannel.send('It is too late to continue voting.');
          client.emit(
            'mafnight',
            client,
            playerObjects,
            gameChannel,
            mafChannel,
            dayCount
          );
        }
      }, 5000);

      // Create collector for dropdown menu selections
      const votes = {};
      const votingSelectFilter = (i) => i.customId === 'vote';
      const votingSelectCollector =
        votingMessage.createMessageComponentCollector({
          votingSelectFilter,
          time: 30000,
        });

      // On collect, add voter & target as a key-value pair to votes object, and reduce the values to count number of votes for each player
      votingSelectCollector.on('collect', async (i) => {
        // If voter is dead, return reply and do not proceed with adding vote
        if (
          _.find(playerObjects, (playerObj) => playerObj.user === i.user).isDead
        ) {
          return i.reply({ content: 'You are already dead!', ephemeral: true });
        }
        const userVote = i.values[0];
        votes[i.user.id] = userVote;
        const voteValues = Object.values(votes);
        const voteMap = voteValues.reduce((prev, cur) => {
          prev[cur] = (prev[cur] || 0) + 1;
          return prev;
        }, {});
        const voteMapEntries = Object.entries(voteMap);
        votedPlayerString = '';
        votesString = '';

        // Reply when user votes for another person/unvotes via abstain option
        if (i.values[0] === 'abstain') {
          i.reply(`${i.user} has chosen to abstain.`);
        } else {
          i.reply(`${i.user} has voted to lynch <@${i.values[0]}>`);
        }

        // For each vote update, update the count in embed. If minimum vote required is hit, clear interval and stop collector, and emit Gallows event
        voteMapEntries.forEach((entry) => {
          if (entry[0] !== 'abstain') {
            votedPlayerString += `<@${entry[0]}>\n`;
            votesString += `${entry[1]}\n`;
            if (entry[1] >= votesRequired) {
              const accused = _.find(
                playerObjects,
                (playerObj) => playerObj.user.id === entry[0]
              );
              clearInterval(phaseCountdownInterval);
              votingSelectCollector.stop('vote');
              setTimeout(() => {
                votingMessage.delete();
              }, 0);
              client.emit(
                'mafgallows',
                client,
                playerObjects,
                gameChannel,
                mafChannel,
                dayCount,
                votesSoFar + 1,
                accused.user
              );
            }
          }
        });
        return votingMessage.edit({
          embeds: [
            votingEmbed.setFields(
              {
                name: 'Players',
                value: votedPlayerString || 'N/A',
                inline: true,
              },
              { name: 'Votes', value: votesString || 'N/A', inline: true },
              {
                name: 'Night will fall in:',
                value: `${phaseCountdown} seconds`,
                inline: true,
              }
            ),
          ],
          components: [votingRow],
        });
      });

      votingSelectCollector.on('end', (collected, reason) => {
        if (reason === 'vote' || reason === 'time') {
          votingMessage.edit({
            embeds: [
              votingEmbed.setFields(
                {
                  name: 'Players',
                  value: votedPlayerString || 'N/A',
                  inline: true,
                },
                { name: 'Votes', value: votesString || 'N/A', inline: true },
                {
                  name: 'Night will fall in:',
                  value: `${phaseCountdown} seconds`,
                  inline: true,
                }
              ),
            ],
            components: [],
          });
        }
      });
    }

    // If more than 2 players have been put on the stand, emit night phase event
    if (votesSoFar >= 3) {
      gameChannel.send('It is too late to continue voting.');
      client.emit(
        'mafnight',
        client,
        playerObjects,
        gameChannel,
        mafChannel,
        dayCount
      );
    }
  },
};
