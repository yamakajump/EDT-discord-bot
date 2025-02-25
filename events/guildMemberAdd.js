const { loadJson } = require('../utils/fileManager');
const path = require('path');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    // Chargement de la configuration
    const configPath = path.join(__dirname, '../config/config.json');
    const config = loadJson(configPath, {});
    const memberCountChannelId = config.memberCountChannel;
    if (!memberCountChannelId) {
      return console.error("La clé 'memberCountChannel' n'est pas définie dans config.json");
    }

    // Récupération du salon vocal dans lequel mettre à jour le compteur
    const channel = member.guild.channels.cache.get(memberCountChannelId);
    if (!channel) {
      return console.error(`Le salon avec l'ID ${memberCountChannelId} n'a pas été trouvé`);
    }

    // Construction de la nouvelle chaîne avec le nombre de membres
    const newName = `📈 Discord : ${member.guild.memberCount} Membres`;
    channel.setName(newName)
      .catch(err => console.error("Erreur lors de la mise à jour du salon :", err));
  }
};
