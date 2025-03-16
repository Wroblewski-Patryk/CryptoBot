const { getInstance } = require('../../api/binance.service');
const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');

const { updateMarketCache } = require('./cache.service');

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
        const forbiddenCurrencies = getConfig('trading.forbiddenCurrencies') || [];

        // Filtrowanie rynków
        const filteredMarkets = Object.values(markets).filter(market =>
            market.quote === baseCurrency &&
            market.info.contractType === contractType &&
            !forbiddenCurrencies.includes(market.base)
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
        //logMessage('info', `♻️ Returning cached markets data.`);
        return cachedMarkets;
    }
    return await initMarkets();
};

// Funkcja, którą wywoła pętla główna, aby odświeżyć rynki
const updateMarkets = async () => {
    logMessage('info', `🔄 Updating market data...`);
    await initMarkets();
};

const getMarketInfo = async (symbol) => {
    try {
        const markets = await getMarkets(); // Pobieramy rynki (z cache lub API)
        const market = markets.find(m => m.symbol === symbol);
        if (!market) {
            throw new Error(`Nie znaleziono danych rynkowych dla ${symbol}`);
        }

        return {
            symbol: market.symbol,
            minNotional: market.limits?.cost?.min || 0, // Minimalna wartość transakcji
            stepSize: market.precision?.amount || 0,    // Precyzja ilościowa (np. 0.01 BTC)
            tickSize: market.precision?.price || 0,     // Precyzja ceny (np. 0.001 USDT)
            maxNotional: market.limits?.cost?.max || Infinity, // Maksymalna wartość transakcji
        };
    } catch (error) {
        console.error(`❌ Błąd w getMarketInfo: ${error.message}`);
        return null;
    }
};


module.exports = {
    initMarkets,
    getMarkets,
    updateMarkets,
    getMarketInfo
};
