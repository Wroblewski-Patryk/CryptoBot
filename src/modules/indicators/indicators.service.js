const technicalindicators = require('technicalindicators');
const { getConfig } = require('../../config/config');

// 📌 Funkcja do pobierania wskaźników i ich konfiguracji
const getIndicatorConfig = (name) => getConfig(`indicators.${name}`);

// 📌 Wagi dla wskaźników
const indicatorWeights = {
    RSI: 1.2,
    MACD: 1.5,
    Bollinger: 1.0,
    ADX: 1.3,
    EMA_Cross: 1.4,
    ATR: 0.8 // ATR jest filtrem, nie wpływa mocno na kierunek
};

// 📌 Trend na wyższym interwale
const isHigherTimeframeTrendBullish = (emaShort, emaLong) => {
    return emaShort > emaLong; // LONG, jeśli EMA krótkoterminowa > EMA długoterminowa
};

// 📌 Pobranie trendu z wyższego interwału
const getHigherTimeframeTrend = async (closePrices) => {
    const configShort = getIndicatorConfig('emaShort');
    const configLong = getIndicatorConfig('emaLong');
    
    const emaShort = technicalindicators.EMA.calculate({ values: closePrices, period: configShort.period });
    const emaLong = technicalindicators.EMA.calculate({ values: closePrices, period: configLong.period });
    
    if (!emaShort || emaShort.length === 0 || !emaLong || emaLong.length === 0) return null;
    
    return isHigherTimeframeTrendBullish(emaShort[emaShort.length - 1], emaLong[emaLong.length - 1]) ? 1 : -1;
};

// 📌 RSI
const getRSISignal = (closePrices) => {
    const config = getIndicatorConfig('rsi');
    if (!config.enabled) return null;

    const rsi = technicalindicators.RSI.calculate({ values: closePrices, period: config.period });
    if (!rsi || rsi.length === 0) return null;
    const lastRsi = rsi[rsi.length - 1];
    return { name: "RSI", strength: (lastRsi > config.overbought ? -1 : lastRsi < config.oversold ? 1 : 0) * indicatorWeights.RSI };
};

// 📌 MACD
const getMACDSignal = (closePrices) => {
    const config = getIndicatorConfig('macd');
    if (!config.enabled || closePrices.length < config.slowPeriod) return null;

    const macd = technicalindicators.MACD.calculate({
        values: closePrices,
        fastPeriod: config.fastPeriod,
        slowPeriod: config.slowPeriod,
        signalPeriod: config.signalPeriod
    });
    if (!macd || macd.length === 0) return null;
    const lastMacd = macd[macd.length - 1];
    if (!lastMacd) return null;
    return { name: "MACD", strength: (lastMacd.histogram > 0 ? 1 : -1) * indicatorWeights.MACD };
};

// 📌 Bollinger Bands
const getBollingerSignal = (closePrices) => {
    const config = getIndicatorConfig('bollinger');
    if (!config.enabled || closePrices.length < config.period) return null;

    const bollinger = technicalindicators.BollingerBands.calculate({
        values: closePrices,
        period: config.period,
        stdDev: config.stdDev
    });
    if (!bollinger || bollinger.length === 0) return null;
    const lastBoll = bollinger[bollinger.length - 1];
    return { name: "Bollinger", strength: (closePrices[closePrices.length - 1] > lastBoll.upper ? -1 : closePrices[closePrices.length - 1] < lastBoll.lower ? 1 : 0) * indicatorWeights.Bollinger };
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
    if (!adx || adx.length === 0) return null;
    const lastAdx = adx[adx.length - 1];
    if (!lastAdx) return null;
    return { name: "ADX", strength: (lastAdx.adx > config.threshold ? (lastAdx.pdi > lastAdx.mdi ? 1 : -1) : 0) * indicatorWeights.ADX };
};

// 📌 EMA Cross
const getEMASignal = (closePrices) => {
    const configShort = getIndicatorConfig('emaShort');
    const configLong = getIndicatorConfig('emaLong');
    if (!configShort.enabled || !configLong.enabled || closePrices.length < configLong.period) return null;

    const emaShort = technicalindicators.EMA.calculate({ values: closePrices, period: configShort.period });
    const emaLong = technicalindicators.EMA.calculate({ values: closePrices, period: configLong.period });
    if (!emaShort || emaShort.length === 0 || !emaLong || emaLong.length === 0) return null;

    return { name: "EMA Cross", strength: (emaShort[emaShort.length - 1] > emaLong[emaLong.length - 1] ? 1 : -1) * indicatorWeights.EMA_Cross };
};

// 📌 Główna funkcja sprawdzająca wszystkie wskaźniki
const checkIndicators = async (closePrices, highPrices, lowPrices, higherTimeframePrices) => {
    const higherTrend = await getHigherTimeframeTrend(higherTimeframePrices);
    if (!higherTrend) return { action: "HOLD", strength: 0, signals: [] };
    
    const signals = [
        getRSISignal(closePrices),
        getMACDSignal(closePrices),
        getBollingerSignal(closePrices),
        getADXSignal(closePrices, highPrices, lowPrices),
        getEMASignal(closePrices)
    ].filter(signal => signal !== null);

    if (signals.length === 0) return { action: "HOLD", strength: 0, signals: [] };

    // 🔥 Agregujemy siłę wskaźników
    const totalStrength = signals.reduce((sum, s) => sum + (s.strength || 0), 0);
    const averageStrength = totalStrength / signals.length;

    // 📌 Decyzja końcowa
    let action = "HOLD";
    if (averageStrength >= 0.5 && higherTrend === 1) action = "LONG";
    if (averageStrength <= -0.5 && higherTrend === -1) action = "SHORT";

    return { action, strength: averageStrength.toFixed(2), signals };
};

// Eksportujemy funkcję
module.exports = {
    checkIndicators
};