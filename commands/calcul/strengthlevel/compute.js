const { EmbedBuilder, MessageFlags } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * Module de calcul du Strength Level pour un exercice spécifique.
 *
 * Ce module récupère les informations suivantes :
 *   - Poids du corps (bodyweight) avec emoji <:cookie:1343575844047687771>
 *   - Poids soulevé (liftweight) avec emoji <a:muscle:1343579279279132795>
 *   - Âge (age) avec emoji <a:cd:1343582302323867750>
 *   - Exercice (exercise) avec emoji <a:cible:1343582335349559358>
 *   - Sexe (sex) avec emoji <:homme:1353728079704363089> ou <:femme:1353728054601580596>
 *
 * Pour l'exercice sélectionné, le fichier JSON fournit deux tableaux de seuils pour chacun
 * des sexes ("Homme" et "Femme") avec :
 *   - Un tableau "bodyweight" : chaque ligne est [référence, Beginner, Novice, Intermediate, Advanced, Elite]
 *   - Un tableau "age"        : chaque ligne est [référence, Beginner, Novice, Intermediate, Advanced, Elite]
 *
 * Pour chacun, la ligne sélectionnée est celle dont le repère est la plus proche (sans dépasser)
 * la valeur fournie par l’utilisateur. Le niveau est déterminé de façon séparée sur chaque critère.
 * Pour atteindre un niveau, le poids soulevé doit être strictement supérieur (>=) au seuil correspondant.
 *
 * Le résultat est affiché dans un embed Discord.
 */

module.exports = {
  async execute(interaction) {
    // Récupération des options fournies par l'utilisateur
    const bodyWeight = interaction.options.getNumber('bodyweight');
    const liftWeight = interaction.options.getNumber('liftweight');
    const age = interaction.options.getInteger('age');
    const exerciseName = interaction.options.getString('exercise');
    const sexOption = interaction.options.getString('sex'); // "Homme" ou "Femme"

    // Vérifications simples
    if (!bodyWeight || bodyWeight <= 0) {
      return interaction.reply({
        content: "Erreur : le poids du corps doit être un nombre positif. Merci de vérifier et réessayer.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!liftWeight || liftWeight <= 0) {
      return interaction.reply({
        content: "Erreur : le poids soulevé doit être un nombre positif. Merci de vérifier et réessayer.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!age || age <= 0) {
      return interaction.reply({
        content: "Erreur : l'âge doit être un nombre positif. Merci de vérifier et réessayer.",
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

    // Chargement du fichier JSON
    const dataPath = path.join(__dirname, '../../../data/strengthlevel.json');
    let exercisesData;
    try {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      exercisesData = JSON.parse(rawData);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier JSON :", error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle("Erreur")
        .setDescription("Une erreur est survenue lors de la récupération des données d'exercices.");
      return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
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

    // Récupération des données pour le sexe choisi
    const thresholds = exerciseObj[sexOption];
    if (!thresholds || !thresholds.bodyweight || !thresholds.age) {
      return interaction.reply({
        content: `Erreur : aucune donnée de seuils n'est disponible pour le sexe "${sexOption}" pour cet exercice.`,
        flags: MessageFlags.Ephemeral,
      });
    }
    const bodyTable = thresholds.bodyweight; // Tableau des seuils pour le poids du corps
    const ageTable  = thresholds.age;          // Tableau des seuils pour l'âge

    // Fonction utilitaire pour sélectionner la ligne du tableau dont la référence est la plus proche (sans dépasser la valeur utilisateur)
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
    const ageRow  = findRow(ageTable, age);

    // Définition des niveaux
    const levels = ["Beginner", "Novice", "Intermediate", "Advanced", "Elite"];

    // Fonction qui détermine le niveau atteint en testant si le poids soulevé >= seuil du niveau.
    // On teste les seuils dans l'ordre croissant et on garde le dernier niveau validé.
    function computeLevel(row, liftWeight) {
      let achieved = "Below Beginner";
      for (let i = 0; i < 5; i++) {
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
    const levelByAge  = computeLevel(ageRow, liftWeight);

    // Choisir l'emoji pour le sexe
    const sexEmoji = sexOption === "Homme"
      ? "<:homme:1353728079704363089>"
      : "<:femme:1353728054601580596>";

    // Autres emojis
    const emojiBody = "<:cookie:1343575844047687771>";
    const emojiAge  = "<a:cd:1343582302323867750>";
    const emojiEx   = "<a:cible:1343582335349559358>";
    const emojiLift = "<a:muscle:1343579279279132795>";

    // Construction de l'embed sans afficher les lignes du JSON
    const description =
      `**Informations fournies :**\n` +
      `• ${sexEmoji} Sexe : **${sexOption}**\n` +
      `• ${emojiBody} Poids du corps : **${bodyWeight} kg**\n` +
      `• ${emojiAge} Âge : **${age} ans**\n` +
      `• ${emojiEx} Exercice : **${exerciseObj.exercise}**\n` +
      `• ${emojiLift} Poids soulevé : **${liftWeight} kg**\n\n` +
      `**Statistiques :**\n` +
      `• Selon le Poids du Corps : **${levelByBody}**\n` +
      `• Selon l'Âge          : **${levelByAge}**`;

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle(`Calcul du Strength Level pour ${exerciseObj.exercise}`)
      .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
      .setDescription(description)
      .setFooter({ text: 'Calcul effectué à partir de vos données personnelles et des seuils de https://strengthlevel.com/' });

    await interaction.reply({ embeds: [embed] });
  },
};
