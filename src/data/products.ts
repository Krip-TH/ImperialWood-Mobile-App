import { Product, ProductStatus } from '@/context/AppContext';

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
    image: { uri: product.image_url },
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

export const fallbackProducts: Product[] = [
  {
    id: 'imperial-classic-oak-door',
    name: 'Imperial Classic Oak Door',
    category: 'Classic Doors',
    price: 'THB 18,900',
    image: require('../../assets/products/imperial-classic-oak-door.jpg'),
    itemCode: 'IW-001',
    stockQuantity: '8 doors in stock',
    storeAvailability: 'Available at 2 stores',
    material: 'Oak',
    size: '80 x 200 cm',
    finish: 'Classic oak satin',
    description: 'A refined oak door with traditional panel proportions and a warm satin finish.',
    status: 'Available',
  },
  {
    id: 'modern-walnut-entrance-door',
    name: 'Modern Walnut Entrance Door',
    category: 'Entrance Doors',
    price: 'THB 24,500',
    image: require('../../assets/products/modern-walnut-entrance-door.jpg'),
    itemCode: 'IW-002',
    stockQuantity: '5 doors in stock',
    storeAvailability: 'Available at 1 store',
    material: 'Walnut',
    size: '90 x 200 cm',
    finish: 'Dark walnut matte',
    description: 'A bold entrance door with clean modern lines and rich walnut character.',
    status: 'Low Stock',
  },
  {
    id: 'premium-teak-glass-panel-door',
    name: 'Premium Teak Glass Panel Door',
    category: 'Glass Panel Doors',
    price: 'THB 29,900',
    image: require('../../assets/products/premium-teak-glass-panel-door.jpg'),
    itemCode: 'IW-003',
    stockQuantity: '4 doors in stock',
    storeAvailability: 'Available at 3 stores',
    material: 'Teak',
    size: '90 x 200 cm',
    finish: 'Natural teak with clear glass',
    description: 'Premium teak construction paired with a glass panel for bright, elegant spaces.',
    status: 'Low Stock',
  },
  {
    id: 'minimal-ash-interior-door',
    name: 'Minimal Ash Interior Door',
    category: 'Interior Doors',
    price: 'THB 15,900',
    image: require('../../assets/products/minimal-ash-interior-door.jpg'),
    itemCode: 'IW-004',
    stockQuantity: '12 doors in stock',
    storeAvailability: 'Available online only',
    material: 'Ash',
    size: '70 x 200 cm',
    finish: 'Light ash natural',
    description: 'A minimal interior door with a calm ash finish for modern rooms.',
    status: 'Available',
  },
];
