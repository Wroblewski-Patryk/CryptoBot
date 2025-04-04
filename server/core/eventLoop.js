const { updateMarkets } = require('../modules/markets/markets.service');
const { updateWallet } = require('../modules/wallet/wallet.service');
const { updatePositions } = require('../modules/positions/positions.service');
const { evaluateStrategies } = require('../modules/strategies/strategies.service');
const { logMessage } = require('./logging');
const { getConfig } = require('../config/config');

// Lista pętli
const eventLoops = [
    { name: 'Markets', action: updateMarkets, interval: getConfig('loops.markets') * 60000 },
    { name: 'Wallet', action: updateWallet, interval: getConfig('loops.wallet') * 60000 },
    { name: 'Positions', action: updatePositions, interval: getConfig('loops.positions') * 60000 },
    { name: 'Strategies', action: evaluateStrategies, interval: getConfig('loops.strategies') * 60000 }
];

const runLoop = async (loop) => {
    while (true) {
        try {
            logMessage('info', `🔄 Running ${loop.name} loop...`);
            await loop.action();
        } catch (error) {
            logMessage('error', `❌ Error in ${loop.name} loop: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, loop.interval));
    }
};

// Inicjalizacja wszystkich pętli
const startEventLoops = () => {
    logMessage('info', '🚀 Starting event loops...');
    eventLoops.forEach(loop => runLoop(loop));
};

module.exports = { startEventLoops };
