import { supabase } from '@/lib/supabase';
import { toApiError } from '@/services/api';

type Category = { category_id: string; name: string };

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('IW_Categories')
    .select('category_id, name')
    .order('name');

  if (error) {
    throw toApiError(error, 'Categories could not be loaded.');
  }

  return ((data ?? []) as Category[])
    .map((category) => category.name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
}
