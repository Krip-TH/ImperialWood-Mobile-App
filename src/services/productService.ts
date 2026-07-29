import type { Product, ProductStatus } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { toApiError } from '@/services/api';

type ApiProduct = Record<string, unknown>;

function text(value: unknown, fallback = ''): string {
  return value === null || value === undefined ? fallback : String(value);
}

function normalizeStatus(value: unknown, stock: number): ProductStatus {
  if (value === 'Available' || value === 'Low Stock' || value === 'Out of Stock') return value;
  if (stock <= 0) return 'Out of Stock';
  if (stock <= 5) return 'Low Stock';
  return 'Available';
}

function normalizeApiProduct(product: ApiProduct): Product {
  const stock = Number(product.stock_quantity ?? product.stock ?? 0);
  const price = Number(product.price ?? 0);
  const rawPrice = text(product.price_text);
  const categoryRelation = product.IW_Categories;
  const category =
    categoryRelation && typeof categoryRelation === 'object' && !Array.isArray(categoryRelation)
      ? text((categoryRelation as Record<string, unknown>).name)
      : '';

  return {
    id: text(product.product_id),
    name: text(product.name),
    category: category || text(product.category),
    price: rawPrice || `THB ${price.toLocaleString('en-US')}`,
    image_url: text(product.image_url) || undefined,
    itemCode: text(product.item_code ?? product.itemCode),
    stockQuantity: text(product.stock_text ?? product.stock_quantity ?? product.stock),
    storeAvailability: text(
      product.location_text ?? product.store_availability ?? product.storeAvailability
    ),
    material: text(product.material),
    size: text(product.size),
    finish: text(product.finish),
    description: text(product.description),
    status: normalizeStatus(product.status ?? product.badge_status, stock),
  };
}

export type ProductSource = 'supabase';
export type ProductResult = { products: Product[]; source: ProductSource };

export async function getProducts(): Promise<ProductResult> {
  const { data, error } = await supabase
    .from('IW_Products')
    .select('*, IW_Categories(name)')
    .order('product_id', { ascending: false });

  if (error) {
    throw toApiError(error, 'Products could not be loaded.');
  }
  if (!Array.isArray(data)) {
    throw new Error('Invalid Supabase product response.');
  }

  return { products: (data as ApiProduct[]).map(normalizeApiProduct), source: 'supabase' };
}

export async function createProduct(product: Product): Promise<Product> {
  const { data: category, error: categoryError } = await supabase
    .from('IW_Categories')
    .select('category_id')
    .eq('name', product.category)
    .single<{ category_id: string | number }>();

  if (categoryError) {
    throw toApiError(categoryError, 'The selected category could not be found.');
  }

  const numericPrice = Number(product.price.replace(/[^0-9.]/g, ''));
  const { data, error } = await supabase
    .from('IW_Products')
    .insert({
      name: product.name,
      category_id: category.category_id,
      category: product.category,
      price: numericPrice,
      image_url: product.image_url ?? null,
      item_code: product.itemCode,
      stock_quantity: Number.parseInt(product.stockQuantity, 10),
      store_availability: product.storeAvailability,
      material: product.material,
      size: product.size,
      finish: product.finish,
      description: product.description,
    })
    .select('*, IW_Categories(name)')
    .single();

  if (error) {
    throw toApiError(error, 'The product could not be created.');
  }
  return normalizeApiProduct(data as ApiProduct);
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase
    .from('IW_Products')
    .delete()
    .eq('product_id', productId);
  if (error) {
    throw toApiError(error, 'The product could not be deleted.');
  }
}
