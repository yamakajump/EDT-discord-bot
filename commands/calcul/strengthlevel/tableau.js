/**
 * Module de génération d'un tableau visuel des seuils de force.
 *
 * Ce module permet de générer une image (au format PNG) contenant un tableau qui récapitule les seuils
 * pour un exercice donné, en fonction du sexe de l'utilisateur et d'une source choisie ("age" ou "bodyweight").
 *
 * Fonctionnalités principales :
 *   - Récupération des options fournies par l'utilisateur (exercice, sexe, source, langue).
 *   - Lecture et parsing d'un fichier JSON contenant les données des seuils.
 *   - Sélection de l'exercice correspondant en recherchant dans le champ "exerciceFR" (recherche non sensible à la casse).
 *   - Génération d'un graphique/tableau en utilisant la bibliothèque Canvas.
 *   - Personnalisation de l'affichage via des couleurs, bordures et textes (avec utilisation d'emojis personnalisés).
 *   - Lecture éventuelle d'une image de l'exercice (si présente) pour l'ajouter en miniature dans l'embed.
 *   - Construction et envoi d'un embed Discord comportant le tableau généré en pièce jointe.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

// Importation de la logique de gestion des données physiques
const { handleUserPhysique } = require("../../../logic/handlePhysiqueData");

const { getEmoji } = require("../../../utils/emoji");
const headerEmoji = getEmoji("cible");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  /**
   * Exécute la sous-commande "tableau" pour générer le tableau des seuils.
   *
   * @param {Interaction} interaction - L'objet interaction Discord contenant les options de la commande.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'embed envoyé.
   */
  async execute(interaction) {
    // 1. Récupération des données fournies par l'utilisateur
    const providedData = {
      exercise: interaction.options.getString("exercise"),
      sexe: interaction.options.getString("sexe"),
      source: interaction.options.getString("source"), // "age" ou "bodyweight"
      langue: interaction.options.getString("langue"),
    };

    // 2. Validation humoristique des valeurs saisies
    if (providedData.exercise == null || providedData.exercise.trim() === "") {
      return interaction.reply({
        content:
          "Attention ! Le nom de l'exercice est manquant ou vide. Même Hulk sait qu'il faut le préciser !",
        ephemeral: true,
      });
    }
    if (providedData.sexe == null || providedData.sexe.trim() === "") {
      return interaction.reply({
        content:
          "Attention ! Vous devez préciser le sexe (H ou F). Même Batman ne peut pas deviner !",
        ephemeral: true,
      });
    }
    if (providedData.source == null || providedData.source.trim() === "") {
      return interaction.reply({
        content:
          "Oups ! Vous devez choisir une source ('age' ou 'bodyweight'). Ce n'est pas de la magie, c'est de l'option !",
        ephemeral: true,
      });
    }

    // 3. Mise en place du callback de calcul
    const executeCalculationCallback = async (
      interactionContext,
      finalData,
    ) => {
      // Vérification des champs requis dans l'objet final
      const missingFields = [];
      if (finalData.exercise == null || finalData.exercise.trim() === "") {
        missingFields.push("exercise");
      }
      if (finalData.sexe == null || finalData.sexe.trim() === "") {
        missingFields.push("sexe");
      }
      if (finalData.source == null || finalData.source.trim() === "") {
        missingFields.push("source");
      }

      if (missingFields.length > 0) {
        const errorMessage = {
          content: `Les champs suivants sont manquants : ${missingFields.join(
            ", ",
          )}. Veuillez les renseigner.`,
          ephemeral: true,
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

      // Récupération des options depuis l'objet finalData
      const exerciseName = finalData.exercise;
      const sexOption = finalData.sexe;
      const sourceChoice = finalData.source;
      const langue = finalData.langue; // pour l'affichage dans le tableau

      // Chargement du fichier JSON contenant les seuils de force
      const dataPath = path.join(__dirname, "../../../data/strengthlevel.json");
      let exercisesData;
      try {
        const rawData = fs.readFileSync(dataPath, "utf8");
        exercisesData = JSON.parse(rawData);
      } catch (error) {
        console.error("⚠️ Erreur lors de la lecture du fichier JSON :", error);
        const errorEmbed = new EmbedBuilder()
          .setColor(colorEmbedError)
          .setTitle("Erreur")
          .setDescription(
            "Une erreur est survenue lors de la récupération des données d'exercices.",
          );
        if (interactionContext.replied || interactionContext.deferred) {
          try {
            await interactionContext.deleteReply();
          } catch (err) {
            console.error("Erreur lors de la suppression de la réponse :", err);
          }
          return interactionContext.channel.send({ embeds: [errorEmbed] });
        }
        return interactionContext.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
      }

      // Recherche de l'exercice dans le JSON en utilisant le champ "exerciceFR" (non sensible à la casse)
      const exerciseObj = exercisesData.find(
        (ex) => ex.exerciceFR.toLowerCase() === exerciseName.toLowerCase(),
      );
      if (!exerciseObj) {
        return interactionContext.reply({
          content: `Erreur : l'exercice "${exerciseName}" est introuvable dans la base de données.`,
          ephemeral: true,
        });
      }

      // Pour la recherche de l'image dans le dossier, on utilise toujours le nom anglais (exerciceEN) s'il existe,
      // sinon on se rabat sur le nom français.
      const imageNameForEmbed =
        exerciseObj.exerciceEN && exerciseObj.exerciceEN.trim() !== ""
          ? exerciseObj.exerciceEN
          : exerciseObj.exerciceFR;
      const exerciseImageName = imageNameForEmbed.replace(/ /g, "_") + ".png";

      // Pour l'affichage dans l'embed, on choisit par défaut le français,
      // sauf si l'option "langue" est définie sur "en" et que le nom anglais existe.
      let displayExerciseName = exerciseObj.exerciceFR;
      if (langue && langue.toLowerCase() === "en" && exerciseObj.exerciceEN) {
        displayExerciseName = exerciseObj.exerciceEN;
      }

      // Récupération des seuils pour le sexe choisi
      const thresholds = exerciseObj[sexOption];
      if (!thresholds || !thresholds.bodyweight || !thresholds.age) {
        return interactionContext.reply({
          content: `Erreur : aucune donnée de seuils n'est disponible pour le sexe "${sexOption}" pour cet exercice.`,
          ephemeral: true,
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
        displayExerciseName,
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
        // Fond de l'en-tête pour chaque colonne
        ctx.fillStyle = "#181A1E";
        ctx.fillRect(x, y, cellWidth, headerHeight);
        // Bordure de la cellule
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
          // Détermine la couleur de fond : première colonne différencie des autres
          ctx.fillStyle = col === 0 ? "#181A1E" : "#202226";
          ctx.fillRect(x, y, cellWidth, cellHeight);
          // Dessine la bordure de chaque cellule
          ctx.strokeStyle = "#151619";
          ctx.strokeRect(x, y, cellWidth, cellHeight);
          // Couleur du texte
          ctx.fillStyle = col === 0 ? "#e7e7e7" : "#a0a0a0";
          const text = rowData[col] !== undefined ? rowData[col] : "";
          ctx.fillText(String(text), x + cellWidth / 2, y + cellHeight / 2);
        }
      }

      // Génération d'un buffer PNG à partir du canvas
      const tableBuffer = canvas.toBuffer("image/png");

      // Récupération de l'image de l'exercice en utilisant le nom anglais (si défini) pour l'embed
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

      // Préparation de l'embed Discord pour présenter le tableau des seuils
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

      if (interactionContext.replied || interactionContext.deferred) {
        try {
          await interactionContext.deleteReply();
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de la réponse éphémère :",
            error,
          );
        }
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

    // 4. Exécution de la logique de gestion du physique
    // Cette fonction fusionne les données fournies avec celles enregistrées éventuellement en BDD,
    // et appelle le callback (executeCalculationCallback) pour poursuivre le traitement.
    await handleUserPhysique(
      interaction,
      providedData,
      executeCalculationCallback,
    );
  },
};
