const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const { logMessage } = require('../modules/logging/logging.service');

// Ścieżki do plików konfiguracyjnych
const ENV_FILE = path.resolve(__dirname, '../.env');
const CONFIG_FILE = path.resolve(__dirname, '../config.json');

// Wczytaj zmienne środowiskowe z pliku .env
dotenv.config({ path: ENV_FILE });

let globalConfig = {};

// Funkcja ładująca konfigurację z config.json
const loadConfig = () => {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const fileData = fs.readFileSync(CONFIG_FILE, 'utf8');
            globalConfig = JSON.parse(fileData);
            logMessage('info','✅ Konfiguracja załadowana z config.json');
        } else {
            logMessage('warn','⚠️ Plik config.json nie istnieje! Tworzenie domyślnej konfiguracji...');
            globalConfig = {};
            saveConfig();
        }
    } catch (error) {
        logMessage('error', '❌ Błąd podczas ładowania config.json:'+error )
        console.error();
        globalConfig = {};
    }
};

// Funkcja zapisująca konfigurację do pliku config.json
const saveConfig = () => {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(globalConfig, null, 2), 'utf8');
        logMessage('info', '✅ Konfiguracja zapisana do config.json');
    } catch (error) {
        logMessage('error', '❌ Błąd podczas zapisywania config.json:', error);
    }
};

// Funkcja zwracająca wartość konfiguracji
const getConfig = (key) => {
    const keys = key.split('.');
    let value = process.env[key] || globalConfig;
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        }
    }
    return value;
};

// Funkcja ustawiająca nową wartość konfiguracji
const setConfig = (key, value) => {
    const keys = key.split('.');
    let config = globalConfig;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in config)) {
            config[keys[i]] = {};
        }
        config = config[keys[i]];
    }
    config[keys[keys.length - 1]] = value;
    saveConfig();
};

// Dynamiczne śledzenie zmian w config.json
const watchConfigChanges = () => {
    fs.watch(CONFIG_FILE, (event) => {
        if (event === 'change') {
            logMessage('info', '♻️ Detekcja zmiany w config.json, przeładowanie...')
            loadConfig();
        }
    });
};

loadConfig(); // Inicjalizacja konfiguracji
watchConfigChanges(); // Start śledzenia zmian

module.exports = { getConfig, setConfig, reloadConfig: loadConfig };
