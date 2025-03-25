/**
 * Module de calcul des besoins caloriques personnalisés.
 *
 * Ce module récupère plusieurs données issues des options de la commande (poids, taille, âge, sexe,
 * activité quotidienne, temps d'entraînement, jours d'entraînement par semaine, TEF, intensité d'entraînement
 * et options de personnalisation par ajustement ou pourcentage) afin de calculer le Métabolisme Basal (TMB)
 * puis la Dépense Énergétique Journalière (DEJ) adaptée aux objectifs nutritionnels de l'utilisateur.
 *
 * La commande permet de réaliser différents calculs selon les options renseignées :
 * - Ajustement direct des calories (ajustementInput)
 * - Pourcentage personnalisé (pourcentageInput) pour une sèche ou une prise de masse
 * - Sinon, en fonction d'un objectif spécifique (seche, maintien ou pdm)
 *
 * En cas d'incohérence (par exemple, renseigner à la fois un pourcentage et un ajustement), une
 * réponse éphémère est envoyée pour informer l'utilisateur.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getEmoji } = require("../../utils/emoji");

module.exports = {
  async execute(interaction) {
    // Récupération des options fournies par l'utilisateur
    const poids = interaction.options.getNumber("poids");
    const taille = interaction.options.getNumber("taille"); // en cm
    const age = interaction.options.getInteger("age");
    const sexe = interaction.options.getString("sexe"); // 'H' ou 'F'

    // Options supplémentaires
    const activite = interaction.options.getString("activite"); // doit correspondre à S, P, A ou T
    const jours = interaction.options.getInteger("jours"); // Nombre de jours d'entraînement par semaine
    const temps = interaction.options.getNumber("temps"); // temps d'entraînement en minutes (par séance)
    const intensite = interaction.options.getString("intensite"); // intensité de l'entraînement (faible, moderee, elevee ou intense)
    const tefInput = interaction.options.getNumber("tef");
    const pourcentageInput = interaction.options.getNumber("pourcentage");
    const ajustementInput = interaction.options.getNumber("ajustement");
    let objectif = interaction.options.getString("objectif"); // 'seche', 'maintien' ou 'pdm'

    // Vérifier que l'utilisateur n'a pas renseigné les deux options de personnalisation simultanément
    if (pourcentageInput !== null && ajustementInput !== null) {
      return interaction.reply({
        content:
          "Veuillez renseigner soit un pourcentage, soit un ajustement direct des calories, pas les deux.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Définir un objectif par défaut
    if (!objectif) {
      objectif = "maintien";
    }

    // Vérifications de base sur les données
    if (!poids || poids <= 0) {
      return interaction.reply({
        content:
          "Oups ! Le poids saisi n'est pas valide. Réessaie en entrant un poids positif.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!taille || taille <= 0) {
      return interaction.reply({
        content:
          "La taille doit être un nombre supérieur à zéro (en cm). Merci de vérifier ta saisie.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!age || age <= 0) {
      return interaction.reply({
        content:
          "L'âge doit être un nombre positif. Vérifie ton âge s'il te plaît.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (temps === null || temps < 0) {
      return interaction.reply({
        content:
          "Le temps d'entraînement doit être positif (en minutes). Merci de vérifier !",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (tefInput === null || tefInput < 10 || tefInput > 25) {
      return interaction.reply({
        content:
          "Le TEF doit être compris entre 10 et 25. Merci de vérifier ta saisie !",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (jours === null || jours < 0) {
      return interaction.reply({
        content:
          "Le nombre de jours d'entraînement par semaine doit être positif. Merci de vérifier !",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!activite) {
      return interaction.reply({
        content: "Merci de renseigner votre niveau d'activité quotidienne.",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!intensite) {
      return interaction.reply({
        content: "Merci de renseigner l'intensité de ton entraînement.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Conversion de la taille de centimètres en mètres
    const tailleMeters = taille / 100;

    // Calcul du TMB (Métabolisme Basal) selon le sexe
    let TMB = 0;
    if (sexe === "H") {
      TMB = 13.707 * poids + 492.3 * tailleMeters - 6.673 * age + 77.0607;
    } else {
      TMB = 9.74 * poids + 172.9 * tailleMeters - 4.737 * age + 667.051;
    }

    // Dictionnaire pour le niveau d'activité (identique à l'ancien bot)
    const diconap = {
      S: { H: 1, F: 1 },
      P: { H: 1.11, F: 1.12 },
      A: { H: 1.25, F: 1.27 },
      T: { H: 1.48, F: 1.45 },
    };
    // Le paramètre "activite" doit correspondre à une des clés : S, P, A ou T
    const NAP = diconap[activite][sexe];

    // Utilisation de l'intensité et du temps pour calculer la dépense liée à l'entraînement
    // Utilisation d'une formule basée sur le MET :
    // Calories brûlées = (MET * 3.5 * poids) / 200 * temps (en minutes)
    const intensiteFactors = {
      leger: 4,
      moderee: 6,
      elevee: 8,
      intense: 10,
    };
    const intensityKey = intensite.toLowerCase();
    const MET = intensiteFactors[intensityKey];
    if (!MET) {
      return interaction.reply({
        content:
          "L'intensité renseignée n'est pas valide. Merci d'utiliser l'une des valeurs suivantes : faible, moderee, elevee ou intense.",
        flags: MessageFlags.Ephemeral,
      });
    }
    const trainingCalories = ((MET * 3.5 * poids) / 200) * temps;
    // Moyenne quotidienne en fonction du nombre de jours d'entraînement par semaine
    const averageTraining = trainingCalories * (jours / 7);

    // Calcul de la dépense de base (métabolisme de base ajusté par l'activité physique + entraînement)
    const baseExpenditure = TMB * NAP + averageTraining;
    // Calcul du TEF (Effet Thermique des Aliments)
    const TEF = 1 + (tefInput / 100);
    // Calcul final de la DEJ
    const DEJ = Math.round(baseExpenditure * TEF);

    // Création de l'Embed pour afficher le résultat
    const embed = new EmbedBuilder()
      .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
      .setColor("#ffa600");

    const TMBrounded = Math.round(TMB);

    const emojiPomme = getEmoji("pomme");
    const emojiCookie = getEmoji("cookie");
    const emojiFrite = getEmoji("frite");
    const emojiBrioche = getEmoji("brioche");

    // 1. Option "ajustement" renseignée (ajustement direct des calories)
    if (ajustementInput !== null) {
      const adjustedCalories = DEJ + ajustementInput;
      let title, description;
      if (ajustementInput < 0) {
        // Réduction pour une sèche
        title = `${emojiPomme} Besoins caloriques ajustés pour une **sèche**`;
        description = `${emojiCookie} **Ajustement direct :**
- Calories de maintien : **${DEJ}** kcal
- Réduction de : **${Math.abs(ajustementInput)}** kcal
- Total ajusté : **${adjustedCalories}** kcal

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`;
      } else if (ajustementInput > 0) {
        // Ajout pour une prise de masse
        title = `${emojiFrite} Besoins caloriques ajustés pour une **prise de masse**`;
        description = `${emojiCookie} **Ajustement direct :**
- Calories de maintien : **${DEJ}** kcal
- Ajout de : **${ajustementInput}** kcal
- Total ajusté : **${adjustedCalories}** kcal

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`;
      } else {
        title = `${emojiBrioche} Besoins caloriques pour le **maintien**`;
        description = `${emojiCookie} **Maintien :**
- Calories : **${DEJ}** kcal

Le maintien vise à conserver l'équilibre énergétique sans prise ni perte de poids.

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`;
      }
      embed.setTitle(title).setDescription(description);
    }
    // 2. Option "pourcentage" renseignée (personnalisation par pourcentage)
    else if (pourcentageInput !== null) {
      if (pourcentageInput < 100) {
        const customSeche = Math.round(DEJ * (pourcentageInput / 100));
        embed
          .setTitle(`${emojiPomme} Besoins caloriques pour une **sèche**`)
          .setDescription(
            `${emojiCookie} **Sèche personnalisée :**
- Pourcentage choisi : **${pourcentageInput}%**
- Calories calculées : **${customSeche}** kcal

**Maintien (100%)** : **${DEJ}** kcal  
**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`
          );
      } else if (pourcentageInput > 100) {
        const customPdm = Math.round(DEJ * (pourcentageInput / 100));
        embed
          .setTitle(`${emojiFrite} Besoins caloriques pour une **prise de masse**`)
          .setDescription(
            `${emojiCookie} **Prise de masse personnalisée :**
- Pourcentage choisi : **${pourcentageInput}%**
- Calories calculées : **${customPdm}** kcal

**Maintien (100%)** : **${DEJ}** kcal  
**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`
          );
      } else {
        embed
          .setTitle(`${emojiBrioche} Besoins caloriques pour le **maintien**`)
          .setDescription(
            `${emojiCookie} **Maintien :**
- Calories : **${DEJ}** kcal

Le maintien vise à conserver l'équilibre énergétique sans prise ni perte de poids.`
          );
      }
    }
    // 3. Aucune option de personnalisation renseignée, utilisation de l'objectif nutritionnel
    else {
      if (objectif === "seche") {
        const ratiosSeche = {
          "5%": 0.95,
          "10%": 0.9,
          "15%": 0.85,
          "20%": 0.8,
        };
        let secheCalculs = "";
        for (const [pourcentage, ratio] of Object.entries(ratiosSeche)) {
          secheCalculs += `- Réduction de ${pourcentage} : **${Math.round(DEJ * ratio)}** kcal\n`;
        }
        embed
          .setTitle(`${emojiPomme} Besoins caloriques pour une **sèche**`)
          .setDescription(
            `${emojiCookie} **Estimations pour une sèche :**
${secheCalculs}
- Maintien : **${DEJ}** kcal

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`
          );
      } else if (objectif === "maintien") {
        embed
          .setTitle(`${emojiBrioche} Besoins caloriques pour le **maintien**`)
          .setDescription(
            `${emojiCookie} **Maintien :**
- Calories : **${DEJ}** kcal

Le maintien vise à conserver l'équilibre énergétique sans prise ni perte de poids.`
          );
      } else if (objectif === "pdm") {
        const ratiosPdm = {
          "5%": 1.05,
          "10%": 1.1,
          "15%": 1.15,
          "20%": 1.2,
        };
        let pdmCalculs = "";
        for (const [pourcentage, ratio] of Object.entries(ratiosPdm)) {
          pdmCalculs += `- Surplus de ${pourcentage} : **${Math.round(DEJ * ratio)}** kcal\n`;
        }
        embed
          .setTitle(`${emojiFrite} Besoins caloriques pour une **prise de masse**`)
          .setDescription(
            `${emojiCookie} **Estimations pour une prise de masse :**
${pdmCalculs}
- Maintien : **${DEJ}** kcal

Le but est d'ajouter un surplus calorique pour favoriser la prise de masse.`
          );
      }
    }
    
    // Envoi de l'Embed de résultat
    await interaction.reply({ embeds: [embed] });
  },
};
