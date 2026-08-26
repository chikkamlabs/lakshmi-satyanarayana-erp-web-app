import { supabase, isSupabaseConfigured } from './supabase';

export type CustomerStatus = 'active' | 'inactive';
export type CustomerTransactionCalc = 'sum' | 'subtract';

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  status: CustomerStatus;
  available_points: number;
  credit: number;
  address?: string | null;
  created_at: string;
  updated_at?: string;
  total_bills?: number;
}

export interface CustomerStats {
  totalCustomers: number;
  totalCredit: number;
}

export interface CustomerTransaction {
  id: string;
  customer_id: string;
  bill_id?: string | null;
  calculation: CustomerTransactionCalc;
  amount: number;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  customer?: {
    id: string;
    name: string;
    mobile: string;
    status: CustomerStatus;
    available_points: number;
    credit: number;
  };
  bill?: {
    id: string;
    bill_id: string;
  } | null;
}

export interface CreateCustomerInput {
  name: string;
  mobile: string;
  status?: CustomerStatus;
  available_points?: number;
  credit?: number;
  address?: string;
}

export interface UpdateCustomerInput {
  id: string;
  name: string;
  mobile: string;
  status: CustomerStatus;
  available_points: number;
  credit: number;
  address?: string;
}

export interface CreateCustomerTransactionInput {
  customer_id: string;
  calculation: CustomerTransactionCalc;
  amount: number;
  notes?: string;
  bill_id?: string;
}

export interface TransactionFilterOptions {
  customer_id?: string;
  type?: 'all' | 'sum' | 'subtract';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

/**
 * Fetch all customers, their total bills count, and apply search filter.
 */
export async function fetchCustomers(searchQuery?: string): Promise<{ data: Customer[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    // Fetch customers
    const { data: customersData, error: custError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (custError) {
      console.error('Error fetching customers:', custError);
      return { data: [], error: custError.message };
    }

    if (!customersData || customersData.length === 0) {
      return { data: [], error: null };
    }

    // Fetch bills count aggregated per customer
    const customerIds = customersData.map((c) => c.id);
    const { data: billsData, error: billsError } = await supabase
      .from('bills')
      .select('customer_id')
      .in('customer_id', customerIds);

    const billCountMap = new Map<string, number>();
    if (!billsError && billsData) {
      billsData.forEach((b: { customer_id?: string | null }) => {
        if (b.customer_id) {
          billCountMap.set(b.customer_id, (billCountMap.get(b.customer_id) || 0) + 1);
        }
      });
    }

    const customersWithBills: Customer[] = customersData.map((c) => ({
      ...c,
      available_points: Number(c.available_points) || 0,
      credit: Number(c.credit) || 0,
      total_bills: billCountMap.get(c.id) || 0,
    }));

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const filtered = customersWithBills.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const mobileMatch = c.mobile?.toLowerCase().includes(q);
        const addressMatch = c.address?.toLowerCase().includes(q);
        return Boolean(nameMatch || mobileMatch || addressMatch);
      });
      return { data: filtered, error: null };
    }

    return { data: customersWithBills, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchCustomers:', err);
    return { data: [], error: err?.message || 'Failed to fetch customers' };
  }
}

/**
 * Fetch total number of customers and total outstanding credit.
 */
export async function getCustomerStats(): Promise<{ stats: CustomerStats; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { stats: { totalCustomers: 0, totalCredit: 0 }, error: null };
    }

    const { data, error } = await supabase
      .from('customers')
      .select('credit');

    if (error) {
      console.error('Error fetching customer stats:', error);
      return { stats: { totalCustomers: 0, totalCredit: 0 }, error: error.message };
    }

    const totalCustomers = data?.length || 0;
    const totalCredit = data?.reduce((acc, curr) => acc + (Number(curr.credit) || 0), 0) || 0;

    return {
      stats: {
        totalCustomers,
        totalCredit,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in getCustomerStats:', err);
    return { stats: { totalCustomers: 0, totalCredit: 0 }, error: err?.message || 'Failed to fetch stats' };
  }
}

