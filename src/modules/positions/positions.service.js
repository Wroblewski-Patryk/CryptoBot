const { getInstance } = require('../../api/binance.service');
const { logMessage } = require('../../core/logging');
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
            side: position.side // LONG / SHORT
        }));

        lastUpdate = Date.now();
        logMessage('info', `📊 Positions updated successfully (${cachedPositions.length} open positions).`);
        
        showPositions();
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
};

const showPositions = () => {
    logMessage('debug', '💰 Lista pozycji');
    for (const position of cachedPositions){
        const symbol = position.symbol;
        const margin = position.margin;
        const profit = position.profit
        const amount = position.amount;
        const side = position.side;

        const symbolFormated = symbol.replace(/\/.*/, '');
        const marginFormated = margin.toFixed(2) + '💲';
        const profitPercent = (profit/margin*100);
        const sideFormated = side.toUpperCase();
        const symbolUp = "📈";
        const symbolDown = "📉";
        const sideSymbol = side === 'short' ? symbolDown : symbolUp;

        let sideLog = '[' + sideSymbol + ' ' + sideFormated + ']';
        sideLog = side === 'short' ? chalk.red(sideLog) : chalk.green(sideLog);
        const symbolLog = symbolFormated;
        const marginLog = chalk.white('Margin: ' + marginFormated);
        let profitLog = 'Profit: ' + profitPercent.toFixed(2)+'%';
        profitLog = profitPercent > 0 ? chalk.green(profitLog) : chalk.red(profitLog);

        logMessage('debug', `${sideLog} ${symbolLog} - ${profitLog} - ${marginLog}`);
    }
}
module.exports = {
    initPositions,
    getPositions,
    updatePositions
};
