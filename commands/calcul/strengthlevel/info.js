const { EmbedBuilder } = require("discord.js");

const { getEmoji } = require("../../../utils/emoji");
const cibleEmoji = getEmoji("cible");
const globeEmoji = getEmoji("globe");
const troisiemeEmoji = getEmoji("troisieme");
const deuxiemeEmoji = getEmoji("deuxieme");
const premierEmoji = getEmoji("premier");
const tropheEmoji = getEmoji("trophe");

const style = require("../../../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

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
      .setColor(colorEmbed)
      .setTitle(`${cibleEmoji} Que signifient les normes de force ?`)
      .setDescription(
        `${globeEmoji} **__Débutant__** : Plus fort que **__5%__** des athlètes. Un athlète débutant est capable d'exécuter correctement le mouvement et s'entraîne depuis au moins **__un mois__**.\n\n` +
          `${troisiemeEmoji} **__Novice__** : Plus fort que **__20%__** des athlètes. Un athlète novice s'entraîne régulièrement à la technique depuis au moins **__six mois__**.\n\n` +
          `${deuxiemeEmoji} **__Intermédiaire__** : Plus fort que **__50%__** des athlètes. Un athlète intermédiaire s'entraîne régulièrement à la technique depuis au moins **__deux ans__**.\n\n` +
          `${premierEmoji} **__Avancé__** : Plus fort que **__80%__** des athlètes. Un athlète avancé progresse depuis plus de **__cinq ans__**.\n\n` +
          `${tropheEmoji} **__Elite__** : Plus fort que **__95%__** des athlètes. Un athlète elite se consacre depuis plus de **__cinq ans__** pour devenir compétitif dans les sports de force.`,
      )
      .setThumbnail(thumbnailEmbed)
      .setFooter({ text: "Informations sur les normes de force" });

    await interaction.reply({ embeds: [embed] });
  },
};
