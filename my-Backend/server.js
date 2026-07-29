require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3117;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured.');
}

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const publicDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function authenticatedDb(token) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function apiError(message, status = 500, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

function assertSupabase(error, fallbackMessage) {
  if (error) {
    throw apiError(error.message || fallbackMessage, error.status || 500, error);
  }
}

async function requireAuth(req, _res, next) {
  try {
    const authorization = req.headers.authorization || '';
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice(7).trim()
      : '';

    if (!token) throw apiError('Authentication required.', 401);

    const db = authenticatedDb(token);
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) {
      throw apiError(error?.message || 'Invalid authentication token.', 401, error);
    }

    req.accessToken = token;
    req.authUser = data.user;
    req.db = db;
    next();
  } catch (error) {
    next(error);
  }
}

async function getProfile(req) {
  const { data, error } = await req.db
    .from('IW_Users')
    .select('user_id, full_name, username, email, phone, role, created_at')
    .eq('auth_user_id', req.authUser.id)
    .single();

  assertSupabase(error, 'The user profile could not be loaded.');
  return data;
}

async function getCart(req, createIfMissing) {
  const profile = await getProfile(req);
  const { data: cart, error: cartError } = await req.db
    .from('IW_Carts')
    .select('cart_id, cart_status')
    .eq('user_id', profile.user_id)
    .maybeSingle();

  assertSupabase(cartError, 'The cart could not be loaded.');
  if (cart?.cart_status === 'active') return cart;
  if (!createIfMissing) return null;

  if (cart) {
    const { error } = await req.db
      .from('IW_Carts')
      .update({ cart_status: 'active' })
      .eq('cart_id', cart.cart_id)
      .eq('user_id', profile.user_id);
    assertSupabase(error, 'The cart could not be activated.');
    return { ...cart, cart_status: 'active' };
  }

  const { data: created, error } = await req.db
    .from('IW_Carts')
    .insert({ user_id: profile.user_id, cart_status: 'active' })
    .select('cart_id, cart_status')
    .single();

  assertSupabase(error, 'The cart could not be created.');
  return created;
}

function productPayload(body) {
  const stock = Number(body.total_stock ?? 0);
  return {
    ...(body.product_id ? { product_id: String(body.product_id) } : {}),
    item_code: String(body.item_code || ''),
    product_name: String(body.product_name || ''),
    category_id: Number(body.category_id),
    material: String(body.material || ''),
    size: String(body.size || ''),
    finish: String(body.finish || ''),
    price: Number(body.price),
    total_stock: stock,
    badge_status:
      stock <= 0 ? 'Out of Stock' : stock <= 5 ? 'Low Stock' : 'Available',
    location_text: String(body.location_text || ''),
    description: String(body.description || ''),
    image_url: body.image_url || null,
    product_status: body.product_status || 'active',
    updated_at: new Date().toISOString(),
  };
}

function withCategory(row) {
  const relation = Array.isArray(row.IW_Categories)
    ? row.IW_Categories[0]
    : row.IW_Categories;
  return {
    ...row,
    category_name: relation?.category_name || '',
  };
}

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'ImperialWood Backend is running' });
});

app.get('/api/categories', asyncRoute(async (_req, res) => {
  const { data, error } = await publicDb
    .from('IW_Categories')
    .select('category_id, category_name, category_status')
    .order('category_name', { ascending: true });
  assertSupabase(error, 'Categories could not be loaded.');
  res.json({ success: true, data: data || [] });
}));

app.get('/api/stores', asyncRoute(async (_req, res) => {
  const { data, error } = await publicDb
    .from('IW_Stores')
    .select(`
      *,
      IW_Store_Photos!IW_Store_Photos_store_id_fkey (
        photo_id,
        photo_url,
        sort_order
      )
    `)
    .eq('store_status', 'active')
    .order('city');
  assertSupabase(error, 'Stores could not be loaded.');
  res.json({ success: true, data: data || [] });
}));

