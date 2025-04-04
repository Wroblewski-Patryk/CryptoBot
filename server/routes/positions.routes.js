const express = require('express');
const router = express.Router();
const { apiGetPositions, closePosition } = require('../modules/positions/positions.service');

// GET /api/positions
router.get('/', async (req, res) => {
    try {
        const positions = await apiGetPositions();
        res.json(positions || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;