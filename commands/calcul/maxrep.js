const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const poids = interaction.options.getNumber('poids');
        const reps = interaction.options.getInteger('reps');

        // Vérifications et validations
        if (!poids || poids <= 0) {
            return interaction.reply({
                content: "Oups ! Le poids doit être un nombre positif. Réessaie en entrant un poids qui te donnera de la force (et pas juste du vent) !",
                flags: MessageFlags.Ephemeral
            });
        }
        if (!reps || reps <= 0) {
            return interaction.reply({
                content: "Attention ! Le nombre de répétitions doit être au moins 1. Ne compte pas tes doigts et réessaie, on croit en toi !",
                flags: MessageFlags.Ephemeral
            });
        }

        // Calcul du 1RM (formule d'Epley)
        const maxRep = (poids * (1 + reps / 30)).toFixed(2);

        // Création de l'embed avec le résultat
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('<a:muscle:1343579279279132795> Résultat de votre 1RM')
            .setDescription(`- **Poids maximum estimé** : ${maxRep} kg`)
            .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
            .setFooter({ text: 'Calculé selon la formule d’Epley' });

        await interaction.reply({ embeds: [embed] });
    },
};
