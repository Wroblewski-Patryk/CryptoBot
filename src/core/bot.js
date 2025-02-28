const express = require('express');
const errorMiddleware = require('./errorMiddleware'); // PO DODANIU GUI
const { logMessage } = require('../modules/logging/logging.service');
const { initInstance } = require('../api/binance.service');
const { initMarkets } = require('../modules/markets/markets.service');
const { initWallet } = require('../modules/wallet/wallet.service');
const { initPositions } = require('../modules/positions/positions.service');

const bot = express();
bot.use(express.json()); // Obsługa JSON w POST,GET
bot.use(errorMiddleware); // PO DODANIU GUI

async function initialize() {
    logMessage('info','Initializing app...');

    await initInstance();
    await initMarkets();
    await initWallet();
    await initPositions();
}

initialize();

module.exports = bot;