/**
 * Fetch a single customer by ID.
 */
export async function fetchCustomerById(id: string): Promise<{ data: Customer | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured || !id) {
      return { data: null, error: 'Database not configured or missing ID' };
    }

    const { data: customerData, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (custError) {
      console.error('Error fetching customer by id:', custError);
      return { data: null, error: custError.message };
    }

    if (!customerData) {
      return { data: null, error: 'Customer not found' };
    }

    // Fetch bill count for this customer
    const { count } = await supabase
      .from('bills')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id);

    const customer: Customer = {
      ...customerData,
      available_points: Number(customerData.available_points) || 0,
      credit: Number(customerData.credit) || 0,
      total_bills: count ?? 0,
    };

    return { data: customer, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchCustomerById:', err);
    return { data: null, error: err?.message || 'Failed to fetch customer' };
  }
}

/**
 * Create a new Customer.
 */
export async function createCustomer(input: CreateCustomerInput): Promise<{ data: Customer | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase is not configured. Please check environment variables.' };
    }

    if (!input.name || !input.name.trim()) {
      return { data: null, error: 'Customer Name is required.' };
    }

    if (!input.mobile || !input.mobile.trim()) {
      return { data: null, error: 'Mobile Number is required.' };
    }

    // Check if mobile already exists
    const { data: existingMobile } = await supabase
      .from('customers')
      .select('id')
      .eq('mobile', input.mobile.trim())
      .maybeSingle();

    if (existingMobile) {
      return { data: null, error: `Customer with mobile number "${input.mobile}" already exists.` };
    }

    const newCustomer = {
      name: input.name.trim(),
      mobile: input.mobile.trim(),
      status: input.status || 'active',
      available_points: Number(input.available_points) || 0,
      credit: Number(input.credit) || 0,
      address: input.address?.trim() || null,
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        available_points: Number(data.available_points) || 0,
        credit: Number(data.credit) || 0,
        total_bills: 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in createCustomer:', err);
    return { data: null, error: err?.message || 'Failed to create customer' };
  }
}

/**
 * Update an existing customer.
 */
