import { apiData } from '@/services/api';

export type StoreRecord = {
  id: string;
  city: string;
  country: string;
  employees: string;
  items: string;
  orders: string;
  refunds: string;
  mostSoldProduct: string;
  popularCategory: string;
  satisfaction: string;
  businessDays: string;
  openingTime: string;
  closingTime: string;
  closedDay: string;
  timezone: string;
  images: string[];
};

type ApiStore = Record<string, unknown>;
type StorePhotoRow = {
  photo_url?: string | null;
  sort_order?: number | string | null;
};
type StoreStats = {
  items: number;
  orders: number;
  refunds: number;
  mostSoldProduct: string;
  popularCategory: string;
};

export type StoreUpdateData = Pick<
  StoreRecord,
  | 'city'
  | 'country'
  | 'employees'
  | 'satisfaction'
  | 'businessDays'
  | 'openingTime'
  | 'closingTime'
  | 'closedDay'
  | 'timezone'
>;

const DEFAULT_STATS: StoreStats = {
  items: 0,
  orders: 0,
  refunds: 0,
  mostSoldProduct: '',
  popularCategory: '',
};

const STORE_STATS: Record<string, StoreStats> = {
  Phuket: {
    items: 156,
    orders: 89,
    refunds: 3,
    mostSoldProduct: 'Imperial Classic Oak Door',
    popularCategory: 'Classic Doors',
  },
  Melbourne: {
    items: 132,
    orders: 76,
    refunds: 2,
    mostSoldProduct: 'Modern Walnut Entrance Door',
    popularCategory: 'Modern Doors',
  },
  'New York City': {
    items: 148,
    orders: 82,
    refunds: 4,
    mostSoldProduct: 'Premium Teak Glass Panel Door',
    popularCategory: 'Glass Panel Doors',
  },
};

const value = (store: ApiStore, camel: string, snake: string): string =>
  String(store[camel] ?? store[snake] ?? '');

const timeValue = (store: ApiStore, camel: string, snake: string): string => {
  const rawValue = value(store, camel, snake);
  const match = /^(\d{1,2}:\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(rawValue);
  return match?.[1] ?? rawValue;
};

function storeImages(store: ApiStore): string[] {
  const source = Array.isArray(store.images)
    ? store.images
    : store.IW_Store_Photos;
  if (!Array.isArray(source)) return [];

  return source
    .map((photo) => {
      if (typeof photo === 'string') return photo;
      if (!photo || typeof photo !== 'object') return '';
      return (photo as StorePhotoRow).photo_url ?? '';
    })
    .filter((photoUrl): photoUrl is string => photoUrl.length > 0);
}

function normalizeStore(store: ApiStore): StoreRecord {
  const city = String(store.city ?? '');
  const fallback = STORE_STATS[city] ?? DEFAULT_STATS;

  return {
    id: String(store.store_id ?? store.id),
    city,
    country: String(store.country ?? ''),
    employees: String(store.employees ?? ''),
    items: String(store.items ?? fallback.items),
    orders: String(store.orders ?? fallback.orders),
    refunds: String(store.refunds ?? fallback.refunds),
    mostSoldProduct:
      value(store, 'mostSoldProduct', 'most_sold_product') ||
      fallback.mostSoldProduct,
    popularCategory:
      value(store, 'popularCategory', 'popular_category') ||
      fallback.popularCategory,
    satisfaction: String(
      store.customer_satisfaction ?? store.satisfaction ?? ''
    ),
    businessDays: value(store, 'businessDays', 'business_days'),
    openingTime: timeValue(store, 'openingTime', 'opening_time'),
    closingTime: timeValue(store, 'closingTime', 'closing_time'),
    closedDay: value(store, 'closedDay', 'closed_day'),
    timezone: String(store.timezone ?? ''),
    images: storeImages(store),
  };
}

export async function getStores(): Promise<StoreRecord[]> {
  const stores = await apiData<ApiStore[]>('/stores');

  return stores.map(normalizeStore);
}

export async function updateStore(
  storeId: string,
  store: StoreUpdateData
): Promise<StoreRecord> {
  const updatedStore = await apiData<ApiStore>(
    `/stores/${encodeURIComponent(storeId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        city: store.city,
        country: store.country,
        employees: Number(store.employees),
        customer_satisfaction: Number(
          store.satisfaction.replace('%', '').trim()
        ),
        business_days: store.businessDays,
        opening_time: store.openingTime,
        closing_time: store.closingTime,
        closed_day: store.closedDay,
        timezone: store.timezone,
      }),
    }
  );

  return normalizeStore(updatedStore);
}
