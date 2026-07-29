import { supabase } from '@/lib/supabase';
import { toApiError } from '@/services/api';

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
  photo_id: string | number;
  photo_url: string | null;
  sort_order: number | string | null;
};
type StoreStats = {
  items: number;
  orders: number;
  refunds: number;
  mostSoldProduct: string;
  popularCategory: string;
};

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

function storeImages(store: ApiStore): string[] {
  const photos = store.IW_Store_Photos;
  if (!Array.isArray(photos)) return [];

  return photos
    .filter((photo): photo is StorePhotoRow => Boolean(photo) && typeof photo === 'object')
    .sort((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0))
    .map((photo) => photo.photo_url ?? '')
    .filter((photoUrl) => photoUrl.length > 0);
}

export async function getStores(): Promise<StoreRecord[]> {
  const { data, error } = await supabase
    .from('IW_Stores')
    .select(`
      *,
      IW_Store_Photos!IW_Store_Photos_store_id_fkey (
        photo_id,
        photo_url,
        sort_order
      )
    `)
    .eq('store_status', 'active')
    .order('city');

  console.log('Raw Supabase stores:', data);

  if (error) {
    console.error('Supabase stores error:', error);
    throw toApiError(error, 'Stores could not be loaded.');
  }

  const mappedStores = ((data ?? []) as ApiStore[]).map((store) => {
    const city = String(store.city ?? '');
    const fallback = STORE_STATS[city] ?? DEFAULT_STATS;

    return {
      id: String(store.store_id),
      city,
      country: String(store.country ?? ''),
      employees: String(store.employees ?? ''),
      items: String(store.items ?? fallback.items),
      orders: String(store.orders ?? fallback.orders),
      refunds: String(store.refunds ?? fallback.refunds),
      mostSoldProduct:
        value(store, 'mostSoldProduct', 'most_sold_product') || fallback.mostSoldProduct,
      popularCategory:
        value(store, 'popularCategory', 'popular_category') || fallback.popularCategory,
      satisfaction: String(store.customer_satisfaction ?? ''),
      businessDays: value(store, 'businessDays', 'business_days'),
      openingTime: value(store, 'openingTime', 'opening_time'),
      closingTime: value(store, 'closingTime', 'closing_time'),
      closedDay: value(store, 'closedDay', 'closed_day'),
      timezone: String(store.timezone ?? ''),
      images: storeImages(store),
    };
  });

  console.log('Mapped stores:', mappedStores);
  return mappedStores;
}
