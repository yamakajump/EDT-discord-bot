const { EmbedBuilder } = require('discord.js');
const { loadJson } = require('../utils/fileManager');
const path = require('path');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    // Chargement de la configuration
    const configPath = path.join(__dirname, '../config/config.json');
    const config = loadJson(configPath, {});

    // Mise à jour du compteur de membres
    const memberCountChannelId = config.memberCountChannel;
    if (!memberCountChannelId) {
      console.error("La clé 'memberCountChannel' n'est pas définie dans config.json");
    } else {
      const countChannel = member.guild.channels.cache.get(memberCountChannelId);
      if (!countChannel) {
        console.error(`Le salon avec l'ID ${memberCountChannelId} n'a pas été trouvé`);
      } else {
        const newName = `📈 Discord : ${member.guild.memberCount} Membres`;
        countChannel.setName(newName).catch(err => console.error("Erreur lors de la mise à jour du salon :", err));
      }
    }

    // Envoi du message de bienvenue dans le salon dédié
    const welcomeChannelId = config.welcomeChannel;
    if (!welcomeChannelId) {
      return console.error("La clé 'welcomeChannel' n'est pas définie dans config.json");
    }

    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
    if (!welcomeChannel) {
      return console.error(`Le salon avec l'ID ${welcomeChannelId} n'a pas été trouvé`);
    }

    const embed = new EmbedBuilder()
      .setTitle("Bienvenue")
      .setDescription(`**Tu es enfin là** ${member.user} !\nBienvenue à toi dans **L'Ecole du Tigre** <a:trophe:1343582450344788019>\nHésite pas à aller te présenter dans le channel\n⁠<#610934395062190096> et à nous faire part de tes objectifs !`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor('#FFA500')

    welcomeChannel.send({ embeds: [embed] }).catch(err => console.error("Erreur lors de l'envoi du message de bienvenue :", err));
  },
};
