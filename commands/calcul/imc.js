const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

module.exports = {
  async execute(interaction) {
    // Récupération et validation des options
    const poids = interaction.options.getNumber('poids');
    const tailleCm = interaction.options.getNumber('taille');

    if (!poids || poids <= 0) {
      return interaction.reply({
        content: "Oups ! Le poids saisi n'est pas valide. Réessaie en entrant un poids positif.",
        ephemeral: true,
      });
    }
    if (!tailleCm || tailleCm <= 0) {
      return interaction.reply({
        content: "Hé, ta taille doit être un nombre supérieur à zéro (en cm). Merci de vérifier ta saisie.",
        ephemeral: true,
      });
    }

    // Calcul de l'IMC
    const taille = tailleCm / 100;
    const imc = parseFloat((poids / (taille * taille)).toFixed(2));

    // Classification de l'IMC
    let classification;
    if (imc < 18.5) classification = "Maigreur";
    else if (imc < 24.9) classification = "Normal";
    else if (imc < 29.9) classification = "Surpoids";
    else if (imc < 34.9) classification = "Obésité modérée";
    else classification = "Obésité sévère";

    // Fonction pour calculer l'angle (de 0° à 180°) en fonction de l'IMC
    // Zones (en degrés) : 
    //  • 0 à 18,5      => 0°   à 36°
    //  • 18,5 à 25     => 36°  à 72°
    //  • 25 à 30       => 72°  à 108°
    //  • 30 à 40       => 108° à 144°
    //  • ≥ 40          => 144° à 180° (capé à 180°)
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
      

    // Dimensions du canvas (l'image IMC occupe toute la surface)
    const canvasWidth = 900;
    const canvasHeight = 521;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Fond blanc
    ctx.fillStyle = "#2B2D31";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Chargement et dessin de l'image IMC
    let imcImage;
    try {
      imcImage = await loadImage(path.join(__dirname, "..", "..", "images", "imc.png"));
    } catch (error) {
      console.error("Erreur lors du chargement de l'image IMC :", error);
    }
    
    // Dessiner l'image IMC couvrant toute la surface
    const imcImgWidth = 900;
    const imcImgHeight = 521;
    const imcImgX = 0;
    const imcImgY = 0;
    if (imcImage) {
        ctx.drawImage(imcImage, imcImgX, imcImgY, imcImgWidth, imcImgHeight);

        // Calcul de l'angle de la flèche :
        // On récupère d'abord l'angle de la jauge dans [0,180] (avec la segmentation),
        // puis on le transforme pour obtenir un angle final qui soit compris dans [-135° ; -45°].
        // Ainsi, pour un IMC très faible, la flèche pointera vers la gauche (–135°),
        // tandis que pour un IMC élevé, elle pointera vers la droite (–45°).
        const gaugeAngleOriginal = getGaugeAngle(imc); // de 0 à 180°
        // Transformation linéaire :
        // Si gaugeAngleOriginal = 0   => final = -135° (flèche vers la gauche et vers le haut)
        // Si gaugeAngleOriginal = 180 => final = -45°  (flèche vers la droite et vers le haut)
        const finalArrowAngleDeg = gaugeAngleOriginal + 180;
        const finalArrowAngle = finalArrowAngleDeg * Math.PI / 180;


        // Point de départ de la flèche (position choisie pour laisser la place en haut)
        const baseX = imcImgWidth / 2;
        const baseY = 445; // sur la partie basse de l'image pour que l'ensemble pointe bien vers le haut

        // Longueur de la flèche
        const arrowLength = 115;

        ctx.save();
        // Se positionner à la base
        ctx.translate(baseX, baseY);
        // Effectuer la rotation selon l'angle calculé
        ctx.rotate(finalArrowAngle);

        // Tracer la ligne de la flèche (large)
        ctx.strokeStyle = "#595659";
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arrowLength, 0);
        ctx.stroke();

        // Dessin de la tête de la flèche droite (triangle)
        ctx.beginPath();
        ctx.moveTo(arrowLength + 75, 0);
        ctx.lineTo(arrowLength - 25, 25);
        ctx.lineTo(arrowLength - 15, 0);
        ctx.closePath();
        ctx.fillStyle = "#8A878A";
        ctx.fill();

        // Dession de la tête de la flèche gauche (triangle)
        ctx.beginPath();
        ctx.moveTo(arrowLength + 75, 0);
        ctx.lineTo(arrowLength - 25, -25);
        ctx.lineTo(arrowLength - 15, 0);
        ctx.closePath();
        ctx.fillStyle = "#5A575B";
        ctx.fill();
        ctx.restore();
    }
    
    // // Chargement et dessin du logo (superposé en haut à gauche)
    // let logo;
    // try {
    //   logo = await loadImage(path.join(__dirname, "..", "..", "images", "logo-EDT.png"));
    // } catch (error) {
    //   console.error("Erreur lors du chargement du logo :", error);
    // }
    
    // const logoWidth = 100;
    // const logoHeight = 100;
    // const logoX = 10;
    // const logoY = 10;
    // if (logo) {
    //   ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    // }

    // Exporter l'image en buffer pour Discord
    const buffer = canvas.toBuffer();
    const attachment = new AttachmentBuilder(buffer, { name: "imc.png" });

    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("<:info:1343582548353089537> Résultat de votre IMC")
      .setDescription(`- **IMC** : ${imc}\n- **Classification** : ${classification}`)
      .setImage("attachment://imc.png")
      .setFooter({ text: "Calculé selon la formule de l’IMC" });

    await interaction.reply({ embeds: [embed], files: [attachment] });
  },
};
