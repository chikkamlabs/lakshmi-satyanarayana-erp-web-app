import { supabase, isSupabaseConfigured } from './supabase';

export type DistributorStatus = 'active' | 'inactive';

export interface Distributor {
  id: string;
  distributor_id: string;
  distributor_name: string;
  address?: string | null;
  mobile?: string | null;
  gstin?: string | null;
  status: DistributorStatus;
  created_at: string;
  updated_at: string;
  total_purchases?: number;
}

export interface DistributorStats {
  totalDistributors: number;
  totalPurchases: number;
  totalUnitsProcured: number;
}

export interface CreateDistributorInput {
  distributor_id: string;
  distributor_name: string;
  address?: string;
  mobile?: string;
  gstin?: string;
  status?: DistributorStatus;
}

export interface UpdateDistributorInput {
  id: string;
  distributor_id: string;
  distributor_name: string;
  address?: string;
  mobile?: string;
  gstin?: string;
  status: DistributorStatus;
}

// Fallback demo distributors when offline or empty
const FALLBACK_DISTRIBUTORS: Distributor[] = [
  {
    id: '22222222-3333-4444-5555-666666666661',
    distributor_id: 'distri-102',
    distributor_name: 'raju dry fruits',
    address: 'hyd',
    mobile: '9876543210',
    gstin: '36AAAAA0000A1Z5',
    status: 'active',
    created_at: '2026-08-20T10:00:00.000Z',
    updated_at: '2026-08-20T10:00:00.000Z',
    total_purchases: 1,
  },
  {
    id: '22222222-3333-4444-5555-666666666662',
    distributor_id: 'distri-101',
    distributor_name: 'KL brothers',
    address: 'Mumbai',
    mobile: '9876543211',
    gstin: '27BBBBB1111B2Y6',
    status: 'active',
    created_at: '2026-08-18T09:30:00.000Z',
    updated_at: '2026-08-18T09:30:00.000Z',
    total_purchases: 3,
  },
];

/**
 * Fetch all distributors and their total purchases count.
 */
export async function fetchDistributors(
  searchQuery?: string
): Promise<{ data: Distributor[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      let filtered = [...FALLBACK_DISTRIBUTORS];
      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (d) =>
            d.distributor_name.toLowerCase().includes(q) ||
            d.distributor_id.toLowerCase().includes(q) ||
            d.address?.toLowerCase().includes(q) ||
            d.mobile?.toLowerCase().includes(q)
        );
      }
      return { data: filtered, error: null };
    }

    const { data: distributorsData, error: distError } = await supabase
      .from('distributors')
      .select('*')
      .order('distributor_id', { ascending: false });

    if (distError) {
      console.error('Error fetching distributors:', distError);
      return { data: [], error: distError.message };
    }

    if (!distributorsData || distributorsData.length === 0) {
      return { data: [], error: null };
    }

    // Fetch purchases count per distributor
    const distIds = distributorsData.map((d) => d.id);
    const { data: purchasesData, error: purchError } = await supabase
      .from('purchases')
      .select('distributor_id')
      .in('distributor_id', distIds);

    const purchaseCountMap = new Map<string, number>();
    if (!purchError && purchasesData) {
      purchasesData.forEach((p: { distributor_id?: string | null }) => {
        if (p.distributor_id) {
          purchaseCountMap.set(
            p.distributor_id,
            (purchaseCountMap.get(p.distributor_id) || 0) + 1
          );
        }
      });
    }

    const distributorsWithPurchases: Distributor[] = distributorsData.map((d) => ({
      ...d,
      total_purchases: purchaseCountMap.get(d.id) || 0,
    }));

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const filtered = distributorsWithPurchases.filter((d) => {
        const nameMatch = d.distributor_name?.toLowerCase().includes(q);
        const idMatch = d.distributor_id?.toLowerCase().includes(q);
        const addressMatch = d.address?.toLowerCase().includes(q);
        const mobileMatch = d.mobile?.toLowerCase().includes(q);
        return Boolean(nameMatch || idMatch || addressMatch || mobileMatch);
      });
      return { data: filtered, error: null };
    }

    return { data: distributorsWithPurchases, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchDistributors:', err);
    return { data: [], error: err?.message || 'Failed to fetch distributors' };
  }
}

