const fs = require('fs');
const path = require('path');
const moment = require('moment');
const chalk = require('chalk');
//const { getConfig } = require('../core/config');

// 📂 Ścieżka do pliku logów
const LOG_FILE = path.join(__dirname, '../logs/app.log');

// 📌 Funkcja do formatowania czasu
const getTimestamp = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss');
};
const logLevels = {
    info: { icon: '🟢', color: chalk.green },
    warn: { icon: '🟡', color: chalk.yellow },
    error: { icon: '🔴', color: chalk.red },
    debug: { icon: '🔵', color: chalk.blue },
    default: { icon: '⚪', color: chalk.white }
};
// 📝 Główna funkcja logowania
const logMessage = (level, message) => {
    const timestamp = getTimestamp();
    const logType = logLevels[level.toLowerCase()] || logLevels.default;
    const logLevel = level || 'msg';
    const logEntry = `[${timestamp}] ${logType.icon} ${logLevel.toUpperCase()} ${message}`;

    // 🖥️ Logowanie do konsoli
    const logLevelConfig = 'debug';
    if (logLevelConfig === logLevel)
        console.log(logType.color(logEntry));


    // 📁 Zapis do pliku
    fs.appendFileSync(LOG_FILE, logEntry + '\n', 'utf8');
};

// 📌 Eksport funkcji
module.exports = { logMessage };