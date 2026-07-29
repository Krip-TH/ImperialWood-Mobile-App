import { supabase } from '@/lib/supabase';
import { ApiError, requireAuthenticatedUserId, toApiError } from '@/services/api';

export type OrderItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
};

export type Order = {
  id: string;
  user_id?: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
};

type OrderRow = {
  order_id: string | number;
  user_id?: string;
  total_amount: number | string;
  status: string;
  created_at: string;
  IW_Order_Items?: OrderItem[];
};

export async function createOrder(): Promise<Order> {
  await requireAuthenticatedUserId();
  const { data, error } = await supabase.rpc('iw_checkout');
  if (error) {
    const status = error.message.toLowerCase().includes('cart is empty') ? 400 : 500;
    throw toApiError(error, 'The order could not be created.', status);
  }
  if (!data || typeof data !== 'object') {
    throw new ApiError('Supabase returned an invalid order.', 500);
  }

  const order = data as Record<string, unknown>;
  const items = Array.isArray(order.items) ? order.items : [];
  return {
    id: String(order.id),
    user_id: order.user_id ? String(order.user_id) : undefined,
    total_amount: Number(order.total_amount),
    status: String(order.status),
    created_at: String(order.created_at),
    items: items.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        product_id: String(row.product_id),
        quantity: Number(row.quantity),
        unit_price: Number(row.unit_price),
      };
    }),
  };
}

export async function getOrders(): Promise<Order[]> {
  const userId = await requireAuthenticatedUserId();
  const { data: profile, error: profileError } = await supabase
    .from('IW_Users')
    .select('role')
    .eq('user_id', userId)
    .single<{ role: string }>();

  if (profileError) throw toApiError(profileError, 'The user profile could not be loaded.');

  let query = supabase
    .from('IW_Orders')
    .select('order_id, user_id, total_amount, status, created_at, IW_Order_Items(product_id, quantity, unit_price)')
    .order('created_at', { ascending: false });

  if (profile.role !== 'admin') {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw toApiError(error, 'Orders could not be loaded.');

  return ((data ?? []) as OrderRow[]).map((order) => ({
    id: String(order.order_id),
    user_id: order.user_id ? String(order.user_id) : undefined,
    total_amount: Number(order.total_amount),
    status: order.status,
    created_at: order.created_at,
    items: (order.IW_Order_Items ?? []).map((item) => ({
      product_id: String(item.product_id),
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  }));
}
