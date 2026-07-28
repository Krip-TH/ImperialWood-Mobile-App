require('dotenv').config();

const express = require('express');
const cors = require('cors');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured.');
}

const pool = require('./config/database');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const storeRoutes = require('./routes/stores');
const favoriteRoutes = require('./routes/favorites');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
const port = Number(process.env.PORT || 3053);
const corsOptions = {
  origin: process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN
    ? '*'
    : process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.disable('x-powered-by');
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res, next) => {
  try {
    await pool.execute('SELECT 1');
    return res.json({ status: 'ok' });
  } catch (error) {
    return next(error);
  }
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || 500;
  return res.status(status).json({
    error: status === 500 ? 'Internal server error.' : error.message,
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`ImperialWood API listening on port ${port}`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
