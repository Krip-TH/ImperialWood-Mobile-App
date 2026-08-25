require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./database');
const { getAuthUser } = require('./auth');
const { uploadProductImage } = require('./githubImages');

const app = express();
const PORT = Number(process.env.PORT || 3117);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function apiError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getOrderSchema(executor) {
  const [rows] = await executor.execute(
    `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE,
            COLUMN_DEFAULT, EXTRA
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('IW_Orders', 'IW_Order_Items')
     ORDER BY TABLE_NAME, ORDINAL_POSITION`
  );
  const tables = new Map([
    ['IW_Orders', new Map()],
    ['IW_Order_Items', new Map()],
  ]);

  for (const row of rows) {
    tables.get(row.TABLE_NAME)?.set(row.COLUMN_NAME, row);
  }
  if (!tables.get('IW_Orders').size || !tables.get('IW_Order_Items').size) {
    throw apiError('The order database tables could not be inspected.', 500);
  }
  return tables;
}

function requireOrderColumn(columns, candidates, tableName) {
  const columnName = candidates.find((candidate) => columns.has(candidate));
  if (!columnName) {
    throw apiError(
      `${tableName} is missing the required ${candidates.join(' or ')} column.`,
      500
    );
  }
  return columnName;
}

function enumValue(column, candidates) {
  const values = [...String(column?.COLUMN_TYPE || '').matchAll(/'((?:[^']|'')*)'/g)]
    .map((match) => match[1].replace(/''/g, "'"));
  if (values.length === 0) return candidates[0];

  for (const candidate of candidates) {
    const exact = values.find((value) => value === candidate);
    if (exact) return exact;
    const caseInsensitive = values.find(
      (value) => value.toLowerCase() === candidate.toLowerCase()
    );
    if (caseInsensitive) return caseInsensitive;
  }
  return values[0];
}

function normalizedOrderStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'processing') return 'packed';
  if (['packed', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    return status;
  }
  return 'confirmed';
}

function databaseOrderStatusCandidates(status) {
  const candidates = {
    confirmed: ['confirmed', 'Pending', 'pending'],
    packed: ['packed', 'Processing', 'processing'],
    shipped: ['shipped', 'Shipped'],
    delivered: ['delivered', 'Delivered'],
    cancelled: ['cancelled', 'Cancelled'],
  };
  return candidates[status] || [status];
}

function logOrderMysqlError(error) {
  console.error('[POST /api/orders] MySQL order creation failed', {
    code: error?.code,
    errno: error?.errno,
    sqlState: error?.sqlState,
    sqlMessage: error?.sqlMessage || error?.message,
  });
}

function isTemporaryImageUrl(value) {
  return /^(blob:|file:|content:|ph:)/i.test(String(value || '').trim());
}

async function requireAuth(req, _res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';

    if (!token) throw apiError('Authentication required.', 401);

    req.accessToken = token;
    req.authUser = await getAuthUser(token);
    next();
  } catch (error) {
    next(error);
  }
}

async function getProfile(req, executor = pool) {
  const [rows] = await executor.execute(
    `SELECT user_id, full_name, username, email, phone, role, created_at
     FROM IW_Users
     WHERE auth_user_id = ?
     LIMIT 1`,
    [req.authUser.id]
  );

  if (!rows[0]) throw apiError('The user profile could not be loaded.', 404);
  return rows[0];
}

async function getCart(req, createIfMissing, executor = pool) {
  const profile = await getProfile(req, executor);
  const [rows] = await executor.execute(
    `SELECT cart_id, cart_status
     FROM IW_Carts
     WHERE user_id = ?
     ORDER BY cart_id DESC
     LIMIT 1`,
    [profile.user_id]
  );
  const cart = rows[0];

  if (cart?.cart_status === 'active') return cart;
  if (!createIfMissing) return null;

  if (cart) {
    await executor.execute(
      `UPDATE IW_Carts
       SET cart_status = 'active'
       WHERE cart_id = ? AND user_id = ?`,
      [cart.cart_id, profile.user_id]
    );
    return { ...cart, cart_status: 'active' };
  }

  const [result] = await executor.execute(
    `INSERT INTO IW_Carts (user_id, cart_status)
     VALUES (?, 'active')`,
    [profile.user_id]
  );
  return { cart_id: result.insertId, cart_status: 'active' };
}

