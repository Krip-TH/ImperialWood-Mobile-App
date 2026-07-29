import { supabase } from '@/lib/supabase';
import { ApiError, requireAuthenticatedUserId, toApiError } from '@/services/api';

export type RemoteCartItem = { productId: string; quantity: number };

type CartRow = { cart_id: string | number };

async function getCartId(createIfMissing: boolean): Promise<string | number | null> {
  const userId = await requireAuthenticatedUserId();
  const { data: cart, error: lookupError } = await supabase
    .from('IW_Carts')
    .select('cart_id')
    .eq('user_id', userId)
    .maybeSingle<CartRow>();

  if (lookupError) {
    throw toApiError(lookupError, 'The cart could not be loaded.');
  }
  if (cart || !createIfMissing) return cart?.cart_id ?? null;

  const { data: created, error: createError } = await supabase
    .from('IW_Carts')
    .insert({ user_id: userId })
    .select('cart_id')
    .single<CartRow>();

  if (createError) {
    throw toApiError(createError, 'The cart could not be created.');
  }
  return created.cart_id;
}

export async function getCart(): Promise<RemoteCartItem[]> {
  const cartId = await getCartId(false);
  if (cartId === null) return [];

  const { data, error } = await supabase
    .from('IW_Cart_Items')
    .select('product_id, quantity')
    .eq('cart_id', cartId)
    .order('product_id');

  if (error) {
    throw toApiError(error, 'Cart items could not be loaded.');
  }

  return (data ?? []).map((item) => ({
    productId: String(item.product_id),
    quantity: Number(item.quantity),
  }));
}

export async function addCartItem(productId: string, quantity = 1): Promise<void> {
  const cartId = await getCartId(true);
  if (cartId === null) throw new ApiError('The cart could not be created.', 500);

  const { data: existing, error: lookupError } = await supabase
    .from('IW_Cart_Items')
    .select('quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle<{ quantity: number | string }>();

  if (lookupError) {
    throw toApiError(lookupError, 'The cart item could not be checked.');
  }

  const nextQuantity = Number(existing?.quantity ?? 0) + Math.max(1, quantity);
  const { error } = await supabase
    .from('IW_Cart_Items')
    .upsert(
      { cart_id: cartId, product_id: productId, quantity: nextQuantity },
      { onConflict: 'cart_id,product_id' }
    );
  if (error) {
    throw toApiError(error, 'The cart item could not be added.');
  }
}

export async function updateCartItem(productId: string, quantity: number): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError('Quantity must be a positive integer.', 400);
  }

  const cartId = await getCartId(false);
  if (cartId === null) throw new ApiError('Cart item not found.', 404);

  const { data, error } = await supabase
    .from('IW_Cart_Items')
    .update({ quantity })
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .select('product_id')
    .maybeSingle();

  if (error) {
    throw toApiError(error, 'The cart quantity could not be updated.');
  }
  if (!data) {
    throw new ApiError('Cart item not found.', 404);
  }
}

export async function removeCartItem(productId: string): Promise<void> {
  const cartId = await getCartId(false);
  if (cartId === null) return;

  const { error } = await supabase
    .from('IW_Cart_Items')
    .delete()
    .eq('cart_id', cartId)
    .eq('product_id', productId);
  if (error) {
    throw toApiError(error, 'The cart item could not be removed.');
  }
}
