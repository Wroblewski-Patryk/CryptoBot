const { logMessage } = require('../core/logging');
const { startEventLoops } = require('../core/eventLoop');

const { initInstance } = require('../api/binance.service');
const { initMarkets } = require('../modules/markets/markets.service');
const { initWallet } = require('../modules/wallet/wallet.service');
const { initPositions } = require('../modules/positions/positions.service');

async function initializeBot() {
    logMessage('info','🔧 Initializing bot core...');

    await initInstance();
    await initMarkets();
    await initWallet();
    await initPositions();

    startEventLoops();
}

module.exports = { initializeBot };