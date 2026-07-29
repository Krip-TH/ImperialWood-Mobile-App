import type { Product } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { ApiError, requireAuthenticatedUserId, toApiError } from '@/services/api';

export type RemoteCartItem = { productId: string; quantity: number };

type CartRow = {
  cart_id: string | number;
  cart_status: string | null;
};
type CartItemRow = {
  cart_item_id: string | number;
  quantity: number | string;
};

function getUnitPrice(product: Product): number {
  const unitPrice = Number(product.price.replace(/[^0-9.]/g, ''));

  if (!Number.isFinite(unitPrice)) {
    throw new ApiError('The product price is invalid.', 400);
  }

  return unitPrice;
}

async function getCartId(createIfMissing: boolean): Promise<string | number | null> {
  const userId = await requireAuthenticatedUserId();
  const { data: cart, error: lookupError } = await supabase
    .from('IW_Carts')
    .select('cart_id, cart_status')
    .eq('user_id', userId)
    .maybeSingle<CartRow>();

  if (lookupError) {
    throw toApiError(lookupError, 'The cart could not be loaded.');
  }
  if (cart?.cart_status === 'active') return cart.cart_id;
  if (cart && !createIfMissing) return null;

  if (cart) {
    const { error: reactivateError } = await supabase
      .from('IW_Carts')
      .update({ cart_status: 'active' })
      .eq('cart_id', cart.cart_id)
      .eq('user_id', userId);

    if (reactivateError) {
      throw toApiError(reactivateError, 'The cart could not be activated.');
    }
    return cart.cart_id;
  }

  if (!createIfMissing) return null;

  const { data: created, error: createError } = await supabase
    .from('IW_Carts')
    .insert({ user_id: userId, cart_status: 'active' })
    .select('cart_id')
    .single<{ cart_id: string | number }>();

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

export async function addCartItem(
  product: Product,
  quantity = 1
): Promise<void> {
  try {
    const activeCartId = await getCartId(true);
    if (activeCartId === null) {
      throw new ApiError('The cart could not be created.', 500);
    }

    const requestedQuantity = Math.max(1, Math.trunc(quantity));
    const unitPrice = getUnitPrice(product);
    const { data: existing, error: lookupError } = await supabase
      .from('IW_Cart_Items')
      .select('cart_item_id, quantity')
      .eq('cart_id', activeCartId)
      .eq('product_id', product.id)
      .maybeSingle<CartItemRow>();

    if (lookupError) {
      throw toApiError(lookupError, 'The cart item could not be checked.');
    }

    if (existing) {
      const nextQuantity = Number(existing.quantity) + requestedQuantity;
      const { data, error } = await supabase
        .from('IW_Cart_Items')
        .update({
          quantity: nextQuantity,
          unit_price: unitPrice,
        })
        .eq('cart_id', activeCartId)
        .eq('product_id', product.id)
        .select('cart_item_id')
        .maybeSingle();

      if (error) {
        throw toApiError(error, 'The cart item could not be updated.');
      }
      if (!data) {
        throw new ApiError('The cart item changed before it could be updated.', 409);
      }
      return;
    }

    const { error } = await supabase
      .from('IW_Cart_Items')
      .insert({
        cart_id: activeCartId,
        product_id: product.id,
        quantity: requestedQuantity,
        unit_price: unitPrice,
      });

    if (error) {
      throw toApiError(error, 'The cart item could not be added.');
    }
  } catch (error) {
    console.error('Supabase add cart item error:', error);
    throw error;
  }
}

export async function updateCartItem(
  product: Product,
  quantity: number
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError('Quantity must be a positive integer.', 400);
  }

  try {
    const activeCartId = await getCartId(true);
    if (activeCartId === null) {
      throw new ApiError('The cart could not be created.', 500);
    }

    const unitPrice = getUnitPrice(product);
    const { data: existing, error: lookupError } = await supabase
      .from('IW_Cart_Items')
      .select('cart_item_id')
      .eq('cart_id', activeCartId)
      .eq('product_id', product.id)
      .maybeSingle<{ cart_item_id: string | number }>();

    if (lookupError) {
      throw toApiError(lookupError, 'The cart item could not be checked.');
    }

    if (!existing) {
      await addCartItem(product, quantity);
      return;
    }

    const { data, error } = await supabase
      .from('IW_Cart_Items')
      .update({
        quantity,
        unit_price: unitPrice,
      })
      .eq('cart_id', activeCartId)
      .eq('product_id', product.id)
      .select('cart_item_id')
      .maybeSingle();

    if (error) {
      throw toApiError(error, 'The cart quantity could not be updated.');
    }
    if (!data) {
      await addCartItem(product, quantity);
    }
  } catch (error) {
    console.error('Supabase update cart item error:', error);
    throw error;
  }
}

export async function removeCartItem(productId: string): Promise<void> {
  try {
    const activeCartId = await getCartId(false);
    if (activeCartId === null) return;

    const { error } = await supabase
      .from('IW_Cart_Items')
      .delete()
      .eq('cart_id', activeCartId)
      .eq('product_id', productId);

    if (error) {
      throw toApiError(error, 'The cart item could not be removed.');
    }
  } catch (error) {
    console.error('Supabase remove cart item error:', error);
    throw error;
  }
}
