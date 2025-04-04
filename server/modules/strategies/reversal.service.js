
const { getConfig } = require("../../core/config");
const { logMessage } = require("../../core/logging");

const checkSignal = async (marketData) => {
    const strategyConfig = getConfig("strategies.reversal");
    const indicatorsConfig = getConfig("indicators");

    if (!strategyConfig || !strategyConfig.enabled) {
        logMessage("error", "❌ Strategia reversal jest wyłączona lub brak konfiguracji!");
        return { signal: "hold", strength: 0 };
    }

    const indicatorNames = strategyConfig.indicators;
    const signals = { buy: 0, sell: 0 };
    let totalWeight = 0;

    for (const name of indicatorNames) {
        const data = marketData.indicators?.[name];
        const config = indicatorsConfig[name];

        if (!config || !config.enabled || !data) continue;

        const weight = config.weight ?? 1;
        let direction = null;

        switch (name) {
            case "rsi":
                if (data < config.oversold) direction = "buy";
                else if (data > config.overbought) direction = "sell";
                break;
            case "macd":
                if (data.MACD > data.signal) direction = "buy";
                else if (data.MACD < data.signal) direction = "sell";
                break;
            case "bollinger":
                if (marketData.info.lastPrice < data.lower) direction = "buy";
                else if (marketData.info.lastPrice > data.upper) direction = "sell";
                break;
            case "adx":
                if (data.adx >= config.threshold) {
                    direction = data.pdi > data.mdi ? "buy" : "sell";
                }
                break;
            case "atr":
                if (data.normalized && config.thresholdLow && config.thresholdHigh) {
                    if (data.normalized > config.thresholdHigh) direction = "buy";
                    else if (data.normalized < config.thresholdLow) direction = "sell";
                }
                break;
            default:
                break;
        }

        totalWeight += weight;
        if (direction === "buy") {
            signals.buy += weight;
        } else if (direction === "sell") {
            signals.sell += weight;
        }
    }

    if (totalWeight === 0) {
        return { signal: "hold", strength: 0 };
    }

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

    logMessage("info", `📊 Reversal signal: ${finalSignal} (strength: ${finalStrength.toFixed(2)})`);
    return { type: finalSignal, strength: parseFloat(finalStrength.toFixed(4)) };
};

module.exports = { checkSignal };
