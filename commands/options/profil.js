// commands/options/profil.js

const { EmbedBuilder, MessageFlags } = require("discord.js");
const guerrierDAO = require("../../dao/guerrierDAO");

const style = require("../../config/style.json");
const colorEmbed = style.colorEmbed;

module.exports = {
  async execute(interaction) {
    const userId = interaction.user.id;

    // Récupérer les informations du guerrier en base de données
    const guerrier = await guerrierDAO.getById(userId);

    if (!guerrier) {
      return await interaction.reply({
        content: "Aucune donnée n'a été trouvée pour votre profil.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Créer l'embed avec les informations du guerrier.
    const embed = new EmbedBuilder()
      .setTitle(`${interaction.user.username} - Profil`)
      .setColor(colorEmbed)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        {
          name: "Poids",
          value: guerrier.poids ? `${guerrier.poids} kg` : "Non défini",
          inline: true,
        },
        {
          name: "Taille",
          value: guerrier.taille ? `${guerrier.taille} cm` : "Non défini",
          inline: true,
        },
        {
          name: "Âge",
          value: guerrier.age ? `${guerrier.age}` : "Non défini",
          inline: true,
        },
        {
          name: "Sexe",
          value: guerrier.sexe ? `${guerrier.sexe}` : "Non défini",
          inline: true,
        },
        {
          name: "Activité",
          value: guerrier.activite || "Non défini",
          inline: true,
        },
        {
          name: "Jours d'entraînement",
          value: guerrier.jours ? `${guerrier.jours}` : "Non défini",
          inline: true,
        },
        {
          name: "Temps d'entraînement",
          value: guerrier.temps ? `${guerrier.temps} minutes` : "Non défini",
          inline: true,
        },
        {
          name: "Intensité",
          value: guerrier.intensite || "Non défini",
          inline: true,
        },
        {
          name: "TEF",
          value: guerrier.tef ? `${guerrier.tef}` : "Non défini",
          inline: true,
        },
      )
      .setTimestamp();

    // Répondre à l'interaction avec l'embed contenant le profil
    await interaction.reply({ embeds: [embed] });
  },
};
