require('./core/errorHandler');
const bot = require('./core/bot');
const { logMessage } = require('./core/logging');

const link = "https://localhost";
const port = 3000;
const url = link + ':' + port;

async function startBot() {
    bot.listen(port, () => {
        logMessage('debug', `🚀 Bot is running at: \x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\`);
    });
}

startBot();