function productPayload(body) {
  const stock = Number(body.total_stock ?? 0);
  const categoryId = Number(body.category_id);
  const price = Number(body.price);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw apiError('A valid category ID is required.', 400);
  }
  if (!Number.isFinite(price) || price < 0) {
    throw apiError('A valid price is required.', 400);
  }
  if (!Number.isFinite(stock) || stock < 0) {
    throw apiError('Stock must be a non-negative number.', 400);
  }

  return {
    ...(body.product_id ? { product_id: String(body.product_id) } : {}),
    item_code: String(body.item_code || ''),
    product_name: String(body.product_name || ''),
    category_id: categoryId,
    material: String(body.material || ''),
    size: String(body.size || ''),
    finish: String(body.finish || ''),
    price,
    total_stock: stock,
    badge_status:
      stock <= 0 ? 'Out of Stock' : stock <= 5 ? 'Low Stock' : 'Available',
    location_text: String(body.location_text || ''),
    description: String(body.description || ''),
    image_url: body.image_url || null,
    product_status: body.product_status || 'active',
  };
}

async function assertProductCategory(categoryId, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT category_id FROM IW_Categories WHERE category_id = ? LIMIT 1',
    [categoryId]
  );
  if (!rows[0]) throw apiError('Product category not found.', 400);
}

function productFromRow(row) {
  const category = row.category_category_id == null
    ? null
    : {
        category_id: row.category_category_id,
        category_name: row.category_category_name,
      };
  const product = { ...row };
  delete product.category_category_id;
  delete product.category_category_name;
  return {
    ...product,
    IW_Categories: category,
    category_name: category?.category_name || '',
  };
}

const PRODUCT_SELECT = `
  SELECT p.*,
         c.category_id AS category_category_id,
         c.category_name AS category_category_name
  FROM IW_Products AS p
  LEFT JOIN IW_Categories AS c ON c.category_id = p.category_id`;

async function selectProduct(productId, executor = pool) {
  const [rows] = await executor.execute(
    `${PRODUCT_SELECT} WHERE p.product_id = ? LIMIT 1`,
    [productId]
  );
  return rows[0] ? productFromRow(rows[0]) : null;
}

async function nextItemCode(executor) {
  const [rows] = await executor.execute(
    `SELECT COALESCE(
       MAX(CAST(SUBSTRING(item_code, 4) AS UNSIGNED)),
       0
     ) AS max_suffix
     FROM IW_Products
     WHERE item_code REGEXP '^IW-[0-9]+$'`
  );
  const nextSuffix = Number(rows[0].max_suffix) + 1;
  return `IW-${String(nextSuffix).padStart(3, '0')}`;
}

function productSlug(productName) {
  return String(productName || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

async function nextProductId(executor, productName) {
  const baseSlug = productSlug(productName);
  const [rows] = await executor.execute(
    `SELECT product_id
     FROM IW_Products
     WHERE product_id = ? OR product_id LIKE ?`,
    [baseSlug, `${baseSlug}-%`]
  );
  const existingIds = new Set(
    rows.map((row) => String(row.product_id).toLowerCase())
  );

  if (!existingIds.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existingIds.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

function storePayload(body) {
  const employees = Number(body.employees);
  const customerSatisfaction = Number(body.customer_satisfaction);

  if (!Number.isInteger(employees) || employees < 0) {
    throw apiError('Employees must be a non-negative integer.', 400);
  }
  if (
    !Number.isFinite(customerSatisfaction) ||
    customerSatisfaction < 0 ||
    customerSatisfaction > 100
  ) {
    throw apiError('Customer satisfaction must be between 0 and 100.', 400);
  }

  return {
    city: String(body.city || ''),
    country: String(body.country || ''),
    employees,
    customer_satisfaction: customerSatisfaction,
    business_days: String(body.business_days || ''),
    opening_time: String(body.opening_time || ''),
    closing_time: String(body.closing_time || ''),
    closed_day: String(body.closed_day || ''),
    timezone: String(body.timezone || ''),
  };
}

async function attachStorePhotos(stores, executor = pool) {
  if (stores.length === 0) return stores;

  const placeholders = stores.map(() => '?').join(', ');
  const [photos] = await executor.execute(
    `SELECT photo_id, store_id, photo_url, sort_order
     FROM IW_Store_Photos
     WHERE store_id IN (${placeholders})
     ORDER BY store_id, sort_order`,
    stores.map((store) => store.store_id)
  );
  const photosByStore = new Map();

  for (const photo of photos) {
    const key = String(photo.store_id);
    const list = photosByStore.get(key) || [];
    const normalized = { ...photo };
    delete normalized.store_id;
    list.push(normalized);
    photosByStore.set(key, list);
  }

  return stores.map((store) => ({
    ...store,
    IW_Store_Photos: photosByStore.get(String(store.store_id)) || [],
  }));
}

async function selectStore(storeId, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT * FROM IW_Stores WHERE store_id = ? LIMIT 1',
    [storeId]
  );
  const stores = await attachStorePhotos(rows, executor);
  return stores[0] || null;
}

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'ImperialWood Backend is running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-test', async (_req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 AS connected');
    res.json({ success: true, connected: rows[0]?.connected === 1 });
  } catch (error) {
    console.error('MySQL connectivity test failed:', error.code || error.message);
    res.status(503).json({ success: false, connected: false });
  }
});

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const role = String(req.body.role || '').trim().toLowerCase();
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!['client', 'admin'].includes(role)) {
    throw apiError('Invalid username or password.', 401);
  }
  if (!username || !password) {
    throw apiError('Invalid username or password.', 401);
  }

  const [rows] = await pool.execute(
    `SELECT user_id, auth_user_id, full_name, username, email, phone, role,
            password_hash, created_at
     FROM IW_Users
     WHERE username = ? AND role = ?
     LIMIT 1`,
    [username, role]
  );
  const profile = rows[0];
  if (!profile?.password_hash || !(await bcrypt.compare(password, profile.password_hash))) {
    throw apiError('Invalid username or password.', 401);
  }

  delete profile.password_hash;
  delete profile.auth_user_id;
  res.json({
    success: true,
    data: {
      token: null,
      user: profile,
    },
  });
}));

