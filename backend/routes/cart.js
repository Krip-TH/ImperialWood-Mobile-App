const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

async function getOrCreateCart(connection, userId) {
  const [rows] = await connection.execute(
    'SELECT id FROM IW_Carts WHERE user_id = ? LIMIT 1',
    [userId]
  );
  if (rows[0]) return rows[0].id;

  const [result] = await connection.execute(
    'INSERT INTO IW_Carts (user_id) VALUES (?)',
    [userId]
  );
  return result.insertId;
}

router.get('/', async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT CAST(ci.product_id AS CHAR) AS product_id, ci.quantity
       FROM IW_Carts c
       JOIN IW_Cart_Items ci ON ci.cart_id = c.id
       WHERE c.user_id = ?
       ORDER BY ci.product_id`,
      [req.user.id]
    );
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

router.post('/', async (req, res, next) => {
  let connection;
  try {
    const productId = String(req.body.productId || '').trim();
    const quantity = Math.max(1, Number.parseInt(req.body.quantity, 10) || 1);
    if (!productId) return res.status(400).json({ error: 'productId is required.' });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const cartId = await getOrCreateCart(connection, req.user.id);
    await connection.execute(
      `INSERT INTO IW_Cart_Items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
      [cartId, productId, quantity]
    );
    await connection.commit();
    return res.status(201).json({ productId, quantityAdded: quantity });
  } catch (error) {
    if (connection) await connection.rollback();
    return next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.put('/', async (req, res, next) => {
  try {
    const productId = String(req.body.productId || '').trim();
    const quantity = Number.parseInt(req.body.quantity, 10);
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'productId and a positive quantity are required.' });
    }

    const [result] = await pool.execute(
      `UPDATE IW_Cart_Items ci
       JOIN IW_Carts c ON c.id = ci.cart_id
       SET ci.quantity = ?
       WHERE c.user_id = ? AND ci.product_id = ?`,
      [quantity, req.user.id, productId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Cart item not found.' });
    return res.json({ productId, quantity });
  } catch (error) {
    return next(error);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    const productId = String(req.body.productId || '').trim();
    if (!productId) return res.status(400).json({ error: 'productId is required.' });

    await pool.execute(
      `DELETE ci FROM IW_Cart_Items ci
       JOIN IW_Carts c ON c.id = ci.cart_id
       WHERE c.user_id = ? AND ci.product_id = ?`,
      [req.user.id, productId]
    );
    return res.json({ productId, removed: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
