import type { Product, ProductStatus } from '@/context/AppContext';
import { apiData } from '@/services/api';

export type ProductImageUpload = {
  file_name: string;
  content_base64: string;
  mime_type?: string | null;
};

type ApiProduct = {
  product_id: string | number;
  item_code: string;
  product_name: string;
  category_id: string | number;
  category_name?: string | null;
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
  IW_Categories?:
    | {
        category_id: string | number;
        category_name: string | null;
      }
    | {
        category_id: string | number;
        category_name: string | null;
      }[]
    | null;
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

function getCategoryName(row: ApiProduct): string {
  if (row.category_name) {
    return row.category_name;
  }

  if (Array.isArray(row.IW_Categories)) {
    return row.IW_Categories[0]?.category_name ?? '';
  }

  return row.IW_Categories?.category_name ?? '';
}

function normalizeProduct(row: ApiProduct): Product {
  const stock = Number(row.total_stock ?? 0);
  const price = Number(row.price ?? 0);

  return {
    id: String(row.product_id),
    name: row.product_name,
    category: getCategoryName(row),
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

function createPayload(
  product: Product,
  imageUpload?: ProductImageUpload
) {
  const numericPrice = Number(
    product.price.replace(/[^0-9.]/g, '')
  );
  const categoryId = Number(product.categoryId);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error('Please select a valid category.');
  }

  const numericStock =
    Number.parseInt(product.stockQuantity, 10) || 0;

  const badgeStatus: ProductStatus =
    numericStock <= 0
      ? 'Out of Stock'
      : numericStock <= 5
        ? 'Low Stock'
        : 'Available';

  return {
    product_id: product.id || undefined,
    item_code: product.itemCode,
    product_name: product.name,
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
    ...(imageUpload ? { image_upload: imageUpload } : {}),
    product_status: product.productStatus ?? 'active',
  };
}

export type ProductSource = 'api';

export type ProductResult = {
  products: Product[];
  source: ProductSource;
};

export async function getProducts(): Promise<ProductResult> {
  const products = await apiData<ApiProduct[]>('/products');

  return {
    products: products.map(normalizeProduct),
    source: 'api',
  };
}

export async function getProductById(
  productId: string
): Promise<Product> {
  const product = await apiData<ApiProduct>(
    `/products/${productId}`
  );

  return normalizeProduct(product);
}

export async function createProduct(
  product: Product,
  imageUpload?: ProductImageUpload
): Promise<Product> {
  const createdProduct = await apiData<ApiProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(createPayload(product, imageUpload)),
    timeoutMs: imageUpload ? 60_000 : undefined,
  });

  return normalizeProduct(createdProduct);
}

export async function updateProduct(
  productId: string,
  product: Product
): Promise<Product> {
  const updatedProduct = await apiData<ApiProduct>(
    `/products/${productId}`,
    {
      method: 'PUT',
      body: JSON.stringify(createPayload(product)),
    }
  );

  return normalizeProduct(updatedProduct);
}

export async function deleteProduct(
  productId: string
): Promise<void> {
  await apiData(`/products/${productId}`, {
    method: 'DELETE',
  });
}
