const ccxt = require('ccxt');
const { getConfig } = require('../config/config');
const { logMessage } = require('../core/logging');

let binance = null;

// 🔄 Inicjalizacja klienta Binance
const initInstance = async () => {
    try {
        logMessage('info', '🔄 Initializing Binance client...');
        
        binance = new ccxt.binance({
            apiKey: getConfig('BINANCE_API_KEY'),
            secret: getConfig('BINANCE_API_SECRET'),
            options: {
                defaultType: getConfig('trading.marketType') || 'future',  // Pobieranie marketType z konfiguracji
                adjustForTimeDifference: true,  // Automatyczna synchronizacja czasu
            },
            enableRateLimit: true,  // Ograniczenie liczby żądań do API Binance
        });

        // 🛠️ Sprawdzenie połączenia
        const isConnected = await checkConnection();
        if (!isConnected) {
            throw new Error('Binance API is not reachable. Check API keys or network connection.');
        }

        logMessage('info', '✅ Binance client initialized successfully.');

        await syncTime();

        return binance;
    } catch (error) {
        logMessage('error', `❌ Binance initialization failed: ${error.message}`);
        throw error;
    }
};

// 📡 Pobranie istniejącej instancji Binance lub inicjalizacja nowej
const getInstance = () => {
    if (!binance) {
        logMessage('warn', '⚠️ Binance client is not initialized. Creating a new instance...');
        return initInstance();  // Inicjalizacja jeśli nie ma instancji
    }
    return binance;
};

// 🌍 Sprawdzenie połączenia z Binance
const checkConnection = async () => {
    try {
        if (!binance) {
            await initInstance();
        }
        const response = await binance.publicGetPing();
        logMessage('info', `🌐 Binance API connectivity check passed.`);
        return true;
    } catch (error) {
        logMessage('error', `❌ Binance connection check failed: ${error.message}`);
        return false;
    }
};

// 🔄 Synchronizacja czasu z Binance
const syncTime = async () => {
    try {
        if (!binance) await initInstance();
        
        await binance.loadTimeDifference();
        logMessage('info', '⏳ Binance time synchronized successfully.');
    } catch (error) {
        logMessage('error', `❌ Error syncing Binance time: ${error.message}`);
    }
};
const fetchBinanceTime = async () => {
    try {
        const binance = await getInstance(); // Pobiera instancję Binance
        const serverTime = await binance.fetchTime(); // Pobiera czas serwera
        const localTime = Date.now(); // Pobiera czas lokalny

        const delay = localTime - serverTime;
        logMessage('info', `⏳ Binance Server Time: ${new Date(serverTime).toISOString()}`);
        logMessage('info', `⏳ Local Time: ${new Date(localTime).toISOString()}`);
        logMessage('info', `⌛ Time Delay: ${delay} ms`);

        return { serverTime, localTime, delay };
    } catch (error) {
        logMessage('error', `❌ Error fetching Binance server time: ${error.message}`);
        return null;
    }
};

module.exports = {
    initInstance,
    getInstance,
    checkConnection,
    syncTime,
    fetchBinanceTime
};
