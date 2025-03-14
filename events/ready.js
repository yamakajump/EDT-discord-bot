const launchSchedulers = require('../utils/schedulerLauncher');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Connecté en tant que ${client.user.tag}`);

        // Lancement des schedulers
        launchSchedulers(client);
    },
};
