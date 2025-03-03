const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { getInstance } = require('../../api/binance.service');

const handleTP = async (position) => {
    const tpConfig = getConfig('tp');
    if (!tpConfig.enabled) return;
    
    const { symbol, margin, amount, profit, side } = position;

    const configPercent = tpConfig.percent;
    const profitPercent = profit/margin*100;

    // 📉 Sprawdzamy, czy osiągnęliśmy poziom Take Profit
    if (profitPercent >= configPercent) {
        logMessage('debug',`✅ ${symbol} osiągnęło +${configPercent}% zysku. Zamykam pozycję!`);
        
        try {
            const binance = await getInstance();
            const formattedSymbol = symbol.replace(':USDT', '').replace('/','');
            let opositeSide = '';
            if (side === 'long'){
                opositeSide = 'SELL';
            } else {
                opositeSide = 'BUY';
            }
            // Składamy zlecenie rynkowe do zamknięcia pozycji
            const closeOrder = await binance.createOrder(formattedSymbol, "MARKET", opositeSide, amount);
            logMessage('debug', `✅ Pozycja ${symbol} zamknięta! (Zlecenie: ${closeOrder.id})`);
            return closeOrder;
        } catch (error) {
            logMessage('warn', `❌ Błąd zamykania pozycji dla ${symbol}: ${error.message}`);
            return null;
        }

    } else {
        logMessage('warn', `📊 ${symbol} jeszcze nie osiągnęło poziomu Take Profit (${profitPercent}% / ${configPercent}%)`);
    }
}

module.exports = {
    handleTP
};
