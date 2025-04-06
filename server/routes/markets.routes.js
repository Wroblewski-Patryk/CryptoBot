const express = require('express');
const router = express.Router();

const { apiGetMarkets } = require('../modules/markets/markets.service');

router.get('/', async (req, res) => {
    try {
        const markets = await apiGetMarkets();
        res.json(markets || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;