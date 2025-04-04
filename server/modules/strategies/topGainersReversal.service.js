const { getConfig } = require("../../config/config");
const { logMessage } = require("../../core/logging");

const checkSignal = async (marketData) => {
  const strategyConfig = getConfig("strategies.topGainersReversal");
  const indicatorsConfig = getConfig("indicators");

  if (!strategyConfig || !strategyConfig.enabled) {
    logMessage("error", "❌ Strategia topGainersReversal jest wyłączona lub brak konfiguracji!");
    return { type: "hold", strength: 0 };
  }

  const rsi = marketData.indicators.rsi;
  const macd = marketData.indicators.macd;
  const emaShort = marketData.indicators.emaShort;
  const emaLong = marketData.indicators.emaLong;
  const lastPrice = marketData.info?.lastPrice || 0;
  const priceChange24h = marketData.info?.priceChangePercent || 0;

  if (!rsi || !macd || !emaShort || !emaLong) {
    logMessage("error", "❌ Brak danych wskaźników: RSI, MACD, EMA");
    return { type: "hold", strength: 0 };
  }

  if (priceChange24h < strategyConfig.min24hGain) {
    logMessage("info", `⛔ ${marketData.info.symbol} nie jest top gainerem (${priceChange24h.toFixed(2)}%)`);
    return { type: "hold", strength: 0 };
  }

  const weights = {
    rsi: indicatorsConfig.rsi?.weight ?? 1,
    macd: indicatorsConfig.macd?.weight ?? 1,
    ema: (indicatorsConfig.emaShort?.weight ?? 1) + (indicatorsConfig.emaLong?.weight ?? 1)
  };

  let signals = { sell: 0 };
  let totalWeight = 0;

  // RSI
  const rsiValue = rsi[rsi.length - 1];
  totalWeight += weights.rsi;
  if (rsiValue > (indicatorsConfig.rsi?.overbought ?? 70)) {
    signals.sell += weights.rsi;
  }

  // MACD
  if (macd.MACD < macd.signal && macd.histogram < 0) {
    signals.sell += weights.macd;
  }
  totalWeight += weights.macd;

  // EMA logic: short > long AND price < short
  const shortEma = emaShort[emaShort.length - 1];
  const longEma = emaLong[emaLong.length - 1];
  const trendBearish = shortEma > longEma;
  const priceBelowShortEma = lastPrice < shortEma;

  if (trendBearish && priceBelowShortEma) {
    signals.sell += weights.ema;
  }
  totalWeight += weights.ema;

  // Final decision
  const strength = totalWeight === 0 ? 0 : signals.sell / totalWeight;
  const minStrength = strategyConfig.minStrength ?? 0.5;

  const finalType = strength >= minStrength ? "sell" : "hold";

  logMessage("info", `📉 TopGainersReversal: ${finalType} (strength: ${strength.toFixed(2)})`);

  return { type: finalType, strength: parseFloat(strength.toFixed(4)) };
};

module.exports = { checkSignal };
