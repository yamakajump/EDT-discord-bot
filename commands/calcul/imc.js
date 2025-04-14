/**
 * Module de calcul et affichage de l'IMC avec une illustration graphique.
 *
 * Ce module récupère le poids et la taille de l'utilisateur via une commande Discord.
 * Après validation humoristique des valeurs saisies, il fusionne ces données avec celles en base
 * via handleUserPhysique, puis exécute le calcul de l'IMC et génère un visuel.
 */

const { EmbedBuilder, AttachmentBuilder, MessageFlags } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

// 1. Importation des dépendances et configuration du style
const { handleUserPhysique } = require("../../logic/handlePhysiqueData");
const style = require("../../config/style.json");
const colorEmbed = style.colorEmbed;

const { getEmoji } = require("../../utils/emoji");
const infoEmoji = getEmoji("info");

module.exports = {
  async execute(interaction) {
    // 2. Récupération des données fournies par l'utilisateur dans providedData
    const providedData = {
      poids: interaction.options.getNumber("poids"),
      taille: interaction.options.getNumber("taille"),
    };

    // 3. Validation humoristique des valeurs saisies
    if (providedData.poids != null && providedData.poids <= 0) {
      return interaction.reply({
        content:
          "Attention ! Un poids négatif, c'est pas de la magie, c'est juste bizarre. Mettez un nombre positif, s'il vous plaît !",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (providedData.taille != null && providedData.taille <= 0) {
      return interaction.reply({
        content:
          "Hey ! Ta taille doit être supérieure à zéro (en cm), sinon on passera pour des nains. Réessaie !",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 4. Mise en place du callback de calcul
    const executeCalculationCallback = async (
      interactionContext,
      finalData,
    ) => {
      // Vérification des champs manquants dans finalData
      const missingFields = [];
      if (finalData.poids === null || finalData.poids === undefined) {
        missingFields.push("poids");
      }
      if (finalData.taille === null || finalData.taille === undefined) {
        missingFields.push("taille");
      }
      if (missingFields.length > 0) {
        const errorMessage = {
          content: `Les champs suivants sont manquants : ${missingFields.join(
            ", ",
          )}. Veuillez les renseigner.`,
          flags: MessageFlags.Ephemeral,
        };
        if (interactionContext.replied || interactionContext.deferred) {
          return interactionContext.channel.send(errorMessage);
        } else {
          return interactionContext.reply(errorMessage);
        }
      }

      // Tous les champs requis sont présents, on procède au calcul.
      const poids = finalData.poids;
      const tailleCm = finalData.taille;
      const taille = tailleCm / 100; // Conversion en mètres
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

      // Création du canvas pour l'image finale
      const canvasWidth = 900;
      const canvasHeight = 521;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Définition du fond (ici une couleur de fond personnalisée)
      ctx.fillStyle = "#2B2D31";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Chargement de l'image de fond "imc.png"
      let imcImage;
      try {
        imcImage = await loadImage(
          path.join(__dirname, "..", "..", "images", "imc.png"),
        );
      } catch (error) {
        console.error("Erreur lors du chargement de l'image IMC :", error);
      }

      // Dessin de l'image de fond sur le canvas
      const imcImgWidth = 900;
      const imcImgHeight = 521;
      if (imcImage) {
        ctx.drawImage(imcImage, 0, 0, imcImgWidth, imcImgHeight);

        /**
         * Calcul de l'angle final de la flèche.
         * On obtient d'abord l'angle de la jauge (0 à 180°) via getGaugeAngle.
         * Cet angle est ensuite transformé pour déterminer un angle final (en radians)
         * qui permettra de pointer vers la gauche pour un IMC faible et vers la droite pour un IMC élevé.
         */
        const gaugeAngleOriginal = getGaugeAngle(imc);
        const finalArrowAngleDeg = gaugeAngleOriginal + 180;
        const finalArrowAngle = finalArrowAngleDeg * (Math.PI / 180);

        // Position de base de la flèche et longueur de la flèche
        const baseX = imcImgWidth / 2;
        const baseY = 445;
        const arrowLength = 115;

        // Sauvegarde de l'état graphique et transformation
        ctx.save();
        ctx.translate(baseX, baseY);
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

      // Exportation de l'image en buffer et création de la pièce jointe Discord
      const buffer = canvas.toBuffer();
      const attachment = new AttachmentBuilder(buffer, { name: "imc.png" });

      // Création de l'embed de réponse
      const embed = new EmbedBuilder()
        .setColor(colorEmbed)
        .setTitle(`${infoEmoji} Résultat de votre IMC`)
        .setDescription(
          `- **IMC** : ${imc}\n- **Classification** : ${classification}`,
        )
        .setImage("attachment://imc.png")
        .setFooter({ text: "Calculé selon la formule de l’IMC" });

      // Envoi de l'embed en fonction du contexte de la réponse
      if (interactionContext.replied || interactionContext.deferred) {
        await interactionContext.channel.send({
          embeds: [embed],
          files: [attachment],
        });
      } else {
        await interactionContext.reply({
          embeds: [embed],
          files: [attachment],
        });
      }
    };

    // 5. Exécution de la logique physique : fusion des données et calcul via handleUserPhysique
    await handleUserPhysique(
      interaction,
      providedData,
      executeCalculationCallback,
    );
  },
};
