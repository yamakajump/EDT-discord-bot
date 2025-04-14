/**
 * Module de calcul du pourcentage de masse grasse
 * selon la formule de Deurenberg.
 *
 * Options attendues dans l'interaction :
 *  - poids        : le poids de l'athlète en kg
 *  - taille       : la taille de l'athlète en cm (sera convertie en mètres)
 *  - age          : l'âge de l'athlète en années
 *  - sexe         : "homme" ou "femme"
 *
 * La formule utilisée est :
 *   Pour un homme : (1.20 * IMC) + (0.23 * Age) - 10.8 - 5.4
 *   Pour une femme : (1.20 * IMC) + (0.23 * Age) - 5.4
 * où l'IMC est calculé par poids (kg) / (taille (m))².
 *
 * Le résultat est présenté dans un embed Discord.
 */

const { EmbedBuilder } = require("discord.js");
const { handleUserPhysique } = require("../../logic/handlePhysiqueData");

const style = require("../../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  async execute(interaction) {
    // Construction des données fournies par l'utilisateur
    const providedData = {
      poids: interaction.options.getNumber("poids"),
      taille: interaction.options.getNumber("taille"), // en cm
      age: interaction.options.getInteger("age"),
      sexe: interaction.options.getString("sexe"),
    };

    // Callback qui exécute le calcul de la masse grasse
    const executeCalculationCallback = async (
      interactionContext,
      finalData,
    ) => {
      // On utilise finalData, sachant que la taille est stockée en cm.
      const poids = finalData.poids;
      const tailleM = finalData.taille / 100; // conversion de cm en m
      const age = finalData.age;
      // Normalisation de la valeur de sexe (minuscule pour éviter les problèmes de casse)
      const sexe = finalData.sexe.toLowerCase();

      // Calcul de l'IMC
      const imc = poids / (tailleM * tailleM);

      // Calcul du pourcentage de masse grasse selon la formule de Deurenberg
      let bodyFatPercentage;
      if (sexe === "homme") {
        bodyFatPercentage = 1.2 * imc + 0.23 * age - 10.8 - 5.4;
      } else {
        bodyFatPercentage = 1.2 * imc + 0.23 * age - 5.4;
      }
      bodyFatPercentage = parseFloat(bodyFatPercentage.toFixed(2));

      // Création de l'embed pour présenter le résultat
      const embed = new EmbedBuilder()
        .setColor(colorEmbed)
        .setTitle("Calcul du Pourcentage de Masse Grasse")
        .setThumbnail(thumbnailEmbed)
        .setDescription(
          "Voici vos résultats basés sur la formule de Deurenberg :",
        )
        .addFields(
          { name: "Poids", value: `${poids} kg`, inline: true },
          { name: "Taille", value: `${finalData.taille} cm`, inline: true },
          { name: "Âge", value: `${age} ans`, inline: true },
          { name: "Sexe", value: `${finalData.sexe}`, inline: true },
          { name: "IMC", value: `${imc.toFixed(2)}`, inline: true },
          {
            name: "Masse grasse estimée",
            value: `${bodyFatPercentage}%`,
            inline: true,
          },
        )
        .setFooter({ text: "Calculé selon la formule de Deurenberg" });

      // S'il existe déjà une réponse (souvent éphémère), on la supprime et on envoie un message public.
      if (interactionContext.replied || interactionContext.deferred) {
        try {
          await interactionContext.deleteReply();
        } catch (error) {
          console.error(
            "Erreur lors de la suppression du message éphémère :",
            error,
          );
        }
        await interactionContext.channel.send({ embeds: [embed] });
      } else {
        // Envoyer directement la réponse publique
        await interactionContext.reply({ embeds: [embed] });
      }
    };

    // Appel à la logique de gestion du physique. Celle‑ci se charge de :
    //  • Vérifier si l'utilisateur doit choisir d'enregistrer ses données
    //  • Fusionner les données fournies et celles stockées
    //  • Vérifier si un rappel de mise à jour s'impose au vu de la date de dernière modification
    await handleUserPhysique(
      interaction,
      providedData,
      executeCalculationCallback,
    );
  },
};
