const express = require('express');
const cors = require("cors");

const errorMiddleware = require('./errorMiddleware'); // PO DODANIU GUI
const { logMessage } = require('./logging');
const { startEventLoops } = require('./eventLoop');

const { initInstance } = require('../api/binance.service');

const { initMarkets } = require('../modules/markets/markets.service');
const { initWallet } = require('../modules/wallet/wallet.service');
const { initPositions } = require('../modules/positions/positions.service');

const bot = express();
bot.use(cors({
    origin: "http://localhost:3001", // adres frontendowy
    credentials: true                // jeśli używasz cookies/auth
  }));
bot.use(express.json()); // Obsługa JSON w POST,GET
bot.use(errorMiddleware); // PO DODANIU GUI

async function initialize() {
    logMessage('info','Initializing app...');

    await initInstance();
    await initMarkets();
    await initWallet();
    await initPositions();

    startEventLoops();
}

initialize();

module.exports = bot;