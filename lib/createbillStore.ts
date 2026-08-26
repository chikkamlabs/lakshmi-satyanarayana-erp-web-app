import { supabase, isSupabaseConfigured } from './supabase';
import { Product } from './productsStore';
import { Customer } from './customersStore';

export interface BillItemInput {
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

export interface PaymentBreakdown {
  cash: number;
  upi: number;
  credit: number;
}

export interface CreateBillPayload {
  customer_id?: string | null;
  items: BillItemInput[];
  sub_total: number;
  discount: number;
  taxable_amount?: number;
  gst?: number;
  total: number;
  status: 'paid' | 'pending'; // 'paid' for completed, 'pending' for draft
  type?: 'normal' | 'gst';
  payments: PaymentBreakdown;
}

export interface CreatedBillResult {
  id: string;
  bill_id: string;
  customer_id?: string | null;
  sub_total: number;
  discount: number;
  total: number;
  status: 'paid' | 'pending';
  created_at: string;
}

// Fallback in-memory sequence for bill IDs
let mockBillSequence = 100;
let lastMockDatePrefix = '';

/**
 * Suggest next sequential Bill ID in format: bill-yymmdd-101+1
 * e.g., bill-260825-101, bill-260825-102
 */
export async function suggestNextBillId(): Promise<string> {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `bill-${yy}${mm}${dd}-`;

  if (!isSupabaseConfigured) {
    if (lastMockDatePrefix !== prefix) {
      lastMockDatePrefix = prefix;
      mockBillSequence = 101;
    } else {
      mockBillSequence += 1;
    }
    return `${prefix}${mockBillSequence}`;
  }

  try {
    const { data, error } = await supabase
      .from('bills')
      .select('bill_id')
      .ilike('bill_id', `${prefix}%`);

    if (error || !data || data.length === 0) {
      return `${prefix}101`;
    }

    let maxNum = 100;
    const regex = new RegExp(`^bill-${yy}${mm}${dd}-(\\d+)`, 'i');
    data.forEach((row: { bill_id: string }) => {
      const match = row.bill_id?.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    return `${prefix}${maxNum + 1}`;
  } catch {
    return `${prefix}101`;
  }
}

/**
 * Search active products by name, product code / SKU, or ID for the billing dropdown
 */
export async function searchProductsForBilling(query: string): Promise<{ data: Product[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const trimmed = (query || '').trim();
    let queryBuilder = supabase
      .from('products')
      .select('*, categories(id, category_id, category_name)')
      .eq('status', 'active');

    if (trimmed) {
      queryBuilder = queryBuilder.or(`name.ilike.%${trimmed}%,product_id.ilike.%${trimmed}%`);
    }

    const { data, error } = await queryBuilder
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error searching products for billing:', error);
      return { data: [], error: error.message };
    }

    const formatted: Product[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      product_id: row.product_id,
      category_id: row.category_id,
      quantity: Number(row.quantity ?? 0),
      selling_price: Number(row.selling_price ?? 0),
      mrp: Number(row.mrp ?? 0),
      low_stock: Number(row.low_stock ?? 0),
      unit: row.unit || 'Piece',
      status: row.status || 'active',
      created_at: row.created_at,
      updated_at: row.updated_at,
      category: row.categories
        ? {
            id: row.categories.id,
            category_id: row.categories.category_id,
            category_name: row.categories.category_name,
          }
        : undefined,
    }));

    return { data: formatted, error: null };
  } catch (err: any) {
    console.error('Unexpected error searching products for billing:', err);
    return { data: [], error: err.message || 'Failed to search products' };
  }
}

/**
 * Search customers by name or mobile number for the billing dropdown
 */
