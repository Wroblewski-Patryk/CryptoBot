const { getConfig } = require("../../config/config");
const { logMessage } = require("../../core/logging");

const checkSignal = async (marketData) => {
    const strategyConfig = getConfig("strategies.trendFollowing");
    const indicatorsConfig = getConfig("indicators");

    if (!strategyConfig || !strategyConfig.enabled) {
        logMessage("error", "❌ Strategia trendFollowing jest wyłączona lub brak konfiguracji!");
        return { type: "hold", strength: 0 };
    }

    const emaShortArr = marketData.indicators.emaShort;
    const emaLongArr = marketData.indicators.emaLong;
    const macd = marketData.indicators.macd;
    const adx = marketData.indicators.adx;

    if (!emaShortArr || !emaLongArr || !macd || !adx) {
        logMessage("error", "❌ Brak danych wskaźników do strategii trendFollowing!");
        return { type: "hold", strength: 0 };
    }

    const adxThreshold = indicatorsConfig.adx?.threshold ?? 20;
    const weights = {
        emaCross: indicatorsConfig.emaCross.weight ?? 1.2,
        macd: indicatorsConfig.macd?.weight ?? 1,
        adx: indicatorsConfig.adx?.weight ?? 1,
    };

    const len = Math.min(emaShortArr.length, emaLongArr.length);
    if (len < 2) return { type: "hold", strength: 0 };

    const shortPrev = emaShortArr[len - 8];
    const shortCurr = emaShortArr[len - 1];
    const longPrev = emaLongArr[len - 8];
    const longCurr = emaLongArr[len - 1];

    const crossedUp = shortPrev < longPrev && shortCurr > longCurr;
    const crossedDown = shortPrev > longPrev && shortCurr < longCurr;

    let signals = { buy: 0, sell: 0 };
    let totalWeight = 0;

    // EMA Cross
    totalWeight += weights.emaCross;
    if (crossedUp) signals.buy += weights.emaCross;
    else if (crossedDown) signals.sell += weights.emaCross;

    // MACD
    if (macd?.MACD !== undefined && macd?.signal !== undefined && macd?.histogram !== undefined) {
        totalWeight += weights.macd;
        if (macd.MACD > macd.signal && macd.histogram > 0) signals.buy += weights.macd;
        else if (macd.MACD < macd.signal && macd.histogram < 0) signals.sell += weights.macd;
    }

    // ADX
    if (adx?.adx !== undefined) {
        if (adx.adx > adxThreshold) {
            totalWeight += weights.adx;
            if (adx.pdi > adx.mdi) signals.buy += weights.adx;
            else if (adx.mdi > adx.pdi) signals.sell += weights.adx;
        }
    }

    if (totalWeight === 0) return { type: "hold", strength: 0 };

    const strengthLong = signals.buy / totalWeight;
    const strengthShort = signals.sell / totalWeight;

    let finalSignal = "hold";
    let finalStrength = 0;
    const minStrength = strategyConfig.minStrength ?? 0.5;

    if (strengthLong > strengthShort && strengthLong >= minStrength) {
        finalSignal = "buy";
        finalStrength = strengthLong;
    } else if (strengthShort > strengthLong && strengthShort >= minStrength) {
        finalSignal = "sell";
        finalStrength = strengthShort;
    }

    logMessage("info", `📈 TrendFollowing signal: ${finalSignal} (strength: ${finalStrength.toFixed(2)})`);

    return { type: finalSignal, strength: parseFloat(finalStrength.toFixed(4)) };
};

module.exports = { checkSignal };