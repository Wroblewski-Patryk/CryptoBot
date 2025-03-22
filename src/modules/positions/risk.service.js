const { getWalletBalance } = require('../wallet/wallet.service');
const { getConfig } = require('../../config/config');
const { getMarketInfo } = require('../markets/markets.service'); // Pobieranie stepSize i minNotional
const { getInstance } = require('../../api/binance.service');
const { logMessage } = require('../../core/logging');

async function calculateOrderSize(symbol) {
    try {
        // 📌 Pobieramy balans portfela
        const baseCurrency = getConfig('trading.baseCurrency') || 'USDT';
        const balance = await getWalletBalance(baseCurrency);
        if (!balance || balance <= 0) {
            throw new Error(`Brak dostępnych środków w ${baseCurrency}`);
        }

        // 📊 Pobieramy konfigurację ryzyka
        const riskConfig = getConfig('trading.risk');
        const riskPerTrade = riskConfig.perTrade / 100; // np. 0% -> 0.1
        const leverage = riskConfig.leverage || 1; // Dźwignia (jeśli stosujemy)

        // 💰 Obliczamy kwotę, jaką możemy użyć
        let positionSize = (balance * riskPerTrade) * leverage;
        if (positionSize > balance) {
            positionSize = balance; // Nie możemy przekroczyć dostępnych środków
        }

        // 📉 Pobieramy ograniczenia rynkowe (minNotional, stepSize)
        const marketInfo = await getMarketInfo(symbol);
        if (!marketInfo) {
            throw new Error(`Nie udało się pobrać danych rynkowych dla ${symbol}`);
        }

        // 🔢 Obliczamy wielkość zlecenia
        const binance = await getInstance();
        const ticker = await binance.fetchTicker(symbol);
        const entryPrice = ticker.last; // Ostatnia cena rynkowa

        let amount = positionSize / entryPrice; // Ilość jednostek do kupna/sprzedaży
        amount = Math.floor(amount / marketInfo.stepSize) * marketInfo.stepSize; // Zaokrąglenie do `stepSize`

        // 🛑 Sprawdzamy, czy spełnia minimalne wymagania giełdy
        if (amount * entryPrice < marketInfo.minNotional) {
            throw new Error(`Minimalna wartość transakcji dla ${symbol} to ${marketInfo.minNotional} USDT`);
        }

        logMessage('info',`📊 Obliczona wielkość pozycji: ${amount} ${symbol} przy cenie ${entryPrice} USDT`);

        return amount;
    } catch (error) {
        logMessage('error',`❌ Błąd w calculateOrderSize: ${error.message}`);
        return null;
    }
}

module.exports = {
    calculateOrderSize
};
