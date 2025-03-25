const { getInstance } = require('../../api/binance.service');
const { getConfig } = require('../../config/config');
const { logMessage } = require('../../core/logging');
const { formatSymbolForBinance } = require('../../core/utils');


// 🔄 Funkcja tworząca zlecenia na Binance
const createOrder = async (symbol, type, side, quantity, price = null) => {
    try {
        const binance = await getInstance();

        let orderParams = {
            symbol: symbol, // Konwersja symbolu do Binance
            type: type.toUpperCase(), // market, limit
            side: side.toUpperCase(), // buy/sell
            amount: quantity, // Ilość
        };

        if (type.toLowerCase() === 'limit') {
            if (!price) throw new Error(`❌ Limit order wymaga ceny!`);
            orderParams.price = price;
        }

        await setMarginMode(symbol);

        const leverage = await setLeverage(symbol);
        if ( !leverage ){
            return;
        }

        logMessage('debug', `🚀 Creating ${type.toUpperCase()} order: ${side.toUpperCase()} ${symbol} | Quantity: ${quantity} | Price: ${price || 'MARKET PRICE'}`);

        const order = await binance.createOrder(
            orderParams.symbol,
            orderParams.type,
            orderParams.side,
            orderParams.amount,
            orderParams.price || undefined
        );
        
        logMessage('success', `✅ Order created successfully: ${JSON.stringify(order)}`);
        return order;

    } catch (error) {
        logMessage('error', `❌ Order creation failed: ${error.message}`);
        return null;
    }
};

// ❌ Anulowanie zlecenia
const cancelOrder = async (symbol, orderId) => {
    try {
        const binance = await getInstance();
        await binance.cancelOrder(orderId, symbol);
        logMessage('success', `✅ Order ${orderId} canceled on ${symbol}`);
    } catch (error) {
        logMessage('error', `❌ Error canceling order ${orderId} on ${symbol}: ${error.message}`);
    }
};

// 🔍 Pobieranie statusu otwartych zleceń
const getOpenOrders = async (symbol) => {
    try {
        const binance = await getInstance();
        const orders = await binance.fetchOpenOrders(symbol);
        logMessage('info', `📊 Open orders for ${symbol}: ${JSON.stringify(orders)}`);
        return orders;
    } catch (error) {
        logMessage('error', `❌ Error fetching open orders: ${error.message}`);
        return [];
    }
};

// 🔥 Sprawdzenie statusu zlecenia
const getOrderStatus = async (symbol, orderId) => {
    try {
        const binance = await getInstance();
        const order = await binance.fetchOrder(orderId, symbol);
        logMessage('info', `📌 Order Status for ${symbol} (${orderId}): ${order.status}`);
        return order.status;
    } catch (error) {
        logMessage('error', `❌ Error fetching order status: ${error.message}`);
        return 'UNKNOWN';
    }
};
const getOrders = async () => {
    try {
        const binance = await getInstance();
        const orders = await binance.getOpenOrders();
        logMessage('info', `📌 Orders ${orders}`);
        return orders;
    } catch (error) {
        logMessage('error', `❌ Error fetching order status: ${error.message}`);
        return null;
    }
}
const setMarginMode = async (symbol) => {
    try {
        const binance = await getInstance();
        const mode = getConfig('trading.order.marginMode') || "ISOLATED";
        const symbolFormated = symbol.replace(':USDT', '').replace('/','');

        await binance.fapiPrivatePostMarginType({
            symbol: symbolFormated,
            marginType: mode
        });
        logMessage('info',`✅ Tryb margin dla ${symbol} ustawiony na ${mode}`);
        return true;
    } catch (error) {
        logMessage('error',`❌ Błąd ustawiania margin mode dla ${symbol}: ${error.message}`);
        return false;
    }
}
const setLeverage = async (symbol) => {
    try {
        const leverage = getConfig("trading.risk.leverage") || 15; 
        const currentLeverage = await getLeverage(symbol);
        if (currentLeverage === leverage) {
            logMessage('info', `⚙️ Dźwignia ${leverage}x dla ${symbol} już ustawiona`);
            return true;
        }

        const symbolFormated = symbol.replace(':USDT', '').replace('/','');
        const binance = await getInstance();

        await binance.fapiPrivatePostLeverage({
            symbol: symbolFormated, 
            leverage: leverage
        });

        logMessage('info',`✅ Ustawiono dźwignię ${leverage}x dla ${symbol}`);
        return true;
    } catch (error) {
        logMessage('error',`❌ Błąd ustawiania dźwigni dla ${symbol}: ${error.message}`);
        return false;
    }
}
const getLeverage = async (symbol) => {
    try {
        const symbolFormated = formatSymbolForBinance(symbol);
        const binance = await getInstance();

        const positions = await binance.fapiPrivateGetPositionRisk();

        const position = positions.find(p => p.symbol === symbolFormated);

        if (!position) {
            logMessage('warn', `⚠️ Nie znaleziono pozycji dla ${symbolFormated}`);
            return null;
        }

        const leverage = parseInt(position.leverage, 10);
        logMessage('info', `🔍 Aktualna dźwignia dla ${symbolFormated} to ${leverage}x`);
        return leverage;
    } catch (error) {
        logMessage('error', `❌ Błąd przy pobieraniu dźwigni dla ${symbol}: ${error.message}`);
        return null;
    }
};
module.exports = {
    createOrder,
    cancelOrder,
    getOpenOrders,
    getOrderStatus,
    getOrders
};
