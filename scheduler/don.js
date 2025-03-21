/**
 * Module de planification des messages
 *
 * Ce module utilise la librairie "node-schedule" pour planifier l'envoi
 * de messages sur différents salons à des horaires définis.
 * Chaque message contient un embed et un bouton proposant un lien pour soutenir l'école via Paypal.
 */

const schedule = require('node-schedule');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Planifie l'envoi des messages à des horaires spécifiques
 *
 * @param {Client} client - L'instance du client Discord.
 */
function scheduleMessages(client) {
    // Définition des tâches planifiées : chaque objet contient l'heure, les minutes et l'ID du salon cible.
    const jobs = [
        { hour: 18, minute: 15, channelId: '820968843429150720' }, // 🌴・jungle 
        { hour: 20, minute: 15, channelId: '820968843429150720' }, // 🌴・jungle 
        { hour: 23, minute: 15, channelId: '820968843429150720' }, // 🌴・jungle 
        { hour: 15, minute: 0,  channelId: '857303824024862750' },  // ☕・discussion  
        { hour: 22, minute: 40, channelId: '857303824024862750' },  // ☕・discussion
        { hour: 15, minute: 0,  channelId: '610931002868498435' },  // 🔥・dojo 
    ];

    // Itération sur chaque configuration de tâche programmée
    jobs.forEach(({ hour, minute, channelId }) => {
        // Création d'une règle de récurrence pour chaque tâche
        const rule = new schedule.RecurrenceRule();
        rule.hour = hour;
        rule.minute = minute;
        // Possibilité de définir un fuseau horaire, par exemple :
        // rule.tz = 'Europe/Paris';

        // Planification de la tâche avec la règle définie
        schedule.scheduleJob(rule, async function() {
            try {
                // Récupération du salon via son ID
                const channel = await client.channels.fetch(channelId);
                if (!channel) {
                    console.error(`Channel ${channelId} non trouvé`);
                    return;
                }

                // Création de l'embed contenant le message d'appel au soutien
                const embed = new EmbedBuilder()
                    .setTitle('Soutenez-nous')
                    .setDescription(
                        "**L'Ecole du Tigre** s'efforce de proposer un service **bénévole**. Afin d'atteindre nos ambitions, nous avons besoin de votre soutien.\n" +
                        "Si vous le pouvez, n'hésitez pas à nous soutenir **via Paypal**. Un rôle <@&678660325494751242> sera décerné à tous les participants.\n" +
                        "Merci d'avance ❤️"
                    )
                    .setColor(0x00AE86);

                // Création d'une ActionRow contenant un bouton renvoyant vers le lien de Paypal
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Soutenir ❤️')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://www.paypal.com/paypalme/ecoledutigre')
                );

                // Envoi du message dans le salon configuré
                await channel.send({ embeds: [embed], components: [row] });
            } catch (error) {
                console.error("Erreur lors de l'envoi du message programmé :", error);
            }
        });
    });
}

module.exports = { scheduleMessages };
