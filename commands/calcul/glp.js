const { EmbedBuilder } = require('discord.js');

function dots_poly(a, b, c, d, e, x) {
    const x2 = x * x;
    const x3 = x2 * x;
    const x4 = x3 * x;
    return 500.0 / (a * x4 + b * x3 + c * x2 + d * x + e);
}

function dots_men(bw) {
    bw = Math.min(Math.max(bw, 40.0), 210.0);
    return dots_poly(-0.0000010930, 0.0007391293, -0.1918759221, 24.0900756, -307.75076, bw);
}

function dots_women(bw) {
    bw = Math.min(Math.max(bw, 40.0), 150.0);
    return dots_poly(-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -57.96288, bw);
}

const PARAMETERS = {
    "M": {
        "Raw": {
            "SBD": [1199.72839, 1025.18162, 0.009210],
            "B": [320.98041, 281.40258, 0.01008]
        },
        "Single-ply": {
            "SBD": [1236.25115, 1449.21864, 0.01644],
            "B": [381.22073, 733.79378, 0.02398]
        }
    },
    "F": {
        "Raw": {
            "SBD": [610.32796, 1045.59282, 0.03048],
            "B": [142.40398, 442.52671, 0.04724]
        },
        "Single-ply": {
            "SBD": [758.63878, 949.31382, 0.02435],
            "B": [221.82209, 357.00377, 0.02937]
        }
    }
};

module.exports = {
    async execute(interaction) {
        // Récupération propre des options
        const sexe = interaction.options.getString('sexe');
        const equipement = interaction.options.getString('equipement');
        const mouvements = interaction.options.getString('mouvements');
        const bw = interaction.options.getNumber('bodyweight');
        const total = interaction.options.getNumber('total');

        // Calcul de la valeur "dots"
        let dots = (sexe === "M") ? dots_men(bw) : dots_women(bw);

        const params = PARAMETERS[sexe][equipement][mouvements];
        const denom = params[0] - (params[1] * Math.exp(-1.0 * params[2] * bw));
        let glp = (denom === 0) ? 0 : Math.max(0, total * 100.0 / denom);
        if (isNaN(glp) || bw < 35) {
            glp = 0;
        }

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('Indice GLP en Force Athlétique')
            .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
            .setDescription(`Votre indice GLP est de **${glp.toFixed(2)} Points**`)
            .setFooter({ text: 'Calculé selon la formule GLP adaptée' });

        await interaction.reply({ embeds: [embed] });
    }
};
