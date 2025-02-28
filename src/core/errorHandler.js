const { logMessage } = require('../modules/logging/logging.service');

process.on('uncaughtException', (error) => {
    logMessage('error', `🔥 Uncaught Exception: ${error.stack || error.message}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logMessage('error', `⚠️ Unhandled Promise Rejection: ${reason}`);
});