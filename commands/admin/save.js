const { EmbedBuilder } = require('discord.js');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const wait = require('node:timers/promises').setTimeout;
const fileManager = require('../../utils/fileManager.js');

// Chargement de la configuration
const configPath = path.join(__dirname, '../../config/config.json');
const config = fileManager.loadJson(configPath, {});

/**
 * Écrit le contenu d'un message dans le PDF en tenant compte des emojis et des chiffres.
 *
 * @param {string} message Le texte à écrire.
 * @param {PDFDocument} doc L'instance PDFDocument.
 * @param {number} size La taille de la police.
 * @param {string} font Le nom de la police (qui doit avoir été enregistrée).
 */
function writePDF(message, doc, size, font) {
  const text = [...message];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '*') {
      if (/[0-9]/u.test(text[i])) {
        text[i] === '\n'
          ? doc.font(font).fontSize(size).text(text[i])
          : doc.font(font).fontSize(size).text(text[i], { continued: true });
      } else if (/\p{Emoji}/u.test(text[i])) {
        doc.font('Noto Emoji').fontSize(size).text(text[i], { continued: true });
      } else {
        text[i] === '\n'
          ? doc.font(font).fontSize(size).text(text[i])
          : doc.font(font).fontSize(size).text(text[i], { continued: true });
      }
    }
  }
  doc.font('Noto Sans').text('\n');
}

module.exports = {
  async execute(interaction) {
    // Récupération du channel passé en option (nommé "salon" dans la commande slash)
    const channel = interaction.options.getChannel('salon');
    if (!channel) {
      return interaction.reply({ content: 'Channel non trouvé', ephemeral: true });
    }

    // Vérifier que le channel est bien un journal via son parentId (les IDs sont chargés via le fichier de configuration)
    const allowedCategories = config.journalCategories || [];
    if (!allowedCategories.includes(channel.parentId)) {
      const embed = new EmbedBuilder()
        .setColor('#BC1F1A')
        .setTitle('Sauvegarde Journal')
        .setDescription("*Ce channel n'est pas un journal*");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Création du document PDF et définition du chemin de sortie dans le dossier data
    const doc = new PDFDocument();
    const outputDir = path.join(__dirname, '../../data'); // dossier de stockage
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, "journalTemp.pdf");
    doc.pipe(fs.createWriteStream(outputPath));

    // Enregistrement des polices depuis le dossier Fonts
    doc.registerFont('Noto Sans', path.join(__dirname, '../../Fonts/NotoSans-Regular.ttf'));
    doc.registerFont('Noto Sans Bold', path.join(__dirname, '../../Fonts/NotoSans-Bold.ttf'));
    doc.registerFont('Noto Emoji', path.join(__dirname, '../../Fonts/NotoEmoji-VariableFont_wght.ttf'));

    // Écriture du titre dans le PDF
    const channelName = channel.name.replace(/-/g, ' ');
    writePDF("Journal de : " + channelName, doc, 25, 'Noto Sans Bold');

    // Récupération de l'historique des messages du channel
    let list_msgs = [];
    let message = await channel.messages
      .fetch({ limit: 1 })
      .then(messagePage => messagePage.size === 1 ? messagePage.at(0) : null);

    while (message) {
      // Pause de 250ms entre chaque fetch afin de limiter la charge sur l'API Discord
      await wait(250);
      await channel.messages.fetch({ limit: 100, before: message.id }).then(messagePage => {
        messagePage.forEach(msg => list_msgs.push(msg));
        message = messagePage.size > 0 ? messagePage.at(messagePage.size - 1) : null;
      });
    }
    console.log(`Total messages récupérés : ${list_msgs.length}`);

    // Parcours des messages dans l'ordre chronologique et écriture dans le PDF
    for (let j = list_msgs.length - 1; j >= 0; j--) {
      const msg = list_msgs[j];
      const date = new Date(msg.createdTimestamp);
      const dateStr = "\nDate: " +
        date.getDate() + "/" +
        (date.getMonth() + 1) + "/" +
        date.getFullYear() + " " +
        date.getHours() + ":" +
        date.getMinutes();
      
      doc.font('Noto Sans Bold').fontSize(18).text(dateStr);

      // Gestion des pièces jointes (à décommenter et adapter si nécessaire)
      if (msg.attachments.size > 0) {
        /*
        msg.attachments.forEach(attachment => {
          // Exemple de téléchargement et intégration d'image :
          // request(attachment.url).pipe(fs.createWriteStream(`./data/${attachment.name}`));
          // doc.image(`./data/${attachment.name}`, { scale: 0.0625 });
        });
        */
      }

      // Remplacement des mentions par les noms d'utilisateurs
      if (msg.mentions.users.size > 0) {
        msg.mentions.users.forEach(mention => {
          msg.content = msg.content.replace(`<@${mention.id}>`, mention.username);
        });
      }
      // Écriture du contenu du message dans le PDF
      writePDF(msg.content, doc, 18, 'Noto Sans');
    }

    console.log('PDF terminé');
    doc.end();

    // Envoi du PDF dans le channel spécifié
    try {
      await channel.send({
        files: [{
          attachment: outputPath
        }]
      });
      await interaction.reply({ content: 'Journal sauvegardé', ephemeral: true });
    } catch (error) {
      console.error('Erreur lors de l\'envoi du PDF :', error);
      await interaction.reply({ content: 'Erreur lors de la sauvegarde.', ephemeral: true });
    }
  }
};
