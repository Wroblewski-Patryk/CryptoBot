const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');

const ordersRoutes = require('./orders.routes');
const positionsRoutes = require('./positions.routes');
const signalsRoutes = require('./signals.routes');
const walletRoutes = require('./wallet.routes');
const marketsRoutes = require('./markets.routes');

router.use('/auth', authRoutes);

router.use('/orders', ordersRoutes);
router.use('/positions', positionsRoutes);
router.use('/signals', signalsRoutes);
router.use('/wallet', walletRoutes);
router.use('/markets', marketsRoutes);

module.exports = router;