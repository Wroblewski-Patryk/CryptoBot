const { updateMarkets } = require('../modules/markets/markets.service');
const { updateWallet } = require('../modules/wallet/wallet.service');
const { updatePositions } = require('../modules/positions/positions.service');
const { updateSignals } = require('../modules/signals/signals.service');
const { logMessage } = require('./logging');

// Lista pętli
const eventLoops = [
    { name: 'Markets', action: updateMarkets, interval: 1 * 60 * 1000 }, // Co 60 sek.
    { name: 'Wallet', action: updateWallet, interval: 2 * 60 * 1000 }, // Co 2 min.
    { name: 'Positions', action: updatePositions, interval: 0.1 * 60 * 1000 }, 
    { name: 'Signals', action: updateSignals, interval: 3 * 60 * 1000 }
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
