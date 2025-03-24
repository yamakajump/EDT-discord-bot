const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
const { getEmoji } = require("../../../utils/emoji");

module.exports = {
  async execute(interaction) {
    // Récupération des options de la sous-commande "tableau"
    const exerciseName = interaction.options.getString("exercise");
    const sexOption = interaction.options.getString("sex");
    const sourceChoice = interaction.options.getString("source"); // "age" ou "bodyweight"

    // Chargement du fichier JSON contenant les seuils
    const dataPath = path.join(__dirname, "../../../data/strengthlevel.json");
    let exercisesData;
    try {
      const rawData = fs.readFileSync(dataPath, "utf8");
      exercisesData = JSON.parse(rawData);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier JSON :", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Erreur")
        .setDescription(
          "Une erreur est survenue lors de la récupération des données d'exercices.",
        );
      return interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Recherche de l'exercice (non sensible à la casse)
    const exerciseObj = exercisesData.find(
      (ex) => ex.exercise.toLowerCase() === exerciseName.toLowerCase(),
    );
    if (!exerciseObj) {
      return interaction.reply({
        content: `Erreur : l'exercice "${exerciseName}" est introuvable dans la base de données.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Récupération des données de seuils pour le sexe choisi
    const thresholds = exerciseObj[sexOption];
    if (!thresholds || !thresholds.bodyweight || !thresholds.age) {
      return interaction.reply({
        content: `Erreur : aucune donnée de seuils n'est disponible pour le sexe "${sexOption}" pour cet exercice.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Sélection de la table selon le choix ("age" ou "bodyweight")
    let table, tableType;
    if (sourceChoice === "age") {
      table = thresholds.age;
      tableType = "Âge";
    } else {
      table = thresholds.bodyweight;
      tableType = "Poids du Corps";
    }

    // Définition de l'en-tête avec la première colonne dynamique
    const firstHeader = tableType;
    // Les autres colonnes restent fixes
    const headers = [
      firstHeader,
      "Débutant",
      "Novice",
      "Intermédiaire",
      "Avancé",
      "Elite",
    ];
    const numCols = headers.length;
    const numRows = table.length; // Le nombre de lignes dans la table issue du JSON

    // Dimensions en pixels
    const cellWidth = 120;
    const cellHeight = 30;
    const headerHeight = 40;
    const canvasWidth = cellWidth * numCols;
    const canvasHeight = headerHeight + cellHeight * numRows;

    // Création du canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Fond blanc
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Dessin de l'en-tête
    ctx.fillStyle = "#000000";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let col = 0; col < numCols; col++) {
      const x = col * cellWidth;
      const y = 0;
      // Bordure de la cellule d'en-tête
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(x, y, cellWidth, headerHeight);
      // Texte centré dans la cellule
      ctx.fillText(headers[col], x + cellWidth / 2, y + headerHeight / 2);
    }

    // Dessin des cellules du tableau
    ctx.font = "14px Arial";
    for (let row = 0; row < numRows; row++) {
      const rowData = table[row];
      for (let col = 0; col < numCols; col++) {
        const x = col * cellWidth;
        const y = headerHeight + row * cellHeight;
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(x, y, cellWidth, cellHeight);
        // On centre le texte dans la cellule
        const text = rowData[col];
        ctx.fillStyle = "#000000";
        ctx.fillText(text, x + cellWidth / 2, y + cellHeight / 2);
      }
    }

    // Création d'un buffer à partir du canvas (format PNG)
    const buffer = canvas.toBuffer("image/png");

    // Préparation de l'embed
    const headerEmoji = getEmoji("cible");
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`${headerEmoji} Tableau des seuils`)
      .setDescription(
        `Tableau des seuils (${tableType}) pour **${exerciseObj.exercise}** - \`${sexOption}\``,
      )
      .setFooter({
        text: "Données issues de https://strengthlevel.com/",
      });

    // Renvoi de l'embed avec l'image en pièce jointe
    return interaction.reply({
      embeds: [embed],
      files: [{ attachment: buffer, name: "tableau.png" }],
    });
  },
};
