/**
 * Handler pour la soumission du modal de suggestion.
 *
 * Ce module récupère les valeurs du modal, construit un embed avec ces informations,
 * et envoie le message dans le salon de suggestions défini dans la configuration.
 *
 * Le message contient également des réactions pour faciliter le vote.
 */

const { MessageFlags, EmbedBuilder } = require("discord.js");

const config = require("../config/config.json");
const suggestionChannelId = config.suggestionChannel;

const style = require("../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  /**
   * Exécute le traitement de la soumission du modal.
   *
   * @param {ModalSubmitInteraction} interaction - L'interaction provenant du modal.
   */
  async execute(interaction) {
    // Récupération des valeurs saisies dans le modal
    const titre = interaction.fields.getTextInputValue("titre");
    const contenu = interaction.fields.getTextInputValue("contenu");

    // Récupère le salon de suggestions à partir du cache du client Discord
    const channel = interaction.client.channels.cache.get(suggestionChannelId);
    if (!channel) {
      return interaction.reply({
        content: "Le salon de suggestions est introuvable.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Construction de l'embed pour la suggestion
    const embed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle(`${interaction.user.username} : ${titre}`)
      .setDescription(contenu)
      .setTimestamp()
      .setThumbnail(thumbnailEmbed);

    // Envoi de l'embed dans le salon, puis ajout de réactions pour le vote
    channel
      .send({ embeds: [embed] })
      .then((msg) => {
        // Réactions standards de vote
        msg.react("👍");
        msg.react("👎");

        // Ajout d'une réaction personnalisée si elle est disponible dans le serveur
        const customEmoji = msg.guild.emojis.cache.get("688499012206460999");
        if (customEmoji) msg.react(customEmoji);
      })
      .catch((err) => {
        console.error(
          "⚠️\x1b[38;5;1m  Erreur lors de l'envoi de la suggestion :",
          err,
        );
      });

    // Réponse éphémère pour confirmer à l'utilisateur que sa suggestion a été envoyée
    await interaction.reply({
      content: "Merci, ta suggestion a bien été envoyée.",
      flags: MessageFlags.Ephemeral,
    });
  },
};
