const { getInstance } = require('../../api/binance.service');
const { logMessage } = require('../../core/logging');
const { formatSymbol, formatPrice, 
        formatSide, formatSymbolForBinance } = require('../../core/utils');
const { getConfig } = require('../../config/config');
const chalk = require('chalk');

const { createOrder } = require('../orders/orders.service');
const { calculateOrderSize } = require('./risk.service');
const { handleTP } = require('./tp.service');
const { handleDCA, clearDCA, getDCA } = require('./dca.service');
const { handleTSL, clearTSL, getTSL } = require('./tsl.service');
const { handleTTP, clearTTP, getTTP } = require('./ttp.service');
const { handleSL } = require('./sl.service');

let cachedPositions = [];
let lastUpdate = 0;
const POSITION_CACHE_TIME = 10 * 1000; // Cache na 10 sekund

// Pobieranie informacji o otwartych pozycjach
const initPositions = async () => {
    try {
        const binance = await getInstance();
        const accountInfo = await binance.fetchPositions(); // Pobieramy pozycje
        const activePositions = accountInfo.filter(pos => parseFloat(pos.contracts) !== 0);

        // Pobieramy ceny w pętli zamiast `Promise.all()`
        let updatedPositions = [];
        for (const position of activePositions) {
            try {
                const formattedSymbol = formatSymbolForBinance(position.symbol);
                const ticker = await binance.fetchTicker(formattedSymbol); // Pobieramy aktualną cenę
                updatedPositions.push({
                    symbol: position.symbol,
                    margin: parseFloat(position.initialMargin),
                    profit: parseFloat(position.unrealizedPnl),
                    amount: parseFloat(position.contracts),
                    side: position.side,
                    entryPrice: position.entryPrice,
                    lastPrice: ticker.last || position.markPrice, // Jeśli brak, użyj markPrice
                    markPrice: position.markPrice,
                    stopLossPrice: position.stopLossPrice,
                    takeProfitPrice: position.takeProfitPrice
                });
            } catch (error) {
                logMessage('warn', `❌ Błąd pobierania ceny dla ${position.symbol}: ${error.message}`);
                updatedPositions.push({ ...position, lastPrice: position.markPrice });
            }
        }

        cachedPositions = updatedPositions;
        lastUpdate = Date.now();
        logMessage('info', `📊 Positions updated successfully (${cachedPositions.length} open positions).`);

        return cachedPositions;
    } catch (error) {
        logMessage('error', `❌ Error fetching positions: ${error.message}`);
        throw error;
    }
};

// Pobieranie pozycji z cache lub API
const getPositions = async () => {
    if (cachedPositions.length > 0 && Date.now() - lastUpdate < POSITION_CACHE_TIME) {
        logMessage('info', `♻️ Returning cached positions.`);
        return cachedPositions;
    }
    return await initPositions();
};

// Funkcja aktualizująca pozycje (np. dla pętli głównej)
const updatePositions = async () => {
    
        logMessage('info', `🔄 Updating position data...`);
        await initPositions();

        showPositions();
        
    if (cachedPositions.length > 0){
        await checkPositions();
    }
};

