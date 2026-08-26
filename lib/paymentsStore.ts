import { supabase, isSupabaseConfigured } from './supabase';

export type PaymentType = 'cash' | 'upi' | 'credit';

export interface Expense {
  id: string;
  amount: number;
  type: PaymentType;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  bill_id: string;
  date_time: string;
  customer?: {
    name: string;
    mobile?: string | null;
  } | null;
  total: number;
  cash: number;
  upi: number;
  credit: number;
  status: string;
}

export interface PaymentDashboardStats {
  totalSale: number;
  totalCash: number;
  totalUpi: number;
  totalCredit: number;
  totalBillsCount: number;
  totalExpenses: number;
}

export interface PaymentFilters {
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
  searchQuery?: string;
}

// Initial mock fallback expenses
let inMemoryExpenses: Expense[] = [
  {
    id: 'exp-001',
    amount: 100,
    type: 'cash',
    notes: 'Shop cleaning supplies & tea',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'exp-002',
    amount: 250,
    type: 'upi',
    notes: 'Packing tape & packaging courier',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-003',
    amount: 500,
    type: 'cash',
    notes: 'Electricity bill contribution',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
];

// Initial mock fallback payment records matching user reference
let inMemoryPaymentRecords: PaymentRecord[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    bill_id: 'bill-260823-131',
    date_time: new Date().toISOString(),
    customer: {
      name: 'suresh',
      mobile: '1234567890',
    },
    total: 2200,
    cash: 2000,
    upi: 100,
    credit: 100,
    status: 'paid',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    bill_id: 'bill-260823-130',
    date_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    customer: null,
    total: 280,
    cash: 280,
    upi: 0,
    credit: 0,
    status: 'paid',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    bill_id: 'bill-260823-129',
    date_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    customer: {
      name: 'Ramesh Patel',
      mobile: '9845012345',
    },
    total: 4500,
    cash: 2000,
    upi: 1000,
    credit: 1500,
    status: 'paid',
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    bill_id: 'bill-260823-128',
    date_time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    customer: {
      name: 'Priya Sharma',
      mobile: '9740123456',
    },
    total: 1850,
    cash: 1850,
    upi: 0,
    credit: 0,
    status: 'paid',
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    bill_id: 'bill-260823-127',
    date_time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    customer: {
      name: 'Anita Verma',
      mobile: '9880198765',
    },
    total: 3590,
    cash: 0,
    upi: 3590,
    credit: 0,
    status: 'paid',
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    bill_id: 'bill-260823-126',
    date_time: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    customer: {
      name: 'Vijay Kumar',
      mobile: '9844054321',
    },
    total: 26890,
    cash: 25050,
    upi: 0,
    credit: 1840,
    status: 'paid',
  },
];

/**
 * Format currency in Indian Rupees format (e.g. ₹39,310.00)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount || 0);
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date & time nicely (e.g. 23 Aug 2026, 09:15 pm)
 */
export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12
    const hoursStr = hours.toString().padStart(2, '0');

    return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
  } catch {
    return isoString;
  }
}

/**
 * Helper to get date string in YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch Payment Dashboard Records and Aggregate Metrics
 */
