const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { formatSymbol, formatSide } = require('../../core/utils');

const { fetchOHLCV } = require('./ohlcv.service');
const { getMarkets } = require("../markets/markets.service");
const { checkIndicators } = require('../indicators/indicators.service');
const { openPosition } = require('../positions/positions.service');

let signals = [];

const updateSignals = async () => {
    signals = [];

    const markets = await getMarkets();

    for (const market of markets){
        const symbol = market.symbol;

        //UPDATE OHLCV DATA
        const ohlcv = await fetchOHLCV(symbol);
        const highInterval = getConfig('indicators.highInterval');
        const higherTimeframeOhlcv = await fetchOHLCV(symbol, highInterval); // Pobieramy dane z wyższego interwału

        //CHECK OHLCV BY INDICATORS BY MARKET 
        const closePrices = ohlcv.map(candle => candle[4]);
        const highPrices = ohlcv.map(candle => candle[2]);
        const lowPrices = ohlcv.map(candle => candle[3]);
        const higherTimeframePrices = higherTimeframeOhlcv.map(candle => candle[4]);

        if (closePrices.length < 30) { // 30 to minimalna liczba dla MACD + ADX
            logMessage('error', '❌ Zbyt mało świec OHLCV do analizy wskaźników.');
            return [];
        }

        // 📊 Analizujemy wskaźniki
        const result = await checkIndicators(closePrices, highPrices, lowPrices, higherTimeframePrices);
        
        const signal = {
            "symbol": symbol,
            "action": result.action,
            "strength": result.strength
        }
        if (signal.strength >= 0.84 || signal.strength <= -0.84){
            signals.push(signal);
            await makePosition(signal);
        }
    }
    //showSignals();

    return true;
};
const showSignals = () => {
    // console.clear();
    logMessage('debug', '📢Lista sygnałów');

    if ( !signals.length ){
        logMessage('debug', `- Brak sygnałów -`);
        return;
    }

    for (const signal of signals){
        const symbol = signal.symbol;
        const side = signal.action;
        const strength = signal.strength;

        const symbolFormated = formatSymbol(symbol);
        const sideFormated = formatSide(side);

        logMessage('debug', `${sideFormated} ${symbolFormated} - Siła: ${strength}`);
    }
    return;
};
const makePosition = async (signal) => {
    const position = {
        "symbol": signal.symbol,
        "side": (signal.action).toLowerCase() === 'short' ? 'sell' : 'buy',
    }
    await openPosition(position);
}

module.exports = {
    updateSignals,
    showSignals
};