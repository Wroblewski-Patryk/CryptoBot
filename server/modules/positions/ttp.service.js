const { getConfig } = require('../../core/config');
const { logMessage } = require('../../core/logging');

let ttpTracking = new Map();

const handleTTP = async (position, closePosition) => {
    const ttpConfig = getConfig('ttp');
    if (!ttpConfig.enabled) return;

    const { symbol, margin, amount, profit, side } = position;
    const profitPercent = (profit / margin) * 100;

    const starts = ttpConfig.starts;
    const steps = ttpConfig.steps;
    const ttpStart = getDynamicStart(profitPercent, starts);
    const ttpStep = getDynamicStep(profitPercent, starts, steps);
    
    if ( profitPercent >= ttpStart - ttpStep ) {
        const tracking = ttpTracking.get(symbol);

        if ( !tracking && profitPercent >= ttpStart ) {
            ttpTracking.set(symbol, { highProfit: profitPercent, step: ttpStep });
            logMessage('info', `🔄 ${symbol} - Aktywacja TTP: ${profitPercent}%`);
        }

        if ( tracking && profitPercent - ttpStep > tracking.highProfit - tracking.step) {
            ttpTracking.set(symbol, { highProfit: profitPercent, step: ttpStep });
            logMessage('info', `🔄 ${symbol} - Nowy poziom TTP: ${profitPercent}%`);
        }

        if ( tracking && profitPercent <= tracking.highProfit - tracking.step){
            logMessage('info', `✅ ${symbol} osiągnęło poziom TTP. Zamykam pozycję!`);
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
        clearTTP(symbol);
        logMessage('warn', `📊 ${symbol} jeszcze nie osiągnęło poziomu aktywacji TTP (${profitPercent}% / ${ttpStart}%)`);
    }
};

const clearTTP = (symbol) => {
    if (ttpTracking.has(symbol)) 
        ttpTracking.delete(symbol);
};
const getTTP = (symbol) => {
    if (!ttpTracking.has(symbol) || !ttpTracking.get(symbol)?.highProfit) {
        return '0.00';
    }

    const ttpStep = ttpTracking.get(symbol).step;
    const highProfit = ttpTracking.get(symbol).highProfit;
    const ttpLevel = Math.max(0, highProfit - ttpStep);

    return ttpLevel.toFixed(2);
};
const getDynamicStart = (profitPercent, starts) => {
    let selectedStart = starts[0];
    for (let i = 0; i < starts.length; i++) {
        if (profitPercent >= starts[i]) {
            selectedStart = starts[i];
        } else {
            break;
        }
    }
    return selectedStart;
};
const getDynamicStep = (profitPercent, starts, steps) => {
    let selectedStep = steps[0];
    for (let i = 0; i < starts.length; i++) {
        if (profitPercent >= starts[i]) {
            selectedStep = steps[i];
        } else {
            break;
        }
    }
    return selectedStep;
};
module.exports = {
    handleTTP,
    clearTTP,
    getTTP
};