app.get('/api/categories', asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT category_id, category_name, category_status
     FROM IW_Categories
     ORDER BY category_name ASC`
  );
  res.json({ success: true, data: rows });
}));

app.get('/api/stores', asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT * FROM IW_Stores
     WHERE store_status = 'active'
     ORDER BY city ASC`
  );
  res.json({ success: true, data: await attachStorePhotos(rows) });
}));

app.put('/api/stores/:id', requireAuth, asyncRoute(async (req, res) => {
  const payload = storePayload(req.body);
  const [result] = await pool.execute(
    `UPDATE IW_Stores
     SET city = ?, country = ?, employees = ?, customer_satisfaction = ?,
         business_days = ?, opening_time = ?, closing_time = ?, closed_day = ?,
         timezone = ?, updated_at = CURRENT_TIMESTAMP
     WHERE store_id = ?`,
    [
      payload.city,
      payload.country,
      payload.employees,
      payload.customer_satisfaction,
      payload.business_days,
      payload.opening_time,
      payload.closing_time,
      payload.closed_day,
      payload.timezone,
      req.params.id,
    ]
  );
  if (result.affectedRows === 0) throw apiError('Store not found.', 404);
  res.json({ success: true, data: await selectStore(req.params.id) });
}));

app.get('/api/products', asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute(
    `${PRODUCT_SELECT}
     WHERE p.product_status = 'active'
     ORDER BY p.item_code ASC`
  );
  res.json({ success: true, data: rows.map(productFromRow) });
}));

app.get('/api/products/:id', asyncRoute(async (req, res) => {
  const product = await selectProduct(req.params.id);
  if (!product) throw apiError('Product not found.', 404);
  res.json({ success: true, data: product });
}));

