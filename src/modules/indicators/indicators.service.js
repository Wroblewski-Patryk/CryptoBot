const technicalindicators = require('technicalindicators');
const { getConfig } = require('../../config/config');

// 📌 Funkcja do pobierania wskaźników i ich konfiguracji
const getIndicatorConfig = (name) => getConfig(`indicators.${name}`);

// 📌 RSI
const getRSISignal = (closePrices) => {
    const config = getIndicatorConfig('rsi');
    if (!config.enabled) return null;

    const rsi = technicalindicators.RSI.calculate({ values: closePrices, period: config.period });
    const lastRsi = rsi[rsi.length - 1];
    return { name: "RSI", strength: lastRsi > config.overbought ? 1 : lastRsi < config.oversold ? -1 : 0 };
};

// 📌 MACD
const getMACDSignal = (closePrices) => {
    const config = getIndicatorConfig('macd');
    if (!config.enabled) return null;

    const macd = technicalindicators.MACD.calculate({
        values: closePrices,
        fastPeriod: config.fastPeriod,
        slowPeriod: config.slowPeriod,
        signalPeriod: config.signalPeriod
    });
    const lastMacd = macd[macd.length - 1];
    return { name: "MACD", strength: lastMacd.histogram > 0 ? 1 : lastMacd.histogram < 0 ? -1 : 0 };
};

// 📌 Bollinger Bands
const getBollingerSignal = (closePrices) => {
    const config = getIndicatorConfig('bollinger');
    if (!config.enabled) return null;

    const bollinger = technicalindicators.BollingerBands.calculate({
        values: closePrices,
        period: config.period,
        stdDev: config.stdDev
    });
    const lastBoll = bollinger[bollinger.length - 1];
    return { name: "Bollinger", strength: closePrices[closePrices.length - 1] > lastBoll.upper ? -1 : closePrices[closePrices.length - 1] < lastBoll.lower ? 1 : 0 };
};

// 📌 ADX
const getADXSignal = (closePrices, highPrices, lowPrices) => {
    const config = getIndicatorConfig('adx');
    if (!config.enabled) return null;

    const adx = technicalindicators.ADX.calculate({
        close: closePrices,
        high: highPrices,
        low: lowPrices,
        period: config.period
    });
    const lastAdx = adx[adx.length - 1];
    return { name: "ADX", strength: lastAdx.adx > config.threshold ? (lastAdx.pdi > lastAdx.mdi ? 1 : -1) : 0 };
};

// 📌 EMA Cross
const getEMASignal = (closePrices) => {
    const configShort = getIndicatorConfig('emaShort');
    const configLong = getIndicatorConfig('emaLong');

    if (!configShort.enabled || !configLong.enabled) return null;

    const emaShort = technicalindicators.EMA.calculate({ values: closePrices, period: configShort.period });
    const emaLong = technicalindicators.EMA.calculate({ values: closePrices, period: configLong.period });

    return { name: "EMA Cross", strength: emaShort[emaShort.length - 1] > emaLong[emaLong.length - 1] ? 1 : -1 };
};

// 📌 Główna funkcja sprawdzająca wszystkie wskaźniki
const checkIndicators = (closePrices, highPrices, lowPrices) => {
    const signals = [
        getRSISignal(closePrices),
        getMACDSignal(closePrices),
        getBollingerSignal(closePrices),
        getADXSignal(closePrices, highPrices, lowPrices),
        getEMASignal(closePrices)
    ].filter(signal => signal !== null); // Usuwamy null (wyłączone wskaźniki)

    if (signals.length === 0) return { action: "HOLD", strength: 0, signals: [] };

    // 🔥 Agregujemy siłę wskaźników
    const totalStrength = signals.reduce((sum, s) => sum + s.strength, 0);
    const averageStrength = totalStrength / signals.length;

    // 📌 Decyzja końcowa
    let action = "HOLD";
    if (averageStrength >= 0.5) action = "LONG";
    if (averageStrength <= -0.5) action = "SHORT";

    return { action, strength: averageStrength.toFixed(2), signals };
};

// Eksportujemy funkcję
module.exports = {
    checkIndicators
};
