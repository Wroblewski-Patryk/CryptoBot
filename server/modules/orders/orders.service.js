const { getInstance } = require('../../api/binance.service');
const { getConfig } = require('../../core/config');
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

        const leverage = getConfig("trading.risk.leverage") || 15; 
        for (let i = leverage; i >= 7; i--) {
            const leverageSet = await setLeverage(symbol, i);
            if ( !leverageSet ) continue;
            else break;
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
        const symbolFormated = formatSymbolForBinance(symbol);

        await binance.fapiPrivatePostMarginType({
            symbol: symbolFormated,
            marginType: mode
        });
        logMessage('info',`✅ Tryb margin dla ${symbol} ustawiony na ${mode}`);
        return true;
    } catch (error) {
        if (error?.message?.includes("No need to change margin type")) {
            logMessage('info', `ℹ️ Margin mode dla ${symbol} już ustawiony`);
            return true;
        }

        logMessage('error',`❌ Błąd ustawiania margin mode dla ${symbol}: ${error.message}`);
        return false;
    }
}
const setLeverage = async (symbol, leverage) => {
    try {
        const symbolFormated = formatSymbolForBinance(symbol);
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
module.exports = {
    createOrder,
    cancelOrder,
    getOpenOrders,
    getOrderStatus,
    getOrders
};