app.post('/api/products', requireAuth, asyncRoute(async (req, res) => {
  const payload = productPayload(req.body);
  delete payload.product_id;
  delete payload.item_code;
  await assertProductCategory(payload.category_id);
  if (req.body.image_upload) {
    payload.image_url = await uploadProductImage(req.body.image_upload);
  }
  if (isTemporaryImageUrl(payload.image_url)) {
    throw apiError('Product images must use a permanent HTTP(S) URL.', 400);
  }
  const connection = await pool.getConnection();
  const lockName = 'imperialwood_next_item_code';
  let lockAcquired = false;

  try {
    const [lockRows] = await connection.execute(
      'SELECT GET_LOCK(?, 10) AS acquired',
      [lockName]
    );
    lockAcquired = Number(lockRows[0]?.acquired) === 1;
    if (!lockAcquired) {
      throw apiError('Product creation is busy. Please try again.', 503);
    }

    let product;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await connection.beginTransaction();

        // The backend is the source of truth for both create identifiers.
        payload.item_code = await nextItemCode(connection);
        payload.product_id = await nextProductId(
          connection,
          payload.product_name
        );
        const columns = [
          'product_id', 'item_code', 'product_name', 'category_id', 'material',
          'size', 'finish', 'price', 'total_stock', 'badge_status',
          'location_text', 'description', 'image_url', 'product_status',
        ];
        const values = columns.map((column) => payload[column]);
        const placeholders = columns.map(() => '?').join(', ');
        await connection.execute(
          `INSERT INTO IW_Products (${columns.join(', ')}, created_at, updated_at)
           VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          values
        );
        product = await selectProduct(payload.product_id, connection);
        await connection.commit();
        break;
      } catch (error) {
        await connection.rollback();
        if (error.code !== 'ER_DUP_ENTRY' || attempt === 3) throw error;
      }
    }

    res.status(201).json({ success: true, data: product });
  } finally {
    if (lockAcquired) {
      try {
        await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
      } catch (error) {
        console.error('Unable to release product item-code lock:', error.code || error.message);
      }
    }
    connection.release();
  }
}));

app.put('/api/products/:id', requireAuth, asyncRoute(async (req, res) => {
  const payload = productPayload(req.body);
  if (isTemporaryImageUrl(payload.image_url)) {
    const existingProduct = await selectProduct(req.params.id);
    if (!existingProduct) throw apiError('Product not found.', 404);
    payload.image_url = existingProduct.image_url || null;
  }
  await assertProductCategory(payload.category_id);
  const [result] = await pool.execute(
    `UPDATE IW_Products
     SET item_code = ?, product_name = ?, category_id = ?, material = ?,
         size = ?, finish = ?, price = ?, total_stock = ?, badge_status = ?,
         location_text = ?, description = ?, image_url = ?, product_status = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE product_id = ?`,
    [
      payload.item_code,
      payload.product_name,
      payload.category_id,
      payload.material,
      payload.size,
      payload.finish,
      payload.price,
      payload.total_stock,
      payload.badge_status,
      payload.location_text,
      payload.description,
      payload.image_url,
      payload.product_status,
      req.params.id,
    ]
  );
  if (result.affectedRows === 0) throw apiError('Product not found.', 404);
  res.json({ success: true, data: await selectProduct(req.params.id) });
}));

app.delete('/api/products/:id', requireAuth, asyncRoute(async (req, res) => {
  const product = await selectProduct(req.params.id);
  if (!product) throw apiError('Product not found.', 404);
  const [result] = await pool.execute(
    'DELETE FROM IW_Products WHERE product_id = ?',
    [req.params.id]
  );
  if (result.affectedRows === 0) throw apiError('Product not found.', 404);
  res.json({ success: true, data: { product_id: product.product_id } });
}));

app.get('/api/favorites', requireAuth, asyncRoute(async (req, res) => {
  const profile = await getProfile(req);
  const [rows] = await pool.execute(
    `SELECT product_id FROM IW_Favorites
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [profile.user_id]
  );
  res.json({ success: true, data: rows });
}));

app.post('/api/favorites', requireAuth, asyncRoute(async (req, res) => {
  const profile = await getProfile(req);
  const productId = String(req.body.productId || '');
  const [rows] = await pool.execute(
    `SELECT product_id FROM IW_Favorites
     WHERE user_id = ? AND product_id = ?
     LIMIT 1`,
    [profile.user_id, productId]
  );

  if (rows[0]) {
    await pool.execute(
      'DELETE FROM IW_Favorites WHERE user_id = ? AND product_id = ?',
      [profile.user_id, productId]
    );
    return res.json({
      success: true,
      data: { productId, favorite: false },
    });
  }

  await pool.execute(
    `INSERT INTO IW_Favorites (user_id, product_id, created_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)`,
    [profile.user_id, productId]
  );
  return res.json({
    success: true,
    data: { productId, favorite: true },
  });
}));

app.get('/api/cart', requireAuth, asyncRoute(async (req, res) => {
  const cart = await getCart(req, false);
  if (!cart) return res.json({ success: true, data: [] });
  const [rows] = await pool.execute(
    `SELECT product_id, quantity FROM IW_Cart_Items
     WHERE cart_id = ?
     ORDER BY product_id`,
    [cart.cart_id]
  );
  return res.json({ success: true, data: rows });
}));

app.post('/api/cart', requireAuth, asyncRoute(async (req, res) => {
  const cart = await getCart(req, true);
  const productId = String(req.body.productId || '');
  const quantity = Math.max(1, Math.trunc(Number(req.body.quantity || 1)));
  const unitPrice = Number(req.body.unitPrice);
  if (!Number.isFinite(unitPrice)) throw apiError('Invalid unit price.', 400);

  const [rows] = await pool.execute(
    `SELECT quantity FROM IW_Cart_Items
     WHERE cart_id = ? AND product_id = ?
     LIMIT 1`,
    [cart.cart_id, productId]
  );
  const payload = {
    cart_id: cart.cart_id,
    product_id: productId,
    quantity: Number(rows[0]?.quantity || 0) + quantity,
    unit_price: unitPrice,
  };

  if (rows[0]) {
    await pool.execute(
      `UPDATE IW_Cart_Items SET quantity = ?, unit_price = ?
       WHERE cart_id = ? AND product_id = ?`,
      [payload.quantity, unitPrice, cart.cart_id, productId]
    );
  } else {
    await pool.execute(
      `INSERT INTO IW_Cart_Items (cart_id, product_id, quantity, unit_price)
       VALUES (?, ?, ?, ?)`,
      [cart.cart_id, productId, payload.quantity, unitPrice]
    );
  }
  res.json({ success: true, data: payload });
}));

app.put('/api/cart', requireAuth, asyncRoute(async (req, res) => {
  const cart = await getCart(req, true);
  const productId = String(req.body.productId || '');
  const quantity = Number(req.body.quantity);
  const unitPrice = Number(req.body.unitPrice);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw apiError('Quantity must be a positive integer.', 400);
  }
  if (!Number.isFinite(unitPrice)) throw apiError('Invalid unit price.', 400);

  const payload = {
    cart_id: cart.cart_id,
    product_id: productId,
    quantity,
    unit_price: unitPrice,
  };
  const [rows] = await pool.execute(
    `SELECT cart_item_id FROM IW_Cart_Items
     WHERE cart_id = ? AND product_id = ?
     LIMIT 1`,
    [cart.cart_id, productId]
  );

  if (rows[0]) {
    await pool.execute(
      `UPDATE IW_Cart_Items SET quantity = ?, unit_price = ?
       WHERE cart_id = ? AND product_id = ?`,
      [quantity, unitPrice, cart.cart_id, productId]
    );
  } else {
    await pool.execute(
      `INSERT INTO IW_Cart_Items (cart_id, product_id, quantity, unit_price)
       VALUES (?, ?, ?, ?)`,
      [cart.cart_id, productId, quantity, unitPrice]
    );
  }
  res.json({ success: true, data: payload });
}));

