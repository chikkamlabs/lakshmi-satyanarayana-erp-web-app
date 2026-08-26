import { supabase, isSupabaseConfigured } from './supabase';

export type CategoryStatus = 'active' | 'inactive';

export interface Category {
  id: string;
  category_id: string;
  category_name: string;
  status: CategoryStatus;
  created_at: string;
  updated_at: string;
  total_products?: number;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
}

export interface CreateCategoryInput {
  category_id: string;
  category_name: string;
  status?: CategoryStatus;
}

export interface UpdateCategoryInput {
  id: string;
  category_id: string;
  category_name: string;
  status: CategoryStatus;
}

// Fallback demo categories when offline or empty
const FALLBACK_CATEGORIES: Category[] = [
  {
    id: '11111111-2222-3333-4444-555555555551',
    category_id: 'cat-102',
    category_name: 'Cashews',
    status: 'active',
    created_at: '2026-08-22T10:00:00.000Z',
    updated_at: '2026-08-22T10:00:00.000Z',
    total_products: 4,
  },
  {
    id: '11111111-2222-3333-4444-555555555552',
    category_id: 'cat-101',
    category_name: 'Almonds',
    status: 'active',
    created_at: '2026-08-22T09:30:00.000Z',
    updated_at: '2026-08-22T09:30:00.000Z',
    total_products: 6,
  },
];

/**
 * Fetch all categories with product counts and apply search/status filters.
 */
export async function fetchCategories(
  searchQuery?: string,
  statusFilter?: string
): Promise<{ data: Category[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      let filtered = [...FALLBACK_CATEGORIES];
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter((c) => c.status === statusFilter);
      }
      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (c) =>
            c.category_name.toLowerCase().includes(q) ||
            c.category_id.toLowerCase().includes(q)
        );
      }
      return { data: filtered, error: null };
    }

    // Fetch categories from Supabase
    let query = supabase
      .from('categories')
      .select('*')
      .order('category_id', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data: categoriesData, error: catError } = await query;

    if (catError) {
      console.error('Error fetching categories:', catError);
      return { data: [], error: catError.message };
    }

    if (!categoriesData || categoriesData.length === 0) {
      return { data: [], error: null };
    }

    // Fetch product counts per category
    const catIds = categoriesData.map((c) => c.id);
    const { data: productsData, error: prodError } = await supabase
      .from('products')
      .select('category_id')
      .in('category_id', catIds);

    const productCountMap = new Map<string, number>();
    if (!prodError && productsData) {
      productsData.forEach((p: { category_id?: string | null }) => {
        if (p.category_id) {
          productCountMap.set(
            p.category_id,
            (productCountMap.get(p.category_id) || 0) + 1
          );
        }
      });
    }

    const categoriesWithProducts: Category[] = categoriesData.map((c) => ({
      ...c,
      total_products: productCountMap.get(c.id) || 0,
    }));

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const filtered = categoriesWithProducts.filter(
        (c) =>
          c.category_name?.toLowerCase().includes(q) ||
          c.category_id?.toLowerCase().includes(q)
      );
      return { data: filtered, error: null };
    }

    return { data: categoriesWithProducts, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchCategories:', err);
    return { data: [], error: err?.message || 'Failed to fetch categories' };
  }
}

/**
 * Fetch category summary stats (Total, Active, Inactive).
 */
export async function getCategoryStats(): Promise<{
  stats: CategoryStats;
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      const total = FALLBACK_CATEGORIES.length;
      const active = FALLBACK_CATEGORIES.filter((c) => c.status === 'active').length;
      const inactive = FALLBACK_CATEGORIES.filter((c) => c.status === 'inactive').length;
      return {
        stats: {
          totalCategories: total,
          activeCategories: active,
          inactiveCategories: inactive,
        },
        error: null,
      };
    }

    const { data, error } = await supabase
      .from('categories')
      .select('status');

    if (error) {
      console.error('Error fetching category stats:', error);
      return {
        stats: { totalCategories: 0, activeCategories: 0, inactiveCategories: 0 },
        error: error.message,
      };
    }

    const totalCategories = data?.length || 0;
    const activeCategories = data?.filter((c) => c.status === 'active').length || 0;
    const inactiveCategories = data?.filter((c) => c.status === 'inactive').length || 0;

    return {
      stats: {
        totalCategories,
        activeCategories,
        inactiveCategories,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in getCategoryStats:', err);
    return {
      stats: { totalCategories: 0, activeCategories: 0, inactiveCategories: 0 },
      error: err?.message || 'Failed to fetch stats',
    };
  }
}

/**
 * Fetch a single category by ID.
 */
