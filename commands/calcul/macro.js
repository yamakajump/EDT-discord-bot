const { EmbedBuilder } = require('discord.js');

module.exports = {
    async execute(interaction) {
        const calories = interaction.options.getNumber('calories');
        const objectif = interaction.options.getString('objectif');

        // Vérification de la valeur des calories
        if (!calories || calories <= 0) {
            return interaction.reply({
                content: "Oups ! Le nombre de calories doit être un nombre positif. Essayez avec un nombre réel (et énergisant) !",
                ephemeral: true,
            });
        }

        // Déterminer les pourcentages pour chaque macronutriment
        let proteinesPct, lipidesPct, glucidesPct;

        if (objectif === 'perte') {
            proteinesPct = 35; // 35% des calories
            lipidesPct = 25;   // 25% des calories
            glucidesPct = 40;  // 40% des calories
        } else if (objectif === 'maintien') {
            proteinesPct = 30; // 30% des calories
            lipidesPct = 30;   // 30% des calories
            glucidesPct = 40;  // 40% des calories
        } else if (objectif === 'prise') {
            proteinesPct = 25; // 25% des calories
            lipidesPct = 25;   // 25% des calories
            glucidesPct = 50;  // 50% des calories
        } else if (objectif === 'recomp') {
            proteinesPct = 35; // 35% des calories
            lipidesPct = 20;   // 20% des calories
            glucidesPct = 45;  // 45% des calories
        }

        // Calcul des grammes pour chaque macronutriment
        // (en supposant 4 kcal par gramme pour les protéines et les glucides et 9 kcal par gramme pour les lipides)
        const proteinesGr = ((calories * proteinesPct) / 100 / 4).toFixed(2);
        const lipidesGr = ((calories * lipidesPct) / 100 / 9).toFixed(2);
        const glucidesGr = ((calories * glucidesPct) / 100 / 4).toFixed(2);

        // Détermination du texte d'objectif en fonction de l'option saisie
        const objectifTexte = 
            objectif === 'perte'   ? 'Perte de poids' :
            objectif === 'maintien'? 'Maintien' :
            objectif === 'prise'   ? 'Prise de masse' :
                                     'Recomposition corporelle';

        // Création de l'embed avec les informations formatées
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('<:coin_info:1343575919608074322> Répartition des macronutriments')
            .setDescription(`**<:trophe_or:1343578100642086953> Objectif** : ${objectifTexte}
**<:cookie:1343575844047687771> Calories totales** : ${calories} kcal`)
            .addFields(
                { name: 'Protéines', value: `${proteinesGr} g (${proteinesPct}%)`, inline: true },
                { name: 'Lipides', value: `${lipidesGr} g (${lipidesPct}%)`, inline: true },
                { name: 'Glucides', value: `${glucidesGr} g (${glucidesPct}%)`, inline: true }
            )
            .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
            .setFooter({ text: 'Répartition estimée' });

        await interaction.reply({ embeds: [embed] });
    },
};
