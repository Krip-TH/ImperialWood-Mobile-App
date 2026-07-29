import { supabase } from '@/lib/supabase';
import { ApiError, requireAuthenticatedUserId, toApiError } from '@/services/api';

export type OrderItem = {
  order_item_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
};

export type OrderStatus =
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type Order = {
  id: string;
  user_id?: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
};

type OrderRow = {
  order_id: string | number;
  user_id?: string | number;
  total_amount: number | string;
  order_status: string;
  created_at: string;
  IW_Order_Items?: OrderItem[];
};

function normalizeOrderStatus(value: unknown): OrderStatus {
  if (
    value === 'packed' ||
    value === 'shipped' ||
    value === 'delivered' ||
    value === 'cancelled'
  ) {
    return value;
  }

  return 'confirmed';
}

export async function createOrder(): Promise<Order> {
  await requireAuthenticatedUserId();
  const { data, error } = await supabase.rpc('iw_checkout');
  if (error) {
    console.error('Supabase create order error:', error);
    if (error.message.includes('IW_Order_Items')) {
      console.error('Supabase create order items error:', error);
    }
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
    status: normalizeOrderStatus(order.order_status),
    created_at: String(order.created_at),
    items: items.map((item) => {
      const row = item as Record<string, unknown>;
      return {
        order_item_id:
          row.order_item_id === null || row.order_item_id === undefined
            ? undefined
            : String(row.order_item_id),
        product_id: String(row.product_id),
        product_name: String(row.product_name),
        quantity: Number(row.quantity),
        unit_price: Number(row.unit_price),
        line_total: Number(row.line_total),
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

  if (profile.role !== 'admin') {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;
  if (error) throw toApiError(error, 'Orders could not be loaded.');

  return ((data ?? []) as OrderRow[]).map((order) => ({
    id: String(order.order_id),
    user_id: order.user_id ? String(order.user_id) : undefined,
    total_amount: Number(order.total_amount),
    status: normalizeOrderStatus(order.order_status),
    created_at: order.created_at,
    items: (order.IW_Order_Items ?? []).map((item) => ({
      order_item_id:
        item.order_item_id === null || item.order_item_id === undefined
          ? undefined
          : String(item.order_item_id),
      product_id: String(item.product_id),
      product_name: item.product_name,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(item.line_total),
    })),
  }));
}

export async function updateOrderStatus(
  orderId: string | number,
  orderStatus:
    | 'confirmed'
    | 'packed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
): Promise<void> {
  const { error } = await supabase
    .from('IW_Orders')
    .update({
      order_status: orderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId);

  if (error) {
    console.error('Supabase update order status error:', error);
    throw toApiError(error, 'The order status could not be updated.');
  }
}
