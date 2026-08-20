import { supabase, isSupabaseConfigured } from './supabase';

export type PointsCalculationType = 'add' | 'subtract';

export interface AssociatePointsTransaction {
  id: string;
  associate_id: string;
  points: number;
  calc: PointsCalculationType;
  balance_points: number;
  bill_id: string | null;
  bill_number?: string | null;
  description: string | null;
  created_at: string;
}

export interface AssociatePointsSummary {
  current_points: number;
  total_transactions: number;
  total_add_count: number;
  total_add_points: number;
  total_subtract_count: number;
  total_subtract_points: number;
  associate_id?: string;
  associate_name?: string;
}

export interface AssociatePointsResult {
  summary: AssociatePointsSummary;
  transactions: AssociatePointsTransaction[];
  error: string | null;
}

/**
 * Fetch current associate's current points balance
 */
export async function fetchCurrentAssociatePoints(): Promise<{ points: number; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { points: 0, error: null };
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { points: 0, error: userError?.message || 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('associates')
      .select('current_points')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching associate points:', error);
      return { points: 0, error: error.message };
    }

    return { points: data?.current_points ?? 0, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchCurrentAssociatePoints:', err);
    return { points: 0, error: err?.message || 'Failed to fetch points' };
  }
}

/**
 * Fetch all points transactions and summary statistics for the logged-in associate
 * Supports optional date filter (format: YYYY-MM-DD)
 */
export async function fetchAssociatePointsTransactions(
  filterDate?: string
): Promise<AssociatePointsResult> {
  const defaultSummary: AssociatePointsSummary = {
    current_points: 0,
    total_transactions: 0,
    total_add_count: 0,
    total_add_points: 0,
    total_subtract_count: 0,
    total_subtract_points: 0,
  };

  try {
    if (!isSupabaseConfigured) {
      return {
        summary: defaultSummary,
        transactions: [],
        error: null,
      };
    }

    // 1. Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return {
        summary: defaultSummary,
        transactions: [],
        error: userError?.message || 'User not logged in',
      };
    }

    // 2. Fetch Associate and Profile Info
    const [assocRes, profileRes] = await Promise.all([
      supabase
        .from('associates')
        .select('associate_id, current_points')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle(),
    ]);

    const currentPoints = assocRes.data?.current_points ?? 0;
    const associateCode = assocRes.data?.associate_id ?? '';
    const associateName = profileRes.data?.name ?? '';

    // 3. Fetch Transactions with joined bill_id if available
    let query = supabase
      .from('associate_p_trans')
      .select('id, associate_id, points, calc, balance_points, bill_id, description, created_at, bills(bill_id)')
      .eq('associate_id', user.id)
      .order('created_at', { ascending: false });

    // Apply date filter at database level if provided
    if (filterDate && filterDate.trim() !== '') {
      const startOfDay = `${filterDate.trim()}T00:00:00.000Z`;
      const endOfDay = `${filterDate.trim()}T23:59:59.999Z`;
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
    }

    const { data: transData, error: transError } = await query;

    if (transError) {
      console.error('Error fetching associate points transactions:', transError);
      return {
        summary: {
          ...defaultSummary,
          current_points: currentPoints,
          associate_id: associateCode,
          associate_name: associateName,
        },
        transactions: [],
        error: transError.message,
      };
    }

    // 4. Format transactions
    const rawList = transData || [];
    const formattedTransactions: AssociatePointsTransaction[] = rawList.map((item: any) => {
      // bills may be an object or array due to relation
      let billNumber = item.bill_id;
      if (item.bills) {
        if (typeof item.bills === 'object' && item.bills !== null) {
          billNumber = item.bills.bill_id || item.bill_id;
        }
      }

      return {
        id: item.id,
        associate_id: item.associate_id,
        points: Number(item.points) || 0,
        calc: (item.calc === 'add' || item.calc === 'subtract') ? item.calc : 'add',
        balance_points: Number(item.balance_points) || 0,
        bill_id: item.bill_id || null,
        bill_number: billNumber || null,
        description: item.description || null,
        created_at: item.created_at,
      };
    });

    // 5. Calculate Aggregations
    let totalAddCount = 0;
    let totalAddPoints = 0;
    let totalSubtractCount = 0;
    let totalSubtractPoints = 0;

    for (const t of formattedTransactions) {
      if (t.calc === 'add') {
        totalAddCount += 1;
        totalAddPoints += t.points;
      } else if (t.calc === 'subtract') {
        totalSubtractCount += 1;
        totalSubtractPoints += t.points;
      }
    }

    const summary: AssociatePointsSummary = {
      current_points: currentPoints,
      total_transactions: formattedTransactions.length,
      total_add_count: totalAddCount,
      total_add_points: totalAddPoints,
      total_subtract_count: totalSubtractCount,
      total_subtract_points: totalSubtractPoints,
      associate_id: associateCode,
      associate_name: associateName,
    };

    return {
      summary,
      transactions: formattedTransactions,
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in fetchAssociatePointsTransactions:', err);
    return {
      summary: defaultSummary,
      transactions: [],
      error: err?.message || 'Failed to fetch points transactions',
    };
  }
}

