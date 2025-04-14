/**
 * Gestionnaire de l'événement "guildMemberRemove".
 *
 * Ce module est déclenché lorsqu'un membre quitte le serveur.
 * Son rôle principal est de mettre à jour le nom du salon affichant le nombre de membres,
 * afin de refléter la diminution du compteur de membres.
 *
 * La configuration (ID du salon à mettre à jour) est chargée depuis le fichier "config/config.json".
 */

const config = require("../config/config.json");
const memberCountChannelId = config.memberCountChannel;

module.exports = {
  name: "guildMemberRemove", // Nom de l'événement
  async execute(member) {
    // 1. Chargement de la configuration depuis le fichier config/config.json

    // Vérifier que la clé "memberCountChannel" existe dans la configuration
    if (!memberCountChannelId) {
      return console.error(
        "La clé 'memberCountChannel' n'est pas définie dans config.json",
      );
    }

    // 2. Récupération du salon où le nombre de membres est affiché
    const channel = member.guild.channels.cache.get(memberCountChannelId);
    if (!channel) {
      return console.error(
        `Le salon avec l'ID ${memberCountChannelId} n'a pas été trouvé`,
      );
    }

    // 3. Mise à jour du nom du salon pour refléter le nouveau nombre de membres
    // Le nom du salon est mis à jour avec le compteur actuel de membres du serveur
    const newName = `📈 Discord : ${member.guild.memberCount} Membres`;
    channel
      .setName(newName)
      .catch((err) =>
        console.error(
          "⚠️\x1b[31m  Erreur lors de la mise à jour du salon :",
          err,
        ),
      );
  },
};
