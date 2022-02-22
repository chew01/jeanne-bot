const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('whisper')
    .setDescription('Whisper to another user.')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('Mention the user that you want to whisper to.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Enter the message that you want to whisper.')
        .setRequired(true)
    ),
  async execute(interaction) {
    const sender = interaction.user.id;
    const user = interaction.options.getUser('user');
    const message = interaction.options.getString('message');

    const embed = new MessageEmbed()
      .setColor('BLUE')
      .setDescription(`<@${sender}> whispered to <@${user.id}>!`);
    const button = new MessageButton()
      .setCustomId('receive')
      .setLabel('Receive message')
      .setEmoji('📨')
      .setStyle('PRIMARY');

    const filter = (i) => i.customId === 'receive' && i.user.id === user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      max: 1,
    });
    collector.on('collect', async (i) => {
      await i.update({
        components: [
          new MessageActionRow().addComponents(button.setDisabled(true)),
        ],
      });
      await i.followUp({ content: message, ephemeral: true });
    });

    return interaction.reply({
      content: `<@${user.id}>`,
      embeds: [embed],
      components: [new MessageActionRow().addComponents(button)],
    });
  },
};
