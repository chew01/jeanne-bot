/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const { Client, Intents, Collection } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
  presence: { activities: [{ name: 'with Discord poggies', type: 'PLAYING' }] },
});

require('./sequelize');

// Command handler
client.commands = new Collection();

const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));
commandFiles.forEach((file) => {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error executing the command.',
    });
  }
});

// Event handler
const eventFiles = fs
  .readdirSync('./events')
  .filter((file) => file.endsWith('.js'));
eventFiles.forEach((file) => {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
});

client.login(process.env.BOT_TOKEN);
