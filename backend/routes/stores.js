const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const [stores] = await pool.execute(
      `SELECT
         CAST(id AS CHAR) AS id, city, country, employees, items, orders, refunds,
         most_sold_product, popular_category, satisfaction, business_days,
         opening_time, closing_time, closed_day, timezone, images
       FROM IW_Stores
       ORDER BY city`
    );

    return res.json({
      stores: stores.map((store) => ({
        ...store,
        images: typeof store.images === 'string'
          ? (() => { try { return JSON.parse(store.images); } catch { return []; } })()
          : (store.images || []),
      })),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
