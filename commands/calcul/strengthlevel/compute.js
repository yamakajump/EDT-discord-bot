const { EmbedBuilder, MessageFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { getEmoji } = require("../../../utils/emoji");

module.exports = {
  async execute(interaction) {
    // Récupération des options fournies par l'utilisateur
    const bodyWeight = interaction.options.getNumber("bodyweight");
    const liftWeight = interaction.options.getNumber("liftweight");
    const age = interaction.options.getInteger("age"); // sert seulement pour sélectionner le palier
    const exerciseName = interaction.options.getString("exercise");
    const sexOption = interaction.options.getString("sex");

    // Vérifications simples
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

    // Chargement du fichier JSON contenant les seuils
    const dataPath = path.join(__dirname, "../../../data/strengthlevel.json");
    let exercisesData;
    try {
      const rawData = fs.readFileSync(dataPath, "utf8");
      exercisesData = JSON.parse(rawData);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier JSON :", error);
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Erreur")
        .setDescription(
          "Une erreur est survenue lors de la récupération des données d'exercices."
        );
      return interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Recherche de l'exercice (non sensible à la casse)
    const exerciseObj = exercisesData.find(
      (ex) => ex.exercise.toLowerCase() === exerciseName.toLowerCase()
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
    const ageTable = thresholds.age; // Tableau des seuils pour l'"âge" (seuils en kg)

    // Fonction utilitaire pour sélectionner la ligne de seuil dont la référence est la plus proche (sans dépasser la valeur utilisateur)
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

    // Définition des niveaux
    const levels = ["Débutant", "Novice", "Intermédiaire", "Avancé", "Elite"];

    // Fonction qui détermine le niveau atteint en testant si le poids soulevé est >= seuil du niveau.
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
      "Débutant": getEmoji("globe"),
      "Novice": getEmoji("troisieme"),
      "Intermédiaire": getEmoji("deuxieme"),
      "Avancé": getEmoji("premier"),
      "Elite": getEmoji("trophe")
    };

    // Récupération dynamique d'emojis généraux
    const sexEmoji = sexOption === "Homme" ? getEmoji("homme") : getEmoji("femme");
    const emojiBody = getEmoji("cookie");
    const emojiAge = getEmoji("cd");
    const cibleEmoji = getEmoji("cible");
    const emojiLift = getEmoji("muscle");

    // Construction de la description principale (informations et statistiques)
    const description =
      `**Informations fournies :**\n` +
      `• ${sexEmoji} Sexe : **${sexOption}**\n` +
      `• ${emojiBody} Poids du corps : **${bodyWeight} kg**\n` +
      `• ${emojiAge} Âge : **${age} ans**\n` +
      `• ${cibleEmoji} Exercice : **${exerciseObj.exercise}**\n` +
      `• ${emojiLift} Poids soulevé : **${liftWeight} kg**\n\n` +
      `**Statistiques :**\n` +
      `• Selon le poids du corps : ${emojiMapping[levelByBody] || ""} **${levelByBody}**\n` +
      `• Selon l'âge : ${emojiMapping[levelByAge] || ""} **${levelByAge}**`;

    // Présentation des paliers avec emojis personnalisés
    const globeEmoji = getEmoji("globe");
    const troisiemeEmoji = getEmoji("troisieme");
    const deuxiemeEmoji = getEmoji("deuxieme");
    const premierEmoji = getEmoji("premier");
    const tropheEmoji = getEmoji("trophe");

    const thresholdsDescription =
      `\n\n**Paliers pour le poids du corps**\n` +
      `${globeEmoji} **__${levels[0]}__** : ${bodyRow[1]} kg\n` +
      `${troisiemeEmoji} **__${levels[1]}__** : ${bodyRow[2]} kg\n` +
      `${deuxiemeEmoji} **__${levels[2]}__** : ${bodyRow[3]} kg\n` +
      `${premierEmoji} **__${levels[3]}__** : ${bodyRow[4]} kg\n` +
      `${tropheEmoji} **__${levels[4]}__** : ${bodyRow[5]} kg\n\n` +
      `**Paliers pour l'âge**\n` +
      `${globeEmoji} **__${levels[0]}__** : ${ageRow[1]} kg\n` +
      `${troisiemeEmoji} **__${levels[1]}__** : ${ageRow[2]} kg\n` +
      `${deuxiemeEmoji} **__${levels[2]}__** : ${ageRow[3]} kg\n` +
      `${premierEmoji} **__${levels[3]}__** : ${ageRow[4]} kg\n` +
      `${tropheEmoji} **__${levels[4]}__** : ${ageRow[5]} kg`;

    // Création de l'embed principal combinant informations, statistiques et affichage des paliers
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`${cibleEmoji} Calcul du Strength Level pour ${exerciseObj.exercise}`)
      .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
      .setDescription(description + thresholdsDescription)
      .setFooter({
        text: "Calcul effectué à partir de vos données personnelles et des seuils de https://strengthlevel.com/",
      });

    await interaction.reply({ embeds: [embed] });
  },
};
