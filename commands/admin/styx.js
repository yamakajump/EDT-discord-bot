/**
 * Module de gestion du "Styx" pour un utilisateur.
 *
 * Ce module permet d'ajouter un utilisateur au Styx (ce qui consiste à supprimer temporairement
 * ses autres rôles protégés, et à lui attribuer le rôle Styx) ou de le retirer du Styx en
 * réattribuant ses anciens rôles sauvegardés.
 *
 * La configuration est récupérée depuis le fichier config.json, et les données persistées
 * dans data/styx.json.
 *
 * Pour modifier le comportement (rôles à sauvegarder, rôles protégés, etc.), veuillez adapter
 * les valeurs dans la configuration ou dans le code selon vos besoins.
 */

const path = require("path");
const { EmbedBuilder, MessageFlags } = require("discord.js");
const fileManager = require("../../utils/fileManager.js");

const { getEmoji } = require("../../utils/emoji");
const infoEmoji = getEmoji("info");

const style = require("../../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

const configPath = path.join(__dirname, "../../config/config.json");
const config = fileManager.loadJson(configPath, {});
const jsonPath = path.join(__dirname, "../../data/styx.json");
let styxjson = fileManager.loadJson(jsonPath, []);

module.exports = {
  async execute(interaction) {
    const userOption = interaction.options.getUser("membre");
    const id = userOption.id;
    let userIsInStyx = false;
    let indice;

    for (let i = 0; i < styxjson.length; i++) {
      if (styxjson[i].name === userOption.username) {
        userIsInStyx = true;
        indice = i;
        break;
      }
    }

    const embed = new EmbedBuilder().setColor(colorEmbed);
    const styxRole = interaction.guild.roles.cache.get(config.styxRole);
    if (!styxRole) {
      console.error(
        "Le rôle Styx n’a pas été trouvé sur ce serveur.",
        config.styxRole,
      );
      return interaction.reply({
        content: "Erreur: Le rôle Styx n’a pas été trouvé sur ce serveur.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const member = await interaction.guild.members.fetch(id);

      if (userIsInStyx) {
        for (const roleId of styxjson[indice].role) {
          const role = interaction.guild.roles.cache.get(roleId);
          if (role && role.editable) await member.roles.add(role);
          else
            console.log(
              `Impossible d’ajouter le rôle ${roleId} à ${member.user.username} (non trouvable ou non editable).`,
            );
        }
        embed
          .setTitle(`${infoEmoji} Styx Enlevé`)
          .setDescription(
            `*Vous venez d'enlever* **${member.user.username}** *du Styx*`,
          )
          .setThumbnail(thumbnailEmbed);
        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
        if (styxRole.editable) await member.roles.remove(styxRole);
        else
          console.log(
            `Le rôle Styx (${styxRole.id}) n'est pas modifiable pour ${member.user.username}.`,
          );
        styxjson.splice(indice, 1);
        fileManager.saveJson(jsonPath, styxjson);
      } else {
        let rolesToRemove = [];
        member.roles.cache.forEach((role) => {
          if (
            role.id !== config.protectedRole &&
            role.id !== interaction.guild.id
          ) {
            rolesToRemove.push(role.id);
          }
        });
        for (const roleId of rolesToRemove) {
          const role = interaction.guild.roles.cache.get(roleId);
          if (role && role.editable) await member.roles.remove(role);
        }
        if (styxRole.editable) await member.roles.add(styxRole);
        styxjson.push({
          name: member.user.username,
          role: rolesToRemove,
        });
        embed
          .setTitle(`${infoEmoji} Styx Ajouté`)
          .setDescription(
            `*Vous venez d'envoyer* **${member.user.username}** *au Styx*`,
          )
          .setThumbnail(thumbnailEmbed);
        await interaction.reply({
          embeds: [embed],
          flags: MessageFlags.Ephemeral,
        });
        fileManager.saveJson(jsonPath, styxjson);
      }
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: "Erreur lors de la modification des rôles.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