app.delete('/api/cart', requireAuth, asyncRoute(async (req, res) => {
  const cart = await getCart(req, false);
  if (!cart) return res.json({ success: true, data: null });
  const productId = String(req.body.productId || '');
  await pool.execute(
    'DELETE FROM IW_Cart_Items WHERE cart_id = ? AND product_id = ?',
    [cart.cart_id, productId]
  );
  return res.json({ success: true, data: null });
}));

app.post('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const connection = await pool.getConnection();
  const orderIdLockName = 'imperialwood_next_order_id';
  const orderItemIdLockName = 'imperialwood_next_order_item_id';
  let orderIdLockAcquired = false;
  let orderItemIdLockAcquired = false;
  let transactionStarted = false;

  try {
    const schema = await getOrderSchema(connection);
    const orderColumns = schema.get('IW_Orders');
    const orderItemColumns = schema.get('IW_Order_Items');
    const orderIdColumn = requireOrderColumn(
      orderColumns,
      ['order_id', 'id'],
      'IW_Orders'
    );
    const orderItemOrderIdColumn = requireOrderColumn(
      orderItemColumns,
      ['order_id'],
      'IW_Order_Items'
    );
    const orderItemIdColumn = ['order_item_id', 'id'].find(
      (columnName) => orderItemColumns.has(columnName)
    );
    const orderStatusColumn = requireOrderColumn(
      orderColumns,
      ['order_status', 'status'],
      'IW_Orders'
    );
    for (const columnName of ['product_id', 'quantity', 'unit_price']) {
      requireOrderColumn(orderItemColumns, [columnName], 'IW_Order_Items');
    }
    const primaryKey = orderColumns.get(orderIdColumn);
    const requiresIntegerOrderId =
      !String(primaryKey.EXTRA || '').includes('auto_increment') &&
      primaryKey.COLUMN_DEFAULT === null &&
      primaryKey.IS_NULLABLE === 'NO' &&
      /^(tinyint|smallint|mediumint|int|bigint)/i.test(primaryKey.COLUMN_TYPE);
    const orderItemPrimaryKey = orderItemIdColumn
      ? orderItemColumns.get(orderItemIdColumn)
      : null;
    const requiresIntegerOrderItemId = Boolean(
      orderItemPrimaryKey &&
      !String(orderItemPrimaryKey.EXTRA || '').includes('auto_increment') &&
      orderItemPrimaryKey.COLUMN_DEFAULT === null &&
      orderItemPrimaryKey.IS_NULLABLE === 'NO' &&
      /^(tinyint|smallint|mediumint|int|bigint)/i.test(
        orderItemPrimaryKey.COLUMN_TYPE
      )
    );

    if (requiresIntegerOrderId) {
      const [lockRows] = await connection.execute(
        'SELECT GET_LOCK(?, 10) AS acquired',
        [orderIdLockName]
      );
      orderIdLockAcquired = Number(lockRows[0]?.acquired) === 1;
      if (!orderIdLockAcquired) {
        throw apiError('Order creation is busy. Please try again.', 503);
      }
    }

    if (requiresIntegerOrderItemId) {
      const [lockRows] = await connection.execute(
        'SELECT GET_LOCK(?, 10) AS acquired',
        [orderItemIdLockName]
      );
      orderItemIdLockAcquired = Number(lockRows[0]?.acquired) === 1;
      if (!orderItemIdLockAcquired) {
        throw apiError('Order creation is busy. Please try again.', 503);
      }
    }

    await connection.beginTransaction();
    transactionStarted = true;
    const profile = await getProfile(req, connection);
    const [cartRows] = await connection.execute(
      `SELECT cart_id FROM IW_Carts
       WHERE user_id = ? AND cart_status = 'active'
       ORDER BY cart_id DESC
       LIMIT 1
       FOR UPDATE`,
      [profile.user_id]
    );
    const cart = cartRows[0];
    if (!cart) throw apiError('Cart is empty', 400);

    const [items] = await connection.execute(
      `SELECT ci.product_id, p.product_name, ci.quantity, ci.unit_price,
              ci.quantity * ci.unit_price AS line_total
       FROM IW_Cart_Items AS ci
       INNER JOIN IW_Products AS p ON p.product_id = ci.product_id
       WHERE ci.cart_id = ?
       FOR UPDATE`,
      [cart.cart_id]
    );
    if (items.length === 0) throw apiError('Cart is empty', 400);

    const subtotal = items.reduce(
      (total, item) => total + Number(item.line_total),
      0
    );
    const shippingFee = 0;
    const totalAmount = subtotal + shippingFee;
    const orderNumber = `IW-${Date.now()}`;
    let storeId = null;

    if (orderColumns.has('store_id')) {
      const [storeRows] = await connection.execute(
        `SELECT store_id FROM IW_Stores
         WHERE store_status = 'active'
         ORDER BY store_id
         LIMIT 1`
      );
      if (!storeRows[0]) throw apiError('No active store is available', 400);
      storeId = storeRows[0].store_id;
    }

    const orderValues = new Map([
      ['user_id', profile.user_id],
      ['total_amount', totalAmount],
      [orderStatusColumn, enumValue(
        orderColumns.get(orderStatusColumn),
        databaseOrderStatusCandidates('confirmed')
      )],
    ]);
    const optionalOrderValues = {
      order_number: orderNumber,
      store_id: storeId,
      order_date: new Date(),
      subtotal,
      shipping_fee: shippingFee,
      payment_method: enumValue(orderColumns.get('payment_method'), [
        'cash_on_delivery',
        'Cash on Delivery',
        'COD',
      ]),
      payment_status: enumValue(orderColumns.get('payment_status'), [
        'pending',
        'Pending',
      ]),
      recipient_name: profile.full_name || profile.username,
      recipient_phone: profile.phone || '',
      shipping_address: 'Store pickup',
      tracking_number: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    for (const [columnName, value] of Object.entries(optionalOrderValues)) {
      if (orderColumns.has(columnName)) orderValues.set(columnName, value);
    }

    let explicitOrderId = null;
    if (requiresIntegerOrderId) {
      const [orderIdRows] = await connection.execute(
        `SELECT COALESCE(MAX(\`${orderIdColumn}\`), 0) + 1 AS next_order_id
         FROM IW_Orders`
      );
      explicitOrderId = Number(orderIdRows[0]?.next_order_id);
      if (!Number.isSafeInteger(explicitOrderId) || explicitOrderId <= 0) {
        throw apiError('The next order ID could not be generated safely.', 500);
      }
      orderValues.set(orderIdColumn, explicitOrderId);
    } else if (
      !String(primaryKey.EXTRA || '').includes('auto_increment') &&
      primaryKey.COLUMN_DEFAULT === null &&
      primaryKey.IS_NULLABLE === 'NO' &&
      /char|text/i.test(primaryKey.COLUMN_TYPE)
    ) {
      explicitOrderId = orderNumber;
      orderValues.set(orderIdColumn, explicitOrderId);
    }

    const missingOrderValues = [...orderColumns.values()]
      .filter((column) =>
        column.IS_NULLABLE === 'NO' &&
        column.COLUMN_DEFAULT === null &&
        !String(column.EXTRA || '').includes('auto_increment') &&
        !orderValues.has(column.COLUMN_NAME)
      )
      .map((column) => column.COLUMN_NAME);
    if (missingOrderValues.length > 0) {
      throw apiError(
        `IW_Orders requires unsupported columns: ${missingOrderValues.join(', ')}.`,
        500
      );
    }

    const orderInsertColumns = [...orderValues.keys()];
    const [orderResult] = await connection.execute(
      `INSERT INTO IW_Orders (${orderInsertColumns.map((name) => `\`${name}\``).join(', ')})
       VALUES (${orderInsertColumns.map(() => '?').join(', ')})`,
      [...orderValues.values()]
    );
    const orderId = explicitOrderId ?? orderResult.insertId;
    if (orderId === undefined || orderId === null || orderId === 0) {
      throw apiError('The new order ID could not be determined.', 500);
    }

    let nextOrderItemId = null;
    if (requiresIntegerOrderItemId) {
      const [orderItemIdRows] = await connection.execute(
        `SELECT COALESCE(MAX(\`${orderItemIdColumn}\`), 0) + 1
                AS next_order_item_id
         FROM IW_Order_Items`
      );
      nextOrderItemId = Number(orderItemIdRows[0]?.next_order_item_id);
      if (!Number.isSafeInteger(nextOrderItemId) || nextOrderItemId <= 0) {
        throw apiError('The next order item ID could not be generated safely.', 500);
      }
    }

    const suppliedItemColumns = new Set([
      orderItemOrderIdColumn,
      'product_id',
      'quantity',
      'unit_price',
      ...(requiresIntegerOrderItemId ? [orderItemIdColumn] : []),
      ...(orderItemColumns.has('product_name') ? ['product_name'] : []),
      ...(orderItemColumns.has('line_total') ? ['line_total'] : []),
    ]);
    const missingItemValues = [...orderItemColumns.values()]
      .filter((column) =>
        column.IS_NULLABLE === 'NO' &&
        column.COLUMN_DEFAULT === null &&
        !String(column.EXTRA || '').includes('auto_increment') &&
        !suppliedItemColumns.has(column.COLUMN_NAME)
      )
      .map((column) => column.COLUMN_NAME);
    if (missingItemValues.length > 0) {
      throw apiError(
        `IW_Order_Items requires unsupported columns: ${missingItemValues.join(', ')}.`,
        500
      );
    }

    for (const item of items) {
      const itemValues = new Map();
      if (requiresIntegerOrderItemId) {
        if (!Number.isSafeInteger(nextOrderItemId)) {
          throw apiError('The next order item ID could not be generated safely.', 500);
        }
        itemValues.set(orderItemIdColumn, nextOrderItemId);
      }
      itemValues.set(orderItemOrderIdColumn, orderId);
      itemValues.set('product_id', item.product_id);
      itemValues.set('quantity', item.quantity);
      itemValues.set('unit_price', item.unit_price);
      if (orderItemColumns.has('product_name')) {
        itemValues.set('product_name', item.product_name);
      }
      if (orderItemColumns.has('line_total')) {
        itemValues.set('line_total', item.line_total);
      }
      const itemInsertColumns = [...itemValues.keys()];
      await connection.execute(
        `INSERT INTO IW_Order_Items (${itemInsertColumns.map((name) => `\`${name}\``).join(', ')})
         VALUES (${itemInsertColumns.map(() => '?').join(', ')})`,
        [...itemValues.values()]
      );
      if (requiresIntegerOrderItemId) nextOrderItemId += 1;
    }

    await connection.execute('DELETE FROM IW_Cart_Items WHERE cart_id = ?', [cart.cart_id]);
    await connection.execute(
      `UPDATE IW_Carts SET cart_status = 'ordered' WHERE cart_id = ?`,
      [cart.cart_id]
    );
    const createdAtColumn = orderColumns.has('created_at')
      ? 'created_at'
      : orderColumns.has('order_date')
        ? 'order_date'
        : null;
    let createdAt = new Date();
    if (createdAtColumn) {
      const [createdRows] = await connection.execute(
        `SELECT \`${createdAtColumn}\` AS created_at
         FROM IW_Orders WHERE \`${orderIdColumn}\` = ? LIMIT 1`,
        [orderId]
      );
      createdAt = createdRows[0]?.created_at || createdAt;
    }
    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        id: orderId,
        order_number: orderNumber,
        user_id: profile.user_id,
        total_amount: totalAmount,
        order_status: normalizedOrderStatus(orderValues.get(orderStatusColumn)),
        created_at: createdAt,
        items,
      },
    });
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    logOrderMysqlError(error);
    if (Number(error.status) && Number(error.status) < 500) throw error;
    const orderError = apiError(
      error.code === 'ER_BAD_FIELD_ERROR'
        ? 'The order database columns do not match the backend order configuration.'
        : error.code === 'ER_NO_DEFAULT_FOR_FIELD'
          ? 'The order database requires a value that the backend could not supply.'
          : 'The order could not be created. Check the backend terminal for the MySQL error.',
      500
    );
    orderError.expose = true;
    throw orderError;
  } finally {
    if (orderItemIdLockAcquired) {
      try {
        await connection.execute('SELECT RELEASE_LOCK(?)', [orderItemIdLockName]);
      } catch (error) {
        console.error('[POST /api/orders] MySQL order item ID lock release failed', {
          code: error?.code,
          sqlMessage: error?.sqlMessage || error?.message,
        });
      }
    }
    if (orderIdLockAcquired) {
      try {
        await connection.execute('SELECT RELEASE_LOCK(?)', [orderIdLockName]);
      } catch (error) {
        console.error('[POST /api/orders] MySQL order ID lock release failed', {
          code: error?.code,
          sqlMessage: error?.sqlMessage || error?.message,
        });
      }
    }
    connection.release();
  }
}));

