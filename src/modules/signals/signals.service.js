const { logMessage } = require('../../core/logging');
const { getMarkets } = require("../markets/markets.service");
const { fetchOHLCV } = require('./ohlcv.service');
const { checkIndicators } = require('../indicators/indicators.service');

const signals = [];

const updateSignals = async () => {
    const markets = await getMarkets();

    for (const market of markets){
        const symbol = market.symbol;

        //UPDATE OHLCV DATA
        const ohlcv = await fetchOHLCV(symbol);

        //CHECK OHLCV BY INDICATORS BY MARKET 
        const closePrices = ohlcv.map(candle => candle[4]);
        const highPrices = ohlcv.map(candle => candle[2]);
        const lowPrices = ohlcv.map(candle => candle[3]);

        if (closePrices.length < 30) { // 30 to minimalna liczba dla MACD + ADX
            logMessage('error', '❌ Zbyt mało świec OHLCV do analizy wskaźników.');
            return [];
        }

        // 📊 Analizujemy wskaźniki
        const result = checkIndicators(closePrices, highPrices, lowPrices);
        
        const signal = {
            "symbol": symbol,
            "action": result.action,
            "strenght": result.strength
        }
        if (signal.strenght >= 0.8 || signal.strenght <= -0.8){
            signals.push(signal);
            // 📢 Logujemy wynik
            logMessage('debug', `📢 ${symbol} - ${result.action} - Siła: ${result.strength}`);
        }
    }

    return true;
}

module.exports = {
    updateSignals
};