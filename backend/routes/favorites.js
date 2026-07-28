const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const [favorites] = await pool.execute(
      `SELECT CAST(f.product_id AS CHAR) AS product_id
       FROM IW_Favorites f
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    return res.json({ favorites });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const productId = String(req.body.productId || '').trim();
    if (!productId) return res.status(400).json({ error: 'productId is required.' });

    const [existing] = await pool.execute(
      'SELECT product_id FROM IW_Favorites WHERE user_id = ? AND product_id = ? LIMIT 1',
      [req.user.id, productId]
    );

    if (existing.length > 0) {
      await pool.execute(
        'DELETE FROM IW_Favorites WHERE user_id = ? AND product_id = ?',
        [req.user.id, productId]
      );
      return res.json({ productId, favorite: false });
    }

    await pool.execute(
      'INSERT INTO IW_Favorites (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId]
    );
    return res.status(201).json({ productId, favorite: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
