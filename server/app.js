// app.js
const express = require('express');
const cors = require("cors");
const routes = require('./routes');
const errorMiddleware = require('./core/errorMiddleware');

const { initializeBot } = require('./core/bot');

const app = express();

// Middleware
app.use(cors({
    origin: "http://localhost:3001",
    credentials: true
}));
app.use(express.json());
app.use(errorMiddleware); // Middleware błędów (do GUI)

app.use('/api', routes);

initializeBot();

module.exports = app;
