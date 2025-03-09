const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');

let tslTracking = new Map(); // Używamy Map dla wydajności!

const handleTSL = async (position, closePosition) => {
    const tslConfig = getConfig('tsl');
    if (!tslConfig.enabled) return;

    const { symbol, amount, side, lastPrice } = position;
    if (!lastPrice || isNaN(lastPrice)) {
        logMessage('warn', `⚠️ ${symbol} - Brak aktualnej ceny! Pomijam TSL.`);
        return;
    }
    const tslStep = tslConfig.step;
    
    if (!tslTracking.has(symbol)) {
        tslTracking.set(symbol, { highPrice: lastPrice });
        logMessage('debug', `🔄 ${symbol} - Trailing Stop Loss aktywowany!`);
    }

    const tslData = tslTracking.get(symbol);
    const { highPrice } = tslData;

    // Aktualizujemy najwyższą cenę, jeśli cena rośnie (dla long) lub maleje (dla short)
    if ((side === 'long' && lastPrice > highPrice) || (side === 'short' && lastPrice < highPrice)) {
        tslTracking.set(symbol, { highPrice: lastPrice });
        logMessage('debug', `🔼 ${symbol} - Nowy poziom TSL: ${lastPrice}`);
    }

    // Sprawdzamy, czy cena spadła o tslStep % od szczytu
    const stopLevel = side === 'long'
        ? highPrice * (1 - tslStep / 100)
        : highPrice * (1 + tslStep / 100);

    if ((side === 'long' && lastPrice <= stopLevel) || (side === 'short' && lastPrice >= stopLevel)) {
        logMessage('debug', `⛔ ${symbol} - Osiągnięto poziom TSL (${stopLevel}). Zamykam pozycję!`);
        const closeOrder = await closePosition(symbol, side, amount);
        if (closeOrder) {
            clearTSL(symbol);
            logMessage('debug', `✅ Pozycja ${symbol} zamknięta!`);
        } else {
            logMessage('warn', `❌ Błąd zamykania pozycji dla ${symbol}.`);
        }
        return;
    }

    logMessage('info', `📊 ${symbol} - Aktualna cena: ${lastPrice}, Poziom TSL: ${stopLevel}`);
};

const clearTSL = (symbol) => {
    if (tslTracking.has(symbol)) {
        tslTracking.delete(symbol);
    }
};

const getTSL = (symbol) => {
    if (!tslTracking.has(symbol)) return '0.00';

    const tslConfig = getConfig('tsl');
    const tslStep = tslConfig.step;
    const highPrice = tslTracking.get(symbol).highPrice;
    const tslLevel = Math.max(0, highPrice - (highPrice * tslStep / 100));

    return tslLevel.toFixed(2);
};

module.exports = {
    handleTSL,
    clearTSL,
    getTSL
};