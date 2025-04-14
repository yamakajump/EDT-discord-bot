/**
 * Module de sauvegarde d'un journal Discord sous forme de transcription PDF/HTML.
 *
 * Ce module effectue les opérations suivantes :
 *   1. Génère une transcription HTML du salon spécifié.
 *   2. Convertit la transcription en PDF avec Puppeteer.
 *   3. Si le PDF dépasse la taille d'upload autorisée par Discord, il tente une compression,
 *      puis, si nécessaire, découpe le PDF en segments adaptatifs en fonction du nombre de pages.
 *
 * Les limites d'upload sont déterminées en fonction du niveau de boost du serveur :
 *   - premiumTier === 0 : 8 MB (8 * 1024 * 1024 octets)
 *   - premiumTier === 1 : 50 MB
 *   - premiumTier >= 2 : 100 MB
 *
 * Dépendances principales :
 *   - discord-html-transcripts : génération de la transcription HTML.
 *   - puppeteer : conversion de la transcription en PDF.
 *   - pdf-lib : manipulation et génération de PDFs.
 *   - archiver & stream-buffers : compression d'un buffer au format ZIP.
 */

const { EmbedBuilder, MessageFlags } = require("discord.js");
const discordTranscripts = require("discord-html-transcripts");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { PDFDocument } = require("pdf-lib");
const archiver = require("archiver");
const StreamBuffers = require("stream-buffers");

const style = require("../../config/style.json");
const colorEmbedError = style.colorEmbedError;
const thumbnailEmbed = style.thumbnailEmbed;

const config = require("../../config/config.json");

const MB = 1024 * 1024;

/**
 * Retourne la taille maximale d'upload autorisée par Discord pour un serveur.
 *
 * @param {Guild} guild - L'objet guilde Discord.
 * @returns {number} - La taille maximale en octets.
 */
function getMaxUploadSize(guild) {
  const tier = guild.premiumTier || 0;
  if (tier === 0) return 8 * MB;
  if (tier === 1) return 50 * MB;
  if (tier >= 2) return 100 * MB;
  return 8 * MB;
}

/**
 * Compresse un buffer dans une archive ZIP et retourne le buffer compressé.
 *
 * @param {Buffer} buffer - Le buffer à compresser.
 * @param {string} [fileName='file.pdf'] - Nom du fichier dans l'archive ZIP.
 * @returns {Promise<Buffer>} - Buffer du fichier compressé.
 */
function zipBuffer(buffer, fileName = "file.pdf") {
  return new Promise((resolve, reject) => {
    if (!Buffer.isBuffer(buffer)) {
      buffer = Buffer.from(buffer);
    }
    const outputBuffer = new StreamBuffers.WritableStreamBuffer();
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.on("error", (err) => reject(err));
    outputBuffer.on("finish", () => resolve(outputBuffer.getContents()));

    archive.pipe(outputBuffer);
    archive.append(buffer, { name: fileName });
    archive.finalize();
  });
}

/**
 * Génère un PDF à partir d'un ensemble de pages d'un document existant.
 *
 * @param {PDFDocument} pdfDoc - Le document PDF complet chargé.
 * @param {number} start - Index de la première page (inclus).
 * @param {number} end - Index de la dernière page (exclus).
 * @returns {Promise<Buffer>} - Buffer du segment PDF généré.
 */
async function generatePdfSegment(pdfDoc, start, end) {
  const newPdf = await PDFDocument.create();
  const indices = Array.from({ length: end - start }, (_, i) => start + i);
  const pagesToCopy = await newPdf.copyPages(pdfDoc, indices);
  pagesToCopy.forEach((page) => newPdf.addPage(page));
  const segmentUint8Array = await newPdf.save();
  return Buffer.from(segmentUint8Array);
}

/**
 * Découpe un PDF en segments adaptatifs.
 * Pour chaque segment, on ajoute des pages une à une tant que la taille générée reste
 * inférieure ou égale à la taille maximale autorisée. Si l'ajout d'une page excède la limite,
 * le segment est finalisé avec le maximum de pages validé.
 *
 * @param {Buffer} pdfBuffer - Le PDF complet sous forme de buffer.
 * @param {number} maxSize - La taille maximale en octets pour chaque segment.
 * @returns {Promise<Array<{ buffer: Buffer, range: string }>>} - Tableau de segments avec leur buffer et plage de pages.
 */
async function splitPdfAdaptive(pdfBuffer, maxSize) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const totalPages = pdfDoc.getPageCount();
  const segments = [];
  let currentStart = 0;

  while (currentStart < totalPages) {
    // On doit ajouter au moins une page dans le segment.
    let currentEnd = currentStart + 1;
    let segmentBuffer = await generatePdfSegment(
      pdfDoc,
      currentStart,
      currentEnd,
    );

    // Tente d'ajouter des pages tant que la taille du segment reste dans la limite.
    while (currentEnd < totalPages) {
      const candidateBuffer = await generatePdfSegment(
        pdfDoc,
        currentStart,
        currentEnd + 1,
      );
      if (candidateBuffer.length <= maxSize) {
        segmentBuffer = candidateBuffer;
        currentEnd++;
      } else {
        break;
      }
    }
    segments.push({
      buffer: segmentBuffer,
      range: `${currentStart + 1}-${currentEnd}`,
    });
    currentStart = currentEnd;
  }
  return segments;
}

