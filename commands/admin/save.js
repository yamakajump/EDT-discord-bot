const { EmbedBuilder, MessageFlags } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer'); // Remplace wkhtmltopdf par Puppeteer
const fileManager = require('../../utils/fileManager.js');

// Chargement de la configuration
const configPath = path.join(__dirname, '../../config/config.json');
const config = fileManager.loadJson(configPath, {});

module.exports = {
  async execute(interaction) {
    // Récupération du channel passé en option (nommé "salon" dans la commande slash)
    const channel = interaction.options.getChannel('salon');
    if (!channel) {
      return interaction.reply({ content: 'Channel non trouvé', flags: MessageFlags.Ephemeral });
    }

    // Récupérer le format demandé. Par défaut, c'est 'pdf'
    const format = interaction.options.getString('format') || 'pdf';

    // Vérifier que le channel est bien un journal via son parentId (IDs chargés via le fichier de configuration)
    const allowedCategories = config.journalCategories || [];
    if (!allowedCategories.includes(channel.parentId)) {
      const embed = new EmbedBuilder()
        .setColor('#BC1F1A')
        .setTitle('Sauvegarde Journal')
        .setDescription("*Ce channel n'est pas un journal*");
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    try {
      // Générer la transcription HTML
      const attachment = await discordTranscripts.createTranscript(channel, {
        limit: -1, // Récupère tous les messages
        returnType: 'attachment', // Retourne une pièce jointe
        filename: 'transcript.html', // Nom de la pièce jointe
        poweredBy: false, // Désactive le pied de page "Powered by discord-html-transcripts"
      });

      // Écrire le fichier HTML temporairement sur disque
      const tempHtmlPath = path.join(__dirname, 'transcript.html');
      fs.writeFileSync(tempHtmlPath, attachment.attachment);

      // Si le format demandé est HTML, on envoie directement le fichier HTML
      if (format === 'html') {
        await channel.send({
          files: [{
            attachment: tempHtmlPath,
            name: 'transcript.html'
          }],
        });
        
        // Supprimer le fichier temporaire HTML
        fs.unlinkSync(tempHtmlPath);
        
        return interaction.reply({ 
          content: 'Journal sauvegardé en HTML', 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Format PDF (par défaut) avec Puppeteer
      const tempPdfPath = path.join(__dirname, 'transcript.pdf');

      // Lancer Puppeteer et ouvrir la page HTML
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // Charger le fichier HTML depuis le système de fichiers en utilisant le protocole file://
      const htmlFileUrl = 'file://' + tempHtmlPath;
      await page.goto(htmlFileUrl, { waitUntil: 'networkidle0' });

      // Générer le PDF
      await page.pdf({
        path: tempPdfPath,
        format: 'A4',
        printBackground: true
      });
      
      await browser.close();

      // Lire le PDF généré dans un buffer
      const pdfBuffer = fs.readFileSync(tempPdfPath);

      // Supprimer les fichiers temporaires
      fs.unlinkSync(tempHtmlPath);
      fs.unlinkSync(tempPdfPath);

      // Envoyer le PDF dans le channel Discord
      await channel.send({
        files: [{
          attachment: pdfBuffer,
          name: 'transcript.pdf'
        }],
      });

      await interaction.reply({ 
        content: 'Journal sauvegardé et converti en PDF', 
        flags: MessageFlags.Ephemeral 
      });
    } catch (error) {
      console.error("Erreur lors de la génération ou de l'envoi de la transcription :", error);
      await interaction.reply({
        content: 'Erreur lors de la sauvegarde.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
