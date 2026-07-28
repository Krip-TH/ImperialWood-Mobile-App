const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const [categories] = await pool.execute(
      'SELECT CAST(id AS CHAR) AS id, name FROM IW_Categories ORDER BY name'
    );
    return res.json({ categories });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
