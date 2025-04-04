const chalk = require("chalk");
const { getConfig } = require("../../core/config");
const { logMessage } = require("../../core/logging");
const { formatSymbol, formatSide, formatStrategy } = require("../../core/utils");

const { getMarkets, getMarketData } = require("../markets/markets.service");
const { openPosition } = require("../positions/positions.service");

const strategies = {
  reversal: require("./reversal.service"),
  trendFollowing: require("./trendFollowing.service"),
  topGainersReversal: require("./topGainersReversal.service")
};
const signals = new Map();

const evaluateStrategies = async () => {
  try {
    const markets = await getMarkets();
    const config = getConfig("strategies");
    let i = 0;
    for (const market of markets) {
      logMessage("info", `📌 Sprawdzam rynek: ${market.symbol} (${i+1}/${markets.length})`);

      let bestSignal = null;
      let bestStrength = 0;
      let bestStrategy = "";

      for (const strategyName of Object.keys(strategies)) {
        const strategyConfig = config[strategyName];
        if (!strategyConfig || !strategyConfig.enabled) {
          logMessage("warn", `⚠️ Strategia ${strategyName} jest wyłączona.`);
          continue;
        }

        logMessage("info", `🔍 Sprawdzam strategię: ${strategyName} dla ${market.symbol}`);
        const marketData = await getMarketData(market.symbol, strategyName);
        if( !marketData || !marketData.info || !marketData.indicators ){
          logMessage("warn", `⚠️ Brak danych dla ${market.symbol} - ${strategyName}`);
          continue;
        }
        const signal = await strategies[strategyName].checkSignal(marketData);

        if (!signal) {
          logMessage("info", `📊 Brak sygnału ze strategii ${strategyName} dla ${market.symbol}`);
          continue;
        }

        logMessage("info", `📊 Sygnał ze strategii ${strategyName}: ${signal.strength}`);
        if (signal.strength > bestStrength) {
          bestSignal = signal;
          bestStrength = signal.strength;
          bestStrategy = strategyName;
        }
      }

      if (bestSignal) {
        logMessage("info", `✅ Najmocniejszy sygnał dla:${market.symbol} - strategia: ${bestStrategy} - ${bestStrength}`);
        signals.set(market.symbol, {
          strategy: bestStrategy,
          strength: bestStrength,
          type: bestSignal.type
        });
      } else {
          logMessage("warn", "⚠️ Brak wystarczających sygnałów dla tego rynku.");
          signals.delete(market.symbol); // Usunięcie rynku, jeśli nie ma sygnału
      }
      i++;
    }

    logSignals();
    checkSignals();
  } catch (error) {
    logMessage("error", `❌ Błąd w evaluateStrategies: ${error.message}`);
  }
};

const logSignals = () => {
  console.clear();
  
  logMessage("debug", "📋 Lista wszystkich sygnałów:");
  if (signals.size === 0) {
      logMessage("debug", "- Brak aktywnych sygnałów. -");
  } else {
      signals.forEach((value, key) => {
        const symbol = formatSymbol(key);
        const side = formatSide(value.type);
        const strategy = formatStrategy(value.strategy);
        const strength = chalk.green(value.strength);
          logMessage("debug", `${side} ${symbol} - 💡 ${strategy} 💪 ${strength}`);
      });
  }
};
const checkSignals = async () => {
  logMessage("debug", "🔍 Sprawdzanie sygnałów...");
  const sortedSignals = Array.from(signals.entries()).sort((a, b) => b[1].strength - a[1].strength);

  for (const [symbol, signal] of sortedSignals) {
    logMessage("debug", `Sygnał dla: ${symbol}, ${signal.strategy} - ${signal.type} - ${signal.strength}`);
    const orderSignal = {
      symbol: symbol,
      side: signal.type,
    };
    await makePosition(orderSignal);
  }
};
const makePosition = async (order) => {
  try {
    const position = await openPosition(order);
    if (position) {
      logMessage("debug", `✅ Otwarto pozycję na ${order.symbol} - ${order.side}`);
    }
  } catch (error) {
    logMessage("error", `❌ Błąd otwierania pozycji na ${order.symbol}: ${error.message}`);
  }
};
const apiGetSignals = async () => {
  const finalSignals = [];
  if ( !signals.length ){
      return finalSignals;
  }
  const sortedSignals = Array.from(signals.entries()).sort((a, b) => b[1].strength - a[1].strength);

  for (const [symbol, signal] of sortedSignals) {
    const finalSignal = {
      symbol: symbol,
      side: signal.type,
      strategy: signal.strategy,
      strength: signal.strength
    }
    finalSignals.push(finalSignal);
  }
  return finalSignals;
}
module.exports = { 
  evaluateStrategies, 
  logSignals, 
  checkSignals,

  apiGetSignals
};