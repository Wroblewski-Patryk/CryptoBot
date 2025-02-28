require('./core/errorHandler');
const bot = require('./core/bot');
const { logMessage } = require('./modules/logging/logging.service');

const link = "https://localhost";
const port = 3000;
const url = link + port;

async function startBot() {
    bot.listen(port, () => {
        logMessage('info', `🚀 Bot is running at: \x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\`);
    });
}

startBot();