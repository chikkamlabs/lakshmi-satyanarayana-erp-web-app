import { supabase, isSupabaseConfigured } from './supabase';
import { Product } from './productsStore';
import { Customer } from './customersStore';

export type BillStatus = 'paid' | 'pending' | 'cancelled';
export type BillType = 'normal' | 'gst';

export interface BillItemDetail {
  id?: string;
  bill_id?: string;
  product_id: string;
  product_name: string;
  product_code?: string;
  mrp: number;
  quantity: number;
  selling_price: number;
  row_total: number;
  available_stock?: number;
  unit?: string;
}

export interface BillPayments {
  cash: number;
  upi: number;
  credit: number;
}

export interface BillRecord {
  id: string;
  bill_id: string;
  customer_id?: string | null;
  sub_total: number;
  discount: number;
  taxable_amount: number;
  gst: number;
  total: number;
  status: BillStatus;
  type: BillType;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    name: string;
    mobile: string;
    available_points?: number;
    credit?: number;
  } | null;
  total_products: number;
  total_quantity: number;
  payments: BillPayments;
  items?: BillItemDetail[];
}

export interface BillFilters {
  searchQuery?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  status?: string; // 'all' | 'paid' | 'pending' | 'cancelled'
}

export interface BillDashboardStats {
  totalBills: number;
  totalRevenue: number;
  totalItemsSold: number;
}

export interface UpdateBillPayload {
  id: string; // The primary UUID of the bill
  bill_id: string; // The visible Bill code (e.g. BILL-1001)
  customer_id?: string | null;
  items: BillItemDetail[];
  sub_total: number;
  discount: number;
  taxable_amount?: number;
  gst?: number;
  total: number;
  status: BillStatus;
  type?: BillType;
  payments: BillPayments;
}

// Fallback in-memory initial records for demo/offline when Supabase is not configured
let inMemoryBills: BillRecord[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    bill_id: 'bill-260823-131',
    customer_id: '10000000-0000-0000-0000-000000000001',
    sub_total: 2200,
    discount: 0,
    taxable_amount: 2200,
    gst: 0,
    total: 2200,
    status: 'paid',
    type: 'normal',
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    customer: {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'suresh',
      mobile: '1234567890',
      available_points: 120,
      credit: 0,
    },
    total_products: 1,
    total_quantity: 20,
    payments: {
      cash: 2200,
      upi: 0,
      credit: 0,
    },
    items: [
      {
        id: 'item-1',
        bill_id: '30000000-0000-0000-0000-000000000001',
        product_id: '20000000-0000-0000-0000-000000000001',
        product_name: 'W180 Jumbo Raw Cashew Nuts 500g',
        product_code: 'PRD-1001',
        mrp: 600,
        quantity: 20,
        selling_price: 110,
        row_total: 2200,
        available_stock: 45,
        unit: 'Packet',
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    bill_id: 'bill-260823-130',
    customer_id: null,
    sub_total: 300,
    discount: 20,
    taxable_amount: 280,
    gst: 0,
    total: 280,
    status: 'pending',
    type: 'normal',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    customer: null,
    total_products: 1,
    total_quantity: 1,
    payments: {
      cash: 0,
      upi: 0,
      credit: 0,
    },
    items: [
      {
        id: 'item-2',
        bill_id: '30000000-0000-0000-0000-000000000002',
        product_id: '20000000-0000-0000-0000-000000000003',
        product_name: 'California Almonds Extra Bold 250g',
        product_code: 'PRD-1003',
        mrp: 320,
        quantity: 1,
        selling_price: 300,
        row_total: 300,
        available_stock: 60,
        unit: 'Packet',
      },
    ],
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    bill_id: 'bill-260823-129',
    customer_id: '10000000-0000-0000-0000-000000000002',
    sub_total: 4800,
    discount: 300,
    taxable_amount: 4500,
    gst: 0,
    total: 4500,
    status: 'paid',
    type: 'normal',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 23 * 3600 * 1000).toISOString(),
    customer: {
      id: '10000000-0000-0000-0000-000000000002',
      name: 'Ramesh Patel',
      mobile: '9845012345',
      available_points: 250,
      credit: 1500,
    },
    total_products: 2,
    total_quantity: 5,
    payments: {
      cash: 2000,
      upi: 1000,
      credit: 1500,
    },
    items: [
      {
        id: 'item-3',
        bill_id: '30000000-0000-0000-0000-000000000003',
        product_id: '20000000-0000-0000-0000-000000000002',
        product_name: 'W240 Whole Cashews 1kg Tin',
        product_code: 'PRD-1002',
        mrp: 1100,
        quantity: 3,
        selling_price: 950,
        row_total: 2850,
        available_stock: 12,
        unit: 'Tin',
      },
      {
        id: 'item-4',
        bill_id: '30000000-0000-0000-0000-000000000003',
        product_id: '20000000-0000-0000-0000-000000000004',
        product_name: 'Afghani Black Raisins 500g',
        product_code: 'PRD-1004',
        mrp: 450,
        quantity: 2,
        selling_price: 390,
        row_total: 780,
        available_stock: 35,
        unit: 'Pouch',
      },
    ],
  },
];

