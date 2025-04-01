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

const style = require("../../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  async execute(interaction) {
    // Récupération des options passées par l'utilisateur
    const poids = interaction.options.getNumber("poids");
    // Conversion de la taille fournie en cm vers des mètres
    const taille = interaction.options.getNumber("taille") / 100;
    const age = interaction.options.getInteger("age");
    const sexe = interaction.options.getString("sexe");

    // Calcul de l'IMC (Indice de Masse Corporelle)
    const imc = poids / (taille * taille);

    // Calcul du pourcentage de masse grasse selon le sexe
    // Pour homme : IMC * 1.20 + Age * 0.23 - 10.8 - 5.4
    // Pour femme : IMC * 1.20 + Age * 0.23 - 5.4
    let bodyFatPercentage;
    if (sexe === "homme") {
      bodyFatPercentage = 1.2 * imc + 0.23 * age - 10.8 - 5.4;
    } else {
      bodyFatPercentage = 1.2 * imc + 0.23 * age - 5.4;
    }
    // Arrondi à deux décimales
    bodyFatPercentage = parseFloat(bodyFatPercentage.toFixed(2));

    // Création de l'embed pour présenter les résultats
    const embed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle("Calcul du Pourcentage de Masse Grasse")
      .setThumbnail(thumbnailEmbed)
      .setDescription(
        "Voici vos résultats basés sur la formule de Deurenberg :",
      )
      .addFields(
        { name: "Poids", value: `${poids} kg`, inline: true },
        { name: "Taille", value: `${taille * 100} cm`, inline: true },
        { name: "Âge", value: `${age} ans`, inline: true },
        { name: "Sexe", value: `${sexe}`, inline: true },
        { name: "IMC", value: `${imc.toFixed(2)}`, inline: true },
        {
          name: "Masse grasse estimée",
          value: `${bodyFatPercentage}%`,
          inline: true,
        },
      )
      .setFooter({
        text: "Calculé selon la formule de Deurenberg",
      });

    // Envoi de l'embed en réponse à l'interaction
    await interaction.reply({ embeds: [embed] });
  },
};
