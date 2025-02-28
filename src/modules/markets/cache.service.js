const { logMessage } = require('../../core/logging');

let marketCache = {}; // Pamięć podręczna kursów
let lastUpdate = 0;
const CACHE_EXPIRATION = 30000; // Cache na 30 sek.

const getMarketData = (symbol) => {
    if (marketCache[symbol]) {
        return marketCache[symbol];
    }
    return null;
};

const updateMarketCache = async (markets) => {
    try {
        logMessage('info', '🔄 Fetching latest market prices...');

        markets.forEach(market => {
            marketCache[market.symbol] = {
                price: market.last, // Aktualna cena
                bid: market.bid,    // Najwyższa oferta kupna
                ask: market.ask,    // Najniższa oferta sprzedaży
                volume: market.baseVolume, // Wolumen obrotu
                timestamp: Date.now() // Czas aktualizacji
            };
        });

        lastUpdate = Date.now();
        logMessage('info', `📈 Market cache updated for ${markets.length} pairs.`);
    } catch (error) {
        logMessage('error', `❌ Error updating market cache: ${error.message}`);
    }
};

const getMarketCache = () => {
    if (Date.now() - lastUpdate > CACHE_EXPIRATION) {
        logMessage('warn', '⚠️ Market cache expired, consider updating.');
    }
    return marketCache;
};

module.exports = {
    getMarketData,
    updateMarketCache,
    getMarketCache
};
