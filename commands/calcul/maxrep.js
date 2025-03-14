const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  async execute(interaction) {
    const poids = interaction.options.getNumber('poids');
    const reps = interaction.options.getInteger('reps');

    // Vérifications et validations
    if (!poids || poids <= 0) {
      return interaction.reply({
        content:
          "Oups ! Le poids doit être un nombre positif. Réessaie en entrant un poids qui te donnera de la force (et pas juste du vent) !",
        flags: MessageFlags.Ephemeral,
      });
    }
    if (!reps || reps <= 0) {
      return interaction.reply({
        content:
          "Attention ! Le nombre de répétitions doit être au moins 1. Ne compte pas tes doigts et réessaie, on croit en toi !",
        flags: MessageFlags.Ephemeral,
      });
    }

    // Calcul des estimations 1RM selon chacune des formules
    const w = poids;
    const r = reps;
    const results = {};

    // Adams:  w * 1/(1 - 0.02*r)
    results['Adams'] = w * (1 / (1 - 0.02 * r));

    // Baechele: w * (1 + 0.033*r)
    results['Baechele'] = w * (1 + 0.033 * r);

    // Berger: w * 1/(1.0261 * e^(-0.0262*r))
    results['Berger'] = w / (1.0261 * Math.exp(-0.0262 * r));

    // Brown: w * (0.9849 + 0.0328*r)
    results['Brown'] = w * (0.9849 + 0.0328 * r);

    // Brzycki: w * (36/(37 - r)) ou équivalent
    results['Brzycki'] = w * (36 / (37 - r));

    // Epley: w * (1 + r/30)
    results['Epley'] = w * (1 + r / 30);

    // Kemmler et al.: w * (0.988 + 0.0104*r + 0.00190*r^2 - 0.0000584*r^3)
    results['Kemmler et al.'] =
      w * (0.988 + 0.0104 * r + 0.00190 * Math.pow(r, 2) - 0.0000584 * Math.pow(r, 3));

    // Landers: w * 1/(1.013 - 0.0267123*r)
    results['Landers'] = w / (1.013 - 0.0267123 * r);

    // Lombardi: w * (r^0.10)
    results['Lombardi'] = w * Math.pow(r, 0.10);

    // Mayhew et al.: w * 1/(0.522 + 0.419*e^(-0.055*r))
    results['Mayhew et al.'] = w / (0.522 + 0.419 * Math.exp(-0.055 * r));

    // Naclerio et al.: w * 1/(0.951*e^(-0.021*r))
    results['Naclerio et al.'] = w / (0.951 * Math.exp(-0.021 * r));

    // O'Conner et al.: w * (1 + 0.025*r)
    results["O'Conner et al."] = w * (1 + 0.025 * r);

    // Wathen: w * 1/(0.4880 + 0.538*e^(-0.075*r))
    results['Wathen'] = w / (0.4880 + 0.538 * Math.exp(-0.075 * r));

    // Calcul de la moyenne de tous les résultats
    const formuleNames = Object.keys(results);
    const total = formuleNames.reduce((sum, key) => sum + results[key], 0);
    const average = total / formuleNames.length;

    // Mise en forme des résultats
    let resultsText = '';
    formuleNames.forEach((key) => {
      resultsText += `**${key}** : ${results[key].toFixed(2)} kg\n`;
    });
    resultsText += `\n**Moyenne de toutes les formules** : ${average.toFixed(2)} kg`;

    // Création de l'embed avec le résultat
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('<a:muscle:1343579279279132795> Résultat de votre 1RM')
      .setDescription(resultsText)
      .setThumbnail('https://i.ibb.co/Y795qQQd/logo-EDT.png')
      .setFooter({ text: 'Calculé à partir de 13 méthodes différentes' });

    await interaction.reply({ embeds: [embed] });
  },
};
