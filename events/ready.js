const { restoreReminders, restoreTotoDraws } = require('../data/timeouts');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    await restoreReminders(client);
    await restoreTotoDraws(client);
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