/**
 * Fetch Bills for Billing Dashboard with filters
 */
export async function fetchBillsDashboard(filters: BillFilters): Promise<{
  data: BillRecord[];
  stats: BillDashboardStats;
  error: string | null;
}> {
  try {
    if (!isSupabaseConfigured) {
      let filtered = [...inMemoryBills];

      // Filter by searchQuery
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (b) =>
            b.bill_id.toLowerCase().includes(q) ||
            (b.customer &&
              (b.customer.name.toLowerCase().includes(q) || b.customer.mobile.includes(q)))
        );
      }

      // Filter by Status
      if (filters.status && filters.status !== 'all') {
        const targetStatus =
          filters.status === 'Completed' || filters.status === 'paid'
            ? 'paid'
            : filters.status === 'Draft' || filters.status === 'pending'
            ? 'pending'
            : filters.status === 'Cancelled' || filters.status === 'cancelled'
            ? 'cancelled'
            : filters.status;
        filtered = filtered.filter((b) => b.status === targetStatus);
      }

      // Filter by Date Range (inclusive)
      if (filters.fromDate) {
        const from = new Date(filters.fromDate);
        from.setHours(0, 0, 0, 0);
        filtered = filtered.filter((b) => new Date(b.created_at) >= from);
      }
      if (filters.toDate) {
        const to = new Date(filters.toDate);
        to.setHours(23, 59, 59, 999);
        filtered = filtered.filter((b) => new Date(b.created_at) <= to);
      }

      // Calculate stats
      const totalBills = filtered.length;
      const totalRevenue = filtered
        .filter((b) => b.status !== 'cancelled')
        .reduce((sum, b) => sum + Number(b.total || 0), 0);
      const totalItemsSold = filtered
        .filter((b) => b.status !== 'cancelled')
        .reduce((sum, b) => sum + Number(b.total_quantity || 0), 0);

      return {
        data: filtered,
        stats: {
          totalBills,
          totalRevenue,
          totalItemsSold,
        },
        error: null,
      };
    }

    // SUPABASE DB QUERY
    let query = supabase
      .from('bills')
      .select(`
        *,
        customers (
          id,
          name,
          mobile,
          available_points,
          credit
        ),
        bill_items (
          id,
          product_id,
          product_name,
          mrp,
          quantity,
          selling_price,
          row_total
        ),
        payments (
          type,
          amount
        )
      `)
      .order('created_at', { ascending: false });

    // Status filter
    if (filters.status && filters.status !== 'all') {
      const targetStatus =
        filters.status === 'Completed' || filters.status === 'paid'
          ? 'paid'
          : filters.status === 'Draft' || filters.status === 'pending'
          ? 'pending'
          : filters.status === 'Cancelled' || filters.status === 'cancelled'
          ? 'cancelled'
          : filters.status;
      query = query.eq('status', targetStatus);
    }

    // Date range filter
    if (filters.fromDate) {
      const fromISO = new Date(`${filters.fromDate}T00:00:00.000Z`).toISOString();
      query = query.gte('created_at', fromISO);
    }
    if (filters.toDate) {
      const toISO = new Date(`${filters.toDate}T23:59:59.999Z`).toISOString();
      query = query.lte('created_at', toISO);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('Error fetching bills from Supabase:', error);
      return {
        data: [],
        stats: { totalBills: 0, totalRevenue: 0, totalItemsSold: 0 },
        error: error.message,
      };
    }

    let records: BillRecord[] = (rows || []).map((row: any) => {
      const itemsList: BillItemDetail[] = row.bill_items || [];
      const distinctProductsCount = itemsList.length;
      const totalQty = itemsList.reduce((acc, curr) => acc + Number(curr.quantity || 0), 0);

      // Payment sums
      const paymentList = row.payments || [];
      const payments: BillPayments = {
        cash: 0,
        upi: 0,
        credit: 0,
      };

      paymentList.forEach((p: any) => {
        if (p.type === 'cash') payments.cash += Number(p.amount || 0);
        else if (p.type === 'upi') payments.upi += Number(p.amount || 0);
        else if (p.type === 'credit') payments.credit += Number(p.amount || 0);
      });

      return {
        id: row.id,
        bill_id: row.bill_id,
        customer_id: row.customer_id,
        sub_total: Number(row.sub_total || 0),
        discount: Number(row.discount || 0),
        taxable_amount: Number(row.taxable_amount || 0),
        gst: Number(row.gst || 0),
        total: Number(row.total || 0),
        status: row.status as BillStatus,
        type: (row.type as BillType) || 'normal',
        created_at: row.created_at,
        updated_at: row.updated_at || row.created_at,
        customer: row.customers
          ? {
              id: row.customers.id,
              name: row.customers.name,
              mobile: row.customers.mobile,
              available_points: Number(row.customers.available_points || 0),
              credit: Number(row.customers.credit || 0),
            }
          : null,
        total_products: distinctProductsCount,
        total_quantity: totalQty,
        payments,
        items: itemsList,
      };
    });

    // Client-side text search (matches bill_id, customer name, mobile)
    if (filters.searchQuery?.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      records = records.filter(
        (b) =>
          b.bill_id.toLowerCase().includes(q) ||
          (b.customer &&
            (b.customer.name.toLowerCase().includes(q) || b.customer.mobile.includes(q)))
      );
    }

    const totalBills = records.length;
    const totalRevenue = records
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.total || 0), 0);
    const totalItemsSold = records
      .filter((b) => b.status !== 'cancelled')
      .reduce((sum, b) => sum + Number(b.total_quantity || 0), 0);

    return {
      data: records,
      stats: {
        totalBills,
        totalRevenue,
        totalItemsSold,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error in fetchBillsDashboard:', err);
    return {
      data: [],
      stats: { totalBills: 0, totalRevenue: 0, totalItemsSold: 0 },
      error: err.message || 'Failed to load bills',
    };
  }
}

