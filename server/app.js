// app.js
const express = require('express');
const cors = require("cors");
const errorMiddleware = require('./core/errorMiddleware');

const { apiGetWallet } = require('./modules/wallet/wallet.service');
const { apiGetPositions } = require('./modules/positions/positions.service');
const { apiGetSignals } = require('./modules/strategies/strategies.service');
const { apiGetMarkets } = require('./modules/markets/markets.service');

const { initializeBot } = require('./core/bot');

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:3001",
    credentials: true
}));
app.use(express.json());
app.use(errorMiddleware); // Middleware błędów (do GUI)

// Trasy API
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get("/api/positions", async (req, res) => {
    const positions = await apiGetPositions();
    res.json(positions || []);
});

app.get("/api/signals", async (req,res) => {
    const signals = await apiGetSignals();
    res.json(signals || []);
});

app.get("/api/wallet", async (req,res) => {
    const wallet = await apiGetWallet();
    res.json(wallet || []);
});

app.get("/api/markets", async (req,res) => {
    const markets = await apiGetMarkets();
    res.json(markets || []);
});

initializeBot();

module.exports = app;
