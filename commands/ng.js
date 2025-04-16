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
    // Si aucun utilisateur n'est spécifié, on prend l'utilisateur qui a lancé la commande.
    const userOption = interaction.options.getUser("utilisateur");
    const user = userOption || interaction.user;
    const id = user.id;

    const embed = new EmbedBuilder();
    const totalMessages = 300; // Seuil de messages pour validation
    const totalDays = 7 * 8; // Durée d'une période pour le suivi (en jours)

    try {
      // Récupération des données du guerrier via le DAO.
      const data = await guerrierDAO.getById(id);

      if (!data) {
        // Aucun enregistrement pour cet utilisateur.
        embed
          .setColor(colorEmbed)
          .setTitle("Statistiques de messages")
          .setThumbnail(thumbnailEmbed)
          .setDescription(
            `<@${user.id}>\n` +
              (user.id === interaction.user.id
                ? "Vous n'avez encore aucune donnée enregistrée."
                : "Cet utilisateur n'a encore aucune donnée enregistrée."),
          );
      } else {
        // Utilisation de la date de création du guerrier (date_creation)
        const creationDate = new Date(data.date_creation);
        const formattedDate = creationDate.toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        // Calcul du temps restant à partir de la date de création sur une période définie
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - creationDate.getTime());
        let diffDays = Math.round(totalDays - diffTime / (1000 * 3600 * 24));
        if (diffDays < 0) diffDays = 0;

        const timeEmoji = diffDays === 0 ? emojiValid : emojiInvalid;
        const countEmoji =
          data.count >= totalMessages ? emojiValid : emojiInvalid;

        embed
          .setColor(colorEmbed)
          .setTitle("Statistiques de messages")
          .setThumbnail(thumbnailEmbed)
          .setDescription(
            `**Utilisateur** : <@${user.id}>\n` +
              `**Date de création** : ${formattedDate}\n` +
              `**Nombre de messages** : ${data.count}/${totalMessages} ${countEmoji}\n` +
              `**Temps restant** : ${diffDays} jour${diffDays > 1 ? "s" : ""} ${timeEmoji}`,
          );
      }

      // Envoi de la réponse en mentionnant l'utilisateur (si besoin)
      await interaction.reply({
        embeds: [embed],
        allowedMentions: { users: [user.id] },
      });
    } catch (err) {
      console.error("⚠️  Erreur lors de l'exécution de la commande ng :", err);
      await interaction.reply({
        content:
          "Une erreur est survenue lors de la récupération des statistiques.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
