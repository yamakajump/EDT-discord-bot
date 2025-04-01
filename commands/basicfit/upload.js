/**
 * Module de traitement des données Basic-Fit.
 *
 * Ce module est chargé de traiter le fichier JSON envoyé par l'utilisateur contenant
 * ses données Basic-Fit. Il vérifie que le fichier est au format JSON, le télécharge et
 * le convertit en objet JavaScript, puis vérifie sa structure avant de l'enregistrer dans
 * la base de données via le DAO dédié (basicFitStatsDAO).
 *
 * Fonctionnalités principales :
 *   - Vérifier la validité du fichier (extension ".json").
 *   - Télécharger et parser le fichier JSON à partir de l'URL fournie par Discord.
 *   - Vérifier que le JSON contient bien une propriété "visits" de type tableau.
 *   - Utiliser le DAO pour insérer ou mettre à jour les données dans la BDD.
 *   - Gérer les erreurs et informer l'utilisateur en cas de problème.
 *
 * L'utilisation d'un DAO pour l'accès aux données favorise la maintenabilité du code,
 * en séparant la logique d'accès aux données de celle de traitement de la commande.
 */

const { request } = require("undici");
const basicFitStatsDAO = require("../../dao/basicFitStatsDAO");
const { MessageFlags } = require("discord.js");

module.exports = {
  /**
   * Exécute la commande d'upload de fichier Basic-Fit.
   *
   * @param {object} interaction - L'objet interaction fourni par Discord, contenant les options et les informations utilisateur.
   * @returns {Promise<void>} Une promesse résolue une fois le traitement terminé.
   */
  async execute(interaction) {
    // Récupère l'attachement envoyé par l'utilisateur
    const attachment = interaction.options.getAttachment("fichier");

    // Vérifie que l'attachement est présent et a une extension ".json"
    if (!attachment || !attachment.name.endsWith(".json")) {
      return interaction.reply({
        content: "Seuls les fichiers JSON sont acceptés.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      // Télécharge le fichier JSON via l'URL de l'attachement
      const { body } = await request(attachment.url);
      const jsonData = await body.json();

      // Vérifie que le JSON contient la propriété "visits" sous forme de tableau
      if (
        !Object.prototype.hasOwnProperty.call(jsonData, "visits") ||
        !Array.isArray(jsonData.visits)
      ) {
        return interaction.reply({
          content: "Le fichier n'est pas un fichier JSON BasicFit valide.",
          flags: MessageFlags.Ephemeral,
        });
      }

      /**
       * Enregistre ou met à jour les données JSON dans la base de données.
       *
       * La méthode upsertStats du DAO basicFitStatsDAO va :
       *   - Vérifier si un enregistrement existe déjà pour l'utilisateur.
       *   - Mettre à jour les statistiques si l'enregistrement existe,
       *     ou insérer un nouvel enregistrement sinon.
       *   - Vérifier si un guerrier est lié à l'utilisateur, sinon le créer.
       *
       * La clé utilisée est l'identifiant de l'utilisateur (interaction.user.id)
       * et le nom d'utilisateur est interaction.user.username.
       */
      await basicFitStatsDAO.upsertStats(
        interaction.user.id,
        jsonData,
        interaction.user.username,
      );

      // Réponse de succès
      return interaction.reply({
        content: "Données envoyées avec succès !",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Erreur lors du traitement du fichier JSON :", error);
      return interaction.reply({
        content: `Erreur lors du traitement du fichier : ${error.message}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
