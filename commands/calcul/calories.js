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
const { handleUserPhysique } = require("../../logic/handlePhysiqueData");
const style = require("../../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

// Pour les emojis
const { getEmoji } = require("../../utils/emoji");
const emojiPomme = getEmoji("pomme");
const emojiCookie = getEmoji("cookie");
const emojiFrite = getEmoji("frite");
const emojiBrioche = getEmoji("brioche");

module.exports = {
  async execute(interaction) {
    // Récupération des données fournies par l'utilisateur dans providedData
    const providedData = {
      poids: interaction.options.getNumber("poids"),
      taille: interaction.options.getNumber("taille"), // en cm
      age: interaction.options.getInteger("age"),
      sexe: interaction.options.getString("sexe"), // "H" ou "F"
      activite: interaction.options.getString("activite"), // S, L, A ou T
      jours: interaction.options.getInteger("jours"), // Jours d'entraînement par semaine
      temps: interaction.options.getNumber("temps"), // temps d'entraînement en minutes par séance
      intensite: interaction.options.getString("intensite"), // faible, moderee, elevee ou intense
      tef: interaction.options.getNumber("tef"),
      pourcentageInput: interaction.options.getNumber("pourcentage"),
      ajustementInput: interaction.options.getNumber("ajustement"),
      objectif: interaction.options.getString("objectif") || "maintien", // seche, maintien ou pdm, avec valeur par défaut
    };

    // Vérifications humoristiques des valeurs saisies
    if (providedData.poids == null || providedData.poids <= 0) {
      return interaction.reply({
        content:
          "Attention ! Un poids négatif (ou nul), ce n'est pas de la magie, c'est juste étrange. Mettez un nombre positif, s'il vous plaît !",
        ephemeral: true,
      });
    }
    if (providedData.taille == null || providedData.taille <= 0) {
      return interaction.reply({
        content:
          "La taille doit être supérieure à zéro (en cm). Merci de vérifier ta saisie !",
        ephemeral: true,
      });
    }
    if (providedData.age == null || providedData.age <= 0) {
      return interaction.reply({
        content:
          "L'âge doit être un nombre positif. Vérifie ton âge s'il te plaît !",
        ephemeral: true,
      });
    }
    if (providedData.temps == null || providedData.temps < 0) {
      return interaction.reply({
        content:
          "Le temps d'entraînement doit être positif (en minutes). Merci de vérifier ta saisie !",
        ephemeral: true,
      });
    }
    if (
      providedData.tef == null ||
      providedData.tef < 10 ||
      providedData.tef > 25
    ) {
      return interaction.reply({
        content:
          "Le TEF doit être compris entre 10 et 25. Merci de vérifier ta saisie !",
        ephemeral: true,
      });
    }
    if (providedData.jours == null || providedData.jours < 0) {
      return interaction.reply({
        content:
          "Le nombre de jours d'entraînement par semaine doit être positif. Merci de vérifier ta saisie !",
        ephemeral: true,
      });
    }
    if (!providedData.activite) {
      return interaction.reply({
        content: "Merci de renseigner votre niveau d'activité quotidienne.",
        ephemeral: true,
      });
    }
    if (!providedData.intensite) {
      return interaction.reply({
        content: "Merci de renseigner l'intensité de ton entraînement.",
        ephemeral: true,
      });
    }

    // Définition du callback qui exécutera les calculs une fois les données fusionnées
    const executeCalculationCallback = async (
      interactionContext,
      finalData,
    ) => {
      // Vérification des champs requis dans finalData
      const missingFields = [];
      if (finalData.poids == null || finalData.poids <= 0)
        missingFields.push("poids");
      if (finalData.taille == null || finalData.taille <= 0)
        missingFields.push("taille");
      if (finalData.age == null || finalData.age <= 0)
        missingFields.push("age");
      if (finalData.temps == null || finalData.temps < 0)
        missingFields.push("temps");
      if (
        finalData.tef == null ||
        finalData.tef < 10 ||
        finalData.tef > 25
      )
        missingFields.push("tef");
      if (finalData.jours == null || finalData.jours < 0)
        missingFields.push("jours");
      if (!finalData.activite) missingFields.push("activite");
      if (!finalData.intensite) missingFields.push("intensite");

      if (missingFields.length > 0) {
        const errorMessage = {
          content: `Il manque les informations suivantes : ${missingFields.join(
            ", ",
          )}. Merci de les renseigner.`,
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

      // Récupération des données finales dans des variables locales
      const {
        poids,
        taille,
        age,
        sexe,
        activite,
        jours,
        temps,
        intensite,
        tef,
        pourcentageInput,
        ajustementInput,
        objectif,
      } = finalData;

      // Conversion de la taille de centimètres en mètres
      const tailleMeters = taille / 100;

      // Calcul du TMB (Métabolisme Basal) selon le sexe
      let TMB = 0;
      if (sexe === "H") {
        TMB = 13.707 * poids + 492.3 * tailleMeters - 6.673 * age + 77.0607;
      } else {
        TMB = 9.74 * poids + 172.9 * tailleMeters - 4.737 * age + 667.051;
      }
      const TMBrounded = Math.round(TMB);

      // Dictionnaire pour le niveau d'activité
      const diconap = {
        S: { H: 1, F: 1 },
        L: { H: 1.11, F: 1.12 },
        A: { H: 1.25, F: 1.27 },
        T: { H: 1.48, F: 1.45 },
      };
      const NAP = diconap[activite][sexe];

      // Traitement de l'entraînement via l'intensité (MET)
      const intensiteFactors = {
        leger: 4,
        moderee: 6,
        elevee: 8,
        intense: 10,
      };
      const intensityKey = intensite.toLowerCase();
      const MET = intensiteFactors[intensityKey];
      if (!MET) {
        return interactionContext.reply({
          content:
            "L'intensité renseignée n'est pas valide. Utilise l'une des valeurs suivantes : faible, moderee, elevee ou intense.",
          ephemeral: true,
        });
      }
      const trainingCalories = ((MET * 3.5 * poids) / 200) * temps;
      // Moyenne quotidienne en fonction du nombre de jours d'entraînement par semaine
      const averageTraining = trainingCalories * (jours / 7);

      // Calcul de la dépense de base et du TEF (Effet Thermique des Aliments)
      const baseExpenditure = TMB * NAP + averageTraining;
      const TEF = 1 + tef / 100;
      const DEJ = Math.round(baseExpenditure * TEF);

      // Création de l'Embed de réponse
      const embed = new EmbedBuilder()
        .setThumbnail(thumbnailEmbed)
        .setColor(colorEmbed);

      // Vérification que l'utilisateur ne fournit pas à la fois ajustement et pourcentage
      if (pourcentageInput !== null && ajustementInput !== null) {
        return interactionContext.reply({
          content:
            "Veuillez renseigner soit un pourcentage, soit un ajustement direct des calories, pas les deux.",
          ephemeral: true,
        });
      }

      // 1. Option "ajustement" renseignée (ajustement direct des calories)
      if (ajustementInput !== null) {
        const adjustedCalories = DEJ + ajustementInput;
        let title, description;
        if (ajustementInput < 0) {
          title = `${emojiPomme} Besoins caloriques ajustés pour une **sèche**`;
          description = `${emojiCookie} **Ajustement direct :**
- Calories de maintien : **${DEJ}** kcal
- Réduction de : **${Math.abs(ajustementInput)}** kcal
- Total ajusté : **${adjustedCalories}** kcal

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`;
        } else if (ajustementInput > 0) {
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
**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`,
            );
        } else if (pourcentageInput > 100) {
          const customPdm = Math.round(DEJ * (pourcentageInput / 100));
          embed
            .setTitle(
              `${emojiFrite} Besoins caloriques pour une **prise de masse**`,
            )
            .setDescription(
              `${emojiCookie} **Prise de masse personnalisée :**
- Pourcentage choisi : **${pourcentageInput}%**
- Calories calculées : **${customPdm}** kcal

**Maintien (100%)** : **${DEJ}** kcal  
**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`,
            );
        } else {
          embed
            .setTitle(`${emojiBrioche} Besoins caloriques pour le **maintien**`)
            .setDescription(
              `${emojiCookie} **Maintien :**
- Calories : **${DEJ}** kcal

Le maintien vise à conserver l'équilibre énergétique sans prise ni perte de poids.`,
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
          for (const [key, ratio] of Object.entries(ratiosSeche)) {
            secheCalculs += `- Réduction de ${key} : **${Math.round(DEJ * ratio)}** kcal\n`;
          }
          embed
            .setTitle(`${emojiPomme} Besoins caloriques pour une **sèche**`)
            .setDescription(
              `${emojiCookie} **Estimations pour une sèche :**
${secheCalculs}
- Maintien : **${DEJ}** kcal

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`,
            );
        } else if (objectif === "maintien") {
          embed
            .setTitle(`${emojiBrioche} Besoins caloriques pour le **maintien**`)
            .setDescription(
              `${emojiCookie} **Maintien :**
- Calories : **${DEJ}** kcal

Le maintien vise à conserver l'équilibre énergétique sans prise ni perte de poids.`,
            );
        } else if (objectif === "pdm") {
          const ratiosPdm = { "5%": 1.05, "10%": 1.1, "15%": 1.15, "20%": 1.2 };
          let pdmCalculs = "";
          for (const [key, ratio] of Object.entries(ratiosPdm)) {
            pdmCalculs += `- Surplus de ${key} : **${Math.round(DEJ * ratio)}** kcal\n`;
          }
          embed
            .setTitle(
              `${emojiFrite} Besoins caloriques pour une **prise de masse**`,
            )
            .setDescription(
              `${emojiCookie} **Estimations pour une prise de masse :**
${pdmCalculs}
- Maintien : **${DEJ}** kcal

Le but est d'ajouter un surplus calorique pour favoriser la prise de masse.`,
            );
        }
      }

      // Envoi de la réponse selon le contexte (réponse ou channel)
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

    // Appel à la logique de gestion du physique qui va fusionner les données et appeler le callback
    await handleUserPhysique(
      interaction,
      providedData,
      executeCalculationCallback,
    );
  },
};
