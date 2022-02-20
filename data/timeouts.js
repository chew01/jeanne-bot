const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const { MessageEmbed } = require('discord.js');
const { Op } = require('sequelize');
const { Reminder } = require('./sequelize');

dayjs.extend(relativeTime);

// Timeout handler
exports.reminderTimeouts = {};

// Restore reminder timeouts after load
exports.restoreReminders = async (client) => {
  // Clear lapsed reminders
  await Reminder.destroy({
    where: {
      scheduledTime: {
        [Op.lt]: Date.now(),
      },
    },
  });

  const remindersToRestore = await Reminder.findAll({
    where: {
      scheduledTime: {
        [Op.gt]: Date.now(),
      },
    },
  });

  let restoreCount = 0;

  remindersToRestore.forEach((reminder) => {
    const channel = client.channels.cache.get(reminder.channelId);
    const messageEmbed = new MessageEmbed()
      .setTitle('Hey! Your reminder is here!')
      .setDescription(
        `You requested a reminder ${dayjs(reminder.createdTime).from(
          reminder.scheduledTime
        )}.`
      )
      .addField('Description', reminder.message);
    const duration = reminder.scheduledTime - Date.now();

    this.reminderTimeouts[reminder.timeoutId] = setTimeout(() => {
      channel.send({
        content: `Guess what, <@${reminder.userId}>?`,
        embeds: [messageEmbed],
      });

      Reminder.destroy({
        where: { timeoutId: reminder.timeoutId },
      });
    }, duration);

    restoreCount += 1;
  });

  console.log(
    `${restoreCount}/${remindersToRestore.length} reminder timeouts restored!`
  );
};
