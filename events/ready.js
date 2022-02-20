const { restoreReminders } = require('../data/timeouts');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    await restoreReminders(client);
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
