const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { getInstance } = require('../../api/binance.service');

let tslTracking = {};

const handleTSL = async (position) => {
    const tslConfig = getConfig('tsl');
    if (!tslConfig.enabled) return;

    const { symbol, margin, amount, profit, side } = position;
    const tslStart = tslConfig.start;  // % progu aktywacji TSL
    const tslStep = tslConfig.step;    // % odległość Stop Loss
    const profitPercent = (profit / margin) * 100;

    // 📉 Jeśli profit przekroczył próg aktywacji TSL, zaczynamy śledzenie
    if (profitPercent >= tslStart) {
        if (!tslTracking[symbol]) {
            tslTracking[symbol] = { highProfit: profitPercent };
        }

        // Aktualizujemy najwyższy osiągnięty profit
        if (profitPercent > tslTracking[symbol].highProfit) {
            tslTracking[symbol].highProfit = profitPercent;
            logMessage('info', `🔄 ${symbol} - Nowy poziom TSL: High ${profitPercent}%`);
        }

        // 📉 Sprawdzamy, czy profit spadł do poziomu `highProfit - tslStep`
        if (profitPercent <= tslTracking[symbol].highProfit - tslStep) {
            logMessage('info', `✅ ${symbol} osiągnęło poziom Trailing Stop Loss. Zamykam pozycję!`);
            await closePosition(symbol, side, amount);
            delete tslTracking[symbol]; // Usuwamy zapis TSL po zamknięciu pozycji
        }
    } else {
        logMessage('warn', `📊 ${symbol} jeszcze nie osiągnęło poziomu aktywacji TSL (${profitPercent}% / ${tslStart}%)`);
    }
};

// 🚀 Funkcja zamykająca pozycję
const closePosition = async (symbol, side, amount) => {
    try {
        logMessage('info','closing position: '+symbol);
        const binance = await getInstance();
        const formattedSymbol = symbol.replace(':USDT', '').replace('/', '');
        const opositeSide = side === 'long' ? 'SELL' : 'BUY';

        const closeOrder = await binance.createOrder(formattedSymbol, "MARKET", opositeSide, amount);
        logMessage('info', `✅ Pozycja ${symbol} zamknięta! (Zlecenie: ${closeOrder.id})`);
        return closeOrder;
    } catch (error) {
        logMessage('warn', `❌ Błąd zamykania pozycji dla ${symbol}: ${error.message}`);
        return null;
    }
};
const clearTSL = (symbol) => {
    if (tslTracking[symbol])
        delete tslTracking[symbol];
}
module.exports = {
    handleTSL,
    clearTSL
};