/**
 * Fetch a single Bill by its primary UUID (or visible bill_id) with full items & customer details
 */
export async function fetchBillById(identifier: string): Promise<{
  data: BillRecord | null;
  error: string | null;
}> {
  try {
    if (!identifier) {
      return { data: null, error: 'Bill identifier is required' };
    }

    if (!isSupabaseConfigured) {
      const found = inMemoryBills.find(
        (b) => b.id === identifier || b.bill_id.toLowerCase() === identifier.toLowerCase()
      );
      if (!found) {
        return { data: null, error: 'Bill not found' };
      }
      return { data: JSON.parse(JSON.stringify(found)), error: null };
    }

    // Try finding by UUID or bill_id
    let query = supabase
      .from('bills')
      .select(`
        *,
        customers (
          id,
          name,
          mobile,
          available_points,
          credit,
          address
        ),
        bill_items (
          id,
          product_id,
          product_name,
          mrp,
          quantity,
          selling_price,
          row_total
        ),
        payments (
          type,
          amount
        )
      `);

    // Check if identifier is UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('bill_id', identifier);
    }

    const { data: row, error } = await query.maybeSingle();

    if (error || !row) {
      console.error('Error fetching bill details:', error);
      return { data: null, error: error?.message || 'Bill not found' };
    }

    // Fetch product units / codes for items
    const itemsList: BillItemDetail[] = await Promise.all(
      (row.bill_items || []).map(async (item: any) => {
        let stock = 0;
        let pCode = '';
        let unit = 'Piece';
        try {
          const { data: prodData } = await supabase
            .from('products')
            .select('product_id, quantity, unit')
            .eq('id', item.product_id)
            .maybeSingle();

          if (prodData) {
            stock = Number(prodData.quantity || 0);
            pCode = prodData.product_id;
            unit = prodData.unit || 'Piece';
          }
        } catch {
          // ignore product detail lookup error
        }

        return {
          id: item.id,
          bill_id: row.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: pCode,
          mrp: Number(item.mrp || 0),
          quantity: Number(item.quantity || 0),
          selling_price: Number(item.selling_price || 0),
          row_total: Number(item.row_total || 0),
          available_stock: stock,
          unit,
        };
      })
    );

    const paymentList = row.payments || [];
    const payments: BillPayments = {
      cash: 0,
      upi: 0,
      credit: 0,
    };

    paymentList.forEach((p: any) => {
      if (p.type === 'cash') payments.cash += Number(p.amount || 0);
      else if (p.type === 'upi') payments.upi += Number(p.amount || 0);
      else if (p.type === 'credit') payments.credit += Number(p.amount || 0);
    });

    const billRecord: BillRecord = {
      id: row.id,
      bill_id: row.bill_id,
      customer_id: row.customer_id,
      sub_total: Number(row.sub_total || 0),
      discount: Number(row.discount || 0),
      taxable_amount: Number(row.taxable_amount || 0),
      gst: Number(row.gst || 0),
      total: Number(row.total || 0),
      status: row.status as BillStatus,
      type: (row.type as BillType) || 'normal',
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
      customer: row.customers
        ? {
            id: row.customers.id,
            name: row.customers.name,
            mobile: row.customers.mobile,
            available_points: Number(row.customers.available_points || 0),
            credit: Number(row.customers.credit || 0),
          }
        : null,
      total_products: itemsList.length,
      total_quantity: itemsList.reduce((acc, curr) => acc + curr.quantity, 0),
      payments,
      items: itemsList,
    };

    return { data: billRecord, error: null };
  } catch (err: any) {
    console.error('Unexpected error in fetchBillById:', err);
    return { data: null, error: err.message || 'Failed to load bill' };
  }
}

