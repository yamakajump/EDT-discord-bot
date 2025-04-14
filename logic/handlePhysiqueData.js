// /logic/handlePhysiqueData.js

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const pendingInteractions = require("../cache/pendingInteractions");
const guerrierDAO = require("../dao/guerrierDAO");

const style = require("../config/style.json");
const colorEmbed = style.colorEmbed;
const thumbnailEmbed = style.thumbnailEmbed;

/**
 * Gère la récupération ou la mise à jour des informations physiques de l'utilisateur.
 *
 * @param {Interaction} interaction - L'interaction initiale de commande.
 * @param {object} providedData - Les données fournies dans la commande (peuvent être partielles) :
 *   { poids, taille, age, sexe, activite, jours, temps, intensite, tef }
 * @param {Function} executeCalculationCallback - Callback à exécuter avec les données finales pour poursuivre le calcul.
 */
async function handleUserPhysique(
  interaction,
  providedData,
  executeCalculationCallback,
) {
  const userId = interaction.user.id;
  let guerrier = await guerrierDAO.getById(userId);

  // Si le guerrier n'existe pas en base, on le crée
  if (!guerrier) {
    await guerrierDAO.create(userId, interaction.user.username);
    guerrier = await guerrierDAO.getById(userId);
  }

  // 1. Si le champ "enregistrer" est null, on demande confirmation via un embed interactif
  if (guerrier.enregistrer === null) {
    const embed = new EmbedBuilder()
      .setTitle("Mise à jour des données")
      .setDescription(
        "Voulez-vous enregistrer vos données physiques afin de ne pas les ressaisir à chaque commande ?\nVos données sont confidentielles.",
      )
      .setColor(colorEmbed)
      .setThumbnail(thumbnailEmbed);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`saveData:yes:${userId}`)
        .setLabel("Oui")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`saveData:no:${userId}`)
        .setLabel("Non")
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral,
    });
    // On conserve le contexte pour reprendre la commande après la réponse
    pendingInteractions.add(userId, {
      type: "physiqueConfirmation",
      providedData,
      executeCalculationCallback,
      guerrier,
      originalInteraction: interaction,
    });
    return; // on attend la réponse via les boutons
  }

  let finalData = {};

  // 2. Si "enregistrer" est false : on utilise uniquement les données fournies

  console.log("enregistrer : ", guerrier.enregistrer);
  console.log(
    "Données fournies par l'utilisateur :",
    providedData,
    "Données stockées en base :",
    guerrier,
  );

  if (guerrier.enregistrer == 0) {
    finalData = providedData;
  }

  // 3. Si "enregistrer" est true : on fusionne données fournies et stockées
  else if (guerrier.enregistrer == 1) {
    finalData = {
      poids: providedData.poids != null ? providedData.poids : guerrier.poids,
      taille:
        providedData.taille != null ? providedData.taille : guerrier.taille,
      age: providedData.age != null ? providedData.age : guerrier.age,
      sexe: providedData.sexe != null ? providedData.sexe : guerrier.sexe,
      activite:
        providedData.activite != null
          ? providedData.activite
          : guerrier.activite,
      jours: providedData.jours != null ? providedData.jours : guerrier.jours,
      temps: providedData.temps != null ? providedData.temps : guerrier.temps,
      intensite:
        providedData.intensite != null
          ? providedData.intensite
          : guerrier.intensite,
      tef: providedData.tef != null ? providedData.tef : guerrier.tef,
    };

    console.log("Données finales après fusion :", finalData);
  }

  // 4. Mise à jour de la DB si l'utilisateur a choisi de sauvegarder (enregistrer === true)
  if (guerrier.enregistrer === true) {
    // On s'attend à ce que la méthode updateUserData du DAO mette à jour
    await guerrierDAO.updateUserData(userId, finalData);
  }

  // 5. Exécuter la suite de la commande (le calcul) avec les données finales
  await executeCalculationCallback(interaction, finalData);
}

module.exports = { handleUserPhysique };
