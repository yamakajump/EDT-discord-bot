const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

// 📖 Générer l'embed du guide selon la page
function getGuideEmbed(page, user) {
  const pages = {
    1: new EmbedBuilder()
      .setTitle("📖 Guide du Serveur L'École du Tigre")
      .setDescription(
        "🌟 **Bienvenue sur le Discord de L'École du Tigre !**\n\n" +
          "👑 L'EDT, c'est un gros projet, marque déposée, en place depuis plus de 5 ans, et la commu N°1 dans le sport francophone. Bref, c'est une belle aventure !\n\n" +
          "🎉 Ici, nous organisons des événements uniques, comme la maison dans **Harry Pother** 🏰\n\n" +
          "💬 Partage ta passion, échange des conseils et profite de discussions enrichissantes !\n\n" +
          "➡️ **Utilise les boutons ci-dessous pour naviguer dans le guide !**"
      )
      .setColor("#fb7819"),

    2: new EmbedBuilder()
      .setTitle("🏢 Organisation du serveur")
      .setDescription("**Le serveur est organisé en 3 grandes catégories :**")
      .addFields(
        {
          name: "1️⃣ Communauté",
          value:
            "<#820968843429150720> → Salon discussion bordel\n" +
            "<#857303824024862750> → Discussion sérieuse\n" +
            "<#1257007382182105180> → Pour les débats\n" +
            "<#610931002868498435> → Discussion sport\n" +
            "<#1057324110226657382> → Discussion sport en particulier\n" +
            "<#1048209755161763870> → Partage de fichier sur le sport\n" +
            "<#1142034399383261184> → Partagez votre progression\n" +
            "<#621246024194719744> → Discussion de film, série, etc.",
        },
        {
          name: "2️⃣ Entraide",
          value:
            "<#986033907252232203> → Aide technique par ticket\n" +
            "<#1049686370584641606> → Analyse programme\n" +
            "<#1046924988323729498> → Questions\n" +
            "<#1064203225651220551> → FAQ",
        },
        {
          name: "3️⃣ Nutrition",
          value:
            "<#878009605358239744> → Compléments\n" +
            "<#1051482338053345341> → Recettes\n" +
            "<#612263023750545410> → Parler nutrition et demander conseil",
        }
      )
      .setColor("#fb7819"),

    3: new EmbedBuilder()
      .setTitle("🤝 Comment bien interagir avec la communauté ?")
      .setDescription(
        "**Quelques règles pour bien s’intégrer :**\n" +
          "✔️ **Respecte tout le monde** 💙\n" +
          "✔️ **Motivation et soutien** 💪\n" +
          "✔️ **Respecte les salons** et pose tes questions dans les bons espaces 📚\n" +
          "✔️ **Partage tes progrès** dans <#1142034399383261184>\n\n" +
          "**➡ Utilise les boutons ci-dessous pour continuer !**"
      )
      .setColor("#fb7819"),

    4: new EmbedBuilder()
      .setTitle("🔥 Besoin d’aide ?")
      .setDescription(
        "🎫 **Ouvre un ticket si nécessaire**\n" +
          "👮‍♂️ **Mentionne un modérateur en cas de problème**\n\n" +
          "**Tu es maintenant prêt à profiter de L'École du Tigre Discord !**"
      )
      .setColor("#fb7819"),
  };

  return pages[page] || pages[1]; // Retour à la page 1 par défaut si la page demandée n'existe pas
}

// 🎮 Générer les boutons de navigation
function getGuideButtons(page, userId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`guide:previous:${page}:${userId}`)
      .setLabel("⬅ Précédent")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 1),
    new ButtonBuilder()
      .setCustomId(`guide:next:${page}:${userId}`)
      .setLabel("➡ Suivant")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page === 4),
    new ButtonBuilder()
      .setCustomId(`guide:home:${page}:${userId}`)
      .setLabel("🏠 Accueil")
      .setStyle(ButtonStyle.Success)
      .setDisabled(page === 1)
  );
}

module.exports = { getGuideEmbed, getGuideButtons };
