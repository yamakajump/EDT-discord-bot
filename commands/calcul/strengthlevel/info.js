const { EmbedBuilder } = require('discord.js');

/**
 * Module d'affichage des explications relatives aux normes de force.
 *
 * Ce module sert à fournir une réponse visuelle (via un embed Discord)
 * qui explique la signification de chaque niveau de force (Débutant, Novice,
 * Intermédiaire, Avancé, Elite). Chaque niveau est décrit par rapport au pourcentage
 * d'athlètes surpassés et aux critères d'entraînement associés.
 */
module.exports = {
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('<a:cible:1343582335349559358> Que signifient les normes de force ?')
      .setDescription(
        `<:globe:1343603858089316453> **__Débutant__** : Plus fort que **__5%__** des athlètes. Un athlète débutant est capable d'exécuter correctement le mouvement et s'entraîne depuis au moins **__un mois__**.\n\n` +
        `<a:troisieme:1343582367478190091> **__Novice__** : Plus fort que **__20%__** des athlètes. Un athlète novice s'entraîne régulièrement à la technique depuis au moins **__six mois__**.\n\n` +
        `<a:deuxieme:1343582357805989976> **__Intermédiaire__** : Plus fort que **__50%__** des athlètes. Un athlète intermédiaire s'entraîne régulièrement à la technique depuis au moins **__deux ans__**.\n\n` +
        `<a:premier:1343582386507612171> **__Avancé__** : Plus fort que **__80%__** des athlètes. Un athlète avancé progresse depuis plus de **__cinq ans__**.\n\n` +
        `<a:trophe:1343582450344788019> **__Elite__** : Plus fort que **__95%__** des athlètes. Un athlète elite se consacre depuis plus de **__cinq ans__** pour devenir compétitif dans les sports de force.`
      )
      .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
      .setFooter({ text: 'Informations sur les normes de force' });

    await interaction.reply({ embeds: [embed] });
  },
};
