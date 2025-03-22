const { getConfig } = require("../../config/config");
const { logMessage } = require("../../core/logging");
const { formatSymbol, formatSide } = require("../../core/utils");

const { getMarkets, getMarketData } = require("../markets/markets.service");
const { openPosition } = require("../positions/positions.service");

const strategies = {
  reversal: require("./reversal.service"),
  trendFollowing: require("./trendFollowing.service")
};
const signals = new Map();

/**
 * Analizuje wszystkie rynki i wybiera najlepsze sygnały
 */
const evaluateStrategies = async () => {
  try {
    const markets = await getMarkets();

    if (!markets || !Array.isArray(markets) || markets.length === 0) {
      logMessage("error", "⚠️ Brak dostępnych rynków do analizy!");
      return;
    }

    const config = getConfig("strategies");
    if (!config) {
      logMessage("error", "❌ Błąd: Nie udało się pobrać konfiguracji strategii!");
      return;
    }

    for (const market of markets) {
      if (!market || !market.symbol) {
        logMessage("error", `❌ Błąd: Brak symbolu dla rynku! ${JSON.stringify(market)}`);
        continue;
      }

      logMessage("info", `📌 Sprawdzam rynek: ${market.symbol}`);

      let bestSignal = null;
      let bestStrength = 0;
      let bestStrategy = "";

      for (const strategyName of Object.keys(strategies)) {
        if (!strategyName) continue;

        logMessage("info", `🔍 Sprawdzam strategię: ${strategyName} dla ${market.symbol}`);
        const marketData = await getMarketData(market.symbol, strategyName);

        if (!marketData || !marketData.indicators) {
          logMessage("error", `⚠️ Brak marketData dla ${market.symbol}, pomijam strategię.`);
          continue;
        }

        const strategyConfig = config[strategyName];
        if (!strategyConfig || !strategyConfig.enabled) {
          logMessage("warn", `⚠️ Strategia ${strategyName} jest wyłączona.`);
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
        //TU DZIALA
        const minStrength = 0.5;
        if (bestStrength >= minStrength) {
          logMessage("debug", `🚀 Otwieram pozycję na ${market.symbol} - ${bestSignal.type} - ${bestSignal.strength}`);
          // Otwarcie pozycji
          const orderSignal = {
            symbol: market.symbol,
            side: bestSignal.type,
          } 
          const position = await openPosition(orderSignal);
          if (position) {
            logMessage("success", `✅ Otwarto pozycję na ${market.symbol} - ${bestSignal.type}`);
          }
        } else {
          logMessage("warn", `⚠️ Sygnał dla ${market.symbol} jest zbyt słaby: ${bestStrength}/${strategyStrength}`);
          //signals.delete(market.symbol); // Usunięcie rynku, jeśli sygnał jest zbyt słaby
        }

      } else {
          logMessage("warn", "⚠️ Brak wystarczających sygnałów dla tego rynku.");
          signals.delete(market.symbol); // Usunięcie rynku, jeśli nie ma sygnału
      }
    }
    logSignals();
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
          logMessage("debug", `${side} ${symbol} → Strategia: ${value.strategy}, Siła: ${value.strength}`);
      });
  }
};
module.exports = { evaluateStrategies, logSignals };