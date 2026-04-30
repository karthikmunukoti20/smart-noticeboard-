const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

// In-memory store for demo mode (when DB is down)
let mockDatasets = [
  { id: 101, title: 'Global Finance Metadata', category: 'Finance', price_cents: 120000, status: 'pending_staff', seller_id: 1, seller_email: 'seller@example.com' }
];

// @route   POST api/datasets
// @desc    Create a dataset listing (Sets to pending for approval)
// @access  Private (Seller only)
router.post('/', auth, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ msg: 'Not authorized for this deployment' });
  }

  const { title, description, category, price_cents, tags, file_format } = req.body;
  const fileInfo = req.file;

  try {
    // --- START DEMO BYPASS ---
    const demoEntry = {
      id: Math.floor(Math.random() * 10000),
      seller_id: req.user.id,
      seller_email: req.user.email,
      title,
      description,
      category,
      price_cents,
      file_format: file_format || 'PDF',
      status: 'pending_staff'
    };
    
    try {
      const newDataset = await db.query(
        `INSERT INTO datasets (seller_id, title, description, category, price_cents, tags, file_format, file_size_bytes, download_url, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_staff') RETURNING *`,
        [
          req.user.id, title, description, category || 'General', price_cents || 0, tags ? tags.split(',') : [],
          file_format || (fileInfo ? fileInfo.mimetype : 'unknown'),
          fileInfo ? fileInfo.size : 0, fileInfo ? fileInfo.path : null
        ]
      );
      res.json(newDataset.rows[0]);
    } catch (dbErr) {
      console.log('DB Offline - Saving to In-Memory Store');
      mockDatasets.push(demoEntry);
      res.json(demoEntry);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/datasets
// @desc    Get all active/approved datasets (Public Browse)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const query = req.query.q || '';
    const datasetsResult = await db.query(
      `SELECT d.id, d.title, d.description, d.price_cents, d.category, u.company_name as seller_name 
       FROM datasets d 
       JOIN users u ON d.seller_id = u.id 
       WHERE d.status = 'active' AND (d.title ILIKE $1 OR d.description ILIKE $1)`,
      [`%${query}%`]
    );
    res.json(datasetsResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/datasets/pending
// @desc    Get all pending datasets for approval
// @access  Private (Staff/Admin)
router.get('/pending', auth, async (req, res) => {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized' });
  }
  try {
    try {
      const datasets = await db.query(
        `SELECT d.*, u.email as seller_email FROM datasets d JOIN users u ON d.seller_id = u.id WHERE d.status = $1 OR ($2 = 'admin' AND d.status = 'pending_staff')`,
        [req.user.role === 'admin' ? 'pending_admin' : 'pending_staff', req.user.role]
      );
      res.json(datasets.rows);
    } catch (dbErr) {
      console.log('DB Offline - Fetching from In-Memory Pending Queue (Admin inclusive)');
      if (req.user.role === 'admin') {
        // Admin sees both stages
        res.json(mockDatasets.filter(d => d.status === 'pending_staff' || d.status === 'pending_admin'));
      } else {
        // Staff only sees staff stage
        res.json(mockDatasets.filter(d => d.status === 'pending_staff'));
      }
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/datasets/:id/approve
// @desc    Approve a dataset
// @access  Private (Staff/Admin)
router.post('/:id/approve', auth, async (req, res) => {
  if (req.user.role !== 'staff' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized' });
  }
  try {
    const targetStatus = req.user.role === 'admin' ? 'active' : 'pending_admin';
    try {
      await db.query(`UPDATE datasets SET status = $1 WHERE id = $2`, [targetStatus, req.params.id]);
      res.json({ msg: `Dataset moved to ${targetStatus}` });
    } catch (dbErr) {
      console.log('DB Offline - Updating In-Memory Store');
      const index = mockDatasets.findIndex(d => d.id == req.params.id);
      if (index !== -1) mockDatasets[index].status = targetStatus;
      res.json({ msg: `[Demo] Dataset moved to ${targetStatus}` });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/datasets/all
// @desc    Get all datasets regardless of status (Admin view)
// @access  Private (Admin only)
router.get('/admin/all', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized' });
  }
  try {
    try {
      const datasets = await db.query(
        `SELECT d.*, u.email as seller_email FROM datasets d JOIN users u ON d.seller_id = u.id`
      );
      res.json(datasets.rows);
    } catch (dbErr) {
      console.log('DB Offline - Admin fetching from In-Memory store');
      res.json(mockDatasets);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/datasets/my
// @desc    Get datasets owned by the seller
// @access  Private (Seller/Admin)
router.get('/my/listings', auth, async (req, res) => {
  try {
    try {
      const datasets = await db.query(
        `SELECT * FROM datasets WHERE seller_id = $1`, [req.user.id]
      );
      res.json(datasets.rows);
    } catch (dbErr) {
      console.log('DB Offline - Fetching from In-Memory My Listings');
      res.json(mockDatasets.filter(d => d.seller_id === req.user.id));
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/datasets/:id
router.get('/:id', async (req, res) => {
  try {
    const dbRes = await db.query(
      `SELECT d.*, u.company_name as seller_name FROM datasets d JOIN users u ON d.seller_id = u.id WHERE d.id = $1`, 
      [req.params.id]
    );
    if(dbRes.rows.length === 0) return res.status(404).json({ msg: 'Dataset not found' });
    res.json(dbRes.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/datasets/:id
// @desc    Delete a dataset (Admin only)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Not authorized' });
  }
  try {
    try {
      await db.query('DELETE FROM datasets WHERE id = $1', [req.params.id]);
      res.json({ msg: 'Dataset removed from cluster' });
    } catch (dbErr) {
      console.log('DB Offline - Deleting from In-Memory store');
      mockDatasets = mockDatasets.filter(d => d.id != req.params.id);
      res.json({ msg: '[Demo] Dataset removed' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