export async function fetchPaymentDashboard(filters: PaymentFilters): Promise<{
  data: PaymentRecord[];
  stats: PaymentDashboardStats;
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      let filteredBills = [...inMemoryPaymentRecords];

      // Filter by search
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        filteredBills = filteredBills.filter(
          (b) =>
            b.bill_id.toLowerCase().includes(q) ||
            (b.customer &&
              (b.customer.name.toLowerCase().includes(q) || (b.customer.mobile && b.customer.mobile.includes(q))))
        );
      }

      // Filter by date range
      if (filters.fromDate || filters.toDate) {
        filteredBills = filteredBills.filter((b) => {
          const itemDate = b.date_time.split('T')[0];
          if (filters.fromDate && itemDate < filters.fromDate) return false;
          if (filters.toDate && itemDate > filters.toDate) return false;
          return true;
        });
      }

      // Calculate aggregated stats
      let totalSale = 0;
      let totalCash = 0;
      let totalUpi = 0;
      let totalCredit = 0;

      filteredBills.forEach((b) => {
        if (b.status !== 'cancelled') {
          totalSale += Number(b.total || 0);
          totalCash += Number(b.cash || 0);
          totalUpi += Number(b.upi || 0);
          totalCredit += Number(b.credit || 0);
        }
      });

      // Calculate total expenses for the same date filter
      let filteredExpenses = [...inMemoryExpenses];
      if (filters.fromDate || filters.toDate) {
        filteredExpenses = filteredExpenses.filter((e) => {
          const itemDate = e.created_at.split('T')[0];
          if (filters.fromDate && itemDate < filters.fromDate) return false;
          if (filters.toDate && itemDate > filters.toDate) return false;
          return true;
        });
      }
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      return {
        data: filteredBills,
        stats: {
          totalSale,
          totalCash,
          totalUpi,
          totalCredit,
          totalBillsCount: filteredBills.length,
          totalExpenses,
        },
        error: null,
      };
    }

    // SUPABASE INTEGRATION
    let query = supabase
      .from('bills')
      .select(`
        id,
        bill_id,
        total,
        status,
        created_at,
        customers (
          id,
          name,
          mobile
        ),
        payments (
          type,
          amount
        )
      `)
      .order('created_at', { ascending: false });

    if (filters.fromDate) {
      const fromISO = new Date(`${filters.fromDate}T00:00:00.000Z`).toISOString();
      query = query.gte('created_at', fromISO);
    }
    if (filters.toDate) {
      const toISO = new Date(`${filters.toDate}T23:59:59.999Z`).toISOString();
      query = query.lte('created_at', toISO);
    }

    const { data: rawBills, error: billsError } = await query;

    if (billsError) {
      console.error('Error fetching bills for payments:', billsError);
      return {
        data: [],
        stats: {
          totalSale: 0,
          totalCash: 0,
          totalUpi: 0,
          totalCredit: 0,
          totalBillsCount: 0,
          totalExpenses: 0,
        },
        error: billsError.message,
      };
    }

    // Process and transform bill payments
    const records: PaymentRecord[] = (rawBills || []).map((b: any) => {
      let cash = 0;
      let upi = 0;
      let credit = 0;

      if (Array.isArray(b.payments)) {
        b.payments.forEach((p: any) => {
          const type = p.type?.toLowerCase();
          const amt = Number(p.amount || 0);
          if (type === 'cash') cash += amt;
          else if (type === 'upi') upi += amt;
          else if (type === 'credit') credit += amt;
        });
      }

      // If payments table had no breakdown, fallback to total as cash if paid
      if (cash === 0 && upi === 0 && credit === 0 && b.status === 'paid') {
        cash = Number(b.total || 0);
      }

      return {
        id: b.id,
        bill_id: b.bill_id,
        date_time: b.created_at,
        customer: b.customers
          ? {
              name: b.customers.name,
              mobile: b.customers.mobile,
            }
          : null,
        total: Number(b.total || 0),
        cash,
        upi,
        credit,
        status: b.status,
      };
    });

    // Client-side search filter
    let finalRecords = records;
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      finalRecords = finalRecords.filter(
        (b) =>
          b.bill_id.toLowerCase().includes(q) ||
          (b.customer &&
            (b.customer.name.toLowerCase().includes(q) || (b.customer.mobile && b.customer.mobile.includes(q))))
      );
    }

    // Compute stats
    let totalSale = 0;
    let totalCash = 0;
    let totalUpi = 0;
    let totalCredit = 0;

    finalRecords.forEach((b) => {
      if (b.status !== 'cancelled') {
        totalSale += b.total;
        totalCash += b.cash;
        totalUpi += b.upi;
        totalCredit += b.credit;
      }
    });

    // Fetch expenses for date range
    let expenseQuery = supabase
      .from('expenses')
      .select('amount, created_at');

    if (filters.fromDate) {
      const fromISO = new Date(`${filters.fromDate}T00:00:00.000Z`).toISOString();
      expenseQuery = expenseQuery.gte('created_at', fromISO);
    }
    if (filters.toDate) {
      const toISO = new Date(`${filters.toDate}T23:59:59.999Z`).toISOString();
      expenseQuery = expenseQuery.lte('created_at', toISO);
    }

    const { data: rawExpenses } = await expenseQuery;
    const totalExpenses = (rawExpenses || []).reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);

    return {
      data: finalRecords,
      stats: {
        totalSale,
        totalCash,
        totalUpi,
        totalCredit,
        totalBillsCount: finalRecords.length,
        totalExpenses,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('fetchPaymentDashboard unexpected error:', err);
    return {
      data: [],
      stats: {
        totalSale: 0,
        totalCash: 0,
        totalUpi: 0,
        totalCredit: 0,
        totalBillsCount: 0,
        totalExpenses: 0,
      },
      error: err?.message || 'Failed to load payments data',
    };
  }
}

