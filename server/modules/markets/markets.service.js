const { getInstance } = require('../../api/binance.service');
const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { formatSymbolForBinance } = require('../../core/utils');

const { calculateRSI, calculateMACD, calculateBollingerBands, calculateADX, calculateATR, calculateEMA } = require('./indicators.service');

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
            market.type === "swap" &&
            !forbiddenCurrencies.includes(market.base)
        );

        const tickers = await binance.fetchTickers();
        cachedMarkets = filteredMarkets.map(market => {
            const ticker = tickers[market.symbol];
            const lastPrice = ticker?.last ?? null;
            const changePrice = ticker?.percentage ?? 0;

            return {
                symbol: market.symbol,
                base: market.base,
                quote: market.quote,
                type: market.type,
                precision: market.precision,
                limits: market.limits,
                lastPrice: lastPrice,
                priceChangePercent: changePrice // 👈 to MUSI być tu
            };
        });

        lastUpdate = Date.now();
        logMessage('info', `📊 Markets updated successfully (${cachedMarkets.length} pairs).`);

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
            minNotional: market.limits?.cost?.min || 0,
            stepSize: market.precision?.amount || 0,
            tickSize: market.precision?.price || 0,
            maxNotional: market.limits?.cost?.max || Infinity,
            lastPrice: market.lastPrice,
            priceChangePercent: market.priceChangePercent
        };
    } catch (error) {
        console.error(`❌ Błąd w getMarketInfo: ${error.message}`);
        return null;
    }
};
const getMarketIndicators = async (symbol, strategyName) => {
    try {
        const binance = await getInstance();
        const strategies = getConfig('strategies');
        const indicatorsConfig = getConfig('indicators');
        const strategyConfig = strategies[strategyName];

        if (!strategyConfig) {
            throw new Error(`Strategia ${strategyName} nie istnieje w konfiguracji.`);
        }

        // Użycie poprawnego interwału ze strategii lub domyślnie 15m
        const interval = strategyConfig.interval || indicatorsConfig.intervals.low || "15m";

        const formattedSymbol = formatSymbolForBinance(symbol);
        //console.log(`🔍 Pobieranie świec dla ${formattedSymbol} (interwał: ${interval})`);
        const candles = await binance.fetchOHLCV(formattedSymbol, interval, undefined, 250);
 
        if (!candles || candles.length === 0) {
            console.log(`⚠️ Brak danych świecowych dla ${symbol}, nie można obliczyć wskaźników.`);
            return null;
        }
        // Pobranie cen zamknięcia
        // const timestamp = candles.map(candle => candle[0]);
        // const openPrices = candles.map(candle => candle[1]);
        const highPrices = candles.map(candle => candle[2]);
        const lowPrices = candles.map(candle => candle[3]); 
        const closePrices = candles.map(candle => candle[4]);
        // const volume = candles.map(candle => candle[5]);

        // Sprawdzenie, czy mamy wystarczającą ilość danych dla każdego wskaźnika
        if (closePrices.length < 25) {
            console.log(`⚠️ Za mało danych do obliczenia wskaźników dla ${symbol}. Wymagane min. 25 świec.`);
            return null;
        }

        // Obliczanie wskaźników
        const indicators = {
            rsi: strategyConfig.indicators.includes("rsi") ? calculateRSI(closePrices, indicatorsConfig.rsi.period) : null,
            macd: strategyConfig.indicators.includes("macd") ? calculateMACD(closePrices, indicatorsConfig.macd.fastPeriod, indicatorsConfig.macd.slowPeriod, indicatorsConfig.macd.signalPeriod) : null,
            bollinger: strategyConfig.indicators.includes("bollinger") ? calculateBollingerBands(closePrices, indicatorsConfig.bollinger.period, indicatorsConfig.bollinger.stdDev) : null,
            adx: strategyConfig.indicators.includes("adx") ? calculateADX(highPrices, lowPrices, closePrices, indicatorsConfig.adx.period) : null,
            atr: strategyConfig.indicators.includes("atr") ? calculateATR(highPrices, lowPrices, closePrices, indicatorsConfig.atr.period) : null,
            emaShort: strategyConfig.indicators.includes("emaShort") ? calculateEMA(closePrices, indicatorsConfig.emaShort.period) : null,
            emaLong: strategyConfig.indicators.includes("emaLong") ? calculateEMA(closePrices, indicatorsConfig.emaLong.period) : null,
        };
        
        //console.log(`📊 Wskaźniki dla ${symbol}:`, indicators);
        return indicators;

    } catch (error) {
        logMessage('error', `❌ Błąd przy pobieraniu wskaźników dla ${symbol}: ${error.message}`);
        return null;
    }
};

const getMarketData = async (symbol, strategyName) => {
    try {
        const info = await getMarketInfo(symbol);
        const indicators = await getMarketIndicators(symbol, strategyName);
        if (!info || !indicators) return null;

        return { "info": info, "indicators": indicators };
    } catch (error) {
        logMessage('error', `❌ Error fetching market data for ${symbol}: ${error.message}`);
        return null;
    }
};

module.exports = {
    initMarkets,
    getMarkets,
    updateMarkets,

    getMarketInfo,
    getMarketIndicators,
    getMarketData
};