/**
 * Update an existing Bill without creating duplicate rows:
 * 1. Updates `bills` row (subtotal, total, discount, customer_id, status, updated_at).
 * 2. Reconciles product inventory deltas.
 * 3. Updates `bill_items` (replaces previous items for this bill_id).
 * 4. Updates `payments` (replaces previous payments for this bill_id).
 * 5. Updates `customer_transactions` & `customers.credit` if credit amounts changed.
 */
export async function updateBill(payload: UpdateBillPayload): Promise<{
  data: BillRecord | null;
  error: string | null;
}> {
  try {
    if (!payload.id) {
      return { data: null, error: 'Cannot update bill: missing bill ID' };
    }
    if (!payload.items || payload.items.length === 0) {
      return { data: null, error: 'Cannot save a bill with no items' };
    }

    const updatedAtTimestamp = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const idx = inMemoryBills.findIndex((b) => b.id === payload.id);
      if (idx === -1) {
        return { data: null, error: 'Bill record not found for update' };
      }

      // Fetch customer details if provided
      let cust = inMemoryBills[idx].customer || null;
      if (payload.customer_id) {
        cust = {
          id: payload.customer_id,
          name: cust?.name || 'Customer',
          mobile: cust?.mobile || '9876543210',
          available_points: cust?.available_points || 0,
          credit: (cust?.credit || 0) + (payload.payments.credit - (inMemoryBills[idx].payments.credit || 0)),
        };
      } else {
        cust = null;
      }

      const updatedRecord: BillRecord = {
        ...inMemoryBills[idx],
        customer_id: payload.customer_id || null,
        customer: cust,
        sub_total: payload.sub_total,
        discount: payload.discount,
        taxable_amount: payload.taxable_amount ?? payload.total,
        gst: payload.gst ?? 0,
        total: payload.total,
        status: payload.status,
        type: payload.type || 'normal',
        payments: payload.payments,
        items: payload.items.map((i, itemIdx) => ({
          ...i,
          id: i.id || `item-${Date.now()}-${itemIdx}`,
          bill_id: payload.id,
        })),
        total_products: payload.items.length,
        total_quantity: payload.items.reduce((s, curr) => s + curr.quantity, 0),
        updated_at: updatedAtTimestamp,
      };

      inMemoryBills[idx] = updatedRecord;
      return { data: updatedRecord, error: null };
    }

    // 1. Fetch previous bill items and previous payments to calculate stock & credit deltas
    const { data: oldBill, error: oldBillErr } = await supabase
      .from('bills')
      .select(`
        *,
        bill_items (*),
        payments (*)
      `)
      .eq('id', payload.id)
      .single();

    if (oldBillErr || !oldBill) {
      return { data: null, error: 'Original bill not found in database' };
    }

    // 2. Update the existing row in `bills` table (no duplicate created!)
    const { data: updatedBillRow, error: updateBillErr } = await supabase
      .from('bills')
      .update({
        customer_id: payload.customer_id || null,
        sub_total: payload.sub_total,
        discount: payload.discount,
        taxable_amount: payload.taxable_amount ?? payload.total,
        gst: payload.gst ?? 0,
        total: payload.total,
        status: payload.status,
        type: payload.type || 'normal',
        updated_at: updatedAtTimestamp,
      })
      .eq('id', payload.id)
      .select()
      .single();

    if (updateBillErr || !updatedBillRow) {
      console.error('Error updating bill header:', updateBillErr);
      return { data: null, error: updateBillErr?.message || 'Failed to update bill' };
    }

    // 3. Reconcile stock quantities
    // First, revert old items quantities back to products
    for (const oldItem of oldBill.bill_items || []) {
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', oldItem.product_id)
          .single();

        if (prodData) {
          const restoredQty = Number(prodData.quantity) + Number(oldItem.quantity);
          await supabase
            .from('products')
            .update({ quantity: restoredQty, updated_at: updatedAtTimestamp })
            .eq('id', oldItem.product_id);
        }
      } catch (err) {
        console.warn('Could not revert stock for old item:', err);
      }
    }

    // Now, deduct newly specified quantities from products
    for (const newItem of payload.items) {
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', newItem.product_id)
          .single();

        if (prodData) {
          const newQty = Math.max(0, Number(prodData.quantity) - Number(newItem.quantity));
          await supabase
            .from('products')
            .update({ quantity: newQty, updated_at: updatedAtTimestamp })
            .eq('id', newItem.product_id);
        }
      } catch (err) {
        console.warn('Could not deduct stock for new item:', err);
      }
    }

    // 4. Update `bill_items`
    // Delete previous items for this bill_id
    await supabase.from('bill_items').delete().eq('bill_id', payload.id);

    // Insert updated items
    const newItemsRows = payload.items.map((item) => ({
      bill_id: payload.id,
      product_id: item.product_id,
      product_name: item.product_name,
      mrp: item.mrp,
      quantity: item.quantity,
      selling_price: item.selling_price,
      row_total: item.row_total,
      updated_at: updatedAtTimestamp,
    }));

    const { error: insertItemsErr } = await supabase.from('bill_items').insert(newItemsRows);
    if (insertItemsErr) {
      console.error('Error inserting updated bill items:', insertItemsErr);
    }

    // 5. Update `payments`
    // Delete previous payments for this bill_id
    await supabase.from('payments').delete().eq('bill_id', payload.id);

    // Insert new payments
    const paymentInserts = [];
    if (payload.payments.cash > 0) {
      paymentInserts.push({
        bill_id: payload.id,
        type: 'cash',
        amount: payload.payments.cash,
        updated_at: updatedAtTimestamp,
      });
    }
    if (payload.payments.upi > 0) {
      paymentInserts.push({
        bill_id: payload.id,
        type: 'upi',
        amount: payload.payments.upi,
        updated_at: updatedAtTimestamp,
      });
    }
    if (payload.payments.credit > 0) {
      paymentInserts.push({
        bill_id: payload.id,
        type: 'credit',
        amount: payload.payments.credit,
        updated_at: updatedAtTimestamp,
      });
    }

    if (paymentInserts.length > 0) {
      const { error: payErr } = await supabase.from('payments').insert(paymentInserts);
      if (payErr) {
        console.error('Error recording updated payments:', payErr);
      }
    }

    // 6. Customer credit balance adjustments
    const oldCreditPayment = (oldBill.payments || [])
      .filter((p: any) => p.type === 'credit')
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    const newCreditPayment = payload.payments.credit || 0;

    // If old bill had customer and old credit > 0, deduct it from old customer
    if (oldCreditPayment > 0 && oldBill.customer_id) {
      try {
        const { data: prevCust } = await supabase
          .from('customers')
          .select('credit')
          .eq('id', oldBill.customer_id)
          .single();

        if (prevCust) {
          const adjCredit = Math.max(0, Number(prevCust.credit || 0) - oldCreditPayment);
          await supabase
            .from('customers')
            .update({ credit: adjCredit, updated_at: updatedAtTimestamp })
            .eq('id', oldBill.customer_id);
        }
      } catch (err) {
        console.warn('Could not revert previous customer credit:', err);
      }
    }

    // If new bill has customer and new credit > 0, add to current customer
    if (newCreditPayment > 0 && payload.customer_id) {
      try {
        const { data: curCust } = await supabase
          .from('customers')
          .select('credit')
          .eq('id', payload.customer_id)
          .single();

        const baseCredit = Number(curCust?.credit || 0);
        const updatedCustCredit = baseCredit + newCreditPayment;

        await supabase
          .from('customers')
          .update({ credit: updatedCustCredit, updated_at: updatedAtTimestamp })
          .eq('id', payload.customer_id);

        // Delete old customer_transactions for this bill
        await supabase.from('customer_transactions').delete().eq('bill_id', payload.id);

        // Insert fresh customer_transaction
        await supabase.from('customer_transactions').insert([
          {
            customer_id: payload.customer_id,
            bill_id: payload.id,
            calculation: 'sum',
            amount: newCreditPayment,
            notes: `Updated Credit Bill ${payload.bill_id}`,
            updated_at: updatedAtTimestamp,
          },
        ]);
      } catch (err) {
        console.warn('Could not apply new customer credit:', err);
      }
    } else {
      // Clean up customer_transactions if credit is 0
      await supabase.from('customer_transactions').delete().eq('bill_id', payload.id);
    }

    // Return the fresh, complete updated bill
    const res = await fetchBillById(payload.id);
    return { data: res.data, error: null };
  } catch (err: any) {
    console.error('Unexpected error in updateBill:', err);
    return { data: null, error: err.message || 'Failed to update bill' };
  }
}
