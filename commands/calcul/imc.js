/**
 * Module de calcul et affichage de l'IMC avec une illustration graphique.
 *
 * Ce module récupère le poids et la taille de l'utilisateur via une commande Discord.
 * Il valide ces données, calcule l'IMC (Indice de Masse Corporelle) et détermine la classification associée.
 *
 * Ensuite, à l'aide de la librairie "canvas", il crée une image graphique qui représente l'IMC
 * sous la forme d'une jauge. La jauge affiche une flèche positionnée en fonction de l’IMC calculé.
 *
 * Le code procède ainsi :
 *   1. Récupération et validation des entrées (poids et taille).
 *   2. Calcul de l'IMC et détermination de la classification.
 *   3. Détermination de l'angle de la flèche à partir de l'IMC à l'aide de la fonction "getGaugeAngle".
 *   4. Création d'un canvas en définissant un fond et en dessinant l'image de fond IMC.
 *   5. Dessin de la flèche indiquant l'IMC sur le canvas avec rotation et création d'une double tête.
 *   6. Exportation du canvas en buffer et création d'une pièce jointe pour Discord.
 *   7. Création d'un embed contenant le résultat de l'IMC, la classification et l'image générée.
 *
 * Le résultat final est envoyé en réponse à l'interaction Discord.
 */

