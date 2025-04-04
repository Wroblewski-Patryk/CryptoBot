const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { logMessage } = require('../core/logging');

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
            logMessage('info', '✅ Konfiguracja załadowana z config.json');
        } else {
            logMessage('warn', '⚠️ Plik config.json nie istnieje! Tworzenie domyślnej konfiguracji...');
            globalConfig = {};
            saveConfig();
        }
    } catch (error) {
        logMessage('error', `❌ Błąd podczas ładowania config.json: ${error.message}`);
        globalConfig = {};
    }
};

// Funkcja zapisująca konfigurację do pliku config.json
const saveConfig = () => {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(globalConfig, null, 2), 'utf8');
        logMessage('info', '✅ Konfiguracja zapisana do config.json');
    } catch (error) {
        logMessage('error', `❌ Błąd podczas zapisywania config.json: ${error.message}`);
    }
};

// Funkcja zwracająca wartość konfiguracji (pierwszeństwo ma .env)
const getConfig = (key) => {
    if (!key || typeof key !== 'string') {
        logMessage('error', `❌ getConfig() otrzymało nieprawidłowy klucz: ${key}`);
        return undefined;
    }

    // Jeśli klucz istnieje w .env, zwróć go jako pierwszeństwo
    if (process.env[key] !== undefined) {
        return process.env[key];
    }

    // Szukaj wartości w config.json
    const keys = key.split('.');
    let value = globalConfig;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return undefined; // Bezpieczny zwrot `undefined` zamiast błędu
        }
    }
    return value;
};

// Funkcja ustawiająca nową wartość konfiguracji
const setConfig = (key, value) => {
    if (!key || typeof key !== 'string') {
        logMessage('error', `❌ setConfig() otrzymało nieprawidłowy klucz: ${key}`);
        return;
    }

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
    fs.watch(CONFIG_FILE, async (event) => {
        if (event === 'change') {
            console.log('♻️ Config file changed, reloading...');
            loadConfig();
        }
    });
};

// Inicjalizacja konfiguracji
loadConfig();
watchConfigChanges();

module.exports = { getConfig, setConfig, reloadConfig: loadConfig };