/**
 * Fetch All Expenses with optional date and text search filters
 */
export async function fetchExpenses(filters?: {
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
}): Promise<{ data: Expense[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      let filtered = [...inMemoryExpenses];

      if (filters?.fromDate || filters?.toDate) {
        filtered = filtered.filter((e) => {
          const itemDate = e.created_at.split('T')[0];
          if (filters.fromDate && itemDate < filters.fromDate) return false;
          if (filters.toDate && itemDate > filters.toDate) return false;
          return true;
        });
      }

      if (filters?.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (e) =>
            (e.notes && e.notes.toLowerCase().includes(q)) ||
            e.type.toLowerCase().includes(q) ||
            e.amount.toString().includes(q)
        );
      }

      // Sort by created_at desc
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { data: filtered, error: null };
    }

    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.fromDate) {
      const fromISO = new Date(`${filters.fromDate}T00:00:00.000Z`).toISOString();
      query = query.gte('created_at', fromISO);
    }
    if (filters?.toDate) {
      const toISO = new Date(`${filters.toDate}T23:59:59.999Z`).toISOString();
      query = query.lte('created_at', toISO);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching expenses from Supabase:', error);
      return { data: [], error: error.message };
    }

    let result: Expense[] = (data || []).map((row: any) => ({
      id: row.id,
      amount: Number(row.amount ?? row.ammount ?? 0),
      type: row.type || 'cash',
      notes: row.notes || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    if (filters?.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.type.toLowerCase().includes(q) ||
          e.amount.toString().includes(q)
      );
    }

    return { data: result, error: null };
  } catch (err: any) {
    console.error('fetchExpenses error:', err);
    return { data: [], error: err?.message || 'Failed to fetch expenses' };
  }
}

/**
 * Add a new expense
 */
export async function addExpense(payload: {
  amount: number;
  type: PaymentType;
  notes?: string;
}): Promise<{ data: Expense | null; error: string | null }> {
  try {
    const amt = Number(payload.amount);
    if (isNaN(amt) || amt <= 0) {
      return { data: null, error: 'Please enter a valid expense amount greater than zero.' };
    }

    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const newExpense: Expense = {
        id: 'exp-' + Date.now(),
        amount: amt,
        type: payload.type || 'cash',
        notes: payload.notes?.trim() || null,
        created_at: now,
        updated_at: now,
      };

      inMemoryExpenses = [newExpense, ...inMemoryExpenses];
      return { data: newExpense, error: null };
    }

    const insertPayload = {
      amount: amt,
      type: payload.type || 'cash',
      notes: payload.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Error adding expense to Supabase:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        id: data.id,
        amount: Number(data.amount ?? data.ammount ?? amt),
        type: data.type,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('addExpense error:', err);
    return { data: null, error: err?.message || 'Failed to add expense' };
  }
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: string,
  payload: {
    amount: number;
    type: PaymentType;
    notes?: string;
  }
): Promise<{ data: Expense | null; error: string | null }> {
  try {
    const amt = Number(payload.amount);
    if (isNaN(amt) || amt <= 0) {
      return { data: null, error: 'Please enter a valid expense amount greater than zero.' };
    }

    const now = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const idx = inMemoryExpenses.findIndex((e) => e.id === id);
      if (idx === -1) {
        return { data: null, error: 'Expense record not found.' };
      }

      inMemoryExpenses[idx] = {
        ...inMemoryExpenses[idx],
        amount: amt,
        type: payload.type || 'cash',
        notes: payload.notes?.trim() || null,
        updated_at: now,
      };

      return { data: inMemoryExpenses[idx], error: null };
    }

    const updatePayload = {
      amount: amt,
      type: payload.type || 'cash',
      notes: payload.notes?.trim() || null,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense in Supabase:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        id: data.id,
        amount: Number(data.amount ?? data.ammount ?? amt),
        type: data.type,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('updateExpense error:', err);
    return { data: null, error: err?.message || 'Failed to update expense' };
  }
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      inMemoryExpenses = inMemoryExpenses.filter((e) => e.id !== id);
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('deleteExpense error:', err);
    return { success: false, error: err?.message || 'Failed to delete expense' };
  }
}