export interface AssociateSimpleOption {
  id: string;
  associate_id: string;
  name: string;
  current_points: number;
}

export interface BillOption {
  id: string;
  bill_id: string;
  total?: number;
  created_at?: string;
}

export interface CreatePointsTransactionInput {
  associate_id: string;
  points: number;
  calc: PointsCalculationType;
  bill_id?: string | null;
  description?: string | null;
  created_at?: string | null;
}

/**
 * Fetch associate's simple profile info and current points (Admin view)
 */
export async function fetchAssociateDetail(associateId: string): Promise<{
  data: AssociateSimpleOption | null;
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured || !associateId || !associateId.trim()) {
      return { data: null, error: 'Associate ID is required' };
    }

    const cleanId = associateId.trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
    
    let assocData: any = null;
    let assocError: any = null;

    if (isUuid) {
      const res = await supabase
        .from('associates')
        .select('id, associate_id, current_points')
        .eq('id', cleanId)
        .maybeSingle();
      assocData = res.data;
      assocError = res.error;

      if (!assocData && !assocError) {
        const fallbackRes = await supabase
          .from('associates')
          .select('id, associate_id, current_points')
          .eq('associate_id', cleanId)
          .maybeSingle();
        assocData = fallbackRes.data;
        assocError = fallbackRes.error;
      }
    } else {
      const res = await supabase
        .from('associates')
        .select('id, associate_id, current_points')
        .eq('associate_id', cleanId)
        .maybeSingle();
      assocData = res.data;
      assocError = res.error;
    }

    if (assocError) {
      return { data: null, error: assocError.message };
    }

    if (!assocData) {
      return { data: null, error: `Associate '${cleanId}' not found in database` };
    }

    let name = 'Unnamed Associate';
    if (assocData.id) {
      const { data: profData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', assocData.id)
        .maybeSingle();
      if (profData?.name) {
        name = profData.name;
      }
    }

    return {
      data: {
        id: assocData.id,
        associate_id: assocData.associate_id,
        name,
        current_points: Number(assocData.current_points) || 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Error in fetchAssociateDetail:', err);
    return { data: null, error: err?.message || 'Failed to fetch associate' };
  }
}

/**
 * Fetch all associates for dropdown selector
 */
export async function fetchAllAssociatesForPoints(): Promise<{
  data: AssociateSimpleOption[];
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('associates')
      .select('id, associate_id, current_points, profiles(name)')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    const formatted: AssociateSimpleOption[] = (data || []).map((item: any) => {
      let name = 'Unnamed Associate';
      if (item.profiles) {
        if (Array.isArray(item.profiles)) {
          name = item.profiles[0]?.name || name;
        } else if (typeof item.profiles === 'object') {
          name = item.profiles.name || name;
        }
      }

      return {
        id: item.id,
        associate_id: item.associate_id,
        name,
        current_points: item.current_points ?? 0,
      };
    });

    return { data: formatted, error: null };
  } catch (err: any) {
    console.error('Error fetching associates list for points:', err);
    return { data: [], error: err?.message || 'Failed to fetch associates' };
  }
}

/**
 * Fetch available bills for linking to points transaction
 */
