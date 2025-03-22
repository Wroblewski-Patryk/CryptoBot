const ti = require('technicalindicators');

/**
 * Oblicza wskaźnik RSI
 * @param {Array} prices - Tablica cen zamknięcia
 * @param {Number} period - Okres RSI
 * @returns {Number} - Wartość RSI
 */
const calculateRSI = (prices, period) => {
    return ti.RSI.calculate({ values: prices, period }).pop();
};

/**
 * Oblicza wskaźnik MACD
 */
const calculateMACD = (prices, fastPeriod, slowPeriod, signalPeriod) => {
    const result = ti.MACD.calculate({
        values: prices,
        fastPeriod,
        slowPeriod,
        signalPeriod,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    });
    return result.length ? result.pop() : null;
};

/**
 * Oblicza Bollinger Bands
 */
const calculateBollingerBands = (prices, period, stdDev) => {
    const result = ti.BollingerBands.calculate({
        values: prices,
        period,
        stdDev
    });
    return result.length ? result.pop() : null;
};

/**
 * Oblicza wskaźnik ADX
 */
const calculateADX = (highs, lows, closes, period) => {
    if (!highs || !lows || !closes || highs.length < period || lows.length < period || closes.length < period) {
        console.log(`⚠️ Za mało danych do obliczenia ADX. Wymagane: ${period}, dostępne: ${closes ? closes.length : 0}`);
        return null;
    }

    const result = ti.ADX.calculate({
        high: highs,
        low: lows,
        close: closes,
        period
    });

    if (!result.length) {
        console.warn("⚠️ ADX nie zwrócił żadnych wyników.");
        return null;
    }

    const last = result.at(-1); // lub result[result.length - 1]
    return {
        adx: last.adx,
        pdi: last.pdi,
        mdi: last.mdi
    };
};

/**
 * Oblicza ATR
 */
const calculateATR = (highs, lows, closes, period) => {
    if (!highs || !lows || !closes || highs.length < period || lows.length < period || closes.length < period) {
        console.log(`⚠️ Za mało danych do obliczenia ATR. Wymagane: ${period}, dostępne: ${closes ? closes.length : 0}`);
        return null;
    }

    // Sprawdzenie czy dane wejściowe są liczbami
    const containsInvalid = [...highs, ...lows, ...closes].some(val => typeof val !== 'number' || isNaN(val));
    if (containsInvalid) {
        console.error("❌ Dane wejściowe zawierają błędne wartości (NaN / undefined / nie-liczby).");
        return null;
    }

    const result = ti.ATR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period
    });

    if (!result.length) {
        console.warn("⚠️ ATR nie zwrócił żadnych wyników.");
        return null;
    }

    const lastATR = result[result.length - 1];
    return {
        atr: lastATR,
        normalized: lastATR / closes[closes.length - 1]
    };
};

/**
 * Oblicza EMA
 */
const calculateEMA = (prices, period) => {
    return ti.EMA.calculate({ values: prices, period }).pop();
};

module.exports = {
    calculateRSI,
    calculateMACD,
    calculateBollingerBands,
    calculateADX,
    calculateATR,
    calculateEMA
};
