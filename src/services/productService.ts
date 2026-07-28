import type { Product, ProductStatus } from '@/context/AppContext';
import { fallbackProducts, parseProducts, PRODUCTS_URL } from '@/data/products';
import { apiRequest } from '@/services/api';

type ApiProduct = Record<string, unknown>;
type ProductsResponse = { products: ApiProduct[] };

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

  return {
    id: text(product.id),
    name: text(product.name),
    category: text(product.category),
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

export type ProductSource = 'api' | 'github' | 'local';
export type ProductResult = { products: Product[]; source: ProductSource };

export async function getProducts(): Promise<ProductResult> {
  try {
    const response = await apiRequest<ProductsResponse>('/products');
    if (!Array.isArray(response.products)) throw new Error('Invalid API product response.');
    return { products: response.products.map(normalizeApiProduct), source: 'api' };
  } catch (apiError) {
    console.warn('ImperialWood API products unavailable:', apiError);
  }

  try {
    const response = await fetch(PRODUCTS_URL);
    if (!response.ok) throw new Error(`GitHub product request failed: ${response.status}`);
    return { products: parseProducts(await response.json(), true), source: 'github' };
  } catch (githubError) {
    console.warn('GitHub products unavailable; using bundled catalog:', githubError);
    return { products: fallbackProducts, source: 'local' };
  }
}
