import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { CustomerAccount, loadCustomerAccounts } from '@/lib/customerAccounts';

export type ProductStatus = 'Available' | 'Low Stock' | 'Out of Stock';
export type UserRole = 'client' | 'admin';

export type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  image_url?: string;
  itemCode: string;
  stockQuantity: string;
  storeAvailability: string;
  material: string;
  size: string;
  finish: string;
  description: string;
  status: ProductStatus;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

type AppContextValue = {
  role: UserRole | null;
  currentCustomer: CustomerAccount | null;
  products: Product[];
  favoriteIds: string[];
  favoriteProducts: Product[];
  cartItems: CartItem[];
  cartItemCount: number;
  cartSubtotal: number;
  categoryList: string[];
  addProductCategories: string[];
  materialOptions: string[];
  sizeOptions: string[];
  storeOptions: string[];
  notice: string;
  nextItemCode: string;
  totalStock: number;
  login: (role: UserRole, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  addProduct: (product: Product) => void;
  replaceProducts: (products: Product[]) => void;
  toggleFavorite: (productId: string) => void;
  addToCart: (product: Product) => void;
  increaseCartItem: (productId: string) => void;
  decreaseCartItem: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  deleteProduct: (productId: string) => void;
  deleteSampleProduct: () => void;
  clearFavorites: () => void;
  getProductById: (productId: string) => Product | undefined;
};

const initialProducts: Product[] = [
  {
    id: 'imperial-classic-oak-door',
    name: 'Imperial Classic Oak Door',
    category: 'Classic Doors',
    price: 'THB 18,900',
    image_url: 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/imperial-classic-oak-door.jpg',
    itemCode: 'IW-001',
    stockQuantity: '8',
    storeAvailability: '2 stores',
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
    image_url: 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/modern-walnut-entrance-door.jpg',
    itemCode: 'IW-002',
    stockQuantity: '5',
    storeAvailability: '1 store',
    material: 'Walnut',
    size: '90 x 200 cm',
    finish: 'Dark walnut matte',
    description: 'A bold entrance door with clean modern lines and rich walnut character.',
    status: 'Available',
  },
  {
    id: 'premium-teak-glass-panel-door',
    name: 'Premium Teak Glass Panel Door',
    category: 'Glass Panel Doors',
    price: 'THB 29,900',
    image_url: 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/premium-teak-glass-panel-door.jpg',
    itemCode: 'IW-003',
    stockQuantity: '4',
    storeAvailability: '3 stores',
    material: 'Teak',
    size: '90 x 200 cm',
    finish: 'Natural teak with clear glass',
    description: 'Premium teak construction paired with a glass panel for bright, elegant spaces.',
    status: 'Available',
  },
  {
    id: 'minimal-ash-interior-door',
    name: 'Minimal Ash Interior Door',
    category: 'Interior Doors',
    price: 'THB 15,900',
    image_url: 'https://raw.githubusercontent.com/Krip-TH/ImperialWood-Mobile-App/refs/heads/main/assets/products/minimal-ash-interior-door.jpg',
    itemCode: 'IW-004',
    stockQuantity: '12',
    storeAvailability: 'Online only',
    material: 'Ash',
    size: '70 x 200 cm',
    finish: 'Light ash natural',
    description: 'A minimal interior door with a calm ash finish for modern rooms.',
    status: 'Available',
  },
];

export const categoryList = [
  'Solid Wood Doors',
  'Modern Doors',
  'Classic Doors',
  'Glass Panel Doors',
  'Entrance Doors',
  'Interior Doors',
  'Door Frames',
  'Accessories',
];
export const addProductCategories = [
  'Solid Wood Doors',
  'Modern Doors',
  'Classic Doors',
  'Glass Panel Doors',
  'Entrance Doors',
  'Interior Doors',
  'Door Frames',
  'Accessories',
];
export const materialOptions = ['Teak', 'Oak', 'Walnut', 'Ash', 'Mahogany', 'Engineered Wood'];
export const sizeOptions = ['70 x 200 cm', '80 x 200 cm', '90 x 200 cm', 'Custom Size'];
export const storeOptions = ['1 store', '2 stores', '3 stores', 'Online only'];

const AppContext = createContext<AppContextValue | null>(null);
const CART_STORAGE_KEY = '@imperialwood/cart';

function numericPrice(price: string) {
  return Number(price.replace(/[^0-9.]/g, '')) || 0;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerAccount | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartReady, setCartReady] = useState(false);
  const [nextItemNumber, setNextItemNumber] = useState(5);
  const [notice, setNotice] = useState('');
  const replaceProducts = useCallback((catalogProducts: Product[]) => {
    setProducts(catalogProducts);
  }, []);
  const login = useCallback(async (
    selectedRole: UserRole,
    username: string,
    password: string
  ): Promise<boolean> => {
    if (selectedRole === 'admin') {
      const isAdminLogin = username === 'Krip' && password === 'b73882548';

      if (isAdminLogin) {
        setRole('admin');
        setCurrentCustomer(null);
        setNotice('');
      }

      return isAdminLogin;
    }

    const accounts = await loadCustomerAccounts();
    const customer = accounts.find(
      (account) => account.username === username && account.password === password
    );

    if (!customer) return false;

    setRole('client');
    setCurrentCustomer(customer);
    setNotice('');
    return true;
  }, []);

  const favoriteProducts = products.filter((product) => favoriteIds.includes(product.id));
  const cartItems = products
    .filter((product) => Boolean(cartQuantities[product.id]))
    .map((product) => ({ product, quantity: cartQuantities[product.id] }));
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cartItems.reduce(
    (total, item) => total + numericPrice(item.product.price) * item.quantity,
    0
  );
  const totalStock = products.reduce(
    (total, product) => total + Number.parseInt(product.stockQuantity, 10),
    0
  );
  const nextItemCode = `IW-${String(nextItemNumber).padStart(3, '0')}`;

  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((savedCart) => {
        if (savedCart) {
          const parsed: unknown = JSON.parse(savedCart);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            setCartQuantities(parsed as Record<string, number>);
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setCartReady(true));
  }, []);

  useEffect(() => {
    if (cartReady) {
      void AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartQuantities));
    }
  }, [cartQuantities, cartReady]);

  const value = useMemo<AppContextValue>(
    () => ({
      role,
      currentCustomer,
      products,
      favoriteIds,
      favoriteProducts,
      cartItems,
      cartItemCount,
      cartSubtotal,
      categoryList,
      addProductCategories,
      materialOptions,
      sizeOptions,
      storeOptions,
      notice,
      nextItemCode,
      totalStock,
      login,
      logout: () => {
        setRole(null);
        setCurrentCustomer(null);
        setNotice('');
      },
      addProduct: (product) => {
        setProducts((currentProducts) => [product, ...currentProducts]);
        setNextItemNumber((currentNumber) => currentNumber + 1);
        setNotice('Door saved locally.');
      },
      replaceProducts,
      toggleFavorite: (productId) => {
        setFavoriteIds((currentFavorites) =>
          currentFavorites.includes(productId)
            ? currentFavorites.filter((id) => id !== productId)
            : [...currentFavorites, productId]
        );
      },
      addToCart: (product) => {
        if (product.status === 'Out of Stock') return;
        setCartQuantities((current) => ({
          ...current,
          [product.id]: (current[product.id] ?? 0) + 1,
        }));
        setNotice(`${product.name} added to cart.`);
      },
      increaseCartItem: (productId) => {
        setCartQuantities((current) => ({
          ...current,
          [productId]: (current[productId] ?? 0) + 1,
        }));
      },
      decreaseCartItem: (productId) => {
        setCartQuantities((current) => {
          const nextQuantity = (current[productId] ?? 0) - 1;
          if (nextQuantity <= 0) {
            const { [productId]: _removed, ...remaining } = current;
            return remaining;
          }
          return { ...current, [productId]: nextQuantity };
        });
      },
      removeFromCart: (productId) => {
        setCartQuantities((current) => {
          const { [productId]: _removed, ...remaining } = current;
          return remaining;
        });
      },
      deleteProduct: (productId) => {
        setProducts((currentProducts) =>
          currentProducts.filter((product) => product.id !== productId)
        );
        setFavoriteIds((currentFavorites) => currentFavorites.filter((id) => id !== productId));
        setNotice('Door deleted successfully.');
      },
      deleteSampleProduct: () => {
        const sampleProduct = products.find((product) =>
          [
            'imperial-classic-oak-door',
            'modern-walnut-entrance-door',
            'premium-teak-glass-panel-door',
            'minimal-ash-interior-door',
          ].includes(product.id)
        );

        if (sampleProduct) {
          setProducts((currentProducts) =>
            currentProducts.filter((product) => product.id !== sampleProduct.id)
          );
          setFavoriteIds((currentFavorites) =>
            currentFavorites.filter((id) => id !== sampleProduct.id)
          );
          setNotice('Door deleted successfully.');
        }
      },
      clearFavorites: () => {
        setFavoriteIds([]);
        setNotice('Favorites cleared.');
      },
      getProductById: (productId) => products.find((product) => product.id === productId),
    }),
    [cartItemCount, cartItems, cartSubtotal, currentCustomer, favoriteIds, favoriteProducts, login, nextItemCode, notice, products, replaceProducts, role, totalStock]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error('useAppContext must be used inside AppProvider');
  }

  return value;
}

export function getProductStatus(stockQuantity: string): ProductStatus {
  const stock = Number.parseInt(stockQuantity, 10);

  if (Number.isNaN(stock) || stock <= 0) {
    return 'Out of Stock';
  }

  if (stock <= 5) {
    return 'Low Stock';
  }

  return 'Available';
}
