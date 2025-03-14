const { MessageFlags, EmbedBuilder } = require('discord.js');
const config = require("../config/config.json");

module.exports = {
  async execute(interaction) {
    // Récupère les valeurs du modal
    const titre = interaction.fields.getTextInputValue("titre");
    const contenu = interaction.fields.getTextInputValue("contenu");
    const suggestionChannelId = config.suggestionChannel;

    // Récupère le salon de suggestions à partir du client Discord
    const channel = interaction.client.channels.cache.get(suggestionChannelId);
    if (!channel) {
      return interaction.reply({
        content: "Le salon de suggestions est introuvable.",
        flags: MessageFlags.Ephemeral
      });
    }

    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`${interaction.user.username} : ${titre}`)
      .setDescription(contenu)
      .setTimestamp()
      .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png');

    // Envoie l'embed dans le salon de suggestions et réagit au message
    channel.send({ embeds: [embed] })
      .then((msg) => {
        msg.react("👍");
        msg.react("👎");
        const customEmoji = msg.guild.emojis.cache.get("688499012206460999");
        if (customEmoji) msg.react(customEmoji);
      })
      .catch((err) =>
        console.error("Erreur lors de l'envoi de la suggestion :", err)
      );

    await interaction.reply({
      content: "Merci, ta suggestion a bien été envoyée.",
      flags: MessageFlags.Ephemeral
    });
  },
};
