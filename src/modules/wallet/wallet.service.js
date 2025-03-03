const { getInstance } = require('../../api/binance.service');
const { logMessage } = require('../../core/logging');

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
const getWalletBalance = async (asset = "USDT") => {
    try {
        // Jeśli wallet jest pusty, odświeżamy
        if (!wallet || Object.keys(wallet).length === 0) {
            await updateWallet();
        }

        // Pobieramy saldo dla wybranego aktywa
        const balance = wallet.freeBalance || 0;
        logMessage('info',`💰 Saldo dla ${asset}: ${balance}`);

        return balance;
    } catch (error) {
        logMessage('error',`❌ Błąd w getWalletBalance: ${error.message}`);
        return 0; // Zwracamy 0 zamiast błędu
    }
};

module.exports = {
    initWallet,
    getWallet,
    updateWallet,
    getWalletBalance
};
