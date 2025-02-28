const { getInstance } = require('../../api/binance.service');
const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');

let cachedOHLCV = {};
const CACHE_EXPIRATION = 60000; // 1 minuta cache

// Pobieranie danych OHLCV dla danej pary
const fetchOHLCV = async (symbol) => {
    try {
        const binance = await getInstance();
        const interval = getConfig('trading.interval') || '15m';

        // Sprawdzenie cache, aby unikać nadmiarowych zapytań
        const cacheKey = `${symbol}-${interval}`;
        const now = Date.now();
        if (cachedOHLCV[cacheKey] && now - cachedOHLCV[cacheKey].timestamp < CACHE_EXPIRATION) {
            //logMessage('info', `♻️ Returning cached OHLCV for ${symbol} (${interval})`);
            return cachedOHLCV[cacheKey].data;
        }

        //logMessage('info', `📊 Fetching OHLCV data for ${symbol} (${interval})...`);
        const ohlcv = await binance.fetchOHLCV(symbol, interval);

        // Aktualizacja cache
        cachedOHLCV[cacheKey] = { data: ohlcv, timestamp: now };

        return ohlcv;
    } catch (error) {
        logMessage('error', `❌ Error fetching OHLCV for ${symbol}: ${error.message}`);
        return null;
    }
};

// Funkcja pobierająca OHLCV dla wielu par jednocześnie
const fetchMultipleOHLCV = async (symbols) => {
    const results = {};
    for (const symbol of symbols) {
        results[symbol] = await fetchOHLCV(symbol);
    }
    return results;
};

const updateOHLCV = async (markets) => {
    const symbols = markets.map(market => market.symbol);
    await fetchMultipleOHLCV(symbols);
    logMessage('info', `📊 Fetching OHLCV data completed`);
    return;
}

module.exports = {
    fetchOHLCV,
    fetchMultipleOHLCV,
    updateOHLCV
};