app.get('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const profile = await getProfile(req);
  const schema = await getOrderSchema(pool);
  const orderColumns = schema.get('IW_Orders');
  const orderItemColumns = schema.get('IW_Order_Items');
  const orderIdColumn = requireOrderColumn(
    orderColumns,
    ['order_id', 'id'],
    'IW_Orders'
  );
  const orderStatusColumn = requireOrderColumn(
    orderColumns,
    ['order_status', 'status'],
    'IW_Orders'
  );
  const createdAtColumn = orderColumns.has('created_at')
    ? 'created_at'
    : requireOrderColumn(orderColumns, ['order_date'], 'IW_Orders');
  const params = [];
  let sql = `
    SELECT \`${orderIdColumn}\` AS order_id, user_id, total_amount,
           \`${orderStatusColumn}\` AS order_status,
           \`${createdAtColumn}\` AS created_at
    FROM IW_Orders`;
  if (profile.role !== 'admin') {
    sql += ' WHERE user_id = ?';
    params.push(profile.user_id);
  }
  sql += ` ORDER BY \`${createdAtColumn}\` DESC`;

  const [orders] = await pool.execute(sql, params);
  if (orders.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const placeholders = orders.map(() => '?').join(', ');
  const orderItemIdExpression = orderItemColumns.has('order_item_id')
    ? 'oi.order_item_id'
    : orderItemColumns.has('id')
      ? 'oi.id'
      : 'NULL';
  const productNameExpression = orderItemColumns.has('product_name')
    ? 'oi.product_name'
    : 'p.product_name';
  const lineTotalExpression = orderItemColumns.has('line_total')
    ? 'oi.line_total'
    : 'oi.quantity * oi.unit_price';
  const productJoin = orderItemColumns.has('product_name')
    ? ''
    : 'INNER JOIN IW_Products AS p ON p.product_id = oi.product_id';
  const [items] = await pool.execute(
    `SELECT ${orderItemIdExpression} AS order_item_id,
            oi.order_id, oi.product_id,
            ${productNameExpression} AS product_name,
            oi.quantity, oi.unit_price,
            ${lineTotalExpression} AS line_total
     FROM IW_Order_Items AS oi
     ${productJoin}
     WHERE oi.order_id IN (${placeholders})
     ORDER BY oi.order_id, order_item_id`,
    orders.map((order) => order.order_id)
  );
  const itemsByOrder = new Map();

  for (const item of items) {
    const key = String(item.order_id);
    const list = itemsByOrder.get(key) || [];
    const normalized = { ...item };
    delete normalized.order_id;
    list.push(normalized);
    itemsByOrder.set(key, list);
  }

  res.json({
    success: true,
    data: orders.map((order) => ({
      ...order,
      order_status: normalizedOrderStatus(order.order_status),
      IW_Order_Items: itemsByOrder.get(String(order.order_id)) || [],
    })),
  });
}));

