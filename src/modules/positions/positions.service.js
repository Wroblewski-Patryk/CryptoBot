const { getInstance } = require('../../api/binance.service');
const { logMessage } = require('../../core/logging');

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

module.exports = {
    initPositions,
    getPositions,
    updatePositions
};
