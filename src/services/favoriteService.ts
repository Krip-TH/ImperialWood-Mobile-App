import { apiData } from '@/services/api';

type ApiFavorite = {
  product_id: string | number;
};

export async function getFavorites(): Promise<string[]> {
  const favorites = await apiData<ApiFavorite[]>('/favorites');
  return favorites.map((favorite) => String(favorite.product_id));
}

export async function toggleFavorite(
  productId: string
): Promise<{ productId: string; favorite: boolean }> {
  return apiData('/favorites', {
    method: 'POST',
    body: JSON.stringify({ productId }),
  });
}
