/**
 * Module de calcul du Strength Level.
 *
 * Ce module calcule le niveau de force d'un utilisateur en fonction de plusieurs paramètres :
 *   - Le poids du corps (bodyweight)
 *   - Le poids soulevé (liftweight)
 *   - L'âge
 *   - Le nom de l'exercice
 *   - Le sexe (Homme ou Femme)
 *
 * La commande récupère également des données de seuils depuis un fichier JSON afin de comparer
 * la performance de l'utilisateur à différents paliers ("Débutant", "Novice", "Intermédiaire", "Avancé", "Elite").
 *
 * Fonctionnalités principales dans ce refactoring :
 *   1. Récupération et vérification humoristique des options fournies par l'utilisateur.
 *   2. Fusion potentielle entre données fournies et celles en base via handleUserPhysique.
 *   3. Vérification des champs requis dans le callback et exécution de la logique spécifique (calcul, lecture JSON, etc.).
 *   4. Renvoi de l'embed final contenant le résultat.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

// 1. Importation des dépendances et configuration du style
const { handleUserPhysique } = require("../../logic/handlePhysiqueData");
const { getEmoji } = require("../../../utils/emoji");
const emojiMuscle = getEmoji("muscle");
const emojiCookie = getEmoji("cookie");
const emojiTrophe = getEmoji("trophe");
const emojiGlobe = getEmoji("globe");
const emojiTroisieme = getEmoji("troisieme");
const emojiDeuxieme = getEmoji("deuxieme");
const emojiPremier = getEmoji("premier");
const emojiCible = getEmoji("cible");
const emojiFemme = getEmoji("femme");
const emojiHomme = getEmoji("homme");
const emojiCd = getEmoji("cd");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

// 2. Récupération des données fournies par l'utilisateur
module.exports = {
  async execute(interaction) {
    const providedData = {
      poids: interaction.options.getNumber("bodyweight"),
      liftWeight: interaction.options.getNumber("liftweight"),
      age: interaction.options.getInteger("age"),
      exerciseName: interaction.options.getString("exercise"),
      sexe: interaction.options.getString("sexe"),
    };

    // 3. Validation humoristique des valeurs saisies
    if (providedData.bodyWeight != null && providedData.bodyWeight <= 0) {
      return interaction.reply({
        content:
          "Attention ! Un poids corporel négatif, ce n'est pas de la magie, c'est juste bizarre. Mettez un nombre positif, s'il vous plaît !",
        ephemeral: true,
      });
    }
    if (providedData.liftWeight != null && providedData.liftWeight <= 0) {
      return interaction.reply({
        content:
          "Hmm… lever un poids négatif serait plutôt du prestidigitation. Merci de fournir un poids soulevé positif !",
        ephemeral: true,
      });
    }
    if (providedData.age != null && providedData.age <= 0) {
      return interaction.reply({
        content:
          "Un âge négatif ? Même dans un roman de science-fiction, ça n'existe pas ! Mettez un âge positif, s'il vous plaît.",
        ephemeral: true,
      });
    }
    if (
      !providedData.exerciseName ||
      providedData.exerciseName.trim().length === 0
    ) {
      return interaction.reply({
        content:
          "Oups ! Le nom de l'exercice est requis. Merci de nous préciser quel muscle vous voulez impressionner !",
        ephemeral: true,
      });
    }
    if (
      !providedData.sex ||
      (providedData.sex !== "Homme" && providedData.sex !== "Femme")
    ) {
      return interaction.reply({
        content: "Erreur : veuillez spécifier votre sexe ('Homme' ou 'Femme').",
        ephemeral: true,
      });
    }

    // 4. Mise en place du callback de calcul
    const executeCalculationCallback = async (
      interactionContext,
      finalData,
    ) => {
      // Vérification des champs requis dans finalData (après fusion avec les données en base, par exemple)
      const missingFields = [];
      if (finalData.bodyWeight === null || finalData.bodyWeight === undefined) {
        missingFields.push("bodyweight");
      }
      if (finalData.liftWeight === null || finalData.liftWeight === undefined) {
        missingFields.push("liftweight");
      }
      if (finalData.age === null || finalData.age === undefined) {
        missingFields.push("age");
      }
      if (
        !finalData.exerciseName ||
        finalData.exerciseName.trim().length === 0
      ) {
        missingFields.push("exercise");
      }
      if (
        !finalData.sex ||
        (finalData.sex !== "Homme" && finalData.sex !== "Femme")
      ) {
        missingFields.push("sex");
      }

      if (missingFields.length > 0) {
        const errorMessage = {
          content: `Les champs suivants sont manquants : ${missingFields.join(", ")}. Veuillez les renseigner.`,
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

      // Lecture du fichier JSON des seuils pour le calcul du Strength Level
      const dataPath = path.join(__dirname, "../../../data/strengthlevel.json");
      let exercisesData;
      try {
        const rawData = fs.readFileSync(dataPath, "utf8");
        exercisesData = JSON.parse(rawData);
      } catch (error) {
        console.error("Erreur lors de la lecture du fichier JSON :", error);
        const errorEmbed = new EmbedBuilder()
          .setColor(colorEmbedError)
          .setTitle("Erreur")
          .setDescription(
            "Une erreur est survenue lors de la récupération des données d'exercices.",
          );
        return interactionContext.reply({
          embeds: [errorEmbed],
          ephemeral: true,
        });
      }

      // Recherche de l'exercice dans le tableau (comparaison insensible à la casse)
      const exerciseObj = exercisesData.find(
        (ex) =>
          ex.exercise.toLowerCase() === finalData.exerciseName.toLowerCase(),
      );
      if (!exerciseObj) {
        return interactionContext.reply({
          content: `Erreur : l'exercice "${finalData.exerciseName}" est introuvable dans la base de données.`,
          ephemeral: true,
        });
      }

      // Récupération des seuils correspondant au sexe choisi
      const thresholds = exerciseObj[finalData.sex];
      if (!thresholds || !thresholds.bodyweight || !thresholds.age) {
        return interactionContext.reply({
          content: `Erreur : aucune donnée de seuils n'est disponible pour le sexe "${finalData.sex}" pour cet exercice.`,
          ephemeral: true,
        });
      }
      const bodyTable = thresholds.bodyweight; // Tableau des seuils pour le poids du corps
      const ageTable = thresholds.age; // Tableau des seuils pour l'âge

      // Fonction utilitaire pour sélectionner la ligne de seuil dont la référence est la plus proche
      function findRow(table, inputValue) {
        let chosen = table[0];
        for (let row of table) {
          const ref = parseFloat(row[0]);
          if (ref <= inputValue) {
            chosen = row;
          } else {
            break;
          }
        }
        return chosen;
      }

      const bodyRow = findRow(bodyTable, finalData.bodyWeight);
      const ageRow = findRow(ageTable, finalData.age);

      // Définition des niveaux de force standards
      const levels = ["Débutant", "Novice", "Intermédiaire", "Avancé", "Elite"];

      // Fonction de calcul du niveau sur la base d'une ligne de seuils
      function computeLevel(row, liftWeight) {
        let achieved = "Below Beginner";
        for (let i = 0; i < levels.length; i++) {
          const threshold = parseFloat(row[i + 1]);
          if (liftWeight >= threshold) {
            achieved = levels[i];
          } else {
            break;
          }
        }
        return achieved;
      }

      const levelByBody = computeLevel(bodyRow, finalData.liftWeight);
      const levelByAge = computeLevel(ageRow, finalData.liftWeight);

      // Mapping des niveaux aux emojis
      const emojiMapping = {
        Débutant: emojiGlobe,
        Novice: emojiTroisieme,
        Intermédiaire: emojiDeuxieme,
        Avancé: emojiPremier,
        Elite: emojiTrophe,
      };

      // Détermination de l'emoji en fonction du sexe
      const emojiSexe = finalData.sex === "Homme" ? emojiHomme : emojiFemme;

      // Construction de la description avec les informations saisies
      const description =
        `**Informations fournies :**\n` +
        `• ${emojiSexe} Sexe : **${finalData.sex}**\n` +
        `• ${emojiCookie} Poids du corps : **${finalData.bodyWeight} kg**\n` +
        `• ${emojiCd} Âge : **${finalData.age} ans**\n` +
        `• ${emojiCible} Exercice : **${exerciseObj.exercise}**\n` +
        `• ${emojiMuscle} Poids soulevé : **${finalData.liftWeight} kg**\n\n` +
        `**Statistiques :**\n` +
        `• Selon le poids du corps : ${emojiMapping[levelByBody] || ""} **${levelByBody}**\n` +
        `• Selon l'âge : ${emojiMapping[levelByAge] || ""} **${levelByAge}**`;

      // Affichage détaillé des paliers pour le poids du corps et l'âge
      const thresholdsDescription =
        `\n\n**Paliers pour le poids du corps**\n` +
        `${emojiGlobe} **__${levels[0]}__** : ${bodyRow[1]} kg\n` +
        `${emojiTroisieme} **__${levels[1]}__** : ${bodyRow[2]} kg\n` +
        `${emojiDeuxieme} **__${levels[2]}__** : ${bodyRow[3]} kg\n` +
        `${emojiPremier} **__${levels[3]}__** : ${bodyRow[4]} kg\n` +
        `${emojiTrophe} **__${levels[4]}__** : ${bodyRow[5]} kg\n\n` +
        `**Paliers pour l'âge**\n` +
        `${emojiGlobe} **__${levels[0]}__** : ${ageRow[1]} kg\n` +
        `${emojiTroisieme} **__${levels[1]}__** : ${ageRow[2]} kg\n` +
        `${emojiDeuxieme} **__${levels[2]}__** : ${ageRow[3]} kg\n` +
        `${emojiPremier} **__${levels[3]}__** : ${ageRow[4]} kg\n` +
        `${emojiTrophe} **__${levels[4]}__** : ${ageRow[5]} kg`;

      // Construction de l'embed final
      const embed = new EmbedBuilder()
        .setColor(colorEmbed)
        .setTitle(
          `${emojiCible} Calcul du Strength Level pour ${exerciseObj.exercise}`,
        )
        .setThumbnail(thumbnailEmbed)
        .setDescription(description + thresholdsDescription)
        .setFooter({
          text: "Calcul effectué à partir de vos données personnelles et des seuils de https://strengthlevel.com/",
        });

      // Envoi de l'embed en fonction du contexte (réponse initiale ou follow-up)
      if (interactionContext.replied || interactionContext.deferred) {
        try {
          await interactionContext.deleteReply();
        } catch (error) {
          console.error(
            "Erreur lors de la suppression de la réponse éphémère :",
            error,
          );
        }
        await interactionContext.channel.send({ embeds: [embed] });
      } else {
        await interactionContext.reply({ embeds: [embed] });
      }
    };

    // 5. Appel à la logique de gestion du physique qui fusionne les données et lance le calcul
    await handleUserPhysique(
      interaction,
      providedData,
      executeCalculationCallback,
    );
  },
};
