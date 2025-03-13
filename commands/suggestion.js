const { MessageFlags } = require('discord.js');
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Soumet une suggestion et la poste dans le salon dédié")
    .addStringOption((option) =>
      option
        .setName("titre")
        .setDescription("Le titre de ta suggestion")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("contenu")
        .setDescription("Décris ta suggestion en détails")
        .setRequired(true)
    ),

  async execute(interaction) {
    const titre = interaction.options.getString("titre");
    const contenu = interaction.options.getString("contenu");
    const suggestionChannelId = config.suggestionChannel;

    // Récupère le salon à partir du client
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
      .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')

    // Envoie l'embed dans le salon de suggestions et ajoute auto les réactions
    channel
      .send({ embeds: [embed] })
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
