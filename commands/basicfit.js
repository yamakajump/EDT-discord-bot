const {
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const path = require("path");

// Charger les modules DAO
const guerrierDAO = require("../dao/guerrierDAO");
const basicFitStatsDAO = require("../dao/basicFitStatsDAO");

// Charger les emojis et styles
const { getEmoji } = require("../utils/emoji");
const emojiInfo = getEmoji("info");

const style = require("../config/style.json");
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("basicfit")
    .setDescription("Commandes pour gérer et analyser vos données Basic-Fit.")
    // Sous-commande : upload
    .addSubcommand((subcommand) =>
      subcommand
        .setName("upload")
        .setDescription(
          "Téléverse un fichier JSON contenant vos données Basic-Fit.",
        )
        .addAttachmentOption((option) =>
          option
            .setName("fichier")
            .setDescription("Fichier JSON contenant vos données.")
            .setRequired(true),
        ),
    )
    // Groupe de sous-commandes : stats
    .addSubcommandGroup((group) =>
      group
        .setName("stats")
        .setDescription(
          "Affiche différentes statistiques en fonction de vos données.",
        )
        // Sous-commande stats : heatmap
        .addSubcommand((subcommand) =>
          subcommand
            .setName("heatmap")
            .setDescription("Affiche la heatmap des visites.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : sérieConsécutive
        .addSubcommand((subcommand) =>
          subcommand
            .setName("serieconsecutive")
            .setDescription("Affiche le streak des jours consécutifs.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : semaineDeSérie
        .addSubcommand((subcommand) =>
          subcommand
            .setName("semainedeserie")
            .setDescription("Affiche le streak hebdomadaire.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : semaineMoyenne
        .addSubcommand((subcommand) =>
          subcommand
            .setName("semainemoyenne")
            .setDescription("Affiche la moyenne hebdomadaire.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : meilleurMois
        .addSubcommand((subcommand) =>
          subcommand
            .setName("meilleurmois")
            .setDescription("Affiche le meilleur mois.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : jourPréféré
        .addSubcommand((subcommand) =>
          subcommand
            .setName("jourprefere")
            .setDescription("Affiche le jour favori.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : visitesParJour
        .addSubcommand((subcommand) =>
          subcommand
            .setName("visiteparjour")
            .setDescription("Affiche les visites par jour.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : heureJournée
        .addSubcommand((subcommand) =>
          subcommand
            .setName("heurejournee")
            .setDescription(
              "Affiche la répartition des visites selon l'heure de la journée.",
            )
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : pourcentageActif
        .addSubcommand((subcommand) =>
          subcommand
            .setName("pourcentageactif")
            .setDescription("Affiche le pourcentage d'activité.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        )
        // Sous-commande stats : tempsMoyenEntreVisites
        .addSubcommand((subcommand) =>
          subcommand
            .setName("tempsmoyenentrevisites")
            .setDescription("Affiche le temps moyen entre les visites.")
            .addUserOption((option) =>
              option
                .setName("utilisateur")
                .setDescription(
                  "Sélectionnez un utilisateur (par défaut, vous-même).",
                )
                .setRequired(false),
            ),
        ),
    )
    // Sous-commande : serverstats
    .addSubcommand((subcommand) =>
      subcommand
        .setName("serverstats")
        .setDescription(
          "Affiche les statistiques globales du serveur BasicFit.",
        ),
    )
    // Sous-commande : compare
    .addSubcommand((subcommand) =>
      subcommand
        .setName("compare")
        .setDescription("Compare les statistiques entre deux utilisateurs.")
        .addUserOption((option) =>
          option
            .setName("utilisateur1")
            .setDescription("Premier utilisateur.")
            .setRequired(true),
        )
        .addUserOption((option) =>
          option
            .setName("utilisateur2")
            .setDescription("Deuxième utilisateur.")
            .setRequired(true),
        ),
    ),
  async execute(interaction) {
    // Récupération du subcommand group (s'il existe) et du subcommand
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand();

    // Si la sous-commande fait partie du groupe "stats", on récupère le JSON depuis la BDD.
    let statsJSON = null;
    let jsonDate = null;
    let targetUser = null;
    if (subcommandGroup === "stats") {
      // Détermine l'utilisateur ciblé :
      // soit celui mentionné avec l'option "utilisateur", soit l'auteur de la commande
      targetUser =
        interaction.options.getUser("utilisateur") || interaction.user;

      // Si l'utilisateur ciblé n'est pas celui qui exécute la commande...
      if (targetUser.id !== interaction.user.id) {
        // Vérifier si le guerrier autorise l'accès à ses statistiques
        const displayStats = await guerrierDAO.getDisplayStats(targetUser.id);
        if (!displayStats) {
          return interaction.reply({
            content: `Ce guerrier ne permet pas l'accès à ses statistiques.`,
            ephemeral: true,
          });
        }
      }

      jsonDate = await basicFitStatsDAO.getLastModifiedDate(targetUser.id);

      const description =
        targetUser.id === interaction.user.id
          ? `Aucune donnée trouvée. Veuillez téléverser vos données avec \`/basicfit upload\`.`
          : `Aucune donnée trouvée pour ${targetUser.username}.`;

      if (!jsonDate) {
        const embed = new EmbedBuilder()
          .setColor(colorEmbedError)
          .setTitle(`${emojiInfo} Aucune donnée trouvée`)
          .setThumbnail(thumbnailEmbed)
          .setDescription(description);

        return interaction.reply({ embeds: [embed] });
      } else {
        // Formater la date au format français jj/mm/aaaa
        jsonDate = new Date(jsonDate);
        jsonDate = `${String(jsonDate.getDate()).padStart(2, "0")}/${String(
          jsonDate.getMonth() + 1,
        ).padStart(2, "0")}/${jsonDate.getFullYear()}`;
      }

      // Vérifier si l'utilisateur ciblé a bien uploadé ses statistiques
      const hasStats = await basicFitStatsDAO.hasStats(targetUser.id);
      if (!hasStats) {
        return interaction.reply({
          content: `Aucune statistique uploadée pour **${targetUser.username}**. Veuillez d'abord téléverser vos statistiques.`,
          ephemeral: true,
        });
      }

      const statsRecord = await basicFitStatsDAO.getStatsByGuerrierId(
        targetUser.id,
      );
      if (!statsRecord || !statsRecord.stats) {
        return interaction.reply({
          content: `Aucun enregistrement de statistiques trouvé pour **${targetUser.username}**.`,
          ephemeral: true,
        });
      }
      try {
        statsJSON = statsRecord.stats;
      } catch (error) {
        console.error("⚠️\x1b[31m Erreur lors du parsing du JSON des stats :", error);
        return interaction.reply({
          content: `Une erreur est survenue lors du traitement des statistiques.`,
          ephemeral: true,
        });
      }
    }

    try {
      let subcommandFile;

      // Si une sous-commande est incluse dans un groupe, on charge le fichier situé dans ce dossier
      if (subcommandGroup) {
        subcommandFile = require(
          path.join(__dirname, "basicfit", subcommandGroup, `${subcommand}.js`),
        );
      } else {
        subcommandFile = require(
          path.join(__dirname, "basicfit", `${subcommand}.js`),
        );
      }

      // Si c'est la sous-commande stats, on passe en plus targetUser et les stats récupérées
      if (subcommandGroup === "stats") {
        await subcommandFile.execute(
          interaction,
          targetUser,
          statsJSON,
          jsonDate,
        );
      } else {
        await subcommandFile.execute(interaction);
      }
    } catch (error) {
      console.error(
        `⚠️\x1b[31m Erreur lors de l'exécution de la commande ${subcommand}${
          subcommandGroup ? ` du groupe ${subcommandGroup}` : ""
        }:`,
        error,
      );
      await interaction.reply({
        content: `Une erreur est survenue lors de l'exécution de la commande.`,
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
