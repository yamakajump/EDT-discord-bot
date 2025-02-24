const { EmbedBuilder } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const poids = interaction.options.getNumber('poids');
        const tailleCm = interaction.options.getNumber('taille');

        // Vérifications et validations
        if (!poids || poids <= 0) {
            return interaction.reply({
                content: "Oups ! Le poids saisi n'est pas valide. Réessaie en entrant un poids positif.",
                ephemeral: true,
            });
        }
        if (!tailleCm || tailleCm <= 0) {
            return interaction.reply({
                content: "Hé, ta taille doit être un nombre supérieur à zéro (en cm). Merci de vérifier ta saisie.",
                ephemeral: true,
            });
        }

        // Conversion de la taille en mètres
        const taille = tailleCm / 100;

        // Calcul de l'IMC
        const imc = (poids / (taille * taille)).toFixed(2);

        // Classification de l'IMC
        let classification;
        if (imc < 18.5) classification = "Insuffisance pondérale (maigreur)";
        else if (imc >= 18.5 && imc < 24.9) classification = "Poids normal";
        else if (imc >= 25 && imc < 29.9) classification = "Surpoids";
        else classification = "Obésité";

        // Création de l'embed
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('<:info:1343582548353089537> Résultat de votre IMC')
            .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
            .setDescription(`- **IMC** : ${imc}\n- **Classification** : ${classification}`)
            .setFooter({ text: 'Calculé selon la formule de l’IMC' });

        await interaction.reply({ embeds: [embed] });
    },
};
