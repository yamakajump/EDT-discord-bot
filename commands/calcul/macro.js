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
 * Le module détermine une répartition par défaut des macronutriments en fonction de l'objectif :
 *   - perte (de poids) : 35% protéines, 25% lipides, 40% glucides.
 *   - maintien : 30% protéines, 30% lipides, 40% glucides.
 *   - prise de masse : 25% protéines, 25% lipides, 50% glucides.
 *   - recomposition corporelle : 35% protéines, 20% lipides, 45% glucides.
 *
 * Ces pourcentages par défaut peuvent être ajustés selon l'état corporel
 * (augmentation des protéines et diminution des glucides pour 'grasse', inversement pour 'maigre')
 * et selon le sexe (pour les femmes, on augmente légèrement la part des lipides au détriment des protéines).
 *
 * Si des pourcentages personnalisés sont fournis, ils remplacent les valeurs par défaut.
 *
 * Enfin, le module calcule en grammes la répartition des macronutriments sachant que :
 *   - Les protéines et glucides apportent environ 4 kcal/g.
 *   - Les lipides apportent environ 9 kcal/g.
 *
 * Le résultat est présenté dans un embed Discord comprenant :
 *   - L'objectif nutritionnel retenu.
 *   - Le nombre total de calories.
 *   - La répartition sous forme de grammes et de pourcentage pour les protéines, lipides et glucides.
 *   - Des informations complémentaires si le sexe et/ou l'état corporel ont été renseignés.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getEmoji } = require("../../utils/emoji");

module.exports = {
  async execute(interaction) {
    // Récupération des options obligatoires
    const calories = interaction.options.getNumber("calories");
    const objectif = interaction.options.getString("objectif"); // 'perte', 'maintien', 'prise', 'recomp'

    // Récupération des options optionnelles
    const sexe = interaction.options.getString("sexe"); // 'H' ou 'F'
    const etat = interaction.options.getString("etat"); // 'maigre' ou 'grasse'
    const protCustom = interaction.options.getNumber("proteines");
    const glucCustom = interaction.options.getNumber("glucides");
    const lipCustom = interaction.options.getNumber("lipides");

    // Vérification de la validité des calories
    if (!calories || calories <= 0) {
      return interaction.reply({
        content:
          "Oups ! Le nombre de calories doit être un nombre positif. Essayez avec un nombre réel (et énergisant) !",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Vérifier la validité des pourcentages personnalisés : soit tous les trois sont renseignés, soit aucun.
    if (
      (protCustom !== null || glucCustom !== null || lipCustom !== null) &&
      (protCustom === null || glucCustom === null || lipCustom === null)
    ) {
      return interaction.reply({
        content:
          "Veuillez renseigner les trois pourcentages personnalisés (protéines, glucides, lipides) ou aucun.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Déclaration des variables de répartition par défaut en fonction de l'objectif nutritionnel
    let proteinesPct, lipidesPct, glucidesPct;

    // Détermination de la répartition initiale selon l'objectif spécifié
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
      // Cas par défaut si l'objectif n'est pas reconnu
      proteinesPct = 30;
      lipidesPct = 30;
      glucidesPct = 40;
    }

    // Ajustement en fonction de l'état corporel
    // Si l'utilisateur se considère "grasse", augmenter les protéines et réduire les glucides.
    // À l'inverse pour "maigre".
    if (etat === "grasse") {
      proteinesPct += 5;
      glucidesPct -= 5;
    } else if (etat === "maigre") {
      proteinesPct -= 5;
      glucidesPct += 5;
    }

    // Ajustement spécifique pour le sexe féminin : augmenter les lipides et réduire les protéines
    if (sexe === "F") {
      lipidesPct += 2;
      proteinesPct -= 2;
    }

    // Si des pourcentages personnalisés sont fournis, ils priment sur les valeurs par défaut et ajustées.
    if (protCustom !== null && glucCustom !== null && lipCustom !== null) {
      // Vérification que la somme des pourcentages personnalisés est exactement 100%
      if (protCustom + glucCustom + lipCustom !== 100) {
        return interaction.reply({
          content:
            "La somme des pourcentages personnalisés doit être égale à 100%.",
          flags: MessageFlags.Ephemeral,
        });
      }
      proteinesPct = protCustom;
      glucidesPct = glucCustom;
      lipidesPct = lipCustom;
    }

    // Calcul des grammes pour chaque macronutriment
    // Rappel des valeurs énergétiques approximatives :
    //   - Protéines et glucides : 4 kcal par gramme.
    //   - Lipides : 9 kcal par gramme.
    const proteinesGr = ((calories * proteinesPct) / 100 / 4).toFixed(2);
    const glucidesGr = ((calories * glucidesPct) / 100 / 4).toFixed(2);
    const lipidesGr = ((calories * lipidesPct) / 100 / 9).toFixed(2);

    // Détermination du libellé d'objectif en fonction du code fourni
    const objectifTexte =
      objectif === "perte"
        ? "Perte de poids"
        : objectif === "maintien"
          ? "Maintien"
          : objectif === "prise"
            ? "Prise de masse"
            : "Recomposition corporelle";

    const coinInfoEmoji = getEmoji("coin_info");
    const tropheEmoji = getEmoji("trophe_or");
    const cookieEmoji = getEmoji("cookie");

    // Création de l'embed Discord de récapitulatif
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle(`${coinInfoEmoji} Répartition des macronutriments`)
      .setDescription(
        `**${tropheEmoji} Objectif** : ${objectifTexte}
**${cookieEmoji} Calories totales** : ${calories} kcal`,
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
      .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
      .setFooter({ text: "Répartition estimée" });

    // Si des informations complémentaires (sexe et/ou état corporel) ont été renseignées,
    // on les ajoute dans un champ dédié.
    let infoSup = "";
    if (sexe) infoSup += `• Sexe : **${sexe === "H" ? "Homme" : "Femme"}**\n`;
    if (etat) infoSup += `• État corporel : **${etat}**\n`;
    if (infoSup.length > 0) {
      embed.addFields({ name: "Informations complémentaires", value: infoSup });
    }

    // Répondre à l'interaction avec l'embed final
    await interaction.reply({ embeds: [embed] });
  },
};
