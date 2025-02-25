const { EmbedBuilder } = require('discord.js');

module.exports = {
    async execute(interaction) {
        // Récupération des options
        const poids = interaction.options.getNumber('poids');
        const taille = interaction.options.getNumber('taille'); // en cm
        const age = interaction.options.getInteger('age');
        const sexe = interaction.options.getString('sexe'); // 'H' ou 'F'
        const nap = interaction.options.getString('nap');
        const temps = interaction.options.getNumber('temps'); // en minutes
        const tefInput = interaction.options.getNumber('tef');
        const pourcentageInput = interaction.options.getNumber('pourcentage');
        const ajustementInput = interaction.options.getNumber('ajustement');
        let objectif = interaction.options.getString('objectif'); // 'seche', 'maintien', 'pdm'
        
        // Vérifier que l'utilisateur n'a pas renseigné les deux options simultanément
        if (pourcentageInput !== null && ajustementInput !== null) {
            return interaction.reply({
                content: "Veuillez renseigner soit un pourcentage, soit un ajustement direct des calories, pas les deux.",
                ephemeral: true,
            });
        }

        // Si aucun objectif n'est sélectionné, on définit "maintien" par défaut.
        if (!objectif) {
            objectif = 'maintien';
        }
        
        // Vérifications et validations
        if (!poids || poids <= 0) {
            return interaction.reply({
                content: "Oups ! Le poids saisi n'est pas valide. Réessaie en entrant un poids positif.",
                ephemeral: true,
            });
        }
        if (!taille || taille <= 0) {
            return interaction.reply({
                content: "La taille doit être un nombre supérieur à zéro (en cm). Merci de vérifier ta saisie.",
                ephemeral: true,
            });
        }
        if (!age || age <= 0) {
            return interaction.reply({
                content: "L'âge doit être un nombre positif. Vérifie ton âge s'il te plaît.",
                ephemeral: true,
            });
        }
        if (temps === null || temps < 0) {
            return interaction.reply({
                content: "Le temps d'entraînement doit être positif (en minutes). Merci de vérifier !",
                ephemeral: true,
            });
        }
        if (tefInput === null || tefInput < 10 || tefInput > 25) {
            return interaction.reply({
                content: "Le TEF doit être compris entre 10 et 25. Merci de vérifier ta saisie !",
                ephemeral: true,
            });
        }
        
        // Conversion de la taille en mètres
        const tailleMeters = taille / 100;
        
        // Calcul du TMB (métabolisme basal)
        let TMB = 0;
        if (sexe === 'H') {
            TMB = (13.707 * poids) + (492.3 * tailleMeters) - (6.673 * age) + 77.0607;
        } else {
            TMB = (9.74 * poids) + (172.9 * tailleMeters) - (4.737 * age) + 667.051;
        }
        
        // Dictionnaire pour le niveau d'activité physique (NAP)
        const diconap = {
            S: { H: 1,   F: 1 },
            P: { H: 1.11, F: 1.12 },
            A: { H: 1.25, F: 1.27 },
            T: { H: 1.48, F: 1.45 }
        };
        const NAP = diconap[nap][sexe];
        
        // Calcul du RTEE en fonction du temps d'entraînement (dépense supplémentaire)
        const RTEE = (0.1 * poids) * (temps / 2);
        
        // TEF : facteur d'effet thermique des aliments
        const TEF = 1 + (tefInput / 100);
        
        // Calcul de la dépense énergétique journalière (DEJ)
        const DEJ = Math.round(((TMB * NAP) + RTEE) * TEF);
        
        // Création de l'embed de réponse
        const embed = new EmbedBuilder()
            .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
            .setColor('#ffa600');
        
        // Arrondi du TMB pour affichage
        const TMBrounded = Math.round(TMB);

        // Utilisation de l'option "ajustement" si renseignée
        if (ajustementInput !== null) {
            const adjustedCalories = DEJ + ajustementInput;
            let title, description;
            if (ajustementInput < 0) {
                title = '<:pomme:1343576949133676636> Besoins caloriques ajustés pour une **sèche**';
                description = `<:cookie:1343575844047687771> **Ajustement direct :**
- Calories de maintien : **${DEJ}** kcal
- Réduction directe de : **${Math.abs(ajustementInput)}** kcal
- Total ajusté : **${adjustedCalories}** kcal

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`;
            } else if (ajustementInput > 0) {
                title = '<:frite:1343577110434021416> Besoins caloriques ajustés pour une **prise de masse**';
                description = `<:cookie:1343575844047687771> **Ajustement direct :**
- Calories de maintien : **${DEJ}** kcal
- Ajout direct de : **${ajustementInput}** kcal
- Total ajusté : **${adjustedCalories}** kcal

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`;
            } else {
                title = '<:brioche:1343577047053635585> Besoins caloriques pour le **maintien**';
                description = `<:cookie:1343575844047687771> **Maintien :**
- Calories : **${DEJ}** kcal

Le maintien vise à conserver l'équilibre énergétique pour ne ni prendre ni perdre de poids.
                
**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`;
            }
            embed.setTitle(title)
                .setDescription(description);
        }
        // Si l'option "pourcentage" est renseignée alors on personnalise via un pourcentage
        else if (pourcentageInput !== null) {
            if (pourcentageInput < 100) {
                // Affichage pour une sèche personnalisée
                const customSeche = Math.round(DEJ * (pourcentageInput / 100));
                embed.setTitle('<:pomme:1343576949133676636> Besoins caloriques pour une **sèche**')
                    .setDescription(
`<:cookie:1343575844047687771> **Sèche personnalisée :**
- Pourcentage choisi : **${pourcentageInput}%**
- Calories calculées : **${customSeche}** kcal

**Maintien (100%)** : **${DEJ}** kcal  
**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`
                    );
            } else if (pourcentageInput > 100) {
                // Affichage pour une prise de masse personnalisée
                const customPdm = Math.round(DEJ * (pourcentageInput / 100));
                embed.setTitle('<:frite:1343577110434021416> Besoins caloriques pour une **prise de masse**')
                    .setDescription(
`<:cookie:1343575844047687771> **Prise de masse personnalisée :**
- Pourcentage choisi : **${pourcentageInput}%**
- Calories calculées : **${customPdm}** kcal

**Maintien (100%)** : **${DEJ}** kcal  
**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`
                    );
            } else {
                // Pourcentage exact de 100% -> affichage de maintien
                embed.setTitle('<:brioche:1343577047053635585> Besoins caloriques pour le **maintien**')
                    .setDescription(
`<:cookie:1343575844047687771> **Maintien :**
- Calories : **${DEJ}** kcal

Le maintien vise à conserver l'équilibre énergétique pour ne ni prendre ni perdre de poids.`
                    );
            }
        }
        // Si aucune option de pourcentage ou d'ajustement n'est renseignée,
        // on se base sur l'objectif nutritionnel choisi.
        else {
            if (objectif === 'seche') {
                const ratiosSeche = {
                    "5%": 0.95,
                    "10%": 0.90,
                    "15%": 0.85,
                    "20%": 0.80,
                };

                let secheCalculs = "";
                for (const [pourcentage, ratio] of Object.entries(ratiosSeche)) {
                    secheCalculs += `- Réduction de ${pourcentage} : **${Math.round(DEJ * ratio)}** kcal\n`;
                }

                embed.setTitle('<:pomme:1343576949133676636> Besoins caloriques pour une **sèche**')
                    .setDescription(
`<:cookie:1343575844047687771> **Estimations pour une sèche :**
${secheCalculs}
- Maintien : **${DEJ}** kcal

**Métabolisme Basal (TMB)** : **${TMBrounded}** kcal`
                    );

            } else if (objectif === 'maintien') {
                embed.setTitle('<:brioche:1343577047053635585> Besoins caloriques pour le **maintien**')
                    .setDescription(
`<:cookie:1343575844047687771> **Maintien :**
- Calories : **${DEJ}** kcal

Le maintien vise à conserver l'équilibre énergétique pour ne ni prendre ni perdre de poids.`
                    );
            } else if (objectif === 'pdm') {
                const ratiosPdm = {
                    "5%": 1.05,
                    "10%": 1.10,
                    "15%": 1.15,
                    "20%": 1.20,
                };

                let pdmCalculs = "";
                for (const [pourcentage, ratio] of Object.entries(ratiosPdm)) {
                    pdmCalculs += `- Surplus de ${pourcentage} : **${Math.round(DEJ * ratio)}** kcal\n`;
                }

                embed.setTitle('<:frite:1343577110434021416> Besoins caloriques pour une **prise de masse**')
                    .setDescription(
`<:cookie:1343575844047687771> **Estimations pour une prise de masse :**
${pdmCalculs}
- Maintien : **${DEJ}** kcal

Le but est d'ajouter un surplus calorique pour favoriser la prise de masse.`
                    );
            }
        }
        
        await interaction.reply({ embeds: [embed] });
    },
};