app.get('/api/products', asyncRoute(async (_req, res) => {
  const { data, error } = await publicDb
    .from('IW_Products')
    .select(`
      *,
      IW_Categories!IW_Products_category_id_fkey (
        category_id,
        category_name
      )
    `)
    .eq('product_status', 'active')
    .order('item_code', { ascending: true });
  assertSupabase(error, 'Products could not be loaded.');
  res.json({ success: true, data: (data || []).map(withCategory) });
}));

app.get('/api/products/:id', asyncRoute(async (req, res) => {
  const { data, error } = await publicDb
    .from('IW_Products')
    .select(`
      *,
      IW_Categories!IW_Products_category_id_fkey (
        category_id,
        category_name
      )
    `)
    .eq('product_id', req.params.id)
    .maybeSingle();
  assertSupabase(error, 'The product could not be loaded.');
  if (!data) throw apiError('Product not found.', 404);
  res.json({ success: true, data: withCategory(data) });
}));

app.post('/api/products', requireAuth, asyncRoute(async (req, res) => {
  const payload = productPayload(req.body);
  const { data, error } = await req.db
    .from('IW_Products')
    .insert(payload)
    .select(`
      *,
      IW_Categories!IW_Products_category_id_fkey (
        category_id,
        category_name
      )
    `)
    .single();
  assertSupabase(error, 'The product could not be created.');
  res.status(201).json({ success: true, data: withCategory(data) });
}));

app.put('/api/products/:id', requireAuth, asyncRoute(async (req, res) => {
  const payload = productPayload(req.body);
  delete payload.product_id;
  const { data, error } = await req.db
    .from('IW_Products')
    .update(payload)
    .eq('product_id', req.params.id)
    .select(`
      *,
      IW_Categories!IW_Products_category_id_fkey (
        category_id,
        category_name
      )
    `)
    .maybeSingle();
  assertSupabase(error, 'The product could not be updated.');
  if (!data) throw apiError('Product not found.', 404);
  res.json({ success: true, data: withCategory(data) });
}));

app.delete('/api/products/:id', requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await req.db
    .from('IW_Products')
    .delete()
    .eq('product_id', req.params.id)
    .select('product_id')
    .maybeSingle();
  assertSupabase(error, 'The product could not be deleted.');
  if (!data) throw apiError('Product not found.', 404);
  res.json({ success: true, data });
}));

app.get('/api/favorites', requireAuth, asyncRoute(async (req, res) => {
  const profile = await getProfile(req);
  const { data, error } = await req.db
    .from('IW_Favorites')
    .select('product_id')
    .eq('user_id', profile.user_id)
    .order('created_at', { ascending: false });
  assertSupabase(error, 'Favorites could not be loaded.');
  res.json({ success: true, data: data || [] });
}));

app.post('/api/favorites', requireAuth, asyncRoute(async (req, res) => {
  const profile = await getProfile(req);
  const productId = String(req.body.productId || '');
  const { data: existing, error: lookupError } = await req.db
    .from('IW_Favorites')
    .select('product_id')
    .eq('user_id', profile.user_id)
    .eq('product_id', productId)
    .maybeSingle();
  assertSupabase(lookupError, 'The favorite could not be checked.');

  if (existing) {
    const { error } = await req.db
      .from('IW_Favorites')
      .delete()
      .eq('user_id', profile.user_id)
      .eq('product_id', productId);
    assertSupabase(error, 'The favorite could not be removed.');
    return res.json({
      success: true,
      data: { productId, favorite: false },
    });
  }

  const { error } = await req.db
    .from('IW_Favorites')
    .insert({ user_id: profile.user_id, product_id: productId });
  assertSupabase(error, 'The favorite could not be added.');
  return res.json({
    success: true,
    data: { productId, favorite: true },
  });
}));

