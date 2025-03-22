const { createOrder } = require('../orders/orders.service');
const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { getWalletBalance } = require('../wallet/wallet.service');

// 📌 Przechowujemy historię DCA dla każdej pozycji
let dcaHistory = {};

const handleDCA = async (position, closePosition) => {
    const dcaConfig = getConfig('dca');
    if (!dcaConfig.enabled) return;

    const { symbol, margin, amount, profit, side } = position;
    // 📊 Sprawdzamy, ile razy DCA było już wykonane dla tej pozycji
    if (!dcaHistory[symbol]) 
        dcaHistory[symbol] = 0;

    if (dcaHistory[symbol] >= dcaConfig.times) {
        logMessage('warn', `⛔ Maksymalna liczba DCA dla ${symbol} osiągnięta.`);
        return;
    }
    
    // 📉 Sprawdzamy, czy strata przekroczyła `dcaPercent`
    const profitPercent = profit/margin*100;
    const percent = dcaConfig.percents[dcaHistory[symbol]] || -40;
    if (profitPercent >= percent) {
        logMessage('warn',`⚠️ DCA dla ${symbol} NIEAKTYWNE (Strata ${profitPercent}%, limit: ${percent}%)`);
        return;
    }

    // 📌 Obliczamy ile dokładamy (110% aktualnej pozycji)
    const dcaAmount = amount * dcaConfig.multiplier;
    const walletFunds = await getWalletBalance();
    if( margin > walletFunds ){
        logMessage('warn',`⛔ Brak środków dla ${symbol}.`);
        return;
    }

    logMessage('info', `📊 DCA aktywowane dla ${symbol}! Dokładamy ${dcaAmount} jednostek.`);

    const orderSide = side === 'short' ? 'sell' : 'buy';

    // 🛒 Składamy zamówienie DCA
    const entryPrice = position.entryPrice || margin / amount; // Średnia cena wejścia
    const type = getConfig('trading.order.type');
    const makeOrder = await createOrder(symbol, type, orderSide, dcaAmount, entryPrice);

    // 🔄 Zapisujemy w historii DCA
    if(makeOrder)
        dcaHistory[symbol] += 1;
}
const clearDCA = (symbol) => {
    if (dcaHistory[symbol])
        dcaHistory[symbol] = 0;
}
const getDCA = (symbol) => {
    let dca = dcaHistory[symbol];
    if (!dca || dca === undefined)
        dca = 0;
    return dca;
}
module.exports = {
    handleDCA,
    clearDCA,
    getDCA
};
