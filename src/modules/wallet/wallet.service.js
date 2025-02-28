const { getInstance } = require('../../api/binance.service');
const { logMessage } = require('../logging/logging.service');

let wallet = {};

// 🔄 Pobiera saldo portfela
const initWallet = async () => {
    if (!wallet)
        await updateWallet();
    return wallet;
};
const getWallet = async() => {
    if (!wallet)
        await updateWallet();
    return wallet;
}
const updateWallet = async() => {
    try {
        const binance = await getInstance();
        const accountInfo = await binance.fetchBalance();
        wallet = {
            totalBalance: accountInfo.total.USDT || 0,
            freeBalance: accountInfo.free.USDT || 0,
            usedBalance: accountInfo.used.USDT || 0,
        };

        logMessage('info', `💰 Wallet updated: Total: ${wallet.totalBalance}, Free: ${wallet.freeBalance}, Used: ${wallet.usedBalance}`);
        return wallet;
    } catch (error) {
        logMessage('error', `❌ Error fetching wallet balance: ${error.message}`);
        return null;
    }
}
module.exports = {
    initWallet,
    getWallet,
    updateWallet
};
