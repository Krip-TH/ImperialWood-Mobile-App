import { supabase } from '@/lib/supabase';
import { toApiError } from '@/services/api';

export type CategoryOption = {
  categoryId: string;
  name: string;
};

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('IW_Categories')
    .select('category_name')
    .eq('category_status', 'active')
    .order('category_name', { ascending: true });

  if (error) {
    throw toApiError(error, 'Categories could not be loaded.');
  }

  return (data ?? []).map((row) => row.category_name);
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const { data, error } = await supabase
    .from('IW_Categories')
    .select('category_id, category_name')
    .order('category_name', { ascending: true });

  if (error) {
    throw toApiError(error, 'Categories could not be loaded.');
  }

  return (data ?? []).map((row) => ({
    categoryId: String(row.category_id),
    name: row.category_name,
  }));
}
