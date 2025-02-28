const express = require('express');
const errorMiddleware = require('./errorMiddleware'); // PO DODANIU GUI
const { logMessage } = require('../modules/logging/logging.service');

const bot = express();
bot.use(express.json()); // Obsługa JSON w POST,GET
// 📌 Twój routing tutaj...

// 📌 Obsługa błędów
bot.use(errorMiddleware); // PO DODANIU GUI

async function initialize() {
    logMessage('info','Initializing app...');
}

initialize();

module.exports = bot;