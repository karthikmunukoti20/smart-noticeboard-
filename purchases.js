const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// In-memory store for demo mode
let mockPurchases = [];

// @route   POST api/purchases
// @desc    Buy a dataset
// @access  Private (Buyer)
router.post('/', auth, async (req, res) => {
  const { dataset_id, title } = req.body;

  try {
    try {
      // 1. Get dataset price
      const datasetRes = await db.query('SELECT price_cents FROM datasets WHERE id = $1', [dataset_id]);
      if (datasetRes.rows.length === 0) return res.status(404).json({ msg: 'Dataset not found' });
      const amount_cents = datasetRes.rows[0].price_cents;

      // 2. Insert purchase
      const newPurchase = await db.query(
        `INSERT INTO purchases (buyer_id, dataset_id, amount_cents, stripe_payment_id) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [req.user.id, dataset_id, amount_cents, 'mock_txn_' + Date.now()]
      );
      res.json(newPurchase.rows[0]);
    } catch (dbErr) {
      console.log('DB Offline - Saving Purchase to In-Memory store');
      const demoPurchase = {
        id: Math.floor(Math.random() * 9999),
        buyer_id: req.user.id,
        dataset_id,
        title: title || 'Dataset Buy (Demo)',
        created_at: new Date().toISOString()
      };
      mockPurchases.push(demoPurchase);
      res.json(demoPurchase);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/purchases
// @desc    List my purchases
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    try {
      const purchases = await db.query(
        `SELECT p.id, p.amount_cents, p.created_at, d.title, d.category 
         FROM purchases p 
         JOIN datasets d ON p.dataset_id = d.id 
         WHERE p.buyer_id = $1`,
         [req.user.id]
      );
      res.json(purchases.rows);
    } catch (dbErr) {
      console.log('DB Offline - Fetching Purchases from In-Memory store');
      res.json(mockPurchases.filter(p => p.buyer_id === req.user.id));
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
