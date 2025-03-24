const emojiConfig = require('../config/emojis.json');

/**
 * Récupère l'emoji configuré pour la clé donnée.
 * Si l'utilisation des emojis custom est désactivée dans la configuration,
 * le fallback est retourné directement.
 *
 * @param {string} key - La clé de l'emoji dans la config (exemple : "globe").
 * @returns {string} - L'emoji personnalisé ou le fallback, ou une chaîne vide s'il n'est pas défini.
 */
function getEmoji(key) {
  const emojiData = emojiConfig[key];
  if (!emojiData || !emojiData.id) return "";

  // Vérifie la configuration globale pour l'utilisation des emojis custom.
  const useCustom = emojiConfig.settings
    ? emojiConfig.settings.customEmojisEnabled
    : true;

  if (useCustom) {
    // Retourne directement l'emoji custom défini.
    return emojiData.id;
  } else {
    // Retourne le fallback.
    return emojiData.fallback || "";
  }
}

module.exports = { getEmoji };
