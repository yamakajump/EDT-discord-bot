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
      tableType = "Poids";
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

    // Dimensions en pixels pour chaque cellule
    const cellWidth = 120;
    const cellHeight = 30;
    const headerHeight = 40;

    // Espace supplémentaire pour afficher le titre (nom de l'exercice)
    const titleAreaHeight = 30;
    const gapBetweenTitleAndTable = 10;

    // Marges autour du tableau
    const margin = 10;
    const tableWidth = cellWidth * numCols;
    const tableHeight = headerHeight + cellHeight * numRows;

    // Dimensions totales du canvas
    const canvasWidth = tableWidth + margin * 2;
    const canvasHeight =
      titleAreaHeight + gapBetweenTitleAndTable + tableHeight + margin * 2;

    // Création du canvas
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Fond du canevas en #2F3135
    ctx.fillStyle = "#2F3135";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Affichage du titre (nom de l'exercice) en haut avec du texte en #e7e7e7
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e7e7e7";
    ctx.fillText(
      exerciseObj.exercise,
      canvasWidth / 2,
      margin + titleAreaHeight / 2,
    );

    // Position du tableau
    const tableX = margin;
    const tableY = margin + titleAreaHeight + gapBetweenTitleAndTable;

    // Fonction utilitaire pour dessiner un rectangle arrondi
    function drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height,
      );
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
    }

    // Dessin du fond du tableau (avec bords arrondis) en #151619
    const borderRadius = 10;
    ctx.fillStyle = "#151619";
    drawRoundedRect(ctx, tableX, tableY, tableWidth, tableHeight, borderRadius);

    // Dessin de l'en-tête du tableau
    // Texte de l'en-tête en #e7e7e7
    ctx.font = "bold 16px Arial";
    for (let col = 0; col < numCols; col++) {
      const x = tableX + col * cellWidth;
      const y = tableY;
      // Fond de la cellule d'en-tête en #181A1E
      ctx.fillStyle = "#181A1E";
      ctx.fillRect(x, y, cellWidth, headerHeight);

      // Bordure de la cellule d'en-tête (optionnelle)
      ctx.strokeStyle = "#151619";
      ctx.strokeRect(x, y, cellWidth, headerHeight);

      // Texte centré dans l'en-tête
      ctx.fillStyle = "#e7e7e7";
      ctx.fillText(headers[col], x + cellWidth / 2, y + headerHeight / 2);
    }

    // Dessin des cellules de données
    ctx.font = "14px Arial";
    for (let row = 0; row < numRows; row++) {
      const rowData = table[row];
      for (let col = 0; col < numCols; col++) {
        const x = tableX + col * cellWidth;
        const y = tableY + headerHeight + row * cellHeight;

        // Fond de la cellule : première colonne = #181A1E, sinon #202226
        ctx.fillStyle = col === 0 ? "#181A1E" : "#202226";
        ctx.fillRect(x, y, cellWidth, cellHeight);

        // Bordure de la cellule
        ctx.strokeStyle = "#151619";
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Choix de la couleur du texte :
        // Pour la première colonne (et on pourrait appliquer pareil pour d'autres éléments spécifiques)
        // on utilise #e7e7e7, sinon pour le reste on utilise #a0a0a0
        ctx.fillStyle = col === 0 ? "#e7e7e7" : "#a0a0a0";
        const text = rowData[col] !== undefined ? rowData[col] : "";
        ctx.fillText(String(text), x + cellWidth / 2, y + cellHeight / 2);
      }
    }

    // Création d'un buffer à partir du canvas (format PNG)
    const tableBuffer = canvas.toBuffer("image/png");

    // Construction du nom de l'image de l'exercice.
    // Remplace les espaces par des underscores et ajoute l'extension ".png"
    const exerciseImageName = exerciseObj.exercise.replace(/ /g, "_") + ".png";
    const exerciseImagePath = path.join(
      __dirname,
      "../../../images/strengthlevel",
      exerciseImageName,
    );

    // Lecture du buffer de l'image de l'exercice (s'il existe)
    let exerciseImageBuffer;
    try {
      exerciseImageBuffer = fs.readFileSync(exerciseImagePath);
    } catch (error) {
      console.error(
        `Erreur lors de la lecture de l'image ${exerciseImageName}:`,
        error,
      );
    }

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

    // Si l'image de l'exercice a été trouvée, on l'ajoute en miniature via setThumbnail
    if (exerciseImageBuffer) {
      embed.setThumbnail("attachment://exercise.png");
    }

    // Envoi de l'embed avec l'image du tableau (et celle de l'exercice si présente) en pièces jointes
    const attachments = [{ attachment: tableBuffer, name: "tableau.png" }];
    if (exerciseImageBuffer) {
      attachments.push({
        attachment: exerciseImageBuffer,
        name: "exercise.png",
      });
    }

    return interaction.reply({
      embeds: [embed],
      files: attachments,
    });
  },
};
