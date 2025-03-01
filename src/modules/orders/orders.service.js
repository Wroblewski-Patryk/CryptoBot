const { getInstance } = require('../../api/binance.service');
const { logMessage } = require('../logging/logging.service');

// 🔄 Funkcja tworząca zlecenia na Binance
const createOrder = async (symbol, type, side, quantity, price = null) => {
    try {
        const binance = await getInstance();

        let orderParams = {
            symbol: symbol.replace('/', ''), // Konwersja symbolu do Binance
            type: type.toUpperCase(), // market, limit
            side: side.toUpperCase(), // buy/sell
            amount: quantity, // Ilość
        };

        if (type.toLowerCase() === 'limit') {
            if (!price) throw new Error(`❌ Limit order wymaga ceny!`);
            orderParams.price = price;
        }

        logMessage('info', `🚀 Creating ${type.toUpperCase()} order: ${side.toUpperCase()} ${symbol} | Quantity: ${quantity} | Price: ${price || 'MARKET PRICE'}`);

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

module.exports = {
    createOrder,
    cancelOrder,
    getOpenOrders,
    getOrderStatus
};
