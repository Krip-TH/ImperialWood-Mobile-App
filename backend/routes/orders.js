const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [cartRows] = await connection.execute(
      'SELECT id FROM IW_Carts WHERE user_id = ? LIMIT 1 FOR UPDATE',
      [req.user.id]
    );
    if (!cartRows[0]) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const cartId = cartRows[0].id;
    const [items] = await connection.execute(
      `SELECT ci.product_id, ci.quantity, p.price
       FROM IW_Cart_Items ci
       JOIN IW_Products p ON p.id = ci.product_id
       WHERE ci.cart_id = ?
       FOR UPDATE`,
      [cartId]
    );
    if (items.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    const totalAmount = items.reduce(
      (total, item) => total + Number(item.price) * item.quantity,
      0
    );
    const [orderResult] = await connection.execute(
      `INSERT INTO IW_Orders (user_id, total_amount, status)
       VALUES (?, ?, 'Pending')`,
      [req.user.id, totalAmount]
    );

    for (const item of items) {
      await connection.execute(
        `INSERT INTO IW_Order_Items (order_id, product_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [orderResult.insertId, item.product_id, item.quantity, item.price]
      );
    }

    await connection.execute('DELETE FROM IW_Cart_Items WHERE cart_id = ?', [cartId]);
    await connection.commit();
    return res.status(201).json({
      order: {
        id: String(orderResult.insertId),
        totalAmount,
        status: 'Pending',
      },
    });
  } catch (error) {
    if (connection) await connection.rollback();
    return next(error);
  } finally {
    if (connection) connection.release();
  }
});

router.get('/', async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const params = isAdmin ? [] : [req.user.id];
    const where = isAdmin ? '' : 'WHERE o.user_id = ?';
    const [orders] = await pool.execute(
      `SELECT
         CAST(o.id AS CHAR) AS id,
         CAST(o.user_id AS CHAR) AS user_id,
         o.total_amount,
         o.status,
         o.created_at
       FROM IW_Orders o
       ${where}
       ORDER BY o.created_at DESC`,
      params
    );

    for (const order of orders) {
      const [items] = await pool.execute(
        `SELECT
           CAST(oi.product_id AS CHAR) AS product_id,
           oi.quantity,
           oi.unit_price
         FROM IW_Order_Items oi
         WHERE oi.order_id = ?`,
        [order.id]
      );
      order.items = items;
    }
    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
