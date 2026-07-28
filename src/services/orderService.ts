import { apiRequest } from '@/services/api';

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

export async function createOrder(): Promise<Order> {
  const response = await apiRequest<{ order: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return response.order;
}

export async function getOrders(): Promise<Order[]> {
  const response = await apiRequest<{ orders: Order[] }>('/orders');
  if (!Array.isArray(response.orders)) throw new Error('Invalid orders response.');
  return response.orders;
}