export async function searchCustomersForBilling(query: string): Promise<{ data: Customer[]; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      return { data: [], error: null };
    }

    const trimmed = (query || '').trim();
    let queryBuilder = supabase
      .from('customers')
      .select('*')
      .eq('status', 'active');

    if (trimmed) {
      queryBuilder = queryBuilder.or(`name.ilike.%${trimmed}%,mobile.ilike.%${trimmed}%`);
    }

    const { data, error } = await queryBuilder
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error searching customers for billing:', error);
      return { data: [], error: error.message };
    }

    const formatted: Customer[] = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      mobile: row.mobile,
      status: row.status || 'active',
      available_points: Number(row.available_points ?? 0),
      credit: Number(row.credit ?? 0),
      address: row.address,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return { data: formatted, error: null };
  } catch (err: any) {
    console.error('Unexpected error searching customers:', err);
    return { data: [], error: err.message || 'Failed to search customers' };
  }
}

/**
 * Quick create customer directly from billing screen
 */
export async function quickAddCustomer(input: {
  name: string;
  mobile: string;
  available_points?: number;
  credit?: number;
}): Promise<{ data: Customer | null; error: string | null }> {
  try {
    if (!isSupabaseConfigured) {
      const mockCustomer: Customer = {
        id: `mock-cust-${Date.now()}`,
        name: input.name.trim(),
        mobile: input.mobile.trim(),
        status: 'active',
        available_points: Number(input.available_points || 0),
        credit: Number(input.credit || 0),
        created_at: new Date().toISOString(),
      };
      return { data: mockCustomer, error: null };
    }

    // Check if mobile already exists
    const { data: existing, error: checkErr } = await supabase
      .from('customers')
      .select('id, name, mobile, available_points, credit, status')
      .eq('mobile', input.mobile.trim())
      .maybeSingle();

    if (existing && !checkErr) {
      // Existing customer found, return it
      const cust: Customer = {
        id: existing.id,
        name: existing.name,
        mobile: existing.mobile,
        status: existing.status || 'active',
        available_points: Number(existing.available_points || 0),
        credit: Number(existing.credit || 0),
        created_at: new Date().toISOString(),
      };
      return { data: cust, error: null };
    }

    const { data, error } = await supabase
      .from('customers')
      .insert([
        {
          name: input.name.trim(),
          mobile: input.mobile.trim(),
          available_points: Number(input.available_points || 0),
          credit: Number(input.credit || 0),
          status: 'active',
        },
      ])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    const created: Customer = {
      id: data.id,
      name: data.name,
      mobile: data.mobile,
      status: data.status,
      available_points: Number(data.available_points || 0),
      credit: Number(data.credit || 0),
      address: data.address,
      created_at: data.created_at,
    };

    return { data: created, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to create customer' };
  }
}

/**
 * Save / Create Bill:
 * 1. Insert into `bills`
 * 2. Insert into `bill_items`
 * 3. Update stock for each product in `products`
 * 4. Insert into `payments` for cash / upi / credit
 * 5. If credit amount > 0 and customer_id:
 *    - Insert into `customer_transactions` (calc: 'sum', amount: credit)
 *    - Update `customers.credit` = `customers.credit + credit`
 */
export async function createBill(payload: CreateBillPayload): Promise<{
  data: CreatedBillResult | null;
  error: string | null;
}> {
  try {
    if (!payload.items || payload.items.length === 0) {
      return { data: null, error: 'Cannot create a bill with no items.' };
    }

    const nextBillCode = await suggestNextBillId();

    if (!isSupabaseConfigured) {
      const mockResult: CreatedBillResult = {
        id: `mock-bill-${Date.now()}`,
        bill_id: nextBillCode,
        customer_id: payload.customer_id,
        sub_total: payload.sub_total,
        discount: payload.discount,
        total: payload.total,
        status: payload.status,
        created_at: new Date().toISOString(),
      };
      return { data: mockResult, error: null };
    }

    // 1. Insert Bill
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert([
        {
          bill_id: nextBillCode,
          customer_id: payload.customer_id || null,
          sub_total: payload.sub_total,
          discount: payload.discount,
          taxable_amount: payload.taxable_amount ?? payload.total,
          gst: payload.gst ?? 0,
          total: payload.total,
          status: payload.status,
          type: payload.type || 'normal',
        },
      ])
      .select()
      .single();

    if (billError || !billData) {
      console.error('Error creating bill record:', billError);
      return { data: null, error: billError?.message || 'Failed to create bill record' };
    }

    const billId = billData.id;

    // 2. Insert Bill Items
    const billItemsRows = payload.items.map((item) => ({
      bill_id: billId,
      product_id: item.product_id,
      product_name: item.product_name,
      mrp: item.mrp,
      quantity: item.quantity,
      selling_price: item.selling_price,
      row_total: item.row_total,
    }));

    const { error: itemsError } = await supabase.from('bill_items').insert(billItemsRows);
    if (itemsError) {
      console.error('Error inserting bill items:', itemsError);
    }

    // 3. Deduct product inventory in `products`
    for (const item of payload.items) {
      try {
        const { data: prodData } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', item.product_id)
          .single();

        if (prodData) {
          const newQty = Math.max(0, Number(prodData.quantity) - Number(item.quantity));
          await supabase
            .from('products')
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq('id', item.product_id);
        }
      } catch (stockErr) {
        console.warn(`Could not update stock for product ${item.product_id}:`, stockErr);
      }
    }

    // 4. Record Payments (cash, upi, credit)
    const paymentInserts = [];
    if (payload.payments.cash > 0) {
      paymentInserts.push({
        bill_id: billId,
        type: 'cash',
        amount: payload.payments.cash,
      });
    }
    if (payload.payments.upi > 0) {
      paymentInserts.push({
        bill_id: billId,
        type: 'upi',
        amount: payload.payments.upi,
      });
    }
    if (payload.payments.credit > 0) {
      paymentInserts.push({
        bill_id: billId,
        type: 'credit',
        amount: payload.payments.credit,
      });
    }

    if (paymentInserts.length > 0) {
      const { error: payError } = await supabase.from('payments').insert(paymentInserts);
      if (payError) {
        console.error('Error saving bill payments:', payError);
      }
    }

    // 5. If credit amount > 0 and customer is selected:
    // Update customer credit balance and add record in customer_transactions
    if (payload.payments.credit > 0 && payload.customer_id) {
      try {
        // Insert customer_transaction
        await supabase.from('customer_transactions').insert([
          {
            customer_id: payload.customer_id,
            bill_id: billId,
            calculation: 'sum',
            amount: payload.payments.credit,
            notes: `Credit Bill ${nextBillCode}`,
          },
        ]);

        // Get current customer credit
        const { data: custData } = await supabase
          .from('customers')
          .select('credit')
          .eq('id', payload.customer_id)
          .single();

        const currentCredit = Number(custData?.credit ?? 0);
        const newCredit = currentCredit + payload.payments.credit;

        await supabase
          .from('customers')
          .update({
            credit: newCredit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.customer_id);
      } catch (creditErr) {
        console.error('Error updating customer credit & transaction:', creditErr);
      }
    }

    // 6. If customer is selected, add customer reward points on the final total amount (after discount):
    // customers.points = customers.points + (1 * total amount / 100)
    if (payload.customer_id && payload.total > 0) {
      try {
        const pointsToAdd = (1 * Number(payload.total)) / 100;
        const { data: custData } = await supabase
          .from('customers')
          .select('available_points')
          .eq('id', payload.customer_id)
          .single();

        const currentPoints = Number(custData?.available_points ?? 0);
        const newPoints = currentPoints + pointsToAdd;

        await supabase
          .from('customers')
          .update({
            available_points: newPoints,
            updated_at: new Date().toISOString(),
          })
          .eq('id', payload.customer_id);
      } catch (pointsErr) {
        console.error('Error adding customer points:', pointsErr);
      }
    }

    return {
      data: {
        id: billData.id,
        bill_id: billData.bill_id,
        customer_id: billData.customer_id,
        sub_total: Number(billData.sub_total),
        discount: Number(billData.discount),
        total: Number(billData.total),
        status: billData.status,
        created_at: billData.created_at,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('Unexpected error creating bill:', err);
    return { data: null, error: err.message || 'Failed to complete bill creation' };
  }
}
