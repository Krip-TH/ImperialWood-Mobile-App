import { apiData } from '@/services/api';

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

type ApiOrderItem = {
  order_item_id?: string | number | null;
  product_id: string | number;
  product_name?: string | null;
  quantity: number | string;
  unit_price: number | string;
  line_total?: number | string | null;
};

type ApiOrder = {
  id?: string | number;
  order_id?: string | number;
  user_id?: string | number | null;
  total_amount: number | string;
  status?: string;
  order_status?: string;
  created_at: string;
  items?: ApiOrderItem[];
  IW_Order_Items?: ApiOrderItem[];
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

function normalizeOrder(order: ApiOrder): Order {
  const items = order.items ?? order.IW_Order_Items ?? [];

  return {
    id: String(order.id ?? order.order_id),
    user_id:
      order.user_id === null || order.user_id === undefined
        ? undefined
        : String(order.user_id),
    total_amount: Number(order.total_amount),
    status: normalizeOrderStatus(order.order_status ?? order.status),
    created_at: order.created_at,
    items: items.map((item) => ({
      order_item_id:
        item.order_item_id === null || item.order_item_id === undefined
          ? undefined
          : String(item.order_item_id),
      product_id: String(item.product_id),
      product_name: item.product_name ?? '',
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      line_total: Number(
        item.line_total ?? Number(item.quantity) * Number(item.unit_price)
      ),
    })),
  };
}

export async function createOrder(): Promise<Order> {
  const order = await apiData<ApiOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  return normalizeOrder(order);
}

export async function getOrders(): Promise<Order[]> {
  const orders = await apiData<ApiOrder[]>('/orders');
  return orders.map(normalizeOrder);
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
  await apiData(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ orderStatus }),
  });
}