export async function fetchAvailableBills(): Promise<{
  data: BillOption[];
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('bills')
      .select('id, bill_id, total, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.warn('Error fetching bills (table may be empty or RLS restricted):', error);
      return { data: [], error: null };
    }

    return {
      data: (data || []).map((b: any) => ({
        id: b.id,
        bill_id: b.bill_id,
        total: Number(b.total) || 0,
        created_at: b.created_at,
      })),
      error: null,
    };
  } catch (err: any) {
    console.error('Error in fetchAvailableBills:', err);
    return { data: [], error: null };
  }
}

/**
 * Fetch all points transactions for a given associate with optional date and calc filters (Admin view)
 */
export async function fetchAssociatePointsTransactionsAdmin(
  associateId: string,
  filterDate?: string,
  filterCalc?: 'all' | 'add' | 'subtract'
): Promise<AssociatePointsResult> {
  const defaultSummary: AssociatePointsSummary = {
    current_points: 0,
    total_transactions: 0,
    total_add_count: 0,
    total_add_points: 0,
    total_subtract_count: 0,
    total_subtract_points: 0,
  };

  try {
    if (!isSupabaseConfigured || !associateId) {
      return {
        summary: defaultSummary,
        transactions: [],
        error: !associateId ? 'Associate ID is required' : null,
      };
    }

    // 1. Fetch Associate details
    const [assocRes, profileRes] = await Promise.all([
      supabase
        .from('associates')
        .select('id, associate_id, current_points')
        .eq('id', associateId)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('name')
        .eq('id', associateId)
        .maybeSingle(),
    ]);

    const currentPoints = assocRes.data?.current_points ?? 0;
    const associateCode = assocRes.data?.associate_id ?? '';
    const associateName = profileRes.data?.name ?? '';

    // 2. Fetch all transactions for this associate
    let query = supabase
      .from('associate_p_trans')
      .select('id, associate_id, points, calc, balance_points, bill_id, description, created_at, bills(bill_id)')
      .eq('associate_id', associateId)
      .order('created_at', { ascending: false });

    // Apply database date filter if provided
    if (filterDate && filterDate.trim() !== '') {
      const startOfDay = `${filterDate.trim()}T00:00:00.000Z`;
      const endOfDay = `${filterDate.trim()}T23:59:59.999Z`;
      query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
    }

    // Apply calc filter if specified and not 'all'
    if (filterCalc && (filterCalc === 'add' || filterCalc === 'subtract')) {
      query = query.eq('calc', filterCalc);
    }

    const { data: transData, error: transError } = await query;

    if (transError) {
      console.error('Error fetching admin points transactions:', transError);
      return {
        summary: {
          ...defaultSummary,
          current_points: currentPoints,
          associate_id: associateCode,
          associate_name: associateName,
        },
        transactions: [],
        error: transError.message,
      };
    }

    // 3. Format transactions
    const rawList = transData || [];
    const formattedTransactions: AssociatePointsTransaction[] = rawList.map((item: any) => {
      let billNumber = item.bill_id;
      if (item.bills) {
        if (typeof item.bills === 'object' && item.bills !== null) {
          billNumber = item.bills.bill_id || item.bill_id;
        }
      }

      return {
        id: item.id,
        associate_id: item.associate_id,
        points: Number(item.points) || 0,
        calc: (item.calc === 'add' || item.calc === 'subtract') ? item.calc : 'add',
        balance_points: Number(item.balance_points) || 0,
        bill_id: item.bill_id || null,
        bill_number: billNumber || null,
        description: item.description || null,
        created_at: item.created_at,
      };
    });

    // 4. Compute Counts & Points
    let totalAddCount = 0;
    let totalAddPoints = 0;
    let totalSubtractCount = 0;
    let totalSubtractPoints = 0;

    for (const t of formattedTransactions) {
      if (t.calc === 'add') {
        totalAddCount += 1;
        totalAddPoints += t.points;
      } else if (t.calc === 'subtract') {
        totalSubtractCount += 1;
        totalSubtractPoints += t.points;
      }
    }

    const summary: AssociatePointsSummary = {
      current_points: currentPoints,
      total_transactions: formattedTransactions.length,
      total_add_count: totalAddCount,
      total_add_points: totalAddPoints,
      total_subtract_count: totalSubtractCount,
      total_subtract_points: totalSubtractPoints,
      associate_id: associateCode,
      associate_name: associateName,
    };

    return {
      summary,
      transactions: formattedTransactions,
      error: null,
    };
  } catch (err: any) {
    console.error('Error in fetchAssociatePointsTransactionsAdmin:', err);
    return {
      summary: defaultSummary,
      transactions: [],
      error: err?.message || 'Failed to load points ledger',
    };
  }
}

