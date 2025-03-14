const { MessageFlags, ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require("../../config/config.json");

const PIN_MESSAGES = PermissionFlagsBits.PinMessages || 16384n;

module.exports = {
  async execute(interaction) {
    const membre = interaction.options.getUser('membre');
    const accessibilite = interaction.options.getString('accessibilite');
    const staffRole = config.staffRole;
    const donorRole = config.donateurRole;
    const categories = config.journalCategories;
    const categoryId = categories[categories.length - 1];

    const overwrites = [];

    overwrites.push({
      id: membre.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PIN_MESSAGES
      ]
    });
    overwrites.push({
      id: staffRole,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PIN_MESSAGES,
        PermissionFlagsBits.ManageMessages
      ]
    });

    if (accessibilite === "public") {
      overwrites.push({
        id: interaction.guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages]
      });
    } else if (accessibilite === "donateur" && donorRole) {
      overwrites.push({
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      });
      overwrites.push({
        id: donorRole,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages]
      });
    } else if (accessibilite === "staff") {
      overwrites.push({
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      });
    } else {
      overwrites.push({
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      });
    }

    const channelName = `${membre.username.toLowerCase()}`;

    try {
      const channel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: categoryId,
        permissionOverwrites: overwrites,
        topic: `Journal personnel de ${membre.tag}`
      });
      await interaction.reply({
        content: `Le journal de ${membre} a été créé : ${channel}`,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error("Erreur lors de la création du journal :", error);
      await interaction.reply({
        content: "Une erreur est survenue lors de la création du journal.",
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
