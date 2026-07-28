import { apiRequest } from '@/services/api';

export type RemoteCartItem = { productId: string; quantity: number };

export async function getCart(): Promise<RemoteCartItem[]> {
  const response = await apiRequest<{
    items: { product_id: string; quantity: number | string }[];
  }>('/cart');
  if (!Array.isArray(response.items)) throw new Error('Invalid cart response.');
  return response.items.map((item) => ({
    productId: String(item.product_id),
    quantity: Number(item.quantity),
  }));
}

export async function addCartItem(productId: string, quantity = 1): Promise<void> {
  await apiRequest('/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function updateCartItem(productId: string, quantity: number): Promise<void> {
  await apiRequest('/cart', {
    method: 'PUT',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function removeCartItem(productId: string): Promise<void> {
  await apiRequest('/cart', {
    method: 'DELETE',
    body: JSON.stringify({ productId }),
  });
}
