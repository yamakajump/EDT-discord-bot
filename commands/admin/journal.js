/**
 * Module de création d'un journal personnel.
 *
 * Ce module permet de créer un salon textuel (journal) pour un membre donné.
 * Les permissions du salon sont configurées en fonction du type d'accessibilité demandé (public, donateur, staff).
 *
 * Paramètres utilisés :
 *   - membre : l'utilisateur pour lequel le journal est créé.
 *   - accessibilite : définit la visibilité et les permissions ('public', 'donateur', 'staff' ou autre).
 *
 * Configuration lue depuis le fichier config.json :
 *   - staffRole : rôle du staff.
 *   - donateurRole : rôle des donateurs.
 *   - journalCategories : liste de catégories dans lesquelles le salon sera créé.
 *
 * Pour modifier les permissions ou les règles de création du salon,
 * il suffit d'adapter les valeurs dans le fichier de configuration ou
 * directement dans le code si nécessaire.
 */

const {
  MessageFlags,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const config = require("../../config/config.json");
const staffRole = config.staffRole;
const donorRole = config.donateurRole;
const categories = config.journalCategories;

// PIN_MESSAGES est soit la permission native ou une valeur par défaut
const PIN_MESSAGES = PermissionFlagsBits.PinMessages || 16384n;

module.exports = {
  async execute(interaction) {
    const membre = interaction.options.getUser("membre");
    const accessibilite = interaction.options.getString("accessibilite");
    const categoryId = categories[categories.length - 1];

    const overwrites = [];

    // Permissions pour le membre
    overwrites.push({
      id: membre.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PIN_MESSAGES,
      ],
    });

    // Permissions pour le staff
    overwrites.push({
      id: staffRole,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PIN_MESSAGES,
        PermissionFlagsBits.ManageMessages,
      ],
    });

    // Permissions en fonction du type d'accessibilité
    if (accessibilite === "public") {
      overwrites.push({
        id: interaction.guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages],
      });
    } else if (accessibilite === "donateur" && donorRole) {
      overwrites.push({
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      });
      overwrites.push({
        id: donorRole,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages],
      });
    } else if (accessibilite === "staff") {
      overwrites.push({
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      });
    } else {
      overwrites.push({
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel],
      });
    }

    const channelName = membre.username.toLowerCase();

    try {
      const channel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: overwrites,
        topic: `Journal personnel de ${membre.tag}`,
      });
      await interaction.reply({
        content: `Le journal de ${membre} a été créé : ${channel}`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error(
        "⚠️\\x1b[38;5;1m;5;1m  Erreur lors de la création du journal :",
        error,
      );
      await interaction.reply({
        content: "Une erreur est survenue lors de la création du journal.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
