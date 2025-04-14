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
 * Fonctionnalités principales :
 *   - Récupération et vérification des options fournies par l'utilisateur.
 *   - Lecture et parsing du fichier JSON contenant les seuils pour les différents exercices.
 *   - Recherche de l'exercice demandé dans le fichier JSON (non sensible à la casse).
 *   - Sélection des données de seuils en fonction du sexe de l'utilisateur.
 *   - Détermination du niveau atteint en comparant le poids soulevé aux valeurs seuils.
 *   - Construction d'un embed Discord détaillant les informations fournies, le résultat du calcul ainsi que les paliers.
 *
 * Ce module utilise également des utilitaires pour récupérer les emojis personnalisés afin d'améliorer la lisibilité
 * et la présentation du résultat.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

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

module.exports = {
  /**
   * Exécute la commande pour calculer le Strength Level.
   *
   * @param {object} interaction - L'objet interaction de Discord contenant les informations de la commande et des options.
   * @returns {Promise<void>} Une promesse résolue une fois le traitement et la réponse terminés.
   */
  async execute(interaction) {
    // Récupération des options fournies par l'utilisateur
    const bodyWeight = interaction.options.getNumber("bodyweight");
    const liftWeight = interaction.options.getNumber("liftweight");
    const age = interaction.options.getInteger("age");
    const exerciseName = interaction.options.getString("exercise");
    const sexOption = interaction.options.getString("sex");

    // Vérifications simples sur les options fournies
    if (!bodyWeight || bodyWeight <= 0) {
      return interaction.reply({
        content:
          "Erreur : le poids du corps doit être un nombre positif. Merci de vérifier et réessayer.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!liftWeight || liftWeight <= 0) {
      return interaction.reply({
        content:
          "Erreur : le poids soulevé doit être un nombre positif. Merci de vérifier et réessayer.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!age || age <= 0) {
      return interaction.reply({
        content:
          "Erreur : l'âge doit être un nombre positif. Merci de vérifier et réessayer.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!exerciseName || exerciseName.trim().length === 0) {
      return interaction.reply({
        content: "Erreur : le nom de l'exercice est requis.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!sexOption || (sexOption !== "Homme" && sexOption !== "Femme")) {
      return interaction.reply({
        content: "Erreur : veuillez spécifier votre sexe (Homme ou Femme).",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Chargement du fichier JSON contenant les seuils pour le calcul des niveaux
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

    // Recherche de l'exercice dans le fichier JSON (comparaison non sensible à la casse)
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
    const bodyTable = thresholds.bodyweight; // Tableau des seuils pour le poids du corps
    const ageTable = thresholds.age; // Tableau des seuils pour l'âge

    /**
     * Fonction utilitaire pour sélectionner la ligne de seuil dont la référence est la plus proche.
     * La ligne sélectionnée est celle pour laquelle la valeur de référence (première valeur de la ligne)
     * est la plus proche sans dépasser la valeur fournie par l'utilisateur.
     *
     * @param {Array} table - Le tableau contenant les lignes de seuils.
     * @param {number} inputValue - La valeur de l'utilisateur (poids ou âge).
     * @returns {Array} La ligne de seuils correspondant.
     */
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

    const bodyRow = findRow(bodyTable, bodyWeight);
    const ageRow = findRow(ageTable, age);

    // Définition des niveaux de force
    const levels = ["Débutant", "Novice", "Intermédiaire", "Avancé", "Elite"];

    /**
     * Fonction qui détermine le niveau atteint en testant si le poids soulevé est supérieur ou égal
     * au seuil correspondant pour chaque niveau de force.
     *
     * @param {Array} row - La ligne de seuils pour le poids du corps ou l'âge.
     * @param {number} liftWeight - Le poids soulevé par l'utilisateur.
     * @returns {string} Le niveau atteint.
     */
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

    const levelByBody = computeLevel(bodyRow, liftWeight);
    const levelByAge = computeLevel(ageRow, liftWeight);

    // Mapping des niveaux aux emojis
    const emojiMapping = {
      Débutant: emojiGlobe,
      Novice: emojiTroisieme,
      Intermédiaire: emojiDeuxieme,
      Avancé: emojiPremier,
      Elite: emojiTrophe,
    };

    // Récupération d'emojis personnalisés pour une meilleure présentation
    const emojiSexe = sexOption === "Homme" ? emojiHomme : emojiFemme;

    // Construction de la description principale avec les informations fournies par l'utilisateur
    const description =
      `**Informations fournies :**\n` +
      `• ${emojiSexe} Sexe : **${sexOption}**\n` +
      `• ${emojiCookie} Poids du corps : **${bodyWeight} kg**\n` +
      `• ${emojiCd} Âge : **${age} ans**\n` +
      `• ${emojiCible} Exercice : **${exerciseObj.exercise}**\n` +
      `• ${emojiMuscle} Poids soulevé : **${liftWeight} kg**\n\n` +
      `**Statistiques :**\n` +
      `• Selon le poids du corps : ${emojiMapping[levelByBody] || ""} **${levelByBody}**\n` +
      `• Selon l'âge : ${emojiMapping[levelByAge] || ""} **${levelByAge}**`;

    // Construction des paliers avec affichage des seuils et des emojis associés
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

    // Construction de l'embed combinant toutes les informations et le résultat du calcul
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

    // Envoie de l'embed en réponse à l'interaction
    await interaction.reply({ embeds: [embed] });
  },
};
