/**
 * Module de génération d'un tableau visuel des seuils de force.
 *
 * Ce module permet de générer une image (au format PNG) contenant un tableau qui récapitule les seuils
 * pour un exercice donné, en fonction du sexe de l'utilisateur et d'une source choisie ("age" ou "bodyweight").
 *
 * Fonctionnalités principales :
 *   - Récupération des options fournies par l'utilisateur (exercice, sexe, source).
 *   - Lecture et parsing d'un fichier JSON contenant les données des seuils.
 *   - Sélection de l'exercice correspondant (recherche non sensible à la casse) et vérification des données disponibles.
 *   - Génération d'un graphique/tableau en utilisant la bibliothèque Canvas.
 *   - Personnalisation de l'affichage via des couleurs, bordures et textes (avec utilisation d'emojis personnalisés).
 *   - Lecture éventuelle d'une image de l'exercice (si présente) pour l'ajouter en miniature dans l'embed.
 *   - Construction et envoi d'un embed Discord comportant le tableau généré en pièce jointe.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const { getEmoji } = require("../../../utils/emoji");
const headerEmoji = getEmoji("cible");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;

module.exports = {
  /**
   * Exécute la sous-commande "tableau" pour générer le tableau des seuils.
   *
   * @param {Interaction} interaction - L'objet interaction Discord contenant les options de la commande.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'embed envoyé.
   */
  async execute(interaction) {
    // Récupération des options de la sous-commande
    const exerciseName = interaction.options.getString("exercise");
    const sexOption = interaction.options.getString("sex");
    const sourceChoice = interaction.options.getString("source"); // "age" ou "bodyweight"

    // Chargement du fichier JSON contenant les seuils de force
    const dataPath = path.join(__dirname, "../../../data/strengthlevel.json");
    let exercisesData;
    try {
      const rawData = fs.readFileSync(dataPath, "utf8");
      exercisesData = JSON.parse(rawData);
    } catch (error) {
      console.error(
        "⚠️\x1b[31m  Erreur lors de la lecture du fichier JSON :",
        error,
      );
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

    // Recherche de l'exercice dans le JSON (non sensible à la casse)
    const exerciseObj = exercisesData.find(
      (ex) => ex.exercise.toLowerCase() === exerciseName.toLowerCase(),
    );
    if (!exerciseObj) {
      return interaction.reply({
        content: `Erreur : l'exercice "${exerciseName}" est introuvable dans la base de données.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Récupération des seuils pour le sexe choisi
    const thresholds = exerciseObj[sexOption];
    if (!thresholds || !thresholds.bodyweight || !thresholds.age) {
      return interaction.reply({
        content: `Erreur : aucune donnée de seuils n'est disponible pour le sexe "${sexOption}" pour cet exercice.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Sélection de la table de données à utiliser : selon "age" ou "bodyweight"
    let table, tableType;
    if (sourceChoice === "age") {
      table = thresholds.age;
      tableType = "Âge";
    } else {
      table = thresholds.bodyweight;
      tableType = "Poids";
    }

    // Préparation des en-têtes du tableau
    const firstHeader = tableType;
    const headers = [
      firstHeader,
      "Débutant",
      "Novice",
      "Intermédiaire",
      "Avancé",
      "Elite",
    ];
    const numCols = headers.length;
    const numRows = table.length; // Nombre de lignes de la table issue du JSON

    // Dimensions en pixels pour les cellules et le header
    const cellWidth = 120;
    const cellHeight = 30;
    const headerHeight = 40;

    // Configuration de l'espace pour le titre et les marges
    const titleAreaHeight = 30;
    const gapBetweenTitleAndTable = 10;
    const margin = 10;
    const tableWidth = cellWidth * numCols;
    const tableHeight = headerHeight + cellHeight * numRows;
    const canvasWidth = tableWidth + margin * 2;
    const canvasHeight =
      titleAreaHeight + gapBetweenTitleAndTable + tableHeight + margin * 2;

    // Création du canvas et récupération du contexte 2D
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Fond du canvas avec la couleur de fond Discord (#2F3135)
    ctx.fillStyle = "#2F3135";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Affichage du titre (nom de l'exercice) centré en haut
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e7e7e7";
    ctx.fillText(
      exerciseObj.exercise,
      canvasWidth / 2,
      margin + titleAreaHeight / 2,
    );

    // Calcul de la position du tableau dans le canvas
    const tableX = margin;
    const tableY = margin + titleAreaHeight + gapBetweenTitleAndTable;

    /**
     * Fonction utilitaire pour dessiner un rectangle arrondi.
     *
     * @param {CanvasRenderingContext2D} ctx - Le contexte de dessin du canvas.
     * @param {number} x - La coordonnée x de départ.
     * @param {number} y - La coordonnée y de départ.
     * @param {number} width - La largeur du rectangle.
     * @param {number} height - La hauteur du rectangle.
     * @param {number} radius - Le rayon de l'arrondi des coins.
     */
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

    // Dessin du fond du tableau avec coins arrondis et couleur personnalisée (#151619)
    const borderRadius = 10;
    ctx.fillStyle = "#151619";
    drawRoundedRect(ctx, tableX, tableY, tableWidth, tableHeight, borderRadius);

    // Dessin de l'en-tête du tableau
    ctx.font = "bold 16px Arial";
    for (let col = 0; col < numCols; col++) {
      const x = tableX + col * cellWidth;
      const y = tableY;
      // Fond de l'en-tête pour chaque colonne
      ctx.fillStyle = "#181A1E";
      ctx.fillRect(x, y, cellWidth, headerHeight);

      // Optionnel : Dessin de la bordure de la cellule
      ctx.strokeStyle = "#151619";
      ctx.strokeRect(x, y, cellWidth, headerHeight);

      // Texte centré dans l'en-tête
      ctx.fillStyle = "#e7e7e7";
      ctx.fillText(headers[col], x + cellWidth / 2, y + headerHeight / 2);
    }

    // Dessin des cellules de données du tableau
    ctx.font = "14px Arial";
    for (let row = 0; row < numRows; row++) {
      const rowData = table[row];
      for (let col = 0; col < numCols; col++) {
        const x = tableX + col * cellWidth;
        const y = tableY + headerHeight + row * cellHeight;

        // Détermine la couleur de fond : colonne 1 diffère des autres
        ctx.fillStyle = col === 0 ? "#181A1E" : "#202226";
        ctx.fillRect(x, y, cellWidth, cellHeight);

        // Dessine la bordure de chaque cellule
        ctx.strokeStyle = "#151619";
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        // Couleur du texte : premier colonne en clair, les autres en gris
        ctx.fillStyle = col === 0 ? "#e7e7e7" : "#a0a0a0";
        const text = rowData[col] !== undefined ? rowData[col] : "";
        ctx.fillText(String(text), x + cellWidth / 2, y + cellHeight / 2);
      }
    }

    // Génération d'un buffer PNG à partir du canvas
    const tableBuffer = canvas.toBuffer("image/png");

    // Construction du nom de l'image correspondant à l'exercice
    // Remplacement des espaces par des underscores pour générer un nom de fichier valide
    const exerciseImageName = exerciseObj.exercise.replace(/ /g, "_") + ".png";
    const exerciseImagePath = path.join(
      __dirname,
      "../../../images/strengthlevel",
      exerciseImageName,
    );

    // Lecture de l'image de l'exercice si elle existe
    let exerciseImageBuffer;
    try {
      exerciseImageBuffer = fs.readFileSync(exerciseImagePath);
    } catch (error) {
      console.error(
        `⚠️\x1b[31m  Erreur lors de la lecture de l'image ${exerciseImageName}:`,
        error,
      );
    }

    // Préparation de l'embed Discord pour présenter le tableau des seuils
    const embed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle(`${headerEmoji} Tableau des seuils`)
      .setDescription(
        `Tableau des seuils (${tableType}) pour **${exerciseObj.exercise}** - \`${sexOption}\``,
      )
      .setFooter({
        text: "Données issues de https://strengthlevel.com/",
      });

    // Si l'image de l'exercice a été lue, on l'utilise comme miniature dans l'embed
    if (exerciseImageBuffer) {
      embed.setThumbnail("attachment://exercise.png");
    }

    // Préparation des fichiers joints : le tableau généré et éventuellement l'image de l'exercice
    const attachments = [{ attachment: tableBuffer, name: "tableau.png" }];
    if (exerciseImageBuffer) {
      attachments.push({
        attachment: exerciseImageBuffer,
        name: "exercise.png",
      });
    }

    // Envoi de l'embed avec les pièces jointes en réponse à l'interaction
    return interaction.reply({
      embeds: [embed],
      files: attachments,
    });
  },
};
