/**
 * Module de commande "template"
 *
 * Cette commande envoie un message contenant un embed qui fournit un lien vers le template
 * de l'EDT. L'embed présente le lien cliquable, une miniature et un pied de page.
 *
 * Lorsque l'utilisateur exécute la commande "template", il reçoit un embed détaillant le lien
 * permettant d'accéder au template.
 */

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  // Définition de la commande slash "template"
  data: new SlashCommandBuilder()
    .setName("template")
    .setDescription("Affiche le lien du template"),

  async execute(interaction) {
    // Création de l'embed contenant les informations sur le template
    const embed = new EmbedBuilder()
      .setTitle("Template Disponible")
      .setDescription(
        "Vous pouvez accéder au template en cliquant sur le lien ci-dessous.",
      )
      .setColor(0x1e90ff)
      .addFields({
        name: "Lien du Template",
        value:
          "[Cliquez ici pour accéder au template](https://docs.google.com/spreadsheets/d/1zhwqxzqUBibLvHbCI0rOi2ZqNU2SzOOBg-KFOwuZvSQ/edit?usp=sharing)",
      })
      .setThumbnail(
        "https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png",
      )
      .setFooter({
        text: "Bon travail !",
        iconURL: "https://i.ibb.co/Y795qQQd/logo-EDT.png",
      });

    // Envoi de l'embed en réponse à la commande
    await interaction.reply({ embeds: [embed] });
  },
};