export async function fetchCategoryById(
  id: string
): Promise<{ data: Category | null; error: string | null }> {
  try {
    if (!id) {
      return { data: null, error: 'Category ID is required' };
    }

    if (!isSupabaseConfigured) {
      const found = FALLBACK_CATEGORIES.find((c) => c.id === id);
      return { data: found || null, error: found ? null : 'Category not found' };
    }

    const { data: categoryData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (catError) {
      console.error('Error fetching category by id:', catError);
      return { data: null, error: catError.message };
    }

    if (!categoryData) {
      return { data: null, error: 'Category not found' };
    }

    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    const category: Category = {
      ...categoryData,
      total_products: count ?? 0,
    };

    return { data: category, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchCategoryById:', err);
    return { data: null, error: err?.message || 'Failed to fetch category' };
  }
}

/**
 * Generate a suggested next category_id (e.g. cat-103)
 */
export async function suggestNextCategoryId(): Promise<string> {
  try {
    if (!isSupabaseConfigured) {
      return 'cat-103';
    }

    const { data } = await supabase
      .from('categories')
      .select('category_id');

    if (!data || data.length === 0) {
      return 'cat-101';
    }

    let maxNum = 100;
    data.forEach((c) => {
      const match = c.category_id?.match(/cat-(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    });

    return `cat-${maxNum + 1}`;
  } catch {
    return 'cat-101';
  }
}

/**
 * Create a new category in Supabase.
 */
export async function createCategory(
  input: CreateCategoryInput
): Promise<{ data: Category | null; error: string | null }> {
  try {
    const cleanName = (input.category_name || '').trim();
    if (!cleanName) {
      return { data: null, error: 'Category Name is required' };
    }

    const cleanId = (input.category_id || '').trim() || (await suggestNextCategoryId());

    if (!isSupabaseConfigured) {
      const newCat: Category = {
        id: crypto.randomUUID(),
        category_id: cleanId,
        category_name: cleanName,
        status: input.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_products: 0,
      };
      FALLBACK_CATEGORIES.unshift(newCat);
      return { data: newCat, error: null };
    }

    // Check if category_id or category_name already exists
    const { data: existingId } = await supabase
      .from('categories')
      .select('id')
      .ilike('category_id', cleanId)
      .maybeSingle();

    if (existingId) {
      return { data: null, error: `Category ID "${cleanId}" is already taken.` };
    }

    const { data: existingName } = await supabase
      .from('categories')
      .select('id')
      .ilike('category_name', cleanName)
      .maybeSingle();

    if (existingName) {
      return { data: null, error: `Category Name "${cleanName}" already exists.` };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('categories')
      .insert({
        category_id: cleanId,
        category_name: cleanName,
        status: input.status || 'active',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting category:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        total_products: 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in createCategory:', err);
    return { data: null, error: err?.message || 'Failed to create category' };
  }
}

/**
 * Update all editable fields of an existing category.
 */
export async function updateCategory(
  input: UpdateCategoryInput
): Promise<{ data: Category | null; error: string | null }> {
  try {
    if (!input.id) {
      return { data: null, error: 'Category internal ID is required.' };
    }
    if (!input.category_id || !input.category_id.trim()) {
      return { data: null, error: 'Category ID is required.' };
    }
    if (!input.category_name || !input.category_name.trim()) {
      return { data: null, error: 'Category Name is required.' };
    }

    const cleanId = input.category_id.trim();
    const cleanName = input.category_name.trim();

    if (!isSupabaseConfigured) {
      const idx = FALLBACK_CATEGORIES.findIndex((c) => c.id === input.id);
      if (idx >= 0) {
        FALLBACK_CATEGORIES[idx] = {
          ...FALLBACK_CATEGORIES[idx],
          category_id: cleanId,
          category_name: cleanName,
          status: input.status,
          updated_at: new Date().toISOString(),
        };
        return { data: FALLBACK_CATEGORIES[idx], error: null };
      }
      return { data: null, error: 'Category not found.' };
    }

    // Check for duplicate category_id on other records
    const { data: duplicateId } = await supabase
      .from('categories')
      .select('id')
      .ilike('category_id', cleanId)
      .neq('id', input.id)
      .maybeSingle();

    if (duplicateId) {
      return { data: null, error: `Category ID "${cleanId}" is already used by another category.` };
    }

    // Check for duplicate category_name on other records
    const { data: duplicateName } = await supabase
      .from('categories')
      .select('id')
      .ilike('category_name', cleanName)
      .neq('id', input.id)
      .maybeSingle();

    if (duplicateName) {
      return { data: null, error: `Category Name "${cleanName}" is already used by another category.` };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('categories')
      .update({
        category_id: cleanId,
        category_name: cleanName,
        status: input.status,
        updated_at: now,
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Unexpected error in updateCategory:', err);
    return { data: null, error: err?.message || 'Failed to update category' };
  }
}

/**
 * Delete a category by ID (if not linked to existing products).
 */
export async function deleteCategory(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!id) {
      return { success: false, error: 'Category ID is required' };
    }

    if (!isSupabaseConfigured) {
      const idx = FALLBACK_CATEGORIES.findIndex((c) => c.id === id);
      if (idx >= 0) {
        FALLBACK_CATEGORIES.splice(idx, 1);
        return { success: true, error: null };
      }
      return { success: false, error: 'Category not found.' };
    }

    // Check if products exist for this category
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete category because it has ${count} product(s) linked to it. Please reassign or remove the products first.`,
      };
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete category' };
  }
}
