const express = require('express');
const router = express.Router();
const { apiGetPositions, closePosition } = require('../modules/positions/positions.service');

router.get('/', async (req, res) => {
    try {
        const positions = await apiGetPositions();
        res.json(positions || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/close', async (req, res) => {
  const { symbol } = req.body;
  const { side } = req.body;
  const { amount } = req.body;
  if (!symbol || !side || !amount) {
      return res.status(400).json({ error: 'Symbol, side and amount are required' });
  }
  console.log(`Zamykam pozycję ${symbol} ${side} ${amount}`);
  // try {
  //   const result = await closePosition(symbol, side, amount); 
  //   res.status(200).json({ success: true, result });
  // } catch (error) {
  //   console.error('Błąd zamykania pozycji:', error);
  //   res.status(500).json({ success: false, error: error.message });
  // }
});

module.exports = router;