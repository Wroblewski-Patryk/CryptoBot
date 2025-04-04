const { logMessage } = require('./logging');

const errorMiddleware = (err, req, res, next) => {
    logMessage('error', `🚨 API Error: ${err.message}`);
    res.status(500).json({ error: err.message });
};

module.exports = errorMiddleware;