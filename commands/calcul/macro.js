const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    async execute(interaction) {
        // Récupération des options obligatoires
        const calories = interaction.options.getNumber('calories');
        const objectif = interaction.options.getString('objectif'); // 'perte', 'maintien', 'prise', 'recomp'

        // Récupération des options optionnelles
        const sexe = interaction.options.getString('sexe'); // 'H' ou 'F'
        const etat = interaction.options.getString('etat'); // 'maigre' ou 'grasse'
        const protCustom = interaction.options.getNumber('proteines');
        const glucCustom = interaction.options.getNumber('glucides');
        const lipCustom = interaction.options.getNumber('lipides');

        // Vérification de la validité du nombre de calories
        if (!calories || calories <= 0) {
            return interaction.reply({
                content: "Oups ! Le nombre de calories doit être un nombre positif. Essayez avec un nombre réel (et énergisant) !",
                flags: MessageFlags.Ephemeral
            });
        }

        // Si une partie seulement des pourcentages personnalisés est fournie, on retourne une erreur
        if ((protCustom !== null || glucCustom !== null || lipCustom !== null) &&
            (protCustom === null || glucCustom === null || lipCustom === null)
        ) {
            return interaction.reply({
                content: "Veuillez renseigner les trois pourcentages personnalisés (protéines, glucides, lipides) ou aucun.",
                flags: MessageFlags.Ephemeral
            });
        }

        // Variable qui contiendra les pourcentages finaux
        let proteinesPct, lipidesPct, glucidesPct;

        // Détermination des valeurs par défaut en fonction de l'objectif
        if (objectif === 'perte') {
            // Objectif perte
            proteinesPct = 35;
            lipidesPct = 25;
            glucidesPct = 40;
        } else if (objectif === 'maintien') {
            // Objectif maintien
            proteinesPct = 30;
            lipidesPct = 30;
            glucidesPct = 40;
        } else if (objectif === 'prise') {
            // Objectif prise de masse
            proteinesPct = 25;
            lipidesPct = 25;
            glucidesPct = 50;
        } else if (objectif === 'recomp') {
            // Objectif recomposition corporelle
            proteinesPct = 35;
            lipidesPct = 20;
            glucidesPct = 45;
        } else {
            // Valeurs par défaut si jamais l'objectif n'est pas reconnu
            proteinesPct = 30;
            lipidesPct = 30;
            glucidesPct = 40;
        }

        // Ajustement en fonction de l'état corporel
        if (etat === 'grasse') {
            // Pour une personne se considérant "grasse", on augmente la part de protéines et on réduit celle des glucides
            proteinesPct += 5;
            glucidesPct -= 5;
        } else if (etat === 'maigre') {
            // Pour une personne se considérant "maigre", on réduit la part de protéines et on augmente celle des glucides
            proteinesPct -= 5;
            glucidesPct += 5;
        }

        // Ajustement en fonction du sexe (pour les femmes)
        if (sexe === 'F') {
            // Exemple d'ajustement : on augmente la part de lipides et on réduit la part de protéines
            lipidesPct += 2;
            proteinesPct -= 2;
        }

        // Si des pourcentages personnalisés sont spécifiés, ceux-ci priment sur les valeurs par défaut/ajustées
        if (protCustom !== null && glucCustom !== null && lipCustom !== null) {
            if (protCustom + glucCustom + lipCustom !== 100) {
                return interaction.reply({
                    content: "La somme des pourcentages personnalisés doit être égale à 100%.",
                    flags: MessageFlags.Ephemeral
                });
            }
            proteinesPct = protCustom;
            glucidesPct = glucCustom;
            lipidesPct = lipCustom;
        }

        // Calcul des grammes pour chaque macronutriment
        // Les protéines et glucides apportent environ 4 kcal/g et les lipides environ 9 kcal/g.
        const proteinesGr = ((calories * proteinesPct) / 100 / 4).toFixed(2);
        const glucidesGr = ((calories * glucidesPct) / 100 / 4).toFixed(2);
        const lipidesGr = ((calories * lipidesPct) / 100 / 9).toFixed(2);

        // Détermination du texte affiché en fonction de l'objectif
        const objectifTexte = 
            objectif === 'perte'    ? 'Perte de poids' :
            objectif === 'maintien' ? 'Maintien' :
            objectif === 'prise'    ? 'Prise de masse' :
                                      'Recomposition corporelle';

        // Création de l'embed récapitulatif
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
        
        // Ajout d'informations complémentaires si le sexe et/ou l'état corporel ont été renseignés
        let infoSup = "";
        if (sexe) infoSup += `• Sexe : **${sexe === 'H' ? 'Homme' : 'Femme'}**\n`;
        if (etat) infoSup += `• État corporel : **${etat}**\n`;
        if (infoSup.length > 0) {
            embed.addFields({ name: "Informations complémentaires", value: infoSup });
        }
        
        await interaction.reply({ embeds: [embed] });
    },
};
