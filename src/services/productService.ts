import type { Product, ProductStatus } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { toApiError } from '@/services/api';

type CategoryRelation = {
  category_id: string | number;
  category_name: string | null;
};

type SupabaseProduct = {
  product_id: string | number;
  item_code: string;
  product_name: string;
  category_id: string | number;
  material: string | null;
  size: string | null;
  finish: string | null;
  price: number | string;
  total_stock: number | string;
  badge_status: string | null;
  location_count: number | string | null;
  location_text: string | null;
  description: string | null;
  image_url: string | null;
  product_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  IW_Categories: CategoryRelation | CategoryRelation[] | null;
};

function normalizeStatus(value: unknown, stock: number): ProductStatus {
  if (
    value === 'Available' ||
    value === 'Low Stock' ||
    value === 'Out of Stock'
  ) {
    return value;
  }

  if (stock <= 0) return 'Out of Stock';
  if (stock <= 5) return 'Low Stock';
  return 'Available';
}

function getCategoryName(
  relation: SupabaseProduct['IW_Categories']
): string {
  if (Array.isArray(relation)) {
    return relation[0]?.category_name ?? '';
  }

  return relation?.category_name ?? '';
}

function normalizeProduct(row: SupabaseProduct): Product {
  const stock = Number(row.total_stock ?? 0);
  const price = Number(row.price ?? 0);

  return {
    id: String(row.product_id),
    name: row.product_name,
    category: getCategoryName(row.IW_Categories),
    categoryId: String(row.category_id),
    price: `THB ${price.toLocaleString('en-US')}`,
    image_url: row.image_url ?? undefined,
    itemCode: row.item_code,
    stockQuantity: String(stock),
    storeAvailability: row.location_text ?? '',
    material: row.material ?? '',
    size: row.size ?? '',
    finish: row.finish ?? '',
    description: row.description ?? '',
    status: normalizeStatus(row.badge_status, stock),
    productStatus: row.product_status ?? 'active',
    updatedAt: row.updated_at ?? undefined,
  };
}

export type ProductSource = 'supabase';

export type ProductResult = {
  products: Product[];
  source: ProductSource;
};

export async function getProducts(): Promise<ProductResult> {
  const { data, error } = await supabase
    .from('IW_Products')
    .select(`
      product_id,
      item_code,
      product_name,
      category_id,
      material,
      size,
      finish,
      price,
      total_stock,
      badge_status,
      location_count,
      location_text,
      description,
      image_url,
      product_status,
      created_at,
      updated_at,
      IW_Categories!IW_Products_category_id_fkey (
        category_id,
        category_name
      )
    `)
    .eq('product_status', 'active')
    .order('item_code', { ascending: true });

  if (error) {
    console.error('Supabase products error:', error);
    throw toApiError(error, 'Products could not be loaded.');
  }

  const rows = (data ?? []) as unknown as SupabaseProduct[];

  return {
    products: rows.map(normalizeProduct),
    source: 'supabase',
  };
}

export async function createProduct(product: Product): Promise<Product> {
  const { data: category, error: categoryError } = await supabase
    .from('IW_Categories')
    .select('category_id')
    .eq('category_name', product.category)
    .single<{ category_id: string | number }>();

  if (categoryError) {
    throw toApiError(
      categoryError,
      'The selected category could not be found.'
    );
  }

  const numericPrice = Number(product.price.replace(/[^0-9.]/g, ''));
  const numericStock = Number.parseInt(product.stockQuantity, 10) || 0;

  const { data, error } = await supabase
    .from('IW_Products')
    .insert({
      product_id: product.id,
      item_code: product.itemCode,
      product_name: product.name,
      category_id: category.category_id,
      price: numericPrice,
      total_stock: numericStock,
      badge_status: product.status,
      location_text: product.storeAvailability,
      material: product.material,
      size: product.size,
      finish: product.finish,
      description: product.description,
      image_url: product.image_url ?? null,
      product_status: 'active',
    })
    .select(`
      product_id,
      item_code,
      product_name,
      category_id,
      material,
      size,
      finish,
      price,
      total_stock,
      badge_status,
      location_count,
      location_text,
      description,
      image_url,
      product_status,
      created_at,
      updated_at,
      IW_Categories!IW_Products_category_id_fkey (
        category_id,
        category_name
      )
    `)
    .single();

  if (error) {
    console.error('Supabase create product error:', error);
    throw toApiError(error, 'The product could not be created.');
  }

  return normalizeProduct(data as unknown as SupabaseProduct);
}

export async function getProductById(productId: string): Promise<Product> {
  const { data, error } = await supabase
    .from('IW_Products')
    .select(`
      product_id,
      item_code,
      product_name,
      category_id,
      material,
      size,
      finish,
      price,
      total_stock,
      badge_status,
      location_count,
      location_text,
      description,
      image_url,
      product_status,
      created_at,
      updated_at,
      IW_Categories!IW_Products_category_id_fkey (
        category_id,
        category_name
      )
    `)
    .eq('product_id', productId)
    .single();

  if (error) {
    console.error('Supabase product error:', error);
    throw toApiError(error, 'The product could not be loaded.');
  }

  return normalizeProduct(data as unknown as SupabaseProduct);
}

export async function updateProduct(
  productId: string,
  product: Product
): Promise<Product> {
  let categoryId = product.categoryId;

  if (!categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from('IW_Categories')
      .select('category_id')
      .eq('category_name', product.category)
      .single<{ category_id: string | number }>();

    if (categoryError) {
      console.error('Supabase update product error:', categoryError);
      throw toApiError(
        categoryError,
        'The selected category could not be found.'
      );
    }

    categoryId = String(category.category_id);
  }

  const numericPrice = Number(product.price.replace(/[^0-9.]/g, ''));
  const numericStock = Number(product.stockQuantity);
  const badgeStatus: ProductStatus =
    numericStock <= 0
      ? 'Out of Stock'
      : numericStock <= 5
        ? 'Low Stock'
        : 'Available';

  const { data, error } = await supabase
    .from('IW_Products')
    .update({
      product_name: product.name,
      item_code: product.itemCode,
      category_id: categoryId,
      price: numericPrice,
      total_stock: numericStock,
      badge_status: badgeStatus,
      location_text: product.storeAvailability,
      material: product.material,
      size: product.size,
      finish: product.finish,
      description: product.description,
      image_url: product.image_url ?? null,
      product_status: product.productStatus ?? 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('product_id', productId)
    .select(`
      product_id,
      item_code,
      product_name,
      category_id,
      material,
      size,
      finish,
      price,
      total_stock,
      badge_status,
      location_count,
      location_text,
      description,
      image_url,
      product_status,
      created_at,
      updated_at,
      IW_Categories!IW_Products_category_id_fkey (
        category_id,
        category_name
      )
    `)
    .single();

  if (error) {
    console.error('Supabase update product error:', error);
    throw toApiError(error, 'The product could not be updated.');
  }

  return normalizeProduct(data as unknown as SupabaseProduct);
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
