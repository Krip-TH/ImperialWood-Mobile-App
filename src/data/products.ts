import { Product, ProductStatus } from '@/context/AppContext';
import localCatalog from '../../products.json';

export const PRODUCTS_URL =
  'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/products.json';

type ProductJson = {
  id: string;
  name: string;
  stock: number;
  stock_text: string;
  category: string;
  location_count: number;
  location_text: string;
  badge_status: ProductStatus;
  price: number;
  price_text: string;
  item_code: string;
  material: string;
  size: string;
  finish: string;
  description: string;
  image_url: string;
};

const productStatuses: ProductStatus[] = ['Available', 'Low Stock', 'Out of Stock'];

function isProductJson(value: unknown): value is ProductJson {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Record<string, unknown>;
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.stock === 'number' &&
    typeof product.stock_text === 'string' &&
    typeof product.category === 'string' &&
    typeof product.location_count === 'number' &&
    typeof product.location_text === 'string' &&
    typeof product.badge_status === 'string' &&
    productStatuses.includes(product.badge_status as ProductStatus) &&
    typeof product.price === 'number' &&
    typeof product.price_text === 'string' &&
    typeof product.item_code === 'string' &&
    typeof product.material === 'string' &&
    typeof product.size === 'string' &&
    typeof product.finish === 'string' &&
    typeof product.description === 'string' &&
    typeof product.image_url === 'string'
  );
}

export function parseProducts(value: unknown): Product[] {
  if (!Array.isArray(value) || !value.every(isProductJson)) {
    throw new Error('The product catalog has an invalid format.');
  }

  return value.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price_text,
    image: getFallbackImage(product.id, product.category),
    image_url: product.image_url,
    itemCode: product.item_code,
    stockQuantity: product.stock_text,
    storeAvailability: product.location_text,
    material: product.material,
    size: product.size,
    finish: product.finish,
    description: product.description,
    status: product.badge_status,
  }));
}

function getFallbackImage(id: string, category: string) {
  if (id === 'modern-walnut-entrance-door' || category === 'Modern Doors') {
    return require('../../assets/products/modern-walnut-entrance-door.jpg');
  }
  if (id === 'premium-teak-glass-panel-door' || category === 'Glass Panel Doors') {
    return require('../../assets/products/premium-teak-glass-panel-door.jpg');
  }
  if (id === 'minimal-ash-interior-door' || category === 'Interior Doors') {
    return require('../../assets/products/minimal-ash-interior-door.jpg');
  }
  return require('../../assets/products/imperial-classic-oak-door.jpg');
}

export const fallbackProducts: Product[] = parseProducts(localCatalog).map((product) => ({
  ...product,
  image_url: undefined,
}));
