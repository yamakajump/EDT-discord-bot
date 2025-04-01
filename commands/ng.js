/**
 * Module de commande "ng"
 *
 * Cette commande slash affiche les statistiques de messages d'un utilisateur :
 * - La date du premier message enregistré.
 * - Le nombre de messages enregistrés (comparé à un total fixé).
 * - Le temps restant (en jours) sur une période donnée.
 *
 * On peut spécifier un utilisateur via l'option "utilisateur". Si aucun utilisateur n'est
 * précisé, les statistiques sont affichées pour l'utilisateur qui exécute la commande.
 *
 * Les données statistiques sont récupérées via "guerrierDAO".
 */

const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const guerrierDAO = require("../dao/guerrierDAO");

const { getEmoji } = require("../utils/emoji");
const emojiValid = getEmoji("oui");
const emojiInvalid = getEmoji("non");

const style = require("../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ng")
    .setDescription(
      "Voir le nombre de messages enregistrés et d'autres statistiques",
    )
    .addUserOption((option) =>
      option
        .setName("utilisateur")
        .setDescription("Choisissez un utilisateur (optionnel)")
        .setRequired(false),
    ),

  async execute(interaction) {
    // Récupération de l'utilisateur ciblé ou, par défaut, l'utilisateur de la commande
    const userOption = interaction.options.getUser("utilisateur");
    const user = userOption || interaction.user;
    const id = user.id;

    const embed = new EmbedBuilder();
    const totalMessages = 300; // Nombre de messages requis pour valider la cible

    const totalDays = 14; // Durée de la période de suivi en jours

    try {
      // Récupération des données de l'utilisateur via le DAO
      const data = await guerrierDAO.getById(id);

      if (!data) {
        // Aucun message enregistré pour cet utilisateur
        embed
          .setColor(colorEmbed)
          .setTitle("Statistiques de messages")
          .setThumbnail(thumbnailEmbed)
          .setDescription(
            `<@${user.id}>\n` +
              (user.id === interaction.user.id
                ? "Vous n'avez encore envoyé aucun message enregistré."
                : "Cet utilisateur n'a encore envoyé aucun message enregistré."),
          );
      } else {
        // Formatage de la date du premier message
        const firstMsgDate = new Date(data.date);
        const formattedDate = firstMsgDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Calcul du temps restant sur une période de "totalDays"
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - firstMsgDate.getTime());
        let diffDays = Math.round(totalDays - diffTime / (1000 * 3600 * 24));
        if (diffDays < 0) diffDays = 0;
        // Choix de l'emoji selon que la période soit écoulée ou non
        const timeEmoji = diffDays === 0 ? emojiValid : emojiInvalid;
        // Choix de l'emoji selon si le nombre de messages atteint le seuil requis
        const countEmoji =
          data.count >= totalMessages ? emojiValid : emojiInvalid;

        embed
          .setColor(colorEmbed)
          .setTitle("Statistiques de messages")
          .setThumbnail(thumbnailEmbed)
          .setDescription(
            `**Utilisateur** : <@${user.id}>\n` +
              `**Date du premier message** : ${formattedDate}\n` +
              `**Nombre de messages** : ${data.count}/${totalMessages} ${countEmoji}\n` +
              `**Temps restant** : ${diffDays} jour${diffDays > 1 ? "s" : ""} ${timeEmoji}`,
          );
      }

      // Envoi de la réponse tout en autorisant la mention de l'utilisateur
      await interaction.reply({
        embeds: [embed],
        allowedMentions: { users: [user.id] },
      });
    } catch (err) {
      console.error("Erreur lors de l'exécution de la commande ng :", err);
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la récupération des statistiques.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