/**
 * Fetch stats for distributors dashboard (Total Distributors, Total Purchases, Total Units Procured).
 */
export async function getDistributorStats(): Promise<{
  stats: DistributorStats;
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      const totalDist = FALLBACK_DISTRIBUTORS.length;
      const totalPurch = FALLBACK_DISTRIBUTORS.reduce((acc, d) => acc + (d.total_purchases || 0), 0);
      return {
        stats: {
          totalDistributors: totalDist,
          totalPurchases: totalPurch,
          totalUnitsProcured: 100,
        },
        error: null,
      };
    }

    // 1. Total distributors count
    const { count: distCount, error: distError } = await supabase
      .from('distributors')
      .select('*', { count: 'exact', head: true });

    if (distError) {
      console.error('Error fetching distributor count:', distError);
    }

    // 2. Total purchases and total units procured
    const { data: purchasesData, error: purchError } = await supabase
      .from('purchases')
      .select('total_items');

    if (purchError) {
      console.error('Error fetching purchases data for stats:', purchError);
    }

    const totalPurchases = purchasesData?.length || 0;
    const totalUnitsProcured =
      purchasesData?.reduce((acc, p) => acc + (Number(p.total_items) || 0), 0) || 0;

    return {
      stats: {
        totalDistributors: distCount || 0,
        totalPurchases,
        totalUnitsProcured,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in getDistributorStats:', err);
    return {
      stats: { totalDistributors: 0, totalPurchases: 0, totalUnitsProcured: 0 },
      error: err?.message || 'Failed to fetch distributor stats',
    };
  }
}

/**
 * Fetch a single distributor by ID.
 */
export async function fetchDistributorById(
  id: string
): Promise<{ data: Distributor | null; error: string | null }> {
  try {
    if (!id) {
      return { data: null, error: 'Distributor ID is required' };
    }

    if (!isSupabaseConfigured) {
      const found = FALLBACK_DISTRIBUTORS.find((d) => d.id === id);
      return { data: found || null, error: found ? null : 'Distributor not found' };
    }

    const { data: distributorData, error: distError } = await supabase
      .from('distributors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (distError) {
      console.error('Error fetching distributor by id:', distError);
      return { data: null, error: distError.message };
    }

    if (!distributorData) {
      return { data: null, error: 'Distributor not found' };
    }

    const { count } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('distributor_id', id);

    const distributor: Distributor = {
      ...distributorData,
      total_purchases: count ?? 0,
    };

    return { data: distributor, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchDistributorById:', err);
    return { data: null, error: err?.message || 'Failed to fetch distributor' };
  }
}

/**
 * Generate a suggested next distributor_id (e.g. distri-103)
 */
export async function suggestNextDistributorId(): Promise<string> {
  try {
    if (!isSupabaseConfigured) {
      let maxNum = 100;
      FALLBACK_DISTRIBUTORS.forEach((d) => {
        const match = d.distributor_id?.match(/distri-(\d+)/i);
        if (match && match[1]) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxNum) {
            maxNum = n;
          }
        }
      });
      return `distri-${maxNum + 1}`;
    }

    const { data } = await supabase
      .from('distributors')
      .select('distributor_id');

    if (!data || data.length === 0) {
      return 'distri-101';
    }

    let maxNum = 100;
    data.forEach((d) => {
      const match = d.distributor_id?.match(/distri-(\d+)/i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) {
          maxNum = n;
        }
      }
    });

    return `distri-${maxNum + 1}`;
  } catch {
    return 'distri-101';
  }
}

/**
 * Create a new distributor in Supabase.
 */
