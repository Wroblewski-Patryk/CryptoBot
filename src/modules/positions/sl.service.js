const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { getDCA } = require('./dca.service');

const handleSL = async (position, closePosition) => {
    const slConfig = getConfig('sl');
    if (!slConfig.enabled) return;

    // Sprawdzamy stan DCA
    const dca = getDCA(symbol);
    const maxDca = getConfig('dca.dcaTimes');

    if (dca === null || dca === undefined) {
        logMessage('error', `❌ Błąd pobierania wartości DCA dla ${symbol}.`);
        return;
    }

    // Aktywacja TSL dopiero po osiągnięciu maksymalnego DCA
    if (dca !== maxDca) {
        logMessage('warn', `⚠️ ${symbol} - DCA nie osiągnęło maksymalnego poziomu: ${dca}/${maxDca}. TSL nie aktywowany.`);
        return;
    }

    const { symbol, amount, side, lastPrice, entryPrice } = position;
    if (!lastPrice || isNaN(lastPrice)) {
        logMessage('warn', `⚠️ ${symbol} - Brak aktualnej ceny! Pomijam SL.`);
        return;
    }

    const slPercent = slConfig.percent; // Ustalony procent SL
    const stopLevel = side === 'long'
        ? entryPrice * (1 - slPercent / 100) // SL dla pozycji long
        : entryPrice * (1 + slPercent / 100); // SL dla short

    if ((side === 'long' && lastPrice <= stopLevel) || (side === 'short' && lastPrice >= stopLevel)) {
        logMessage('debug', `⛔ ${symbol} - Osiągnięto poziom SL (${stopLevel}). Zamykam pozycję!`);
        const closeOrder = await closePosition(symbol, side, amount);
        if (closeOrder) {
            logMessage('debug', `✅ Pozycja ${symbol} zamknięta na poziomie SL!`);
        } else {
            logMessage('warn', `❌ Błąd zamykania pozycji SL dla ${symbol}.`);
        }
        return;
    }

    logMessage('info', `📊 ${symbol} - Aktualna cena: ${lastPrice}, Poziom SL: ${stopLevel}`);
};

module.exports = { handleSL };