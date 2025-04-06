const express = require('express');
const router = express.Router();

const { apiGetOrders } = require('../modules/orders/orders.service');

router.get('/', async (req, res) => {
    try {
        const orders = await apiGetOrders();
        res.json(orders || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;