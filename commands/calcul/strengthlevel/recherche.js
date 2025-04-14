const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

const { getEmoji } = require("../../../utils/emoji");
const cibleEmoji = getEmoji("cible");
const nonEmoji = getEmoji("non");
const emojiBoule = getEmoji("boule");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

/**
 * Module de recherche et de filtrage des exercices de force.
 *
 * Ce module lit un fichier JSON contenant des données sur divers exercices
 * et permet de filtrer ces exercices en fonction des options fournies par l'utilisateur,
 * à savoir la catégorie et la partie du corps sollicitée.
 *
 * Les données filtrées sont ensuite présentées dans un embed Discord. Avant d'afficher
 * le résultat, le module vérifie que le contenu généré ne dépasse pas la limite de caractères
 * autorisée par Discord pour un embed.
 */
module.exports = {
  async execute(interaction) {
    // Récupération des options fournies par l'utilisateur (optionnelles)
    const categoryOption = interaction.options.getString("categorie");
    const bodyPartOption = interaction.options.getString("muscle");

    // Chemin absolu vers le fichier JSON
    const dataPath = path.join(__dirname, "../../../data/strengthlevel.json");
    let exercises;

    // Lecture et parsing du fichier JSON
    try {
      const rawData = fs.readFileSync(dataPath, "utf8");
      exercises = JSON.parse(rawData);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier JSON :", error);
      const errorEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle("Erreur")
        .setDescription(
          "Une erreur est survenue lors de la récupération des données d'exercices.",
        );
      return interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Filtrage des exercices en fonction des options
    let filteredExercises = exercises;

    if (categoryOption && categoryOption !== "none") {
      filteredExercises = filteredExercises.filter(
        (ex) =>
          ex.Category &&
          ex.Category.toLowerCase() === categoryOption.toLowerCase(),
      );
    }
    if (bodyPartOption && bodyPartOption !== "none") {
      filteredExercises = filteredExercises.filter(
        (ex) =>
          ex["Body Part"] &&
          ex["Body Part"].toLowerCase() === bodyPartOption.toLowerCase(),
      );
    }

    // Préparation du résumé des filtres appliqués
    const filtersApplied = `Catégorie: ${categoryOption && categoryOption !== "none" ? categoryOption : "Tous"}
Partie du corps: ${bodyPartOption && bodyPartOption !== "none" ? bodyPartOption : "Toutes"}`;

    // S'il n'y a aucun résultat, on informe l'utilisateur via un embed
    if (filteredExercises.length === 0) {
      const noResultEmbed = new EmbedBuilder()
        .setColor(colorEmbed)
        .setTitle(`Aucun exercice trouvé ${nonEmoji}`)
        .setDescription(
          "Aucun exercice ne correspond aux critères de recherche spécifiés.",
        )
        .addFields({
          name: `${emojiBoule} Filtres appliqués :`,
          value: filtersApplied,
        });
      return interaction.reply({
        embeds: [noResultEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Construction de la description à afficher dans l'embed
    const description = filteredExercises
      .map((ex) => `**${ex.exercise}**`)
      .join("\n\n");

    // Vérification de la taille du message pour ne pas dépasser la limite Discord
    // La limite d'un embed pour la description est de 4096 caractères.
    if (description.length > 4096) {
      const limitEmbed = new EmbedBuilder()
        .setColor(colorEmbed)
        .setTitle(`${nonEmoji} Recherche trop large`)
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          "Il y a trop d'exercices correspondant à votre recherche. Veuillez affiner votre recherche en utilisant des paramètres supplémentaires.",
        )
        .addFields({
          name: `${emojiBoule} Filtres appliqués :`,
          value: filtersApplied,
        });
      return interaction.reply({
        embeds: [limitEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Création de l'embed de résultat
    const resultEmbed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle(`${cibleEmoji} Résultats de la recherche`)
      .setDescription(description)
      .setThumbnail(thumbnailEmbed)
      .addFields({
        name: `${emojiBoule} Filtres appliqués :`,
        value: filtersApplied,
      })
      .setFooter({
        text: "Données extraites du site https://strengthlevel.com/",
      });

    // Réponse à l'interaction avec l'embed
    await interaction.reply({ embeds: [resultEmbed] });
  },
};
