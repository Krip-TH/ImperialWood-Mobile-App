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

const value = (store: ApiStore, camel: string, snake: string): string =>
  String(store[camel] ?? store[snake] ?? '');

function storeImages(store: ApiStore): string[] {
  const photos = store.IW_Store_Photos;
  if (!Array.isArray(photos)) return [];

  return photos
    .map((photo) => {
      if (!photo || typeof photo !== 'object') return '';
      const row = photo as Record<string, unknown>;
      return String(row.image_url ?? row.photo_url ?? row.url ?? row.path ?? '');
    })
    .filter((image) => image.length > 0);
}

export async function getStores(): Promise<StoreRecord[]> {
  const { data, error } = await supabase
    .from('IW_Stores')
    .select('*, IW_Store_Photos(*)')
    .order('city');

  if (error) {
    throw toApiError(error, 'Stores could not be loaded.');
  }

  return ((data ?? []) as ApiStore[]).map((store) => ({
    id: String(store.store_id),
    city: String(store.city ?? ''),
    country: String(store.country ?? ''),
    employees: String(store.employees ?? ''),
    items: String(store.items ?? ''),
    orders: String(store.orders ?? ''),
    refunds: String(store.refunds ?? ''),
    mostSoldProduct: value(store, 'mostSoldProduct', 'most_sold_product'),
    popularCategory: value(store, 'popularCategory', 'popular_category'),
    satisfaction: String(store.satisfaction ?? ''),
    businessDays: value(store, 'businessDays', 'business_days'),
    openingTime: value(store, 'openingTime', 'opening_time'),
    closingTime: value(store, 'closingTime', 'closing_time'),
    closedDay: value(store, 'closedDay', 'closed_day'),
    timezone: String(store.timezone ?? ''),
    images: storeImages(store),
  }));
}
