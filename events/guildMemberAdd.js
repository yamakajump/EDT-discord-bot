const { EmbedBuilder } = require("discord.js");
const { loadJson } = require("../utils/fileManager");
const { getGuideEmbed, getGuideButtons } = require('../utils/guide'); // Importer les fonctions du guide
const path = require("path");

module.exports = {
  name: "guildMemberAdd",
  async execute(member) {
    // Chargement de la configuration à l'aide du module fileManager
    const configPath = path.join(__dirname, "../config/config.json");
    const config = loadJson(configPath, {});

    // Mise à jour du compteur de membres
    const memberCountChannelId = config.memberCountChannel;
    if (!memberCountChannelId) {
      console.error(
        "La clé 'memberCountChannel' n'est pas définie dans config.json"
      );
    } else {
      const countChannel =
        member.guild.channels.cache.get(memberCountChannelId);
      if (!countChannel) {
        console.error(
          `Le salon avec l'ID ${memberCountChannelId} n'a pas été trouvé`
        );
      } else {
        const newName = `📈 Discord : ${member.guild.memberCount} Membres`;
        countChannel
          .setName(newName)
          .catch((err) =>
            console.error("Erreur lors de la mise à jour du salon :", err)
          );
      }
    }

    // Envoi du message de bienvenue dans le salon dédié
    const welcomeChannelId = config.welcomeChannel;
    if (!welcomeChannelId) {
      console.error(
        "La clé 'welcomeChannel' n'est pas définie dans config.json"
      );
    } else {
      const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
      if (!welcomeChannel) {
        console.error(
          `Le salon avec l'ID ${welcomeChannelId} n'a pas été trouvé`
        );
      } else {
        const embed = new EmbedBuilder()
          .setTitle("Bienvenue")
          .setDescription(
            `**Tu es enfin là** ${member.user} !\n` +
              `Bienvenue dans **L'Ecole du Tigre** <a:trophe:1343582450344788019>\n` +
              `N'hésite pas à te présenter dans le salon <#610934395062190096> et à nous faire part de tes objectifs !`
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setColor("#FFA500");

        welcomeChannel
          .send({ embeds: [embed] })
          .catch((err) =>
            console.error(
              "Erreur lors de l'envoi du message de bienvenue :",
              err
            )
          );
      }
    }

    // Envoi du ping dans le salon dédié aux explications de bienvenue
    // Le message ping est supprimé quelques secondes après afin d'inciter la personne à aller consulter le channel
    const pingWelcomeChannelIds = config.pingWelcomeChannelIds;
    if (!pingWelcomeChannelIds || pingWelcomeChannelIds.length === 0) {
      console.error(
        "La clé 'pingWelcomeChannelIds' n'est pas définie ou vide dans config.json"
      );
    } else {
      pingWelcomeChannelIds.forEach(async (channelId) => {
        const pingChannel = member.guild.channels.cache.get(channelId);
        if (!pingChannel) {
          console.error(`Le salon avec l'ID ${channelId} n'a pas été trouvé`);
        } else {
          try {
            // Envoi du ping : on mentionne le membre pour attirer son attention
            const pingMessage = await pingChannel.send(`${member}`);
            // Suppression du message après 2 secondes
            setTimeout(() => {
              pingMessage
                .delete()
                .catch((err) =>
                  console.error("Erreur lors de la suppression du ping :", err)
                );
            }, 2000);
          } catch (err) {
            console.error(
              "Erreur lors de l'envoi du ping dans le salon de bienvenue :",
              err
            );
          }
        }
      });
    }

    // 💬 Envoi du guide en DM (Page 1)
    try {
      const guideEmbed = getGuideEmbed(1, member.user);
      const row = getGuideButtons(1, member.user.id);

      await member.send({ embeds: [guideEmbed], components: [row] });
      console.log(`📖 Guide envoyé à ${member.user.tag} en DM.`);
    } catch (error) {
      console.error(
        `⚠️ Impossible d'envoyer le guide en DM à ${member.user.tag} :`,
        error
      );
    }
  },
};
