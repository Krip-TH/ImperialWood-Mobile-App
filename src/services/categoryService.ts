import { apiData } from '@/services/api';

type ApiCategory = {
  category_id: string | number;
  category_name: string;
  category_status?: string | null;
};

export type CategoryOption = {
  categoryId: string;
  name: string;
};

export async function getCategories(): Promise<string[]> {
  const categories = await apiData<ApiCategory[]>('/categories');

  return categories
    .filter((category) => category.category_status !== 'inactive')
    .map((category) => category.category_name);
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const categories = await apiData<ApiCategory[]>('/categories');

  return categories
    .filter((category) => category.category_status !== 'inactive')
    .map((category) => ({
      categoryId: String(category.category_id),
      name: category.category_name,
    }));
}
