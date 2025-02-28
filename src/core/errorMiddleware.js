const { logMessage } = require('../modules/logging/logging.service');

const errorMiddleware = (err, req, res, next) => {
    logMessage('error', `🚨 API Error: ${err.message}`);
    res.status(500).json({ error: err.message });
};

module.exports = errorMiddleware;