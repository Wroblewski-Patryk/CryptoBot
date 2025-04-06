const { getInstance } = require('../../api/binance.service');
const { getConfig } = require('../../core/config');
const { logMessage } = require('../../core/logging');
const { formatSymbolForBinance } = require('../../core/utils');
const { getMarkets } = require('../markets/markets.service');

let orders = [];
let updateLastTime = 0;
const updateTime = getConfig('loops.orders') * 60000;

const updateOrders = async () => {
    try {
        orders.length = 0;
        const binance = await getInstance();
        const markets = await getMarkets();
        for (const market of markets) {
            const symbol = market.symbol;
            const openOrders = await binance.fetchOpenOrders(symbol);
            if (openOrders && openOrders.length > 0) {
                for (const order of openOrders) {
                    orders.push({
                        symbol: symbol,
                        status: order.status,
                        type: order.type,
                        side: order.side,
                        amount: order.amount,
                        id: order.id, // 💡 warto dodać identyfikator zlecenia
                        price: order.price,
                        filled: order.filled,
                        remaining: order.remaining,
                        datetime: order.datetime,
                    });
                }
            }
        }
        updateLastTime = Date.now();
        logMessage('info', `📌 Orders updated successfully ${orders.length} open orders`);
        return orders;
    } catch (error) {
        logMessage('error', `❌ Error fetching order status: ${error.message}`);
        return null;
    }
}
const getOrders = async () => {
    if (orders.length > 0 && Date.now() - updateLastTime < updateTime) {
        logMessage('info', `♻️ Returning cached orders.`);
        return orders;
    }
    return await updateOrders();
}
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
const apiGetOrders = async () => {
    logMessage('info', `📤 API: Returning ${orders.length} cached open orders`);
    return [...orders]; 
};
module.exports = {
    updateOrders,
    getOrders,
    createOrder,

    apiGetOrders
};
