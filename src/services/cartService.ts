import type { Product } from '@/context/AppContext';
import { ApiError, apiData } from '@/services/api';

export type RemoteCartItem = {
  productId: string;
  quantity: number;
};

type ApiCartItem = {
  product_id: string | number;
  quantity: number | string;
};

function getUnitPrice(product: Product): number {
  const unitPrice = Number(product.price.replace(/[^0-9.]/g, ''));

  if (!Number.isFinite(unitPrice)) {
    throw new ApiError('The product price is invalid.', 400);
  }

  return unitPrice;
}

export async function getCart(): Promise<RemoteCartItem[]> {
  const items = await apiData<ApiCartItem[]>('/cart');

  return items.map((item) => ({
    productId: String(item.product_id),
    quantity: Number(item.quantity),
  }));
}

export async function addCartItem(
  product: Product,
  quantity = 1
): Promise<void> {
  await apiData('/cart', {
    method: 'POST',
    body: JSON.stringify({
      productId: product.id,
      quantity,
      unitPrice: getUnitPrice(product),
    }),
  });
}

export async function updateCartItem(
  product: Product,
  quantity: number
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError('Quantity must be a positive integer.', 400);
  }

  await apiData('/cart', {
    method: 'PUT',
    body: JSON.stringify({
      productId: product.id,
      quantity,
      unitPrice: getUnitPrice(product),
    }),
  });
}

export async function removeCartItem(productId: string): Promise<void> {
  await apiData('/cart', {
    method: 'DELETE',
    body: JSON.stringify({ productId }),
  });
}
