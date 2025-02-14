const { loadJson } = require('../utils/fileManager');
const path = require('path');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Connecté en tant que ${client.user.tag}`);
    },
};
