require('./core/errorHandler');
const bot = require('./core/bot');
const { logMessage } = require('./core/logging');

const { apiGetWallet } = require('./modules/wallet/wallet.service');
const { apiGetPositions } = require('./modules/positions/positions.service');
const { apiGetSignals } = require('./modules/strategies/strategies.service');


const link = "https://localhost";
const port = 3000;
const url = link + ':' + port;

async function startBot() {
    bot.listen(port, () => {
        logMessage('debug', `🚀 Bot is running at: \x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\`);
    });

    bot.get('/', (req, res) => {
        res.send('Hello World!');
    });

    bot.get("/api/positions", async (req, res) => {
        // Tutaj dodaj logikę do pobierania pozycji z bazy danych lub innego źródła
        const positions = await apiGetPositions();
        res.json(positions || []);
    });
    bot.get("/api/sinals", async (req,res) => {
        const signals = await apiGetSignals();
        res.json(signals || []);
    })
    bot.get("/api/wallet", async (req,res) => {
        const wallet = await apiGetWallet();
        res.json(wallet || []);
    })
    
}

startBot();