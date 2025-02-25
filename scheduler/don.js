// scheduler/messageScheduler.js
const schedule = require('node-schedule');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function scheduleMessages(client) {
    // Liste des horaires et channels où envoyer le message programmé
    const jobs = [
        { hour: 18, minute: 15, channelId: '820968843429150720' }, // 🌴・jungle 
        { hour: 20, minute: 15, channelId: '820968843429150720' }, // 🌴・jungle 
        { hour: 23, minute: 15, channelId: '820968843429150720' }, // 🌴・jungle 
        { hour: 15, minute: 0,  channelId: '857303824024862750' }, // ☕・discussion  
        { hour: 22, minute: 40, channelId: '857303824024862750' }, // ☕・discussion
        { hour: 15, minute: 0,  channelId: '610931002868498435' }, // 🔥・dojo 
    ];

    jobs.forEach(({ hour, minute, channelId }) => {
        // Configure la règle de récurrence pour chaque horaire
        const rule = new schedule.RecurrenceRule();
        rule.hour = hour;
        rule.minute = minute;
        // Vous pouvez spécifier un fuseau horaire si nécessaire, par exemple : rule.tz = 'Europe/Paris';

        schedule.scheduleJob(rule, async function() {
            try {
                // Récupération du channel ciblé
                const channel = await client.channels.fetch(channelId);
                if (!channel) return console.error(`Channel ${channelId} non trouvé`);

                // Création de l'embed avec le texte et le bouton
                const embed = new EmbedBuilder()
                    .setTitle('Soutenez-nous')
                    .setDescription(
                        "**L'Ecole du Tigre** s'efforce de proposer un service **bénévole**, pour autant, afin d'atteindre nos ambitions nous avons besoin de votre soutien. \n" +
                        "Si vous le pouvez, n'hésitez pas à nous soutenir **via Paypal**. Un rôle <@&678660325494751242> sera décerné à tous les participants. \n" +
                        "Merci d'avance❤️"
                    )
                    .setColor(0x00AE86);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Soutenir ❤️')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://www.paypal.com/paypalme/ecoledutigre')
                );

                // Envoi du message programmé
                await channel.send({ embeds: [embed], components: [row] });
            } catch (error) {
                console.error("Erreur lors de l'envoi du message programmé :", error);
            }
        });
    });
}

module.exports = { scheduleMessages };
