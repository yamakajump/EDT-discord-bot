/**
 * Module de calcul de l'estimation de la 1RM (une répétition maximale)
 * à partir du poids soulevé et du nombre de répétitions effectuées.
 *
 * Pour ce faire, plusieurs formules sont utilisées :
 *   - Adams
 *   - Baechele
 *   - Berger
 *   - Brown
 *   - Brzycki
 *   - Epley
 *   - Kemmler et al.
 *   - Landers
 *   - Lombardi
 *   - Mayhew et al.
 *   - Naclerio et al.
 *   - O'Conner et al.
 *   - Wathen
 *
 * Chaque formule propose un calcul différent pour estimer la charge maximale
 * qu'une personne peut soulever (1RM). Le résultat final est présenté avec
 * la valeur issue de chaque formule et la moyenne de toutes ces estimations.
 *
 * Le résultat est affiché dans un embed Discord.
 *
 * Valeurs attendues en options :
 *   - poids : charge soulevée (en kg)
 *   - reps  : nombre de répétitions réalisées
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const { getEmoji } = require("../../utils/emoji");
const emojiMuscle = getEmoji("muscle");

const style = require("../../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  async execute(interaction) {
    // Récupération des options : poids (kg) et nombre de répétitions (reps)
    const poids = interaction.options.getNumber("poids");
    const reps = interaction.options.getInteger("reps");

    // Vérifications et validations des entrées utilisateur
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

    // Variables simplifiées pour le calcul
    const w = poids;
    const r = reps;

    // Objet pour stocker les résultats selon chaque formule
    const results = {};

    /**
     * Calcul selon chaque méthode :
     *
     * Adams : w * 1/(1 - 0.02*r)
     *    => Considère une réduction de 2% de la charge estimée par répétition.
     */
    results["Adams"] = w * (1 / (1 - 0.02 * r));

    /**
     * Baechele : w * (1 + 0.033*r)
     *    => Augmentation linéaire de la charge de 3,3% par répétition.
     */
    results["Baechele"] = w * (1 + 0.033 * r);

    /**
     * Berger : w * 1/(1.0261 * Math.exp(-0.0262*r))
     *    => Formule faisant intervenir une composante exponentielle.
     */
    results["Berger"] = w / (1.0261 * Math.exp(-0.0262 * r));

    /**
     * Brown : w * (0.9849 + 0.0328*r)
     *    => Formule linéaire ajustant la charge de base.
     */
    results["Brown"] = w * (0.9849 + 0.0328 * r);

    /**
     * Brzycki : w * (36/(37 - r))
     *    => Une des formules les plus utilisées pour l'estimation de la 1RM.
     */
    results["Brzycki"] = w * (36 / (37 - r));

    /**
     * Epley : w * (1 + r/30)
     *    => Formule classique incrémentée d'une fraction proportionnelle au nombre de répétitions.
     */
    results["Epley"] = w * (1 + r / 30);

    /**
     * Kemmler et al. : w * (0.988 + 0.0104*r + 0.00190*r² - 0.0000584*r³)
     *    => Formule plus détaillée intégrant des termes quadratiques et cubiques.
     */
    results["Kemmler et al."] =
      w *
      (0.988 +
        0.0104 * r +
        0.0019 * Math.pow(r, 2) -
        0.0000584 * Math.pow(r, 3));

    /**
     * Landers : w * 1/(1.013 - 0.0267123*r)
     *    => Surface une relation inverse linéairement proportionnelle.
     */
    results["Landers"] = w / (1.013 - 0.0267123 * r);

    /**
     * Lombardi : w * (r^0.10)
     *    => Légère augmentation avec le nombre de répétitions sous forme de puissance.
     */
    results["Lombardi"] = w * Math.pow(r, 0.1);

    /**
     * Mayhew et al. : w * 1/(0.522 + 0.419*Math.exp(-0.055*r))
     *    => Formule utilisant une composante exponentielle pour moduler l'estimation.
     */
    results["Mayhew et al."] = w / (0.522 + 0.419 * Math.exp(-0.055 * r));

    /**
     * Naclerio et al. : w * 1/(0.951*Math.exp(-0.021*r))
     *    => Formule basée sur une relation exponentielle inverse.
     */
    results["Naclerio et al."] = w / (0.951 * Math.exp(-0.021 * r));

    /**
     * O'Conner et al. : w * (1 + 0.025*r)
     *    => Augmentation simple de 2.5% par répétition.
     */
    results["O'Conner et al."] = w * (1 + 0.025 * r);

    /**
     * Wathen : w * 1/(0.4880 + 0.538*Math.exp(-0.075*r))
     *    => Intègre une composante exponentielle pour estimer la charge maximale.
     */
    results["Wathen"] = w / (0.488 + 0.538 * Math.exp(-0.075 * r));

    // Calcul de la moyenne de toutes les estimations de la 1RM
    const formuleNames = Object.keys(results);
    const total = formuleNames.reduce((sum, key) => sum + results[key], 0);
    const average = total / formuleNames.length;

    // Mise en forme des résultats pour l'embed Discord
    let resultsText = "";
    formuleNames.forEach((key) => {
      resultsText += `**${key}** : ${results[key].toFixed(2)} kg\n`;
    });
    resultsText += `\n**Moyenne de toutes les formules** : ${average.toFixed(2)} kg`;

    // Construction de l'embed avec le résultat final
    const embed = new EmbedBuilder()
      .setColor(colorEmbed)
      .setTitle(`${emojiMuscle} Résultat de votre 1RM`)
      .setDescription(resultsText)
      .setThumbnail(thumbnailEmbed)
      .setFooter({ text: "Calculé à partir de 13 méthodes différentes" });

    // Réponse de l'interaction avec l'embed final
    await interaction.reply({ embeds: [embed] });
  },
};
