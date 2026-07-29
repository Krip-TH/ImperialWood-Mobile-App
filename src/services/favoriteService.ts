import { supabase } from '@/lib/supabase';
import { requireAuthenticatedUserId, toApiError } from '@/services/api';

export async function getFavorites(): Promise<string[]> {
  const userId = await requireAuthenticatedUserId();
  const { data, error } = await supabase
    .from('IW_Favorites')
    .select('product_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw toApiError(error, 'Favorites could not be loaded.');
  }

  return (data ?? []).map((favorite) => String(favorite.product_id));
}

export async function toggleFavorite(
  productId: string
): Promise<{ productId: string; favorite: boolean }> {
  const userId = await requireAuthenticatedUserId();
  const { data: existing, error: lookupError } = await supabase
    .from('IW_Favorites')
    .select('product_id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (lookupError) {
    throw toApiError(lookupError, 'The favorite could not be checked.');
  }

  if (existing) {
    const { error } = await supabase
      .from('IW_Favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) {
      throw toApiError(error, 'The favorite could not be removed.');
    }
    return { productId, favorite: false };
  }

  const { error } = await supabase
    .from('IW_Favorites')
    .insert({ user_id: userId, product_id: productId });
  if (error) {
    throw toApiError(error, 'The favorite could not be added.');
  }
  return { productId, favorite: true };
}
