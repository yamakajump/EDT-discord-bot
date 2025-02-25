// utils/schedulerLauncher.js
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const schedulerPath = path.join(__dirname, '..', 'scheduler');
    fs.readdirSync(schedulerPath).forEach(file => {
        if (file.endsWith('.js')) {
            const scheduler = require(path.join(schedulerPath, file));

            // Vérifie si le fichier exporte une fonction de scheduling
            if (typeof scheduler.scheduleMessages === 'function') {
                scheduler.scheduleMessages(client);
                console.log(`Scheduler chargé : ${file}`);
            }
        }
    });
};
