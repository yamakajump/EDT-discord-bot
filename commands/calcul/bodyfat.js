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
    // Récupération des valeurs fournies par l'utilisateur
    const poids = interaction.options.getNumber("poids");
    const taille = interaction.options.getNumber("taille"); // en cm
    const age = interaction.options.getInteger("age");
    const sexe = interaction.options.getString("sexe");

    // Création d'un tableau pour lister les champs manquants
    const missingFields = [];

    if (poids === null || poids === undefined) missingFields.push("poids");
    if (taille === null || taille === undefined) missingFields.push("taille");
    if (age === null || age === undefined) missingFields.push("age");
    if (!sexe) missingFields.push("sexe");

    if (missingFields.length > 0) {
      return interaction.reply({
        content: `Les champs suivants sont manquants : ${missingFields.join(
          ", ",
        )}. Veuillez les renseigner.`,
        ephemeral: true,
      });
    }

    // Vérification que les valeurs numériques sont positives
    if (poids <= 0) {
      return interaction.reply({
        content: "Le poids doit être un nombre positif.",
        ephemeral: true,
      });
    }
    if (taille <= 0) {
      return interaction.reply({
        content: "La taille doit être un nombre positif.",
        ephemeral: true,
      });
    }
    if (age <= 0) {
      return interaction.reply({
        content: "L'âge doit être un nombre positif.",
        ephemeral: true,
      });
    }

    // Normalisation et vérification du champ 'sexe'
    const sexeNormalized = sexe.trim().toLowerCase();
    if (sexeNormalized !== "homme" && sexeNormalized !== "femme") {
      return interaction.reply({
        content: 'Le champ "sexe" doit être renseigné avec "homme" ou "femme".',
        ephemeral: true,
      });
    }

    // Construction de l'objet de données fourni
    const providedData = {
      poids,
      taille,
      age,
      sexe,
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
      // Normalisation de la valeur de sexe (minuscule)
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

      // Si une réponse éphémère existe déjà, on la supprime puis on envoie un message public.
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

    // Appel à la logique de gestion du physique.
    await handleUserPhysique(
      interaction,
      providedData,
      executeCalculationCallback,
    );
  },
};