module.exports = {
  /**
   * Exécute la commande de sauvegarde.
   *
   * @param {CommandInteraction} interaction - L'interaction Discord.
   */
  async execute(interaction) {
    const channel = interaction.options.getChannel("salon");
    if (!channel) {
      return interaction.reply({
        content: "Channel non trouvé",
        flags: MessageFlags.Ephemeral,
      });
    }

    const format = interaction.options.getString("format") || "pdf";
    const allowedCategories = config.journalCategories || [];
    if (!allowedCategories.includes(channel.parentId)) {
      const embed = new EmbedBuilder()
        .setColor(colorEmbedError)
        .setTitle("Sauvegarde Journal")
        .setThumbnail(thumbnailEmbed)
        .setDescription("*Ce channel n'est pas un journal*");
      return interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const startTime = Date.now();
    let currentStep = "Initialisation";
    const updateProgress = async () => {
      const secondsElapsed = Math.floor((Date.now() - startTime) / 1000);
      await interaction.editReply(
        `**${currentStep}** en cours... (${secondsElapsed} secondes écoulées)`,
      );
    };
    const intervalId = setInterval(updateProgress, 1000);

    try {
      // Étape 1 : Génération de la transcription HTML.
      currentStep = "Génération du transcript";
      const attachment = await discordTranscripts.createTranscript(channel, {
        limit: -1,
        returnType: "attachment",
        filename: "transcript.html",
        poweredBy: false,
      });
      const tempHtmlPath = path.join(__dirname, "transcript.html");
      fs.writeFileSync(tempHtmlPath, attachment.attachment);

      if (format === "html") {
        currentStep = "Envoi du transcript HTML";
        await channel.send({
          files: [{ attachment: tempHtmlPath, name: "transcript.html" }],
        });
        fs.unlinkSync(tempHtmlPath);
        clearInterval(intervalId);
        return interaction.editReply("Journal sauvegardé en HTML");
      }

      // Étape 2 : Conversion en PDF.
      currentStep = "Conversion en PDF";
      const tempPdfPath = path.join(__dirname, "transcript.pdf");
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      const htmlFileUrl = "file://" + tempHtmlPath;
      await page.goto(htmlFileUrl, {
        waitUntil: "networkidle0",
        timeout: 60000,
      });
      await page.pdf({
        path: tempPdfPath,
        format: "A4",
        printBackground: true,
      });
      await browser.close();

      let pdfBuffer = fs.readFileSync(tempPdfPath);
      fs.unlinkSync(tempHtmlPath);
      fs.unlinkSync(tempPdfPath);

      const maxUploadSize = getMaxUploadSize(interaction.guild);
      const filesToSend = [];

      if (pdfBuffer.length <= maxUploadSize) {
        filesToSend.push({ buffer: pdfBuffer, name: "transcript.pdf" });
      } else {
        currentStep = "Compression du PDF";
        const zippedBuffer = await zipBuffer(pdfBuffer, "transcript.pdf");
        if (zippedBuffer.length <= maxUploadSize) {
          filesToSend.push({ buffer: zippedBuffer, name: "transcript.zip" });
        } else {
          currentStep = "Découpage du PDF en segments";
          const segments = await splitPdfAdaptive(pdfBuffer, maxUploadSize);
          for (const seg of segments) {
            if (seg.buffer.length > maxUploadSize) {
              const segZip = await zipBuffer(
                seg.buffer,
                `transcript_${seg.range}.pdf`,
              );
              filesToSend.push({
                buffer: segZip,
                name: `transcript_${seg.range}.zip`,
              });
            } else {
              filesToSend.push({
                buffer: seg.buffer,
                name: `transcript_${seg.range}.pdf`,
              });
            }
          }
        }
      }

      currentStep = "Envoi du fichier (ou segments)";
      for (const file of filesToSend) {
        await channel.send({
          files: [{ attachment: file.buffer, name: file.name }],
        });
      }

      clearInterval(intervalId);
      await interaction.editReply(
        "Journal sauvegardé et converti en PDF (découpé et/ou compressé selon la taille)",
      );
    } catch (error) {
      clearInterval(intervalId);
      console.error(
        "⚠️\x1b[31m  Erreur lors de la génération ou de l'envoi de la transcription :",
        error,
      );
      await interaction.editReply("⚠️\x1b[31m  Erreur lors de la sauvegarde.");
    }
  },
};
