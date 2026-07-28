const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const [products] = await pool.execute(
      `SELECT
         CAST(p.id AS CHAR) AS id,
         p.name,
         COALESCE(c.name, p.category) AS category,
         p.price,
         p.image_url,
         p.item_code,
         p.stock_quantity,
         p.store_availability,
         p.material,
         p.size,
         p.finish,
         p.description,
         CASE
           WHEN p.stock_quantity <= 0 THEN 'Out of Stock'
           WHEN p.stock_quantity <= 5 THEN 'Low Stock'
           ELSE 'Available'
         END AS status
       FROM IW_Products p
       LEFT JOIN IW_Categories c ON c.id = p.category_id
       ORDER BY p.id DESC`
    );
    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
