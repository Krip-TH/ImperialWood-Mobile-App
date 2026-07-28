import { apiRequest } from '@/services/api';

export async function getFavorites(): Promise<string[]> {
  const response = await apiRequest<{ favorites: { product_id: string }[] }>('/favorites');
  if (!Array.isArray(response.favorites)) throw new Error('Invalid favorites response.');
  return response.favorites.map((favorite) => String(favorite.product_id));
}

export async function toggleFavorite(
  productId: string
): Promise<{ productId: string; favorite: boolean }> {
  return apiRequest('/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}