app.put('/api/orders/:id/status', requireAuth, asyncRoute(async (req, res) => {
  const profile = await getProfile(req);
  if (profile.role !== 'admin') throw apiError('Admin access required.', 403);

  const allowedStatuses = [
    'confirmed',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
  ];
  const orderStatus = String(req.body.orderStatus || '');
  if (!allowedStatuses.includes(orderStatus)) {
    throw apiError('Invalid order status.', 400);
  }

  const schema = await getOrderSchema(pool);
  const orderColumns = schema.get('IW_Orders');
  const orderIdColumn = requireOrderColumn(
    orderColumns,
    ['order_id', 'id'],
    'IW_Orders'
  );
  const orderStatusColumn = requireOrderColumn(
    orderColumns,
    ['order_status', 'status'],
    'IW_Orders'
  );
  const databaseOrderStatus = enumValue(
    orderColumns.get(orderStatusColumn),
    databaseOrderStatusCandidates(orderStatus)
  );
  const updatedAtSql = orderColumns.has('updated_at')
    ? ', updated_at = CURRENT_TIMESTAMP'
    : '';

  const [result] = await pool.execute(
    `UPDATE IW_Orders
     SET \`${orderStatusColumn}\` = ?${updatedAtSql}
     WHERE \`${orderIdColumn}\` = ?`,
    [databaseOrderStatus, req.params.id]
  );
  if (result.affectedRows === 0) throw apiError('Order not found.', 404);
  const [rows] = await pool.execute(
    `SELECT \`${orderIdColumn}\` AS order_id,
            \`${orderStatusColumn}\` AS order_status
     FROM IW_Orders
     WHERE \`${orderIdColumn}\` = ? LIMIT 1`,
    [req.params.id]
  );
  res.json({
    success: true,
    data: {
      ...rows[0],
      order_status: normalizedOrderStatus(rows[0].order_status),
    },
  });
}));

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'A record with the same unique value already exists.',
    });
  }
  if (
    error.code === 'ER_NO_REFERENCED_ROW_2' ||
    error.code === 'ER_ROW_IS_REFERENCED_2'
  ) {
    return res.status(400).json({
      success: false,
      error: 'This operation conflicts with related database records.',
    });
  }

  const status = Number(error.status) || 500;
  res.status(status).json({
    success: false,
    error: status >= 500 && !error.expose
      ? 'Internal server error.'
      : error.message || 'The request failed.',
  });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ImperialWood MySQL API listening on port ${PORT}`);
  });
}

module.exports = app;
