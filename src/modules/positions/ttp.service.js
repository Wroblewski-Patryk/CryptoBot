const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');

let ttpTracking = {};

const handleTTP = async (position, closePosition) => {
    const ttpConfig = getConfig('ttp');
    if (!ttpConfig.enabled) return;

    const { symbol, margin, amount, profit, side } = position;
    const ttpStart = ttpConfig.start;
    const ttpStep = ttpConfig.step;
    const profitPercent = (profit / margin) * 100;

    if (profitPercent >= ttpStart) {
        if (!ttpTracking[symbol]) {
            ttpTracking[symbol] = { highProfit: profitPercent };
        }

        if (profitPercent > ttpTracking[symbol].highProfit) {
            ttpTracking[symbol].highProfit = profitPercent;
            logMessage('info', `🔄 ${symbol} - Nowy poziom TTP: High ${profitPercent}%`);
        }

        if (profitPercent <= ttpTracking[symbol].highProfit - ttpStep) {
            logMessage('info', `✅ ${symbol} osiągnęło poziom Trailing Take Profit. Zamykam pozycję!`);
            const closeOrder = await closePosition(symbol, side, amount);
            if (closeOrder) {
                clearTTP(symbol);
                logMessage('debug', `✅ Pozycja ${symbol} zamknięta!`);
            } else {
                logMessage('warn', `❌ Błąd zamykania pozycji dla ${symbol}.`);
            }
            return;
        }
    } else {
        logMessage('warn', `📊 ${symbol} jeszcze nie osiągnęło poziomu aktywacji TTP (${profitPercent}% / ${ttpStart}%)`);
    }
};

const clearTTP = (symbol) => {
    if (ttpTracking[symbol]) delete ttpTracking[symbol];
};
const getTTP = (symbol) => {
    const ttpConfig = getConfig('ttp');

    // Sprawdzamy, czy symbol istnieje w ttpTracking
    if (!ttpTracking[symbol] || !ttpTracking[symbol].highProfit) {
        return '0.00'; // Jeśli nie ma danych, zwraca 0.00
    }

    const ttpStep = ttpConfig.step;
    const highProfit = ttpTracking[symbol].highProfit;
    const ttpLevel = Math.max(0, highProfit - ttpStep); // Zapewnia, że TTP nie będzie ujemne

    return ttpLevel.toFixed(2);
};

module.exports = {
    handleTTP,
    clearTTP,
    getTTP
};
