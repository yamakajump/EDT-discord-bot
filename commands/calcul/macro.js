/**
 * Module de répartition des macronutriments en fonction des calories et de l'objectif nutritionnel.
 *
 * Ce module récupère les options suivantes depuis une commande Discord :
 *  - calories : le nombre total de calories quotidiennes (obligatoire)
 *  - objectif : l'objectif nutritionnel ('perte', 'maintien', 'prise', 'recomp') (obligatoire)
 *
 * Options facultatives :
 *  - sexe : 'H' (homme) ou 'F' (femme)
 *  - etat  : état corporel perçu ('maigre' ou 'grasse')
 *  - proteines, glucides, lipides : pourcentages personnalisés (ils doivent être les trois renseignés et totaliser 100)
 *
 * La répartition par défaut des macronutriments est ensuite ajustée en fonction des options.
 * Enfin, le module calcule en grammes la répartition sachant que :
 *   - Protéines et glucides : 4 kcal/g.
 *   - Lipides : 9 kcal/g.
 *
 * Le résultat est présenté dans un embed Discord.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const { handleUserPhysique } = require("../../logic/handlePhysiqueData");
const style = require("../../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

const { getEmoji } = require("../../utils/emoji");
const coinInfoEmoji = getEmoji("coin_info");
const tropheEmoji = getEmoji("trophe_or");
const cookieEmoji = getEmoji("cookie");

module.exports = {
  async execute(interaction) {
    // 1. Récupération des données fournies par l'utilisateur dans providedData
    const providedData = {
      calories: interaction.options.getNumber("calories"),
      objectif: interaction.options.getString("objectif"), // 'perte', 'maintien', 'prise', 'recomp'
      sexe: interaction.options.getString("sexe"), // 'H' ou 'F'
      etat: interaction.options.getString("etat"), // 'maigre' ou 'grasse'
      proteines: interaction.options.getNumber("proteines"),
      glucides: interaction.options.getNumber("glucides"),
      lipides: interaction.options.getNumber("lipides"),
    };

    // 2. Validation humoristique des valeurs saisies
    if (providedData.calories != null && providedData.calories <= 0) {
      return interaction.reply({
        content:
          "Attention ! Des calories négatives, c'est comme un régime invisible… ça n'existe pas. Merci d'entrer un nombre positif !",
        flags: MessageFlags.Ephemeral,
      });
    }
    // Vous pouvez ajouter d'autres validations sur d'autres données (ex : poids, taille, âge, etc.)

    // Vérification de la cohérence des pourcentages personnalisés
    const { proteines, glucides, lipides } = providedData;
    if (
      (proteines !== null || glucides !== null || lipides !== null) &&
      (proteines === null || glucides === null || lipides === null)
    ) {
      return interaction.reply({
        content:
          "Merci de renseigner soit les trois pourcentages personnalisés (protéines, glucides, lipides) ou aucun.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 3. Définition du callback de calcul qui sera exécuté après la fusion des données
    const executeCalculationCallback = async (
      interactionContext,
      finalData,
    ) => {
      // Vérification que les champs requis sont présents
      const missingFields = [];
      if (finalData.calories != null || finalData.calories === undefined) {
        missingFields.push("calories");
      }
      if (finalData.objectif != null || finalData.objectif === undefined) {
        missingFields.push("objectif");
      }

      if (missingFields.length > 0) {
        const errorMessage = {
          content: `Les champs suivants sont manquants : ${missingFields.join(", ")}. Merci de bien vouloir les renseigner.`,
          flags: MessageFlags.Ephemeral,
        };

        if (interactionContext.replied || interactionContext.deferred) {
          return interactionContext.channel.send(errorMessage);
        } else {
          return interactionContext.reply(errorMessage);
        }
      }

      // 4. Calcul de la répartition des macronutriments

      // Variables pour la répartition par défaut, en fonction de l'objectif nutritionnel
      let proteinesPct, lipidesPct, glucidesPct;
      const objectif = finalData.objectif;
      if (objectif === "perte") {
        proteinesPct = 35;
        lipidesPct = 25;
        glucidesPct = 40;
      } else if (objectif === "maintien") {
        proteinesPct = 30;
        lipidesPct = 30;
        glucidesPct = 40;
      } else if (objectif === "prise") {
        proteinesPct = 25;
        lipidesPct = 25;
        glucidesPct = 50;
      } else if (objectif === "recomp") {
        proteinesPct = 35;
        lipidesPct = 20;
        glucidesPct = 45;
      } else {
        proteinesPct = 30;
        lipidesPct = 30;
        glucidesPct = 40;
      }

      // Ajustements en fonction de l'état corporel, si renseigné
      if (finalData.etat === "grasse") {
        proteinesPct += 5;
        glucidesPct -= 5;
      } else if (finalData.etat === "maigre") {
        proteinesPct -= 5;
        glucidesPct += 5;
      }

      // Ajustement spécifique pour le sexe féminin
      if (finalData.sexe === "F") {
        lipidesPct += 2;
        proteinesPct -= 2;
      }

      // Si des pourcentages personnalisés sont fournis, ils priment sur les valeurs par défaut
      if (
        finalData.proteines !== null &&
        finalData.glucides !== null &&
        finalData.lipides !== null
      ) {
        if (
          finalData.proteines + finalData.glucides + finalData.lipides !==
          100
        ) {
          return interactionContext.reply({
            content:
              "La somme des pourcentages personnalisés doit être égale à 100%.",
            flags: MessageFlags.Ephemeral,
          });
        }
        proteinesPct = finalData.proteines;
        glucidesPct = finalData.glucides;
        lipidesPct = finalData.lipides;
      }

      // Calcul des grammes pour chaque macronutriment
      // Valeurs énergétiques approximatives :
      // - Protéines et glucides : 4 kcal/g.
      // - Lipides : 9 kcal/g.
      const calories = finalData.calories;
      const proteinesGr = ((calories * proteinesPct) / 100 / 4).toFixed(2);
      const glucidesGr = ((calories * glucidesPct) / 100 / 4).toFixed(2);
      const lipidesGr = ((calories * lipidesPct) / 100 / 9).toFixed(2);

      // Détermination du libellé d'objectif
      const objectifTexte =
        objectif === "perte"
          ? "Perte de poids"
          : objectif === "maintien"
            ? "Maintien"
            : objectif === "prise"
              ? "Prise de masse"
              : "Recomposition corporelle";

      // Création de l'embed de récapitulatif
      const embed = new EmbedBuilder()
        .setColor(colorEmbed)
        .setTitle(`${coinInfoEmoji} Répartition des macronutriments`)
        .setDescription(
          `**${tropheEmoji} Objectif** : ${objectifTexte}\n**${cookieEmoji} Calories totales** : ${calories} kcal`,
        )
        .addFields(
          {
            name: "Protéines",
            value: `${proteinesGr} g (${proteinesPct}%)`,
            inline: true,
          },
          {
            name: "Lipides",
            value: `${lipidesGr} g (${lipidesPct}%)`,
            inline: true,
          },
          {
            name: "Glucides",
            value: `${glucidesGr} g (${glucidesPct}%)`,
            inline: true,
          },
        )
        .setThumbnail(thumbnailEmbed)
        .setFooter({ text: "Répartition estimée" });

      // Ajout d'informations complémentaires, si renseignées
      let infoSup = "";
      if (finalData.sexe)
        infoSup += `• Sexe : **${finalData.sexe === "H" ? "Homme" : "Femme"}**\n`;
      if (finalData.etat)
        infoSup += `• État corporel : **${finalData.etat}**\n`;
      if (infoSup.length > 0) {
        embed.addFields({
          name: "Informations complémentaires",
          value: infoSup,
        });
      }

      // 5. Envoi de l'embed en réponse à l'interaction
      if (interactionContext.replied || interactionContext.deferred) {
        await interactionContext.channel.send({ embeds: [embed] });
      } else {
        await interactionContext.reply({ embeds: [embed] });
      }
    };

    // 6. Exécution de la logique de gestion du physique
    await handleUserPhysique(
      interaction,
      providedData,
      executeCalculationCallback,
    );
  },
};
