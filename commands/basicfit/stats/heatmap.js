const { AttachmentBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { createCanvas } = require("canvas");

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
        .setColor("#FF0000")
        .setTitle("Données introuvables")
        .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
        .setDescription(
          `Aucune donnée trouvée pour **${targetUser.username}**.\nVeuillez téléverser vos données avec \`/basicfit upload\`.`
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
      .setColor("#FFA500")
      .setTitle("Heatmap des visites")
      .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
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
  const padding = 60; // Utilisé pour la marge à gauche ET à droite
  const paddingBottom = 5; // Utilisé pour la marge en bas
  const numWeeks = 53; 
  // Calcul de la largeur de la grille
  const gridWidth = numWeeks * (cellSize + cellGap) - cellGap;
  // La largeur totale du canvas inclut le padding gauche et droit
  const canvasWidth = padding + gridWidth + padding; 

  // Zone réservée au titre en haut
  const titleArea = 50;
  
  // Regroupement des visites par année (chaque entrée possède une date au format "DD-MM-YYYY")
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
  // Espace requis par bloc d'année, incluant la légende des mois (20px) et un petit margin (10px)
  const yPerYear = gridHeight + 30; 
  // Calcul de la hauteur du canvas : titre, bloc(s) d'année, et un padding en bas
  const canvasHeight = titleArea + sortedYears.length * yPerYear + paddingBottom;

  // Création du canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Fond sombre
  ctx.fillStyle = "#2c2f33";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Titre centré (placé à 30px pour laisser un margin en haut)
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
    ctx.fillText(year, padding - 55, yOffset + gridHeight / 2);

    // Dessin de la grille de l'année
    drawYearHeatmap(ctx, yearData[year], yOffset, cellSize, cellGap, padding);

    // Légende des mois en dessous de la grille
    drawMonths(ctx, yOffset, cellSize, cellGap, padding);
    
    // Passage au bloc de l'année suivante
    yOffset += yPerYear;
  }

  return canvas.toBuffer("image/png");
}

function drawYearHeatmap(ctx, data, yOffset, cellSize, cellGap, padding) {
  // Affichage des labels des jours (du haut vers le bas)
  const jours = ["L", "M", "M", "J", "V", "S", "D"];
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px Arial";
  ctx.textAlign = "right";
  jours.forEach((jour, index) => {
    ctx.fillText(
      jour,
      padding - 10,
      yOffset + index * (cellSize + cellGap) + cellSize / 2
    );
  });

  // Dessiner la grille de la heatmap (53 semaines x 7 jours)
  for (let semaine = 0; semaine < 53; semaine++) {
    for (let jour = 0; jour < 7; jour++) {
      const dayOfYear = semaine * 7 + jour + 1;
      const intensite = data[dayOfYear] || 0;
      if (intensite === 0) {
        ctx.fillStyle = "#212121";
      } else if (intensite === 1) {
        ctx.fillStyle = "#FB7819";
      } else {
        ctx.fillStyle = "#FF6500";
      }
      const x = padding + semaine * (cellSize + cellGap);
      const y = yOffset + jour * (cellSize + cellGap);
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }
}

function drawMonths(ctx, yOffset, cellSize, cellGap, padding) {
  const mois = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Août", "Sept", "Oct", "Nov", "Déc"
  ];
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  // Positions indiquées en semaines, à ajuster si besoin
  const positionsMois = [0, 4, 8, 13, 17, 21, 26, 30, 35, 39, 43, 48];
  positionsMois.forEach((semaine, index) => {
    const x = padding + semaine * (cellSize + cellGap) + cellSize / 2;
    const y = yOffset + 7 * (cellSize + cellGap) + 15;
    ctx.fillText(mois[index], x, y);
  });
}

function getDayOfYear(date) {
  const debut = new Date(date.getFullYear(), 0, 0);
  const diff =
    date - debut +
    (debut.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
