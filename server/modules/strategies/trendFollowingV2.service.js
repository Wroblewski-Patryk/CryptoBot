const { getConfig } = require("../../config/config");
const { logMessage } = require("../../core/logging");

const checkSignal = async (marketData) => {
  const strategyConfig = getConfig("strategies.trendFollowing");
  const indicatorsConfig = getConfig("indicators");

  if (!strategyConfig || !strategyConfig.enabled) {
    logMessage("error", "❌ Strategia trendFollowing jest wyłączona lub brak konfiguracji!");
    return { type: "hold", strength: 0 };
  }

  const { emaShort, emaLong, macd, adx, rsi } = marketData.indicators;

  if (!emaShort || !emaLong || !macd || !adx || rsi === null) {
    logMessage("error", "❌ Brak danych wskaźników do strategii trendFollowing!");
    return { type: "hold", strength: 0 };
  }

  const adxThreshold = indicatorsConfig.adx?.threshold ?? 20;
  const weights = {
    emaCross: indicatorsConfig.emaCross?.weight ?? 1.2,
    macd: indicatorsConfig.macd?.weight ?? 1,
    adx: indicatorsConfig.adx?.weight ?? 1,
    rejection: indicatorsConfig.rejection?.weight ?? 0.8,
    rsi: indicatorsConfig.rsi?.weight ?? 0.5,
  };

  const len = Math.min(emaShort.length, emaLong.length);
  if (len < 20) return { type: "hold", strength: 0 };

  const shortPrev = emaShort[len - 8];
  const shortCurr = emaShort[len - 1];
  const longPrev = emaLong[len - 8];
  const longCurr = emaLong[len - 1];

  const crossedUp = shortPrev < longPrev && shortCurr > longCurr;
  const crossedDown = shortPrev > longPrev && shortCurr < longCurr;
  const emaShortAbove = shortCurr > longCurr;
  const emaShortBelow = shortCurr < longCurr;

  // FAŁSZYWY CROSS (szybkie wybicie i powrót)
  const recentFalseCross =
    emaShort[len - 3] > emaLong[len - 3] &&
    emaShort[len - 1] < emaLong[len - 1];
    if (recentFalseCross) {
        totalWeight += weights.falseCross;
        if (emaShortAbove) signals.sell += weights.falseCross;
        else if (emaShortBelow) signals.buy += weights.falseCross;
    }
  // REJECTION CHECK
  let rejectionCount = 0;
  let closeBelowCount = 0;
  for (let i = len - 16; i < len; i++) {
    const price = marketData.info.lastPrice;
    const short = emaShort[i];
    if (!short) continue;

    if (emaShortAbove && price < short) {
      closeBelowCount++;
      rejectionCount++;
    }

    if (emaShortBelow && price > short) {
      closeBelowCount++;
      rejectionCount++;
    }
  }

  let signals = { buy: 0, sell: 0 };
  let totalWeight = 0;

  // EMA CROSS
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
  if (adx?.adx !== undefined && adx.adx > adxThreshold) {
    totalWeight += weights.adx;
    if (adx.pdi > adx.mdi) signals.buy += weights.adx;
    else if (adx.mdi > adx.pdi) signals.sell += weights.adx;
  }

  // REJECTION LOGIKA
  if (rejectionCount >= 2 && closeBelowCount / 16 >= 0.6) {
    totalWeight += weights.rejection;
    if (emaShortAbove) signals.sell += weights.rejection;
    else if (emaShortBelow) signals.buy += weights.rejection;
  }

  // RSI
  totalWeight += weights.rsi;
  if (rsi > 50 && rsi < indicatorsConfig.rsi.overbought) 
    signals.buy += weights.rsi;
  else if (rsi < 50 && rsi > indicatorsConfig.rsi.oversold) signals.sell += weights.rsi;

  // FINAL SCORE
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

  return {
    type: finalSignal,
    strength: parseFloat(finalStrength.toFixed(4)),
  };
};

module.exports = { checkSignal };
