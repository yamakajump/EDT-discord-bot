/**
 * Gestionnaire de l'événement "guildMemberAdd".
 *
 * Ce module intervient lorsqu'un nouveau membre rejoint le serveur et réalise plusieurs actions :
 *  1. Met à jour le compteur de membres dans le salon dédié.
 *  2. Envoie un message de bienvenue dans le salon approprié.
 *  3. Envoie un "ping" temporaire dans un ou plusieurs salons définis afin d'attirer l'attention du nouveau membre.
 *  4. Envoie en message privé (DM) un guide de bienvenue comprenant une embed et une rangée de boutons interactifs.
 *
 * La configuration (IDs des salons, etc.) est chargée depuis le fichier config/config.json.
 */

const { EmbedBuilder } = require("discord.js");
const { getGuideEmbed, getGuideButtons } = require("../utils/guide"); // Importer les fonctions utilitaires pour le guide

const { getEmoji } = require("../utils/emoji");
const emojiTrophe = getEmoji("trophe");

const style = require("../config/style.json");
const colorEmbed = style.colorEmbed;

const config = require("../config/config.json");
const memberCountChannelId = config.memberCountChannel;
const welcomeChannelId = config.welcomeChannel;
const pingWelcomeChannelIds = config.pingWelcomeChannelIds;

module.exports = {
  name: "guildMemberAdd",
  async execute(member) {
    // Création d'une variable pour afficher le nom du membre
    const memberName =
      member.guild.members.cache.get(member.id)?.displayName ||
      member.user.username;

    /*
     * 1. Mise à jour du compteur de membres
     * - La configuration doit contenir l'ID du salon où le nombre de membres doit être affiché.
     * - Le nom du salon est mis à jour avec la valeur actuelle du compteur de membres du serveur.
     */
    if (!memberCountChannelId) {
      console.error(
        "La clé 'memberCountChannel' n'est pas définie dans config.json",
      );
    } else {
      const countChannel =
        member.guild.channels.cache.get(memberCountChannelId);
      if (!countChannel) {
        console.error(
          `Le salon avec l'ID ${memberCountChannelId} n'a pas été trouvé`,
        );
      } else {
        const newName = `📈 Discord : ${member.guild.memberCount} Membres`;
        countChannel
          .setName(newName)
          .then(() => {
            console.log(
              `\x1b[38;5;5m📈  Compteur de membres mis à jour : \x1b[38;5;13m${member.guild.memberCount} membres \x1b[38;5;2m+1\x1b[0m`,
            );
          })
          .catch((err) =>
            console.error(
              "⚠️\\x1b[38;5;1m  Erreur lors de la mise à jour du salon :",
              err,
            ),
          );
      }
    }

    /*
     * 2. Envoi du message de bienvenue dans le salon dédié
     * - La configuration doit contenir l'ID du salon de bienvenue.
     * - Le message de bienvenue inclut le nom de l'utilisateur, un message de présentation ainsi qu'un rappel vers
     *   le salon de présentation.
     */
    if (!welcomeChannelId) {
      console.error(
        "La clé 'welcomeChannel' n'est pas définie dans config.json",
      );
    } else {
      const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
      if (!welcomeChannel) {
        console.error(
          `Le salon avec l'ID ${welcomeChannelId} n'a pas été trouvé`,
        );
      } else {
        const embed = new EmbedBuilder()
          .setTitle("Bienvenue")
          .setDescription(
            `**Tu es enfin là** ${member.user} !\n` +
              `Bienvenue dans **L'Ecole du Tigre** ${emojiTrophe}\n` +
              `N'hésite pas à te présenter dans le salon <#610934395062190096> et à nous faire part de tes objectifs !`,
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setColor(colorEmbed);

        welcomeChannel
          .send({ embeds: [embed] })
          .catch((err) =>
            console.error(
              "⚠️\\x1b[38;5;1m  Erreur lors de l'envoi du message de bienvenue :",
              err,
            ),
          );
      }
    }

    /*
     * 3. Envoi d'un ping dans un ou plusieurs salons pour attirer l'attention
     * - On récupère la liste des IDs des salons où le ping doit être envoyé.
     * - Pour chaque salon, un message mentionnant le nouveau membre est envoyé, puis supprimé après 2 secondes.
     */
    if (!pingWelcomeChannelIds || pingWelcomeChannelIds.length === 0) {
      console.error(
        "La clé 'pingWelcomeChannelIds' n'est pas définie ou vide dans config.json",
      );
    } else {
      pingWelcomeChannelIds.forEach(async (channelId) => {
        const pingChannel = member.guild.channels.cache.get(channelId);
        if (!pingChannel) {
          console.error(`Le salon avec l'ID ${channelId} n'a pas été trouvé`);
        } else {
          try {
            // Envoi du ping en mentionnant le membre
            const pingMessage = await pingChannel.send(`${member}`);
            // Suppression du message 2 secondes après envoi
            setTimeout(() => {
              pingMessage
                .delete()
                .then(() => {
                  console.log(
                    `\x1b[38;5;5m🔔  Suppresion du message de ping de \x1b[38;5;13m${memberName} \x1b[38;5;5mdans le salon \x1b[38;5;13m${channelId}\x1b[0m`,
                  );
                })
                .catch((err) =>
                  console.error(
                    "⚠️\\x1b[38;5;1m  Erreur lors de la suppression du ping :",
                    err,
                  ),
                );
            }, 2000);
          } catch (err) {
            console.error(
              "⚠️\\x1b[38;5;1m  Erreur lors de l'envoi du ping dans le salon de bienvenue :",
              err,
            );
          }
        }
      });
    }

    /*
     * 4. Envoi du guide en message privé (DM)
     * - Utilisation des fonctions utilitaires getGuideEmbed et getGuideButtons pour générer
     *   le contenu et les composants interactifs du guide.
     * - Le guide est envoyé sous forme d'embed avec une rangée de boutons (par exemple, pour la pagination).
     */
    try {
      // Génération de l'embed pour la page 1
      const guideEmbed = getGuideEmbed(1, member.user);
      // Génération de la rangée de boutons pour interagir avec le guide
      const row = getGuideButtons(1, member.user.id);

      await member.send({ embeds: [guideEmbed], components: [row] });
      console.log(
        `\x1b[38;5;13m📖  Guide \x1b[38;5;5menvoyé à \x1b[38;5;13m${memberName} \x1b[38;5;5men DM.\x1b[0m`,
      );
    } catch (error) {
      console.error(
        `⚠️ Impossible d'envoyer le guide en DM à ${memberName} :`,
        error,
      );
    }
  },
};
