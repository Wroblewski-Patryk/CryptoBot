const { getInstance } = require('../../api/binance.service');
const { logMessage } = require('../../core/logging');
const { formatSymbol, formatPrice, 
        formatSide } = require('../../core/utils');
const { getConfig } = require('../../config/config');

const { getOrders, createOrder } = require('../orders/orders.service');
const { calculateOrderSize } = require('../risk/risk.service');
const { handleDCA, clearDCA } = require('./dca.service');
const { handleTP } = require('./tp.service');
const { handleTSL, clearTSL } = require('./tsl.service');
const chalk = require('chalk');

let cachedPositions = [];
let lastUpdate = 0;
const POSITION_CACHE_TIME = 10 * 1000; // Cache na 10 sekund

// Pobieranie informacji o otwartych pozycjach
const initPositions = async () => {
    try {
        const binance = await getInstance();
        const accountInfo = await binance.fetchPositions();

        // Filtrowanie tylko aktywnych pozycji
        const activePositions = accountInfo.filter(pos => parseFloat(pos.contracts) !== 0);
        cachedPositions = activePositions.map(position => ({
            symbol: position.symbol,
            margin: parseFloat(position.initialMargin), // Wartość margin
            profit: parseFloat(position.unrealizedPnl), // Zysk/Strata
            amount: parseFloat(position.contracts), // Ilość kontraktów
            side: position.side, // LONG / SHORT
            entryPrice: position.entryPrice,
            markPrice: position.markPrice,
            stopLossPrice: position.stopLossPrice,
            takeProfitPrice: position.takeProfitPrice
        }));

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
    checkPositions();
};

const showPositions = () => {
    console.clear();
    logMessage('debug', `💰 Lista pozycji (${cachedPositions.length}/${getConfig('trading.maxOpenPositions')})`);
    if ( !cachedPositions.length ){
        logMessage('debug', '- Brak otwartych pozycji -');
        return null;
    }
    for (const position of cachedPositions){
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

        logMessage('debug', `${sideFormated} ${symbolFormated} - ${profitLog} - ${marginLog}`);
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
    //CHECK OPENED ORDERS
    // const orders = await getOrders();
    // const openedOrders = orders.length;

    // if( openedPositions + openedOrders >= maxOpenedPositions){
    //     console.log('Za dużo otwartych zleceń');
    //     return null;
    // }

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
    return order;
};
const checkPositions = async () => {
    if (!cachedPositions || cachedPositions.length === 0) {
        logMessage('info', "📌 Brak otwartych pozycji.");
        return;
    }

    for (const position of cachedPositions) {
        logMessage('info',`🔍 Sprawdzam pozycję: ${position.symbol}`);

        // 📊 Sprawdzamy, czy należy dokupić (DCA)
        await handleDCA(position);

        //Sprawdzamy, czy nie należy zamknąć pozycji na plusie
        await handleTP(position);

        // 🚀 Sprawdzamy, czy aktywować Trailing Stop-Loss (TSL)
        await handleTSL(position);
    }
}

module.exports = {
    initPositions,
    getPositions,
    updatePositions,
    openPosition
};
