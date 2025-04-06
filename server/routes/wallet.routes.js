const express = require('express');
const router = express.Router();
const { apiGetWallet } = require('../modules/wallet/wallet.service');

router.get('/', async (req, res) => {
    try {
        const wallet = await apiGetWallet();
        res.json(wallet || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;