const showPositions = () => {
    console.clear();
    logMessage('debug', `📋 Lista pozycji (${cachedPositions.length}/${getConfig('trading.maxOpenPositions')})`);
    if ( !cachedPositions.length ){
        logMessage('debug', '- Brak otwartych pozycji -');
        return null;
    }
    const sortedPositions = [...cachedPositions].sort((a, b) => (b.profit / b.margin) - (a.profit / a.margin));
    for (const position of sortedPositions){
        const symbol = position.symbol;
        const margin = position.margin;
        const profit = position.profit
        const amount = position.amount;
        const side = position.side;

        const symbolFormated = formatSymbol(symbol);
        const marginFormated = formatPrice(margin);
        const profitPercent = (profit/margin*100);
        const sideFormated = formatSide(side);

        const marginLog = chalk.white('Margin: ' + marginFormated);
        let profitLog = 'Profit: ' + profitPercent.toFixed(2)+'%';
        profitLog = profitPercent > 0 ? chalk.green(profitLog) : chalk.red(profitLog);

        let additionalInfo = '';
        const dca = getDCA(symbol);
        const dcaInfo = ' DCA: ' + dca + 'x';
        if (dca)
            additionalInfo = additionalInfo + chalk.cyan(dcaInfo);

        const ttp = getTTP(symbol);
        const ttpInfo = ' TTP: ' + ttp + '%';
        if (ttp > 0)
            additionalInfo = additionalInfo + chalk.yellow(ttpInfo);
        
        const tsl = getTSL(symbol);
        const tslInfo = ' TSL: ' + tsl + '%';
        if (tsl < 0)
            additionalInfo = additionalInfo + chalk.magenta(tslInfo);

        logMessage('debug', `${sideFormated} ${symbolFormated} - ${profitLog} - ${marginLog}${additionalInfo}`);
    }
}
const openPosition = async (signal) =>{
    // CHECK OPENED POSITIONS
    const openedPositions = await getPositions();
    const openedPositionsLength = openedPositions.length;
    const maxOpenedPositions = getConfig('trading.maxOpenPositions');
    if( openedPositionsLength >= maxOpenedPositions ){
        logMessage('info','Za dużo otwartych pozycji');
        return null;
    }
    //CHECKING IS EXISTING
    const existingPosition = openedPositions.find(pos => pos.symbol === signal.symbol);
    if (existingPosition) {
        logMessage('info',`⚠️ Pozycja dla ${signal.symbol} już otwarta!`);
        return null;
    }    
    //TO DO - CHECK OPENED ORDERS
    
    const amount = await calculateOrderSize(signal.symbol); 
    if(!amount){
        logMessage('error','Minimalna ilość zakupu nie wystarczająca.');
        return null;
    }
    const orderType = getConfig('trading.order.type');
    const order = await createOrder(signal.symbol, orderType, signal.side, amount);

    //SET DCA TO 0
    clearDCA(signal.symbol);
    clearTSL(signal.symbol);
    clearTTP(signal.symbol);
    return order;
};
const checkPositions = async () => {
    if (!cachedPositions || cachedPositions.length === 0) {
        logMessage('info', "📌 Brak otwartych pozycji.");
        return;
    }

    for (const position of cachedPositions) {
        logMessage('info',`🔍 Sprawdzam pozycję: ${position.symbol}`);

        // Sprawdzamy, czy należy dokupić (DCA)
        await handleDCA(position, closePosition);

        //Sprawdzamy, czy nie należy zamknąć pozycji na plusie (TP)
        await handleTP(position, closePosition);

        // Sprawdzamy, czy aktywować Trailing Take-Profit (TTP)
        await handleTTP(position, closePosition);

        // Sprawdzamy, czy aktywować Stop Loss (SL)
        await handleSL(position, closePosition);

        // Sprawdzamy, czy aktywować Trailing Stop-Loss (TSL)
        await handleTSL(position, closePosition);
    }
};
const closePosition = async (symbol, side, amount) => {
    try {
        logMessage('info', `🚀 Zamykam pozycję: ${symbol}`);
        const binance = await getInstance();
        const formattedSymbol = formatSymbolForBinance(symbol);
        const opositeSide = side === 'long' ? 'SELL' : 'BUY';

        const closeOrder = await binance.createOrder(formattedSymbol, "MARKET", opositeSide, amount);
        logMessage('debug', `✅ Pozycja ${symbol} zamknięta! (Zlecenie: ${closeOrder.id})`);
        
        clearDCA(symbol);
        clearTSL(symbol);
        clearTTP(symbol);

        return closeOrder;
    } catch (error) {
        logMessage('warn', `❌ Błąd zamykania pozycji dla ${symbol}: ${error.message}`);
        return null;
    }
};

module.exports = {
    initPositions,
    getPositions,
    updatePositions,
    openPosition,
    closePosition
};