export async function createDistributor(
  input: CreateDistributorInput
): Promise<{ data: Distributor | null; error: string | null }> {
  try {
    const cleanName = (input.distributor_name || '').trim();
    if (!cleanName) {
      return { data: null, error: 'Distributor Name is required' };
    }

    const cleanId = (input.distributor_id || '').trim() || (await suggestNextDistributorId());
    const cleanAddress = input.address?.trim() || null;
    const cleanMobile = input.mobile?.trim() || null;
    const cleanGstin = input.gstin?.trim() || null;

    if (!isSupabaseConfigured) {
      const newDist: Distributor = {
        id: crypto.randomUUID(),
        distributor_id: cleanId,
        distributor_name: cleanName,
        address: cleanAddress,
        mobile: cleanMobile,
        gstin: cleanGstin,
        status: input.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        total_purchases: 0,
      };
      FALLBACK_DISTRIBUTORS.unshift(newDist);
      return { data: newDist, error: null };
    }

    // Check if distributor_id already exists
    const { data: existingId } = await supabase
      .from('distributors')
      .select('id')
      .ilike('distributor_id', cleanId)
      .maybeSingle();

    if (existingId) {
      return { data: null, error: `Distributor ID "${cleanId}" is already taken.` };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('distributors')
      .insert({
        distributor_id: cleanId,
        distributor_name: cleanName,
        address: cleanAddress,
        mobile: cleanMobile,
        gstin: cleanGstin,
        status: input.status || 'active',
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting distributor:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        total_purchases: 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in createDistributor:', err);
    return { data: null, error: err?.message || 'Failed to create distributor' };
  }
}

/**
 * Update an existing distributor.
 */
export async function updateDistributor(
  input: UpdateDistributorInput
): Promise<{ data: Distributor | null; error: string | null }> {
  try {
    if (!input.id) {
      return { data: null, error: 'Distributor internal ID is required.' };
    }
    if (!input.distributor_id || !input.distributor_id.trim()) {
      return { data: null, error: 'Distributor ID is required.' };
    }
    if (!input.distributor_name || !input.distributor_name.trim()) {
      return { data: null, error: 'Distributor Name is required.' };
    }

    const cleanId = input.distributor_id.trim();
    const cleanName = input.distributor_name.trim();
    const cleanAddress = input.address?.trim() || null;
    const cleanMobile = input.mobile?.trim() || null;
    const cleanGstin = input.gstin?.trim() || null;

    if (!isSupabaseConfigured) {
      const idx = FALLBACK_DISTRIBUTORS.findIndex((d) => d.id === input.id);
      if (idx >= 0) {
        FALLBACK_DISTRIBUTORS[idx] = {
          ...FALLBACK_DISTRIBUTORS[idx],
          distributor_id: cleanId,
          distributor_name: cleanName,
          address: cleanAddress,
          mobile: cleanMobile,
          gstin: cleanGstin,
          status: input.status,
          updated_at: new Date().toISOString(),
        };
        return { data: FALLBACK_DISTRIBUTORS[idx], error: null };
      }
      return { data: null, error: 'Distributor not found.' };
    }

    // Check for duplicate distributor_id on other records
    const { data: duplicateId } = await supabase
      .from('distributors')
      .select('id')
      .ilike('distributor_id', cleanId)
      .neq('id', input.id)
      .maybeSingle();

    if (duplicateId) {
      return { data: null, error: `Distributor ID "${cleanId}" is already used by another distributor.` };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('distributors')
      .update({
        distributor_id: cleanId,
        distributor_name: cleanName,
        address: cleanAddress,
        mobile: cleanMobile,
        gstin: cleanGstin,
        status: input.status,
        updated_at: now,
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating distributor:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('Unexpected error in updateDistributor:', err);
    return { data: null, error: err?.message || 'Failed to update distributor' };
  }
}

/**
 * Delete a distributor (if no purchases reference it).
 */
export async function deleteDistributor(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!id) {
      return { success: false, error: 'Distributor ID is required' };
    }

    if (!isSupabaseConfigured) {
      const idx = FALLBACK_DISTRIBUTORS.findIndex((d) => d.id === id);
      if (idx >= 0) {
        FALLBACK_DISTRIBUTORS.splice(idx, 1);
        return { success: true, error: null };
      }
      return { success: false, error: 'Distributor not found.' };
    }

    // Check if purchases exist for this distributor
    const { count } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('distributor_id', id);

    if (count && count > 0) {
      return {
        success: false,
        error: `Cannot delete distributor because they have ${count} purchase bill(s) recorded.`,
      };
    }

    const { error } = await supabase
      .from('distributors')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete distributor' };
  }
}
