const { getInstance } = require('../../api/binance.service');
const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { updateMarketCache } = require('./cache.service');
const { updateOHLCV } = require('./ohlcv.service');

let cachedMarkets = [];
let lastUpdate = 0;
const MARKET_CACHE_TIME = 5 * 60 * 1000; // Cache na 5 minut

// Funkcja pobierająca rynki z Binance
const initMarkets = async () => {
    try {
        const binance = await getInstance();
        const markets = await binance.fetchMarkets();

        const baseCurrency = getConfig('trading.baseCurrency') || 'USDT';
        const contractType = getConfig('trading.contractType') || 'PERPETUAL'
        
        // Filtrowanie rynków
        const filteredMarkets = Object.values(markets).filter(market =>
            market.quote === baseCurrency &&
            market.info.contractType === contractType
        );
        cachedMarkets = filteredMarkets.map(market => ({
            symbol: market.symbol,
            base: market.base,
            quote: market.quote,
            type: market.type,
            precision: market.precision,
            limits: market.limits
        }));

        lastUpdate = Date.now();
        logMessage('info', `📊 Markets updated successfully (${cachedMarkets.length} pairs).`);

        await updateOHLCV(cachedMarkets);
        await updateMarketCache(cachedMarkets);
        
        return cachedMarkets;
    } catch (error) {
        logMessage('error', `❌ Error fetching markets: ${error.message}`);
        throw error;
    }
};

// Funkcja zwracająca listę rynków (z cache lub pobierając nowe)
const getMarkets = async () => {
    if (cachedMarkets.length > 0 && Date.now() - lastUpdate < MARKET_CACHE_TIME) {
        logMessage('info', `♻️ Returning cached markets data.`);
        return cachedMarkets;
    }
    return await initMarkets();
};

// Funkcja, którą wywoła pętla główna, aby odświeżyć rynki
const updateMarkets = async () => {
    logMessage('info', `🔄 Updating market data...`);
    await initMarkets();
};

module.exports = {
    initMarkets,
    getMarkets,
    updateMarkets
};
