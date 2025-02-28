const fs = require('fs');
const path = require('path');
const moment = require('moment');
const chalk = require('chalk');

// 📂 Ścieżka do pliku logów
const LOG_FILE = path.join(__dirname, '../../logs/app.log');

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
    console.log(logType.color(logEntry));

    // 📁 Zapis do pliku
    fs.appendFileSync(LOG_FILE, logEntry + '\n', 'utf8');
};

// 🔹 Ikony dla różnych poziomów logów
const getLogIcon = (level) => {
    switch (level.toLowerCase()) {
        case 'info': return '🟢';
        case 'warn': return '🟡';
        case 'error': return '🔴';
        case 'debug': return '🔵';
        default: return '⚪';
    }
};

// 📌 Eksport funkcji
module.exports = { logMessage };