app.get('/api/cart', requireAuth, asyncRoute(async (req, res) => {
  const cart = await getCart(req, false);
  if (!cart) return res.json({ success: true, data: [] });
  const { data, error } = await req.db
    .from('IW_Cart_Items')
    .select('product_id, quantity')
    .eq('cart_id', cart.cart_id)
    .order('product_id');
  assertSupabase(error, 'Cart items could not be loaded.');
  return res.json({ success: true, data: data || [] });
}));

app.post('/api/cart', requireAuth, asyncRoute(async (req, res) => {
  const cart = await getCart(req, true);
  const productId = String(req.body.productId || '');
  const quantity = Math.max(1, Math.trunc(Number(req.body.quantity || 1)));
  const unitPrice = Number(req.body.unitPrice);
  if (!Number.isFinite(unitPrice)) throw apiError('Invalid unit price.', 400);

  const { data: existing, error: lookupError } = await req.db
    .from('IW_Cart_Items')
    .select('quantity')
    .eq('cart_id', cart.cart_id)
    .eq('product_id', productId)
    .maybeSingle();
  assertSupabase(lookupError, 'The cart item could not be checked.');

  const payload = {
    cart_id: cart.cart_id,
    product_id: productId,
    quantity: Number(existing?.quantity || 0) + quantity,
    unit_price: unitPrice,
  };
  const query = existing
    ? req.db
        .from('IW_Cart_Items')
        .update(payload)
        .eq('cart_id', cart.cart_id)
        .eq('product_id', productId)
    : req.db.from('IW_Cart_Items').insert(payload);
  const { error } = await query;
  assertSupabase(error, 'The cart item could not be added.');
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
  const { data: existing, error: lookupError } = await req.db
    .from('IW_Cart_Items')
    .select('cart_item_id')
    .eq('cart_id', cart.cart_id)
    .eq('product_id', productId)
    .maybeSingle();
  assertSupabase(lookupError, 'The cart item could not be checked.');

  const query = existing
    ? req.db
        .from('IW_Cart_Items')
        .update(payload)
        .eq('cart_id', cart.cart_id)
        .eq('product_id', productId)
    : req.db.from('IW_Cart_Items').insert(payload);
  const { error } = await query;
  assertSupabase(error, 'The cart quantity could not be updated.');
  res.json({ success: true, data: payload });
}));

app.delete('/api/cart', requireAuth, asyncRoute(async (req, res) => {
  const cart = await getCart(req, false);
  if (!cart) return res.json({ success: true, data: null });
  const productId = String(req.body.productId || '');
  const { error } = await req.db
    .from('IW_Cart_Items')
    .delete()
    .eq('cart_id', cart.cart_id)
    .eq('product_id', productId);
  assertSupabase(error, 'The cart item could not be removed.');
  return res.json({ success: true, data: null });
}));

app.post('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const { data, error } = await req.db.rpc('iw_checkout');
  assertSupabase(error, 'The order could not be created.');
  res.status(201).json({ success: true, data });
}));

app.get('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const profile = await getProfile(req);
  let query = req.db
    .from('IW_Orders')
    .select(`
      order_id,
      user_id,
      total_amount,
      order_status,
      created_at,
      IW_Order_Items!IW_Order_Items_order_id_fkey (
        order_item_id,
        product_id,
        product_name,
        quantity,
        unit_price,
        line_total
      )
    `)
    .order('created_at', { ascending: false });
  if (profile.role !== 'admin') query = query.eq('user_id', profile.user_id);
  const { data, error } = await query;
  assertSupabase(error, 'Orders could not be loaded.');
  res.json({ success: true, data: data || [] });
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
  const { data, error } = await req.db
    .from('IW_Orders')
    .update({
      order_status: orderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', req.params.id)
    .select('order_id, order_status')
    .maybeSingle();
  assertSupabase(error, 'The order status could not be updated.');
  if (!data) throw apiError('Order not found.', 404);
  res.json({ success: true, data });
}));

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.status) || 500;
  res.status(status).json({
    success: false,
    error: error.message || 'Internal server error.',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ImperialWood API listening on port ${PORT}`);
});
