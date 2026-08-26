import { supabase, isSupabaseConfigured } from './supabase';

export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: string;
  name: string;
  product_id: string;
  category_id: string;
  quantity: number;
  selling_price: number;
  mrp: number;
  low_stock: number;
  unit: string;
  status: ProductStatus;
  created_at?: string;
  updated_at?: string;
  category?: {
    id: string;
    category_id: string;
    category_name: string;
  };
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockCount: number;
  totalStockUnits: number;
}

export interface CreateProductInput {
  name: string;
  product_id: string;
  category_id: string;
  quantity: number;
  selling_price: number;
  mrp: number;
  low_stock: number;
  unit: string;
  status?: ProductStatus;
}

export interface UpdateProductInput {
  id: string;
  name: string;
  product_id: string;
  category_id: string;
  quantity: number;
  selling_price: number;
  mrp: number;
  low_stock: number;
  unit: string;
  status: ProductStatus;
}

export interface CategoryOption {
  id: string;
  category_id: string;
  category_name: string;
  status: string;
}

// Fallback demo data if offline or supabase is not configured
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    product_id: 'PRD-1001',
    name: 'W180 Jumbo Raw Cashew Nuts 500g',
    category_id: '11111111-2222-3333-4444-555555555551',
    quantity: 45,
    selling_price: 520,
    mrp: 600,
    low_stock: 10,
    unit: 'Packet',
    status: 'active',
    created_at: '2026-08-20T10:00:00.000Z',
    updated_at: '2026-08-23T14:30:00.000Z',
    category: {
      id: '11111111-2222-3333-4444-555555555551',
      category_id: 'cat-102',
      category_name: 'Cashews',
    },
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    product_id: 'PRD-1002',
    name: 'W240 Whole Cashews 1kg Tin',
    category_id: '11111111-2222-3333-4444-555555555551',
    quantity: 4,
    selling_price: 950,
    mrp: 1100,
    low_stock: 10,
    unit: 'Tin',
    status: 'active',
    created_at: '2026-08-21T11:00:00.000Z',
    updated_at: '2026-08-24T09:15:00.000Z',
    category: {
      id: '11111111-2222-3333-4444-555555555551',
      category_id: 'cat-102',
      category_name: 'Cashews',
    },
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    product_id: 'PRD-1003',
    name: 'California Premium Roasted Almonds 500g',
    category_id: '11111111-2222-3333-4444-555555555552',
    quantity: 80,
    selling_price: 480,
    mrp: 550,
    low_stock: 15,
    unit: 'Packet',
    status: 'active',
    created_at: '2026-08-22T08:30:00.000Z',
    updated_at: '2026-08-23T11:45:00.000Z',
    category: {
      id: '11111111-2222-3333-4444-555555555552',
      category_id: 'cat-101',
      category_name: 'Almonds',
    },
  },
];

function extractCategory(cat: any): { id: string; category_id: string; category_name: string } | undefined {
  if (!cat) return undefined;
  if (Array.isArray(cat)) {
    const first = cat[0];
    if (!first) return undefined;
    return {
      id: String(first.id || ''),
      category_id: String(first.category_id || ''),
      category_name: String(first.category_name || ''),
    };
  }
  return {
    id: String(cat.id || ''),
    category_id: String(cat.category_id || ''),
    category_name: String(cat.category_name || ''),
  };
}

/**
 * Fetch categories list for dropdown selector
 */
export async function fetchCategoriesForDropdown(): Promise<{
  data: CategoryOption[];
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      return {
        data: [
          {
            id: '11111111-2222-3333-4444-555555555551',
            category_id: 'cat-102',
            category_name: 'Cashews',
            status: 'active',
          },
          {
            id: '11111111-2222-3333-4444-555555555552',
            category_id: 'cat-101',
            category_name: 'Almonds',
            status: 'active',
          },
        ],
        error: null,
      };
    }

    const { data, error } = await supabase
      .from('categories')
      .select('id, category_id, category_name, status')
      .order('category_name', { ascending: true });

    if (error) {
      console.error('Error fetching categories for dropdown:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err: any) {
    console.error('Unexpected error fetching categories for dropdown:', err);
    return { data: [], error: err?.message || 'Failed to fetch categories' };
  }
}

/**
 * Fetch all products with joined category data and apply search/filter criteria.
 */
