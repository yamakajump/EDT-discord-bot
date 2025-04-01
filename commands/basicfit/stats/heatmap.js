const { AttachmentBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { createCanvas } = require("canvas");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

/**
 * Exécute la commande affichant la heatmap des visites.
 *
 * @param {Object} interaction - L'interaction Discord.
 * @param {Object} targetUser - L'utilisateur cible.
 * @param {Object} jsonData - Les données JSON des statistiques.
 * @param {string} jsonDate - La date associée aux statistiques.
 */
module.exports = {
  async execute(interaction, targetUser, jsonData, jsonDate) {
    // Vérification de l'existence des données
    if (!jsonData) {
      const noDataEmbed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle("Données introuvables")
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          `Aucune donnée trouvée pour **${targetUser.username}**.\nVeuillez téléverser vos données avec \`/basicfit upload\`.`,
        );
      return interaction.reply({
        embeds: [noDataEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Récupération du pseudo dans le serveur (ou valeur de repli)
    const memberDisplayName =
      (interaction.guild &&
        interaction.guild.members.cache.get(targetUser.id)?.displayName) ||
      targetUser.username;

    // Génération de la heatmap avec une taille dynamique
    const imageBuffer = generateHeatmap(jsonData, memberDisplayName);
    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "heatmap.png",
    });

    const heatmapEmbed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle("Heatmap des visites")
      .setThumbnail(thumbnailEmbed)
      .setDescription(`Voici la heatmap des visites pour <@${targetUser.id}>.`)
      .setImage("attachment://heatmap.png")
      .setFooter({
        text: `Statistiques BasicFit de ${targetUser.username} du ${jsonDate}`,
      });

    return interaction.reply({ embeds: [heatmapEmbed], files: [attachment] });
  },
};

function generateHeatmap(jsonData, displayName) {
  // Configuration de la heatmap
  const cellSize = 15;
  const cellGap = 3;
  const padding = 60; // marge à gauche et à droite
  const paddingBottom = 5; // marge en bas
  const numWeeks = 53;

  // Calcul de la largeur de la grille : nb semaines * (taille + gap) (dernier gap non inclus)
  const gridWidth = numWeeks * (cellSize + cellGap) - cellGap;
  // Largeur totale du canvas (padding gauche + grille + padding droite)
  const canvasWidth = padding + gridWidth + padding;

  // Zone réservée au titre en haut
  const titleArea = 50;

  // Regroupement des visites par année (date format "DD-MM-YYYY")
  const visits = jsonData.visits;
  const yearData = {};
  visits.forEach((entry) => {
    const [day, month, year] = entry.date.split("-");
    const dateStr = `${year}-${month}-${day}`;
    const date = new Date(dateStr);
    const dayOfYear = getDayOfYear(date);
    if (!yearData[year]) yearData[year] = {};
    yearData[year][dayOfYear] = (yearData[year][dayOfYear] || 0) + 1;
  });

  // Récupération et tri des années
  const sortedYears = Object.keys(yearData).sort();

  // Hauteur de la grille pour chaque année (7 jours)
  const gridHeight = 7 * (cellSize + cellGap) - cellGap;
  // Espace requis par bloc d'année, incluant la légende des mois (20px) et un margin (10px)
  const yPerYear = gridHeight + 30;
  // Calcul de la hauteur totale du canvas
  const canvasHeight =
    titleArea + sortedYears.length * yPerYear + paddingBottom;

  // Création du canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Fond sombre
  ctx.fillStyle = "#2c2f33";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Titre centré
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "20px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Heatmap de ${displayName}`, canvasWidth / 2, 30);

  // Dessin de chaque bloc d'année
  let yOffset = titleArea;
  for (const year of sortedYears) {
    // Affichage de l'année à gauche (centré verticalement par rapport à la grille)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "14px Arial";
    ctx.textAlign = "left";
    // La position x négative permet de placer l'année avec une marge à droite
    ctx.fillText(year, padding - 55, yOffset + gridHeight / 2);

    // Dessin de la grille avec gestion des cases hors de l'année
    drawYearHeatmap(
      ctx,
      yearData[year],
      year,
      yOffset,
      cellSize,
      cellGap,
      padding,
      numWeeks,
    );

    // Légende des mois sous la grille
    drawMonths(ctx, yOffset, cellSize, cellGap, padding);

    // Passage au bloc de l'année suivante
    yOffset += yPerYear;
  }

  return canvas.toBuffer("image/png");
}

/**
 * Dessine la grille pour une année donnée.
 * Pour chaque cellule, on calcule la date correspondante.
 * Si la date n'appartient pas à l'année (avant le 1er janvier ou après le 31 décembre),
 * la case est coloriée différemment.
 *
 * @param {CanvasRenderingContext2D} ctx - Le contexte du canvas.
 * @param {Object} data - Les visites de l'année (clé = jour de l'année).
 * @param {string} year - L'année en cours.
 * @param {number} yOffset - L'ordonnée de départ du bloc.
 * @param {number} cellSize - La taille d'une cellule.
 * @param {number} cellGap - L'espacement entre cellules.
 * @param {number} padding - Marge à gauche (début de la grille).
 * @param {number} numWeeks - Nombre de semaines (colonnes).
 */
function drawYearHeatmap(
  ctx,
  data,
  year,
  yOffset,
  cellSize,
  cellGap,
  padding,
  numWeeks,
) {
  // Déterminer l'indice du jour de la semaine du 1er janvier
  const firstJan = new Date(year, 0, 1);
  // Pour notre grille, 0 = Lundi, ..., 6 = Dimanche
  const jan1Index = (firstJan.getDay() + 6) % 7;

  // Affichage des labels des jours (affichés en marge à gauche)
  const jours = ["L", "M", "M", "J", "V", "S", "D"];
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px Arial";
  ctx.textAlign = "right";
  jours.forEach((jour, index) => {
    ctx.fillText(
      jour,
      padding - 10,
      yOffset + index * (cellSize + cellGap) + cellSize / 2,
    );
  });

  // Parcourir la grille (53 semaines et 7 jours)
  for (let week = 0; week < numWeeks; week++) {
    for (let day = 0; day < 7; day++) {
      // Calculer la date correspondant à la cellule
      const cellDate = new Date(year, 0, 1 - jan1Index + week * 7 + day);
      let fillStyle;
      if (cellDate.getFullYear() != Number(year)) {
        // Si la date n'appartient pas à l'année : couleur pour les cases en dehors de l'année
        fillStyle = "#414141";
      } else {
        // Récupérer le numéro du jour dans l'année (1 à 365/366)
        const dYear = getDayOfYear(cellDate);
        const intensite = data[dYear] || 0;
        if (intensite === 0) {
          fillStyle = "#212121";
        } else if (intensite === 1) {
          fillStyle = "#FB7819";
        } else {
          fillStyle = "#FF6500";
        }
      }
      ctx.fillStyle = fillStyle;
      const x = padding + week * (cellSize + cellGap);
      const y = yOffset + day * (cellSize + cellGap);
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }
}

/**
 * Affiche la légende des mois sous la grille.
 *
 * @param {CanvasRenderingContext2D} ctx - Le contexte du canvas.
 * @param {number} yOffset - L'ordonnée de départ du bloc d'année.
 * @param {number} cellSize - La taille d'une cellule.
 * @param {number} cellGap - L'espacement entre cellules.
 * @param {number} padding - La marge à gauche (début de la grille).
 */
function drawMonths(ctx, yOffset, cellSize, cellGap, padding) {
  const mois = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sept",
    "Oct",
    "Nov",
    "Déc",
  ];
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  // Positions en semaines dans la grille (ajustables selon le rendu souhaité)
  const positionsMois = [0, 4, 8, 13, 17, 21, 26, 30, 35, 39, 43, 48];
  positionsMois.forEach((week, index) => {
    const x = padding + week * (cellSize + cellGap) + cellSize / 2;
    const y = yOffset + 7 * (cellSize + cellGap) + 15;
    ctx.fillText(mois[index], x, y);
  });
}

/**
 * Retourne le numéro du jour dans l'année (de 1 à 365 ou 366)
 *
 * @param {Date} date - La date à convertir.
 * @returns {number} - Le numéro du jour dans l'année.
 */
function getDayOfYear(date) {
  const debut = new Date(date.getFullYear(), 0, 0);
  const diff =
    date -
    debut +
    (debut.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