/**
 * Add a new Points Transaction in associate_p_trans table and update associate current_points
 */
export async function createAssociatePointsTransaction(
  input: CreatePointsTransactionInput
): Promise<{
  success: boolean;
  new_balance?: number;
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Database is not configured' };
    }

    if (!input.associate_id || !input.associate_id.trim()) {
      return { success: false, error: 'Associate ID is required' };
    }

    const cleanAssocId = input.associate_id.trim();

    if (!input.points || input.points <= 0) {
      return { success: false, error: 'Points must be greater than zero' };
    }

    if (input.calc !== 'add' && input.calc !== 'subtract') {
      return { success: false, error: 'Calculation type must be add or subtract' };
    }

    // 1. Fetch current points of associate directly from the associates table in DB
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanAssocId);
    
    let assocData: any = null;
    let assocError: any = null;

    if (isUuid) {
      const res = await supabase
        .from('associates')
        .select('id, associate_id, current_points')
        .eq('id', cleanAssocId)
        .maybeSingle();
      assocData = res.data;
      assocError = res.error;

      if (!assocData && !assocError) {
        const fallbackRes = await supabase
          .from('associates')
          .select('id, associate_id, current_points')
          .eq('associate_id', cleanAssocId)
          .maybeSingle();
        assocData = fallbackRes.data;
        assocError = fallbackRes.error;
      }
    } else {
      const res = await supabase
        .from('associates')
        .select('id, associate_id, current_points')
        .eq('associate_id', cleanAssocId)
        .maybeSingle();
      assocData = res.data;
      assocError = res.error;
    }

    if (assocError) {
      return { success: false, error: `Database error querying associate: ${assocError.message}` };
    }

    if (!assocData) {
      return { success: false, error: `Associate record '${cleanAssocId}' not found in database.` };
    }

    const targetAssociateUuid = assocData.id;
    const currentPoints = Number(assocData.current_points) || 0;

    // 2. Calculate balance points based on associates.current_points in DB and now points
    let newBalance = 0;
    if (input.calc === 'add') {
      newBalance = currentPoints + Math.floor(input.points);
    } else {
      if (currentPoints < input.points) {
        return {
          success: false,
          error: `Insufficient points: current points (${currentPoints}) is less than points to deduct (${input.points})`,
        };
      }
      newBalance = currentPoints - Math.floor(input.points);
    }

    // 3. Prepare payload for associate_p_trans table
    const insertPayload: any = {
      associate_id: targetAssociateUuid, // Always valid UUID referencing associates.id
      points: Math.floor(input.points),
      calc: input.calc,
      balance_points: newBalance,
      bill_id: input.bill_id && input.bill_id.trim() !== '' ? input.bill_id.trim() : null,
      description: input.description && input.description.trim() !== '' ? input.description.trim() : null,
    };

    if (input.created_at && input.created_at.trim() !== '') {
      insertPayload.created_at = new Date(input.created_at).toISOString();
    }

    // 4. Insert into associate_p_trans
    const { error: insertError } = await supabase
      .from('associate_p_trans')
      .insert(insertPayload);

    if (insertError) {
      console.error('Error inserting points transaction:', insertError);
      return { success: false, error: `Failed to insert transaction: ${insertError.message}` };
    }

    // 5. Update associates current_points in DB
    const { error: updateError } = await supabase
      .from('associates')
      .update({
        current_points: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetAssociateUuid);

    if (updateError) {
      console.error('Error updating associate points balance:', updateError);
      return {
        success: false,
        error: `Transaction recorded, but failed to update balance in associates table: ${updateError.message}`,
      };
    }

    return {
      success: true,
      new_balance: newBalance,
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in createAssociatePointsTransaction:', err);
    return { success: false, error: err?.message || 'Failed to create points transaction' };
  }
}

