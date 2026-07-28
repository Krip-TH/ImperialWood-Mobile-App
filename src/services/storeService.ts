import { apiRequest } from '@/services/api';

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

export async function getStores(): Promise<StoreRecord[]> {
  const response = await apiRequest<{ stores: ApiStore[] }>('/stores');
  if (!Array.isArray(response.stores)) throw new Error('Invalid store response.');

  return response.stores.map((store) => ({
    id: String(store.id),
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
    images: Array.isArray(store.images)
      ? store.images.filter((image): image is string => typeof image === 'string')
      : [],
  }));
}
