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
    // Création d'une variable pour afficher le nom du membre
    const memberName =
      member.guild.members.cache.get(member.id)?.displayName ||
      member.user.username;

    // Vérifier que la clé "memberCountChannel" existe dans la configuration
    if (!memberCountChannelId) {
      return console.error(
        "La clé 'memberCountChannel' n'est pas définie dans config.json",
      );
    }

    // 1. Récupération du salon où le nombre de membres est affiché
    const channel = member.guild.channels.cache.get(memberCountChannelId);
    if (!channel) {
      return console.error(
        `Le salon avec l'ID ${memberCountChannelId} n'a pas été trouvé`,
      );
    }

    // 2. Mise à jour du nom du salon pour refléter le nouveau nombre de membres
    // Le nom du salon est mis à jour avec le compteur actuel de membres du serveur
    const newName = `📈 Discord : ${member.guild.memberCount} Membres`;
    channel
      .setName(newName)
      .then(() => {
        console.log(
          `\x1b[38;5;13m📉  ${memberName}\x1b[38;5;5m vient de quitter. Compteur de membres mis à jour : \x1b[38;5;13m${member.guild.memberCount} membres \x1b[38;5;1m-1\x1b[0m`,
        );
      })
      .catch((err) =>
        console.error(
          "⚠️\x1b[38;5;1m  Erreur lors de la mise à jour du salon :",
          err,
        ),
      );
  },
};
