/**
 * Module de calcul de l'indice GLP en Force Athlétique.
 *
 * Ce module effectue le calcul du score "GLP" en utilisant les formules Dots.
 * Les formules Dots sont utilisées pour normaliser les performances en fonction
 * du poids de l'athlète et permettent ainsi de comparer les performances entre athlètes.
 *
 * Les formules sont définies différemment pour les hommes et les femmes :
 *   - dots_men : limite le poids entre 40 et 210 kg et utilise des coefficients spécifiques.
 *   - dots_women : limite le poids entre 40 et 150 kg et utilise une autre série de coefficients.
 *
 * Le calcul du GLP se base ensuite sur des paramètres ajustés selon :
 *   - Le sexe ("M" ou "F")
 *   - L'équipement ("Raw" ou "Single-ply")
 *   - Les mouvements ("SBD" ou "B")
 *
 * Les paramètres de calcul sont stockés dans l'objet PARAMETERS.
 *
 * Le module récupère les options suivantes :
 *   - sexe : le sexe de l'athlète ("M" ou "F")
 *   - equipement : le type d'équipement ("Raw" ou "Single-ply")
 *   - mouvements : la discipline ("SBD" ou "B")
 *   - bodyweight (bw) : le poids de l'athlète
 *   - total : le total des charges soulevées
 *
 * Finalement, un embed est envoyé en réponse, affichant l'indice GLP et les Dots calculés.
 */

const { EmbedBuilder } = require("discord.js");

/**
 * Calcule la valeur d'un polynôme du 4ème degré pour x.
 *
 * La formule utilisée est :
 *   500.0 / (a*x⁴ + b*x³ + c*x² + d*x + e)
 *
 * @param {number} a Coefficient pour x⁴
 * @param {number} b Coefficient pour x³
 * @param {number} c Coefficient pour x²
 * @param {number} d Coefficient pour x
 * @param {number} e Terme constant
 * @param {number} x La valeur d'entrée (poids)
 * @returns {number} Résultat du calcul du polynôme
 */
function dots_poly(a, b, c, d, e, x) {
  const x2 = x * x;
  const x3 = x2 * x;
  const x4 = x3 * x;
  return 500.0 / (a * x4 + b * x3 + c * x2 + d * x + e);
}

/**
 * Calcule la valeur "dots" pour les athlètes masculins.
 *
 * Le poids est d'abord restreint à l'intervalle [40, 210] kg.
 * Puis, la fonction dots_poly est appelée avec les coefficients spécifiques aux hommes.
 *
 * @param {number} bw Poids de l'athlète en kg
 * @returns {number} Coefficient calculé pour les dots (hors multiplication par le total)
 */
function dots_men(bw) {
  bw = Math.min(Math.max(bw, 40.0), 210.0);
  return dots_poly(
    -0.000001093,
    0.0007391293,
    -0.1918759221,
    24.0900756,
    -307.75076,
    bw,
  );
}

/**
 * Calcule la valeur "dots" pour les athlètes féminines.
 *
 * Le poids est restreint à l'intervalle [40, 150] kg.
 * Puis, la fonction dots_poly est appelée avec les coefficients spécifiques aux femmes.
 *
 * @param {number} bw Poids de l'athlète en kg
 * @returns {number} Coefficient calculé pour les dots (hors multiplication par le total)
 */
function dots_women(bw) {
  bw = Math.min(Math.max(bw, 40.0), 150.0);
  return dots_poly(
    -0.0000010706,
    0.0005158568,
    -0.1126655495,
    13.6175032,
    -57.96288,
    bw,
  );
}

/**
 * Paramètres de conformité pour le calcul GLP.
 *
 * La structure PARAMETERS contient les coefficients suivant le sexe, le type d'équipement
 * et le type de mouvement. Par exemple, pour un homme en Raw effectuant le mouvement "SBD",
 * les coefficients sont [1199.72839, 1025.18162, 0.009210].
 */
const PARAMETERS = {
  M: {
    Raw: {
      SBD: [1199.72839, 1025.18162, 0.00921],
      B: [320.98041, 281.40258, 0.01008],
    },
    "Single-ply": {
      SBD: [1236.25115, 1449.21864, 0.01644],
      B: [381.22073, 733.79378, 0.02398],
    },
  },
  F: {
    Raw: {
      SBD: [610.32796, 1045.59282, 0.03048],
      B: [142.40398, 442.52671, 0.04724],
    },
    "Single-ply": {
      SBD: [758.63878, 949.31382, 0.02435],
      B: [221.82209, 357.00377, 0.02937],
    },
  },
};

module.exports = {
  async execute(interaction) {
    // Récupération des options fournies par l'utilisateur
    const sexe = interaction.options.getString("sexe"); // "M" ou "F"
    const equipement = interaction.options.getString("equipement"); // "Raw" ou "Single-ply"
    const mouvements = interaction.options.getString("mouvements"); // "SBD" ou "B"
    const bw = interaction.options.getNumber("bodyweight"); // poids de l'athlète
    const total = interaction.options.getNumber("total"); // total des charges soulevées

    // Calcul de la valeur "dots" en multipliant le total par le coefficient adapté au sexe
    let dots = total * (sexe === "M" ? dots_men(bw) : dots_women(bw));

    // Récupération des coefficients adaptés à l'athlète selon le sexe, l'équipement et le mouvement
    const params = PARAMETERS[sexe][equipement][mouvements];

    // Calcul du dénominateur de la formule GLP à partir des coefficients
    const denom = params[0] - params[1] * Math.exp(-params[2] * bw);

    // Calcul du score GLP en ajustant le total par rapport au dénominateur
    let glp = denom === 0 ? 0 : Math.max(0, (total * 100.0) / denom);

    // Si le score n'est pas valide ou que le poids est trop faible (bw < 35), on force le score à 0
    if (isNaN(glp) || bw < 35) {
      glp = 0;
    }

    // Création de l'embed de réponse contenant l'indice GLP et les Dots calculés
    const embed = new EmbedBuilder()
      .setColor("#FFA500")
      .setTitle("Indice GLP en Force Athlétique")
      .setThumbnail("https://i.ibb.co/Y795qQQd/logo-EDT.png")
      .setDescription(
        `Votre indice GLP : **${glp.toFixed(2)} Points**\nVos Dots : **${dots.toFixed(2)}**`,
      )
      .setFooter({ text: "Calculé selon la formule GLP adaptée" });

    // Réponse de l'interaction avec l'embed
    await interaction.reply({ embeds: [embed] });
  },
};