const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
  async execute(interaction) {
    // Récupération et validation des options saisies par l'utilisateur
    const poids = interaction.options.getNumber('poids');
    const tailleCm = interaction.options.getNumber('taille');

    if (!poids || poids <= 0) {
      return interaction.reply({
        content: "Oups ! Le poids saisi n'est pas valide. Réessaie en entrant un poids positif.",
        flags: MessageFlags.Ephemeral
      });
    }
    if (!tailleCm || tailleCm <= 0) {
      return interaction.reply({
        content: "Hé, ta taille doit être un nombre supérieur à zéro (en cm). Merci de vérifier ta saisie.",
        flags: MessageFlags.Ephemeral
      });
    }

    // Calcul de l'IMC
    const taille = tailleCm / 100; // conversion de la taille en mètres
    const imc = parseFloat((poids / (taille * taille)).toFixed(2));

    // Classification de l'IMC selon les standards
    let classification;
    if (imc < 18.5) classification = "Maigreur";
    else if (imc < 24.9) classification = "Normal";
    else if (imc < 29.9) classification = "Surpoids";
    else if (imc < 34.9) classification = "Obésité modérée";
    else classification = "Obésité sévère";

    /**
     * Calcule l'angle de la jauge (de 0° à 180°) en fonction de l'IMC.
     *
     * Les zones définies en degrés sont les suivantes :
     *  • 0 à 18,5      => 0°   à 36°
     *  • 18,5 à 25     => 36°  à 72°
     *  • 25 à 30       => 72°  à 108°
     *  • 30 à 40       => 108° à 144°
     *  • ≥ 40          => 144° à 180° (capé à 180°)
     *
     * @param {number} imcValue La valeur de l'IMC à convertir en angle.
     * @returns {number} L'angle de la jauge en degrés.
     */
    function getGaugeAngle(imcValue) {
      if (imcValue <= 18.5) {
        return (imcValue / 18.5) * 36;
      } else if (imcValue <= 25) {
        return 36 + ((imcValue - 18.5) / (25 - 18.5)) * 36;
      } else if (imcValue <= 30) {
        return 72 + ((imcValue - 25) / 5) * 36;
      } else if (imcValue <= 40) {
        return 108 + ((imcValue - 30) / 10) * 36;
      } else if (imcValue <= 50) {
        return 144 + ((imcValue - 40) / 10) * 36;
      } else {
        return 180;
      }
    }

    // Création du canvas pour l'image finale (dimensions définies en pixels)
    const canvasWidth = 900;
    const canvasHeight = 521;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Définition du fond (ici une couleur de fond personnalisée)
    ctx.fillStyle = "#2B2D31";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Chargement de l'image de fond "imc.png" qui va occuper toute la surface du canvas
    let imcImage;
    try {
      imcImage = await loadImage(path.join(__dirname, "..", "..", "images", "imc.png"));
    } catch (error) {
      console.error("Erreur lors du chargement de l'image IMC :", error);
    }
    
    // Dessin de l'image de fond couvrant le canvas
    const imcImgWidth = 900;
    const imcImgHeight = 521;
    const imcImgX = 0;
    const imcImgY = 0;
    if (imcImage) {
      ctx.drawImage(imcImage, imcImgX, imcImgY, imcImgWidth, imcImgHeight);

      /**
       * Calcul de l'angle final de la flèche.
       *
       * On démarre par obtenir l'angle de la jauge (0 à 180°) via getGaugeAngle.
       * Cet angle est ensuite transformé pour déterminer un angle final compris dans [-135° ; -45°]
       * afin que la flèche pointe vers la gauche pour un IMC faible et vers la droite pour un IMC élevé.
       *
       * Ici, la transformation consiste à additionner 180° à l'angle initial et le convertir en radians.
       */
      const gaugeAngleOriginal = getGaugeAngle(imc); // angle initial de 0 à 180°
      const finalArrowAngleDeg = gaugeAngleOriginal + 180; // Transformation vers [-135° ; -45°] (en°)
      const finalArrowAngle = finalArrowAngleDeg * (Math.PI / 180); // conversion en radians

      // Position de base de la flèche sur l'image (centre horizontal, position basse verticalement)
      const baseX = imcImgWidth / 2;
      const baseY = 445; // position choisie pour bien diriger la flèche vers le haut

      // Longueur de la flèche
      const arrowLength = 115;

      // Sauvegarde de l'état graphique courant, afin de revenir après transformation
      ctx.save();
      // Translation du contexte au point de départ de la flèche
      ctx.translate(baseX, baseY);
      // Rotation du contexte en fonction de l'angle final
      ctx.rotate(finalArrowAngle);

      // Dessin de la ligne de la flèche
      ctx.strokeStyle = "#595659";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(arrowLength, 0);
      ctx.stroke();

      // Dessin de la tête de la flèche côté droit (triangle)
      ctx.beginPath();
      ctx.moveTo(arrowLength + 75, 0);
      ctx.lineTo(arrowLength - 25, 25);
      ctx.lineTo(arrowLength - 15, 0);
      ctx.closePath();
      ctx.fillStyle = "#8A878A";
      ctx.fill();

      // Dessin de la tête de la flèche côté gauche (triangle)
      ctx.beginPath();
      ctx.moveTo(arrowLength + 75, 0);
      ctx.lineTo(arrowLength - 25, -25);
      ctx.lineTo(arrowLength - 15, 0);
      ctx.closePath();
      ctx.fillStyle = "#5A575B";
      ctx.fill();

      // Restauration de l'état graphique initial
      ctx.restore();
    }
    
    // Vous pouvez désactiver ou activer le chargement du logo si nécessaire.
    // Ci-dessous un exemple commenté de chargement et dessin du logo en haut à gauche.
    /*
    let logo;
    try {
      logo = await loadImage(path.join(__dirname, "..", "..", "images", "logo-EDT.png"));
    } catch (error) {
      console.error("Erreur lors du chargement du logo :", error);
    }
    
    const logoWidth = 100;
    const logoHeight = 100;
    const logoX = 10;
    const logoY = 10;
    if (logo) {
      ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    }
    */

    // Exportation de l'image du canvas sous forme de buffer
    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: "imc.png" });

    // Création de l'embed qui contient le résultat de l'IMC et l'image générée
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("<:info:1343582548353089537> Résultat de votre IMC")
      .setDescription(`- **IMC** : ${imc}\n- **Classification** : ${classification}`)
      .setImage("attachment://imc.png")
      .setFooter({ text: "Calculé selon la formule de l’IMC" });

    // Envoi de l'embed et de la pièce jointe en réponse à l'interaction
    await interaction.reply({ embeds: [embed], files: [attachment] });
  },
};
