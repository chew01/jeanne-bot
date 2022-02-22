/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const commands = [];
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

commandFiles.forEach((file) => {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
});

const rest = new REST({ version: '9' }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID_2
      ),
      { body: commands }
    );

    console.log('Successfully added application (/) commands');
  } catch (error) {
    console.error(error);
  }
})();
