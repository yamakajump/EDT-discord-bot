const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('template')
        .setDescription('Affiche le lien du template'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Template Disponible')
            .setDescription('Vous pouvez accéder au template en cliquant sur le lien ci-dessous.')
            .setColor(0x1E90FF)
            .addFields(
                { name: 'Lien du Template', value: '[Cliquez ici pour accéder au template](https://docs.google.com/spreadsheets/d/1zhwqxzqUBibLvHbCI0rOi2ZqNU2SzOOBg-KFOwuZvSQ/edit?usp=sharing)' }
            )
            .setThumbnail('https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png')
            .setFooter({ text: 'Bon travail !', iconURL: 'https://i.ibb.co/Y795qQQd/logo-EDT.png' });
        
        await interaction.reply({ embeds: [embed] });
    },
};
