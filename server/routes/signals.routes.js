const express = require('express');
const router = express.Router();
const { apiGetSignals } = require('../modules/strategies/strategies.service');

// GET /api/positions
router.get('/', async (req, res) => {
    try {
        const signals = await apiGetSignals();
        res.json(signals || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;