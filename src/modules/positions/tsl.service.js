const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { getDCA } = require('./dca.service');
const { getTTP } = require('./ttp.service');

let tslTracking = new Map();

const handleTSL = async (position, closePosition) => {
    const tslConfig = getConfig('tsl');
    if (!tslConfig.enabled) return;

    const { symbol, margin, amount, profit, side } = position;
    const tslStart = tslConfig.start;  // Poziom aktywacji TSL, np. -25%
    const tslStep = tslConfig.step;    // O ile procent podnosić maksymalną stratę, np. 5%
    const profitPercent = (profit / margin) * 100;

    // Sprawdzamy stan DCA
    const dca = getDCA(symbol);
    const maxDca = getConfig('dca.times');

    if (dca === null || dca === undefined) {
        logMessage('error', `❌ Błąd pobierania wartości DCA dla ${symbol}.`);
        return;
    }

    // Aktywacja TSL dopiero po osiągnięciu maksymalnego DCA
    if (dca !== maxDca) {
        logMessage('warn', `⚠️ ${symbol} - DCA nie osiągnęło maksymalnego poziomu: ${dca}/${maxDca}. TSL nie aktywowany.`);
        return;
    }

    //sprawdzić czy jest przejęty przez tpp jak tak to wyczyscic 
    const ttp = getTTP(symbol);
    if ( ttp > 0 )
        clearTSL(symbol);

    // Jeśli profit osiągnął poziom `tslStart`
    if (!tslTracking.has(symbol)) {
        if(profitPercent <= tslStart){
            // Jeśli TSL nie był aktywny, ustaw pierwszą maksymalną stratę
            tslTracking.set(symbol, { maxLoss: tslStart - tslStep });
            logMessage('debug', `🔄 ${symbol} - Trailing Stop Loss aktywowany! Maksymalna strata: ${tslStart - tslStep}%`);
            return;
        } else {
            logMessage('debug', `📊 ${symbol} jeszcze nie osiągnęło poziomu aktywacji TSL (${profitPercent}% / ${tslStart}%)`);
            return;
        }
    }


    if ( tslTracking.has(symbol)){
        let tslData = tslTracking.get(symbol);
        let { maxLoss } = tslData;

        if (profitPercent > maxLoss + tslStep){
            maxLoss = profitPercent - tslStep;
            tslTracking.set(symbol, { maxLoss });
            logMessage('debug', `🔼 ${symbol} - Nowy poziom TSL: Maksymalna strata przesunięta na ${maxLoss}%`);        
        }
        if (profitPercent < maxLoss){
            logMessage('info', `✅ ${symbol} osiągnęło poziom Trailing Stop Loss. Zamykam pozycję na poziomie ${maxLoss}%!`);
            const closeOrder = await closePosition(symbol, side, amount);
            if (closeOrder) {
                clearTSL(symbol);
                logMessage('debug', `✅ Pozycja ${symbol} zamknięta na poziomie ${maxLoss}%!`);
            } else {
                logMessage('warn', `❌ Błąd zamykania pozycji dla ${symbol}.`);
            }
            return;
        }
    }
};

// Czyszczenie TSL po zamknięciu pozycji
const clearTSL = (symbol) => {
    if (tslTracking.has(symbol)) {
        tslTracking.delete(symbol);
    }
};

// Pobieranie aktualnego poziomu TSL
const getTSL = (symbol) => {
    const tslConfig = getConfig('tsl');

    if (!tslTracking.has(symbol) || !tslTracking.get(symbol)?.maxLoss) {
        return '0.00';
    }

    const tslStep = tslConfig.step;
    const maxLoss = tslTracking.get(symbol).maxLoss;
    const tslLevel = Math.min(0, maxLoss);

    return tslLevel.toFixed(2);
};

module.exports = {
    handleTSL,
    clearTSL,
    getTSL
};