export async function fetchProducts(
  searchQuery?: string,
  categoryIdFilter?: string,
  statusFilter?: string,
  lowStockOnly?: boolean
): Promise<{ data: Product[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      let filtered = [...FALLBACK_PRODUCTS];

      if (categoryIdFilter && categoryIdFilter !== 'all') {
        filtered = filtered.filter((p) => p.category_id === categoryIdFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }
      if (lowStockOnly) {
        filtered = filtered.filter((p) => Number(p.quantity) < Number(p.low_stock));
      }
      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.product_id.toLowerCase().includes(q) ||
            p.category?.category_name?.toLowerCase().includes(q)
        );
      }

      return { data: filtered, error: null };
    }

    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        product_id,
        category_id,
        quantity,
        selling_price,
        mrp,
        low_stock,
        unit,
        status,
        created_at,
        updated_at,
        categories (
          id,
          category_id,
          category_name
        )
      `)
      .order('name', { ascending: true });

    if (categoryIdFilter && categoryIdFilter !== 'all') {
      query = query.eq('category_id', categoryIdFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products from supabase:', error);
      return { data: [], error: error.message };
    }

    let results: Product[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      product_id: row.product_id,
      category_id: row.category_id,
      quantity: Number(row.quantity ?? 0),
      selling_price: Number(row.selling_price ?? 0),
      mrp: Number(row.mrp ?? 0),
      low_stock: Number(row.low_stock ?? 0),
      unit: row.unit || 'Piece',
      status: (row.status as ProductStatus) || 'active',
      created_at: row.created_at,
      updated_at: row.updated_at,
      category: extractCategory(row.categories),
    }));

    if (lowStockOnly) {
      results = results.filter((p) => p.quantity < p.low_stock);
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.product_id.toLowerCase().includes(q) ||
          p.category?.category_name?.toLowerCase().includes(q)
      );
    }

    return { data: results, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchProducts:', err);
    return { data: [], error: err?.message || 'Failed to fetch products' };
  }
}

/**
 * Get product inventory summary statistics.
 */
export async function getProductStats(): Promise<{
  stats: ProductStats;
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      const totalProducts = FALLBACK_PRODUCTS.length;
      const activeProducts = FALLBACK_PRODUCTS.filter((p) => p.status === 'active').length;
      const lowStockCount = FALLBACK_PRODUCTS.filter((p) => p.quantity < p.low_stock).length;
      const totalStockUnits = FALLBACK_PRODUCTS.reduce((acc, p) => acc + p.quantity, 0);

      return {
        stats: {
          totalProducts,
          activeProducts,
          lowStockCount,
          totalStockUnits,
        },
        error: null,
      };
    }

    const { data, error } = await supabase
      .from('products')
      .select('quantity, low_stock, status');

    if (error) {
      console.error('Error fetching product stats:', error);
      return {
        stats: { totalProducts: 0, activeProducts: 0, lowStockCount: 0, totalStockUnits: 0 },
        error: error.message,
      };
    }

    const products = data || [];
    const totalProducts = products.length;
    const activeProducts = products.filter((p) => p.status === 'active').length;
    const lowStockCount = products.filter(
      (p) => Number(p.quantity ?? 0) < Number(p.low_stock ?? 0)
    ).length;
    const totalStockUnits = products.reduce(
      (acc, p) => acc + Number(p.quantity ?? 0),
      0
    );

    return {
      stats: {
        totalProducts,
        activeProducts,
        lowStockCount,
        totalStockUnits,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in getProductStats:', err);
    return {
      stats: { totalProducts: 0, activeProducts: 0, lowStockCount: 0, totalStockUnits: 0 },
      error: err?.message || 'Failed to calculate product stats',
    };
  }
}

/**
 * Fetch a single product by ID.
 */
export async function fetchProductById(
  id: string
): Promise<{ data: Product | null; error: string | null }> {
  try {
    if (!id) return { data: null, error: 'Product ID is required' };

    if (!isSupabaseConfigured) {
      const found = FALLBACK_PRODUCTS.find((p) => p.id === id);
      return { data: found || null, error: found ? null : 'Product not found' };
    }

    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        product_id,
        category_id,
        quantity,
        selling_price,
        mrp,
        low_stock,
        unit,
        status,
        created_at,
        updated_at,
        categories (
          id,
          category_id,
          category_name
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product by ID:', error);
      return { data: null, error: error.message };
    }

    if (!data) return { data: null, error: 'Product not found' };

    const product: Product = {
      id: data.id,
      name: data.name,
      product_id: data.product_id,
      category_id: data.category_id,
      quantity: Number(data.quantity ?? 0),
      selling_price: Number(data.selling_price ?? 0),
      mrp: Number(data.mrp ?? 0),
      low_stock: Number(data.low_stock ?? 0),
      unit: data.unit || 'Piece',
      status: (data.status as ProductStatus) || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
      category: extractCategory((data as any).categories),
    };

    return { data: product, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchProductById:', err);
    return { data: null, error: err?.message || 'Failed to fetch product' };
  }
}

/**
 * Suggest next product code (e.g. PRD-1004)
 */
export async function suggestNextProductId(): Promise<string> {
  try {
    if (!isSupabaseConfigured) {
      return `PRD-${1000 + FALLBACK_PRODUCTS.length + 1}`;
    }

    const { data } = await supabase.from('products').select('product_id');

    if (!data || data.length === 0) {
      return 'PRD-1001';
    }

    let maxNum = 1000;
    data.forEach((p) => {
      const match = p.product_id?.match(/PRD-(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    });

    return `PRD-${maxNum + 1}`;
  } catch {
    return 'PRD-1001';
  }
}

/**
 * Create a new product in Supabase.
 */
export async function createProduct(
  input: CreateProductInput
): Promise<{ data: Product | null; error: string | null }> {
  try {
    if (!input.name || !input.name.trim()) {
      return { data: null, error: 'Product Name is required.' };
    }
    if (!input.product_id || !input.product_id.trim()) {
      return { data: null, error: 'Product ID/Code is required.' };
    }
    if (!input.category_id) {
      return { data: null, error: 'Category selection is required.' };
    }
    if (input.quantity < 0) {
      return { data: null, error: 'Quantity cannot be negative.' };
    }
    if (input.selling_price < 0) {
      return { data: null, error: 'Selling Price cannot be negative.' };
    }
    if (input.mrp < 0) {
      return { data: null, error: 'MRP cannot be negative.' };
    }
    if (input.low_stock < 0) {
      return { data: null, error: 'Low Stock threshold cannot be negative.' };
    }

    const cleanProductId = input.product_id.trim().toUpperCase();
    const cleanName = input.name.trim();

    if (!isSupabaseConfigured) {
      const newProduct: Product = {
        id: crypto.randomUUID(),
        name: cleanName,
        product_id: cleanProductId,
        category_id: input.category_id,
        quantity: Number(input.quantity || 0),
        selling_price: Number(input.selling_price || 0),
        mrp: Number(input.mrp || 0),
        low_stock: Number(input.low_stock || 0),
        unit: input.unit || 'Piece',
        status: input.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      FALLBACK_PRODUCTS.unshift(newProduct);
      return { data: newProduct, error: null };
    }

    // Check duplicate product_id
    const { data: existingCode } = await supabase
      .from('products')
      .select('id')
      .ilike('product_id', cleanProductId)
      .maybeSingle();

    if (existingCode) {
      return {
        data: null,
        error: `Product Code "${cleanProductId}" is already in use. Please choose a unique code.`,
      };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: cleanName,
        product_id: cleanProductId,
        category_id: input.category_id,
        quantity: Number(input.quantity || 0),
        selling_price: Number(input.selling_price || 0),
        mrp: Number(input.mrp || 0),
        low_stock: Number(input.low_stock || 0),
        unit: input.unit || 'Piece',
        status: input.status || 'active',
        created_at: now,
        updated_at: now,
      })
      .select(`
        id,
        name,
        product_id,
        category_id,
        quantity,
        selling_price,
        mrp,
        low_stock,
        unit,
        status,
        created_at,
        updated_at,
        categories (
          id,
          category_id,
          category_name
        )
      `)
      .single();

    if (error) {
      console.error('Error inserting product:', error);
      return { data: null, error: error.message };
    }

    const created: Product = {
      id: data.id,
      name: data.name,
      product_id: data.product_id,
      category_id: data.category_id,
      quantity: Number(data.quantity ?? 0),
      selling_price: Number(data.selling_price ?? 0),
      mrp: Number(data.mrp ?? 0),
      low_stock: Number(data.low_stock ?? 0),
      unit: data.unit || 'Piece',
      status: (data.status as ProductStatus) || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
      category: extractCategory((data as any).categories),
    };

    return { data: created, error: null };
  } catch (err: any) {
    console.error('Unexpected error creating product:', err);
    return { data: null, error: err?.message || 'Failed to create product' };
  }
}

/**
 * Update all fields of an existing product in Supabase.
 */
export async function updateProduct(
  input: UpdateProductInput
): Promise<{ data: Product | null; error: string | null }> {
  try {
    if (!input.id) {
      return { data: null, error: 'Product internal ID is required.' };
    }
    if (!input.name || !input.name.trim()) {
      return { data: null, error: 'Product Name is required.' };
    }
    if (!input.product_id || !input.product_id.trim()) {
      return { data: null, error: 'Product Code is required.' };
    }
    if (!input.category_id) {
      return { data: null, error: 'Category selection is required.' };
    }
    if (input.quantity < 0) {
      return { data: null, error: 'Quantity cannot be negative.' };
    }
    if (input.selling_price < 0) {
      return { data: null, error: 'Selling Price cannot be negative.' };
    }
    if (input.mrp < 0) {
      return { data: null, error: 'MRP cannot be negative.' };
    }
    if (input.low_stock < 0) {
      return { data: null, error: 'Low Stock threshold cannot be negative.' };
    }

    const cleanProductId = input.product_id.trim().toUpperCase();
    const cleanName = input.name.trim();

    if (!isSupabaseConfigured) {
      const idx = FALLBACK_PRODUCTS.findIndex((p) => p.id === input.id);
      if (idx >= 0) {
        FALLBACK_PRODUCTS[idx] = {
          ...FALLBACK_PRODUCTS[idx],
          name: cleanName,
          product_id: cleanProductId,
          category_id: input.category_id,
          quantity: Number(input.quantity || 0),
          selling_price: Number(input.selling_price || 0),
          mrp: Number(input.mrp || 0),
          low_stock: Number(input.low_stock || 0),
          unit: input.unit || 'Piece',
          status: input.status,
          updated_at: new Date().toISOString(),
        };
        return { data: FALLBACK_PRODUCTS[idx], error: null };
      }
      return { data: null, error: 'Product not found.' };
    }

    // Check duplicate product_id on other records
    const { data: duplicateCode } = await supabase
      .from('products')
      .select('id')
      .ilike('product_id', cleanProductId)
      .neq('id', input.id)
      .maybeSingle();

    if (duplicateCode) {
      return {
        data: null,
        error: `Product Code "${cleanProductId}" is already used by another product.`,
      };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('products')
      .update({
        name: cleanName,
        product_id: cleanProductId,
        category_id: input.category_id,
        quantity: Number(input.quantity || 0),
        selling_price: Number(input.selling_price || 0),
        mrp: Number(input.mrp || 0),
        low_stock: Number(input.low_stock || 0),
        unit: input.unit || 'Piece',
        status: input.status,
        updated_at: now,
      })
      .eq('id', input.id)
      .select(`
        id,
        name,
        product_id,
        category_id,
        quantity,
        selling_price,
        mrp,
        low_stock,
        unit,
        status,
        created_at,
        updated_at,
        categories (
          id,
          category_id,
          category_name
        )
      `)
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return { data: null, error: error.message };
    }

    const updated: Product = {
      id: data.id,
      name: data.name,
      product_id: data.product_id,
      category_id: data.category_id,
      quantity: Number(data.quantity ?? 0),
      selling_price: Number(data.selling_price ?? 0),
      mrp: Number(data.mrp ?? 0),
      low_stock: Number(data.low_stock ?? 0),
      unit: data.unit || 'Piece',
      status: (data.status as ProductStatus) || 'active',
      created_at: data.created_at,
      updated_at: data.updated_at,
      category: extractCategory((data as any).categories),
    };

    return { data: updated, error: null };
  } catch (err: any) {
    console.error('Unexpected error updating product:', err);
    return { data: null, error: err?.message || 'Failed to update product' };
  }
}

/**
 * Delete a product by ID.
 */
export async function deleteProduct(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!id) {
      return { success: false, error: 'Product ID is required.' };
    }

    if (!isSupabaseConfigured) {
      const idx = FALLBACK_PRODUCTS.findIndex((p) => p.id === id);
      if (idx >= 0) {
        FALLBACK_PRODUCTS.splice(idx, 1);
        return { success: true, error: null };
      }
      return { success: false, error: 'Product not found.' };
    }

    // Check if bill items or purchase items reference this product
    const { count: billCount } = await supabase
      .from('bill_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    if (billCount && billCount > 0) {
      return {
        success: false,
        error: `Cannot delete product because it is referenced in ${billCount} billing records. You may set its status to Inactive instead.`,
      };
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Unexpected error in deleteProduct:', err);
    return { success: false, error: err?.message || 'Failed to delete product' };
  }
}
