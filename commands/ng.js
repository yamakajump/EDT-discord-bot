const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const nouveauGuerrierDAO = require('../dao/nouveauGuerrierDAO');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ng')
    .setDescription("Voir le nombre de messages enregistrés et d'autres statistiques")
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription("Choisissez un utilisateur (optionnel)")
        .setRequired(false)
    ),

  async execute(interaction) {
    // Récupération de l'utilisateur spécifié ou, par défaut, l'utilisateur qui exécute la commande.
    const userOption = interaction.options.getUser('utilisateur');
    const user = userOption || interaction.user;
    const id = user.id;

    const embed = new EmbedBuilder();
    const totalMessages = 300;
    const emojiValid = "<:oui:1343603794818109440>";
    const emojiInvalid = "<:non:1343603803580010678>";
    const totalDays = 14; // Période d'exemple pour le temps restant

    try {
      const data = await nouveauGuerrierDAO.getById(id);

      if (!data) {
        // Aucun message enregistré pour cet utilisateur.
        embed.setColor('#FFA500')
          .setTitle("Statistiques de messages")
          .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
          .setDescription(
            `<@${user.id}>\n` +
            (user.id === interaction.user.id
              ? "Vous n'avez encore envoyé aucun message enregistré."
              : "Cet utilisateur n'a encore envoyé aucun message enregistré.")
          );
      } else {
        // Formatage de la date du premier message
        const firstMsgDate = new Date(data.date);
        const formattedDate = firstMsgDate.toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // Calcul du temps restant en jours (sur une période de 14 jours)
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - firstMsgDate.getTime());
        let diffDays = Math.round(totalDays - (diffTime / (1000 * 3600 * 24)));
        if (diffDays < 0) diffDays = 0;
        // Emoji pour le temps restant : validé s'il reste 0 jours
        const timeEmoji = diffDays === 0 ? emojiValid : emojiInvalid;

        // Emoji pour le nombre de messages
        const countEmoji = data.count >= totalMessages ? emojiValid : emojiInvalid;

        embed.setColor('#FFA500')
          .setTitle("Statistiques de messages")
          .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
          .setDescription(
            `**Utilisateur** : <@${user.id}>\n` +
            `**Date du premier message** : ${formattedDate}\n` +
            `**Nombre de messages** : ${data.count}/${totalMessages} ${countEmoji}\n` +
            `**Temps restant** : ${diffDays} jour${diffDays > 1 ? 's' : ''} ${timeEmoji}`
          );
      }

      // On se garantit que le mention de l'utilisateur est autorisée en spécifiant allowedMentions
      await interaction.reply({ embeds: [embed], allowedMentions: { users: [user.id] } });
    } catch (err) {
      console.error("Erreur lors de l'exécution de la commande ng :", err);
      await interaction.reply({ 
        content: "Une erreur est survenue lors de la récupération des statistiques.", 
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
