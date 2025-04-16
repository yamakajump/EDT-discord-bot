/**
 * Module de génération d'un tableau visuel des seuils de force.
 *
 * Ce module permet de générer une image (au format PNG) contenant un tableau qui récapitule les seuils
 * pour un exercice donné, en fonction du sexe de l'utilisateur et d'une source choisie ("age" ou "bodyweight").
 *
 * La séquence est la suivante :
 *   1. Importation des dépendances et configuration du style.
 *   2. Récupération des données fournies par l'utilisateur.
 *   3. Validation humoristique des valeurs saisies.
 *   4. Mise en place du callback de calcul (executeCalculationCallback) qui :
 *      - Vérifie que les champs requis existent dans l'objet final.
 *      - Exécute la logique spécifique (calculs, génération d'un embed, etc.).
 *   5. Appel à la logique de gestion du physique via handleUserPhysique.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

// 1. Importation des dépendances de la logique physique et du style
const { handleUserPhysique } = require("../../../logic/handlePhysiqueData");
const { findSimilarExercise } = require("../../../utils/strengthlevel");
const { getEmoji } = require("../../../utils/emoji");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;

const headerEmoji = getEmoji("cible");

module.exports = {
  /**
   * Exécute la sous-commande "tableau" pour générer le tableau des seuils.
   *
   * @param {Interaction} interaction - L'objet interaction Discord contenant les options de la commande.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'embed envoyé.
   */
  async execute(interaction) {
    // 2. Récupération des données fournies par l'utilisateur
    const providedData = {
      exercise: interaction.options.getString("exercise"),
      sexe: interaction.options.getString("sexe"),
      source: interaction.options.getString("source"), // "age" ou "bodyweight"
      langue: interaction.options.getString("langue") || "FR",
    };

    // 3. Validation humoristique des valeurs saisies
    if (!providedData.exercise || providedData.exercise.trim() === "") {
      return interaction.reply({
        content:
          "Attention ! Le nom de l'exercice est manquant ou vide. Même Hulk sait qu'il faut le préciser !",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!providedData.sexe || providedData.sexe.trim() === "") {
      return interaction.reply({
        content:
          "Attention ! Vous devez préciser le sexe (H ou F). Même Batman ne peut pas deviner !",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!providedData.source || providedData.source.trim() === "") {
      return interaction.reply({
        content:
          "Oups ! Vous devez choisir une source ('age' ou 'bodyweight'). Ce n'est pas de la magie, c'est de l'option !",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 4. Mise en place du callback de calcul
    const executeCalculationCallback = async (
      interactionContext,
      finalData,
    ) => {
      // Vérification des champs requis dans l'objet final
      const missingFields = [];
      if (!finalData.exercise || finalData.exercise.trim() === "") {
        missingFields.push("exercise");
      }
      if (!finalData.sexe || finalData.sexe.trim() === "") {
        missingFields.push("sexe");
      }
      if (!finalData.source || finalData.source.trim() === "") {
        missingFields.push("source");
      }

      if (missingFields.length > 0) {
        const errorMessage = {
          content: `Les champs suivants sont manquants : ${missingFields.join(
            ", ",
          )}. Veuillez les renseigner.`,
          flags: MessageFlags.Ephemeral,
        };

        if (interactionContext.replied || interactionContext.deferred) {
          try {
            await interactionContext.deleteReply();
          } catch (error) {
            console.error(
              "Erreur lors de la suppression de la réponse :",
              error,
            );
          }
          return interactionContext.channel.send(errorMessage);
        } else {
          return interactionContext.reply(errorMessage);
        }
      }

      // Récupération des options à partir de finalData
      const exerciseName = finalData.exercise;
      const sexOption = finalData.sexe;
      const sourceChoice = finalData.source;
      const langue = finalData.langue;

      // Recherche de l'exercice dans le JSON en utilisant la similarité sur "exerciceFR" et "exerciceEN"
      const exerciseObj = findSimilarExercise(exerciseName);
      if (!exerciseObj) {
        return interactionContext.reply({
          content: `Erreur : l'exercice "${exerciseName}" est introuvable dans la base de données.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Détermination du nom à afficher et de l'image associée à l'exercice
      const imageNameForEmbed =
        exerciseObj.exerciceEN && exerciseObj.exerciceEN.trim() !== ""
          ? exerciseObj.exerciceEN
          : exerciseObj.exerciceFR;
      const exerciseImageName = imageNameForEmbed.replace(/ /g, "_") + ".png";

      // Par défaut, affichage en français, sauf si la langue est définie sur "en" et que le nom anglais existe
      let displayExerciseName = exerciseObj.exerciceFR;
      if (langue && langue.toLowerCase() === "en" && exerciseObj.exerciceEN) {
        displayExerciseName = exerciseObj.exerciceEN;
      }

      // Récupération des seuils correspondant au sexe choisi
      const thresholds = exerciseObj[sexOption];
      if (!thresholds || !thresholds.bodyweight || !thresholds.age) {
        return interactionContext.reply({
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

      // Préparation du tableau
      const headers = [
        tableType,
        "Débutant",
        "Novice",
        "Intermédiaire",
        "Avancé",
        "Elite",
      ];
      const numCols = headers.length;
      const numRows = table.length;
      const cellWidth = 120;
      const cellHeight = 30;
      const headerHeight = 40;
      const titleAreaHeight = 30;
      const gapBetweenTitleAndTable = 10;
      const margin = 10;
      const tableWidth = cellWidth * numCols;
      const tableHeight = headerHeight + cellHeight * numRows;
      const canvasWidth = tableWidth + margin * 2;
      const canvasHeight =
        titleAreaHeight + gapBetweenTitleAndTable + tableHeight + margin * 2;

      // Création du canvas pour le tableau
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Fond du canvas (couleur Discord par défaut)
      ctx.fillStyle = "#2F3135";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Affichage du titre centré (nom de l'exercice)
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e7e7e7";
      ctx.fillText(
        displayExerciseName,
        canvasWidth / 2,
        margin + titleAreaHeight / 2,
      );

      // Position du tableau
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
       * @param {number} radius - Le rayon des coins arrondis.
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

      // Dessin du fond du tableau avec coins arrondis
      const borderRadius = 10;
      ctx.fillStyle = "#151619";
      drawRoundedRect(
        ctx,
        tableX,
        tableY,
        tableWidth,
        tableHeight,
        borderRadius,
      );

      // Dessin de l'en-tête du tableau
      ctx.font = "bold 16px Arial";
      for (let col = 0; col < numCols; col++) {
        const x = tableX + col * cellWidth;
        const y = tableY;
        ctx.fillStyle = "#181A1E";
        ctx.fillRect(x, y, cellWidth, headerHeight);
        ctx.strokeStyle = "#151619";
        ctx.strokeRect(x, y, cellWidth, headerHeight);
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
          ctx.fillStyle = col === 0 ? "#181A1E" : "#202226";
          ctx.fillRect(x, y, cellWidth, cellHeight);
          ctx.strokeStyle = "#151619";
          ctx.strokeRect(x, y, cellWidth, cellHeight);
          ctx.fillStyle = col === 0 ? "#e7e7e7" : "#a0a0a0";
          const text = rowData[col] !== undefined ? rowData[col] : "";
          ctx.fillText(String(text), x + cellWidth / 2, y + cellHeight / 2);
        }
      }

      // Conversion du canvas en image PNG
      const tableBuffer = canvas.toBuffer("image/png");

      // Tentative de récupération de l'image de l'exercice
      const exerciseImagePath = path.join(
        __dirname,
        "../../../images/strengthlevel",
        exerciseImageName,
      );

      let exerciseImageBuffer;
      try {
        exerciseImageBuffer = fs.readFileSync(exerciseImagePath);
      } catch (error) {
        console.error(
          `⚠️ Erreur lors de la lecture de l'image ${exerciseImageName}:`,
          error,
        );
      }

      // Préparation de l'embed Discord
      const embed = new EmbedBuilder()
        .setColor(colorEmbed)
        .setTitle(`${headerEmoji} Tableau des seuils`)
        .setDescription(
          `Tableau des seuils (${tableType}) pour **${displayExerciseName}** - \`${sexOption}\``,
        )
        .setFooter({ text: "Données issues de https://strengthlevel.com/" });

      if (exerciseImageBuffer) {
        embed.setThumbnail("attachment://exercise.png");
      }

      const attachments = [{ attachment: tableBuffer, name: "tableau.png" }];
      if (exerciseImageBuffer) {
        attachments.push({
          attachment: exerciseImageBuffer,
          name: "exercise.png",
        });
      }

      // Envoi de la réponse : si une réponse éphémère a déjà été envoyée, on la supprime avant d'envoyer le message dans le canal
      if (interactionContext.replied || interactionContext.deferred) {
        return interactionContext.channel.send({
          embeds: [embed],
          files: attachments,
        });
      } else {
        return interactionContext.reply({
          embeds: [embed],
          files: attachments,
        });
      }
    };

    // 5. Appel à la logique de gestion du physique
    // handleUserPhysique fusionne les données fournies avec celles enregistrées en base,
    // et appelle ensuite executeCalculationCallback.
    await handleUserPhysique(
      interaction,
      providedData,
      executeCalculationCallback,
    );
  },
};
