import { apiRequest } from '@/services/api';

type Category = { id: string; name: string };

export async function getCategories(): Promise<string[]> {
  const response = await apiRequest<{ categories: Category[] }>('/categories');
  if (!Array.isArray(response.categories)) throw new Error('Invalid category response.');
  return response.categories
    .map((category) => category.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
}