export async function updateCustomer(input: UpdateCustomerInput): Promise<{ data: Customer | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, error: 'Supabase is not configured.' };
    }

    if (!input.id) {
      return { data: null, error: 'Customer ID is required.' };
    }

    if (!input.name || !input.name.trim()) {
      return { data: null, error: 'Customer Name is required.' };
    }

    if (!input.mobile || !input.mobile.trim()) {
      return { data: null, error: 'Mobile Number is required.' };
    }

    // Check if mobile is used by another customer
    const { data: existingMobile } = await supabase
      .from('customers')
      .select('id')
      .eq('mobile', input.mobile.trim())
      .neq('id', input.id)
      .maybeSingle();

    if (existingMobile) {
      return { data: null, error: `Mobile number "${input.mobile}" is already registered to another customer.` };
    }

    const { data, error } = await supabase
      .from('customers')
      .update({
        name: input.name.trim(),
        mobile: input.mobile.trim(),
        status: input.status,
        available_points: Number(input.available_points) || 0,
        credit: Number(input.credit) || 0,
        address: input.address?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return { data: null, error: error.message };
    }

    return {
      data: {
        ...data,
        available_points: Number(data.available_points) || 0,
        credit: Number(data.credit) || 0,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in updateCustomer:', err);
    return { data: null, error: err?.message || 'Failed to update customer' };
  }
}

/**
 * Fetch customer transactions with optional filtering by customer_id, calculation type, and date range.
 */
export async function fetchCustomerTransactions(options?: TransactionFilterOptions): Promise<{ data: CustomerTransaction[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('customer_transactions')
      .select(`
        *,
        customer:customers(id, name, mobile, status, available_points, credit),
        bill:bills(id, bill_id)
      `)
      .order('created_at', { ascending: false });

    if (options?.customer_id) {
      query = query.eq('customer_id', options.customer_id);
    }

    if (options?.type && options.type !== 'all') {
      query = query.eq('calculation', options.type);
    }

    if (options?.startDate) {
      query = query.gte('created_at', `${options.startDate}T00:00:00.000Z`);
    }

    if (options?.endDate) {
      query = query.lte('created_at', `${options.endDate}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customer transactions:', error);
      return { data: [], error: error.message };
    }

    const formattedData: CustomerTransaction[] = (data || []).map((t: any) => ({
      id: t.id,
      customer_id: t.customer_id,
      bill_id: t.bill_id,
      calculation: t.calculation,
      amount: Number(t.amount) || 0,
      notes: t.notes,
      created_at: t.created_at,
      updated_at: t.updated_at,
      customer: t.customer
        ? {
            id: t.customer.id,
            name: t.customer.name,
            mobile: t.customer.mobile,
            status: t.customer.status,
            available_points: Number(t.customer.available_points) || 0,
            credit: Number(t.customer.credit) || 0,
          }
        : undefined,
      bill: t.bill
        ? {
            id: t.bill.id,
            bill_id: t.bill.bill_id,
          }
        : null,
    }));

    return { data: formattedData, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchCustomerTransactions:', err);
    return { data: [], error: err?.message || 'Failed to fetch customer transactions' };
  }
}

/**
 * Create a new Customer Transaction and atomically update the customer's credit balance.
 */
export async function createCustomerTransaction(input: CreateCustomerTransactionInput): Promise<{ data: CustomerTransaction | null; newCredit: number; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: null, newCredit: 0, error: 'Supabase is not configured.' };
    }

    if (!input.customer_id) {
      return { data: null, newCredit: 0, error: 'Customer selection is required.' };
    }

    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      return { data: null, newCredit: 0, error: 'Amount must be greater than 0.' };
    }

    if (input.calculation !== 'sum' && input.calculation !== 'subtract') {
      return { data: null, newCredit: 0, error: 'Calculation type must be either sum or subtract.' };
    }

    // 1. Fetch current customer balance
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('id, name, mobile, status, available_points, credit')
      .eq('id', input.customer_id)
      .single();

    if (custError || !customer) {
      return { data: null, newCredit: 0, error: 'Customer not found.' };
    }

    const currentCredit = Number(customer.credit) || 0;
    const newCredit = input.calculation === 'sum'
      ? currentCredit + amount
      : currentCredit - amount;

    // 2. Insert into customer_transactions table
    const { data: insertedTransaction, error: insertError } = await supabase
      .from('customer_transactions')
      .insert({
        customer_id: input.customer_id,
        bill_id: input.bill_id || null,
        calculation: input.calculation,
        amount: amount,
        notes: input.notes?.trim() || null,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating customer transaction:', insertError);
      return { data: null, newCredit: currentCredit, error: insertError.message };
    }

    // 3. Update customer's credit
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        credit: newCredit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.customer_id);

    if (updateError) {
      console.error('Error updating customer credit:', updateError);
      // Still return the transaction with warning/error
      return {
        data: insertedTransaction as CustomerTransaction,
        newCredit: currentCredit,
        error: `Transaction logged, but failed to update customer credit balance: ${updateError.message}`,
      };
    }

    const fullRecord: CustomerTransaction = {
      ...insertedTransaction,
      amount: Number(insertedTransaction.amount) || 0,
      customer: {
        ...customer,
        credit: newCredit,
      },
    };

    return { data: fullRecord, newCredit, error: null };
  } catch (err: any) {
    console.error('Unexpected error in createCustomerTransaction:', err);
    return { data: null, newCredit: 0, error: err?.message || 'Failed to create transaction' };
  }
}
