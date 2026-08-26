'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Scan,
  X,
  Trash2,
  User,
  UserPlus,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Check,
  Banknote,
  Smartphone,
  CreditCard,
  Clock,
  Save,
  ChevronRight,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  fetchBillById,
  updateBill,
  BillRecord,
  BillItemDetail,
  BillStatus,
  BillType,
} from '@/lib/openbillStore';
import {
  searchProductsForBilling,
  searchCustomersForBilling,
  quickAddCustomer,
} from '@/lib/createbillStore';
import { Product } from '@/lib/productsStore';
import { Customer } from '@/lib/customersStore';

function OpenBillContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const billIdParam = searchParams.get('id') || searchParams.get('bill_id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Loading & original bill state
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [originalBill, setOriginalBill] = useState<BillRecord | null>(null);

  // Editable Bill Meta
  const [billDbId, setBillDbId] = useState('');
  const [billCode, setBillCode] = useState('');
  const [items, setItems] = useState<BillItemDetail[]>([]);
  const [discount, setDiscount] = useState<number | string>(0);
  const [billStatus, setBillStatus] = useState<BillStatus>('paid');
  const [billType, setBillType] = useState<BillType>('normal');
  const [createdAt, setCreatedAt] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string>('');

  // Product Search State
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [isProductSearching, setIsProductSearching] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Customer State
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isCustomerSearching, setIsCustomerSearching] = useState(false);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(0);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Quick Add Customer Modal
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustMobile, setQuickCustMobile] = useState('');
  const [quickCustPoints, setQuickCustPoints] = useState<number | string>(0);
  const [quickCustCredit, setQuickCustCredit] = useState<number | string>(0);
  const [quickCustSaving, setQuickCustSaving] = useState(false);
  const [quickCustError, setQuickCustError] = useState<string | null>(null);

  // Payments State
  const [cashAmount, setCashAmount] = useState<number | string>('');
  const [upiAmount, setUpiAmount] = useState<number | string>('');
  const [creditAmount, setCreditAmount] = useState<number | string>('');

  // Saving State & Alerts
  const [savingBill, setSavingBill] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // DOM Refs for keyboard flow
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const customerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const discountInputRef = useRef<HTMLInputElement | null>(null);
  const cashInputRef = useRef<HTMLInputElement | null>(null);
  const upiInputRef = useRef<HTMLInputElement | null>(null);
  const creditInputRef = useRef<HTMLInputElement | null>(null);
  const saveAndPrintBtnRef = useRef<HTMLButtonElement | null>(null);
  const qtyInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const spInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Load existing bill data
  const loadBillData = useCallback(async (id: string) => {
    if (!id) {
      setLoadError('No Bill ID provided in URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const res = await fetchBillById(id);

    if (res.error || !res.data) {
      setLoadError(res.error || 'Bill not found.');
      setLoading(false);
      return;
    }

    const b = res.data;
    setOriginalBill(b);
    setBillDbId(b.id);
    setBillCode(b.bill_id);
    setItems(b.items || []);
    setDiscount(b.discount || 0);
    setBillStatus(b.status);
    setBillType(b.type || 'normal');
    setCreatedAt(b.created_at);
    setUpdatedAt(b.updated_at || b.created_at);

    // Populate customer
    if (b.customer) {
      setSelectedCustomer({
        id: b.customer.id,
        name: b.customer.name,
        mobile: b.customer.mobile,
        status: 'active',
        available_points: b.customer.available_points || 0,
        credit: b.customer.credit || 0,
        created_at: b.created_at,
      });
    } else {
      setSelectedCustomer(null);
    }

    // Populate payments
    setCashAmount(b.payments.cash || '');
    setUpiAmount(b.payments.upi || '');
    setCreditAmount(b.payments.credit || '');

    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function initBill() {
      if (!billIdParam) {
        if (mounted) {
          setLoading(false);
          setLoadError('Please provide a valid Bill ID to view or edit.');
        }
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetchBillById(billIdParam);
        if (!mounted) return;

        if (res.error || !res.data) {
          setLoadError(res.error || 'Bill not found.');
          setLoading(false);
          return;
        }

        const b = res.data;
        setOriginalBill(b);
        setBillDbId(b.id);
        setBillCode(b.bill_id);
        setItems(b.items || []);
        setDiscount(b.discount || 0);
        setBillStatus(b.status);
        setBillType(b.type || 'normal');
        setCreatedAt(b.created_at);
        setUpdatedAt(b.updated_at || b.created_at);

        if (b.customer) {
          setSelectedCustomer({
            id: b.customer.id,
            name: b.customer.name,
            mobile: b.customer.mobile,
            status: 'active',
            available_points: b.customer.available_points || 0,
            credit: b.customer.credit || 0,
            created_at: b.created_at,
          });
        } else {
          setSelectedCustomer(null);
        }

        setCashAmount(b.payments.cash || '');
        setUpiAmount(b.payments.upi || '');
        setCreditAmount(b.payments.credit || '');
      } catch (err: any) {
        if (mounted) {
          setLoadError(err?.message || 'Failed to load bill.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initBill();

    return () => {
      mounted = false;
    };
  }, [billIdParam]);

  // Product Search Debounce
  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      if (!productQuery.trim()) {
        if (active) {
          setProductResults([]);
          setShowProductDropdown(false);
          setIsProductSearching(false);
        }
        return;
      }

      setIsProductSearching(true);
      const res = await searchProductsForBilling(productQuery);
      if (!active) return;
      setIsProductSearching(false);
      if (res.data) {
        setProductResults(res.data);
        setSelectedProductIndex(0);
        setShowProductDropdown(res.data.length > 0);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [productQuery]);

  // Customer Search Debounce
  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      if (!customerQuery.trim()) {
        if (active) {
          setCustomerResults([]);
          setShowCustomerDropdown(false);
          setIsCustomerSearching(false);
        }
        return;
      }

      setIsCustomerSearching(true);
      const res = await searchCustomersForBilling(customerQuery);
      if (!active) return;
      setIsCustomerSearching(false);
      if (res.data) {
        setCustomerResults(res.data);
        setSelectedCustomerIndex(0);
        setShowCustomerDropdown(res.data.length > 0);
      }
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [customerQuery]);

  // Calculations
  const subTotal = items.reduce((acc, curr) => acc + (Number(curr.row_total) || 0), 0);
  const discountVal = Math.max(0, Number(discount) || 0);
  const totalAmount = Math.max(0, subTotal - discountVal);

  const numCash = Number(cashAmount) || 0;
  const numUpi = Number(upiAmount) || 0;
  const numCredit = Number(creditAmount) || 0;
  const totalPaid = numCash + numUpi + numCredit;
  const remainingPayment = Math.max(0, totalAmount - totalPaid);

  const handleSetFullCash = () => {
    setCashAmount(totalAmount);
    setUpiAmount(0);
    setCreditAmount(0);
  };

  // Add Product to items list
  const handleSelectProduct = (prod: Product) => {
    const existingIndex = items.findIndex((i) => i.product_id === prod.id);
    let targetIndex = 0;

    if (existingIndex >= 0) {
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + 1;
      const sp = updated[existingIndex].selling_price;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        row_total: Number((newQty * sp).toFixed(2)),
      };
      setItems(updated);
      targetIndex = existingIndex;
    } else {
      const newItem: BillItemDetail = {
        bill_id: billDbId,
        product_id: prod.id,
        product_name: prod.name,
        product_code: prod.product_id,
        mrp: prod.mrp,
        quantity: 1,
        selling_price: prod.selling_price,
        row_total: Number((1 * prod.selling_price).toFixed(2)),
        available_stock: prod.quantity,
        unit: prod.unit,
      };
      setItems((prev) => [...prev, newItem]);
      targetIndex = items.length;
    }

    setProductQuery('');
    setProductResults([]);
    setShowProductDropdown(false);

    setTimeout(() => {
      qtyInputRefs.current[targetIndex]?.focus();
      qtyInputRefs.current[targetIndex]?.select();
    }, 50);
  };

  // Update item quantity
  const handleQuantityChange = (index: number, newQty: number) => {
    const updated = [...items];
    const qty = isNaN(newQty) ? 0 : newQty;
    const sp = updated[index].selling_price;
    updated[index] = {
      ...updated[index],
      quantity: qty,
      row_total: Number((qty * sp).toFixed(2)),
    };
    setItems(updated);
  };

  // Update item selling price
  const handleSellingPriceChange = (index: number, newSp: number) => {
    const updated = [...items];
    const sp = isNaN(newSp) ? 0 : newSp;
    const qty = updated[index].quantity;
    updated[index] = {
      ...updated[index],
      selling_price: sp,
      row_total: Number((qty * sp).toFixed(2)),
    };
    setItems(updated);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setTimeout(() => {
      productSearchInputRef.current?.focus();
    }, 50);
  };

  // Keyboard navigation
  const handleProductSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showProductDropdown || productResults.length === 0) {
      if (e.key === 'ArrowDown' && items.length > 0) {
        e.preventDefault();
        qtyInputRefs.current[0]?.focus();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedProductIndex((prev) => (prev + 1) % productResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProductIndex((prev) => (prev - 1 + productResults.length) % productResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (productResults[selectedProductIndex]) {
        handleSelectProduct(productResults[selectedProductIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowProductDropdown(false);
    }
  };

  // Quick Customer Creation
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName.trim() || !quickCustMobile.trim()) {
      setQuickCustError('Name and Mobile number are required.');
      return;
    }

    setQuickCustSaving(true);
    setQuickCustError(null);

    const res = await quickAddCustomer({
      name: quickCustName.trim(),
      mobile: quickCustMobile.trim(),
      available_points: Number(quickCustPoints) || 0,
      credit: Number(quickCustCredit) || 0,
    });

    setQuickCustSaving(false);

    if (res.error) {
      setQuickCustError(res.error);
    } else if (res.data) {
      setSelectedCustomer(res.data);
      setShowQuickAddModal(false);
      setQuickCustName('');
      setQuickCustMobile('');
      setQuickCustPoints(0);
      setQuickCustCredit(0);
      setCustomerQuery('');
      setTimeout(() => {
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
      }, 50);
    }
  };

  // Update Bill Action
  const handleSaveBillUpdates = async (newStatus: BillStatus, printAfter = false) => {
    if (items.length === 0) {
      setBillError('Cannot save a bill with no items.');
      return;
    }

    if (newStatus === 'paid' && numCredit > 0 && !selectedCustomer) {
      setBillError('Customer must be selected for Credit payment mode.');
      return;
    }

    setSavingBill(true);
    setBillError(null);
    setSaveSuccessMsg(null);

    let finalCash = numCash;
    let finalUpi = numUpi;
    let finalCredit = numCredit;

    if (finalCash === 0 && finalUpi === 0 && finalCredit === 0 && newStatus === 'paid') {
      finalCash = totalAmount;
    }

    const payload = {
      id: billDbId,
      bill_id: billCode,
      customer_id: selectedCustomer?.id || null,
      items: items.map((i) => ({
        id: i.id,
        bill_id: billDbId,
        product_id: i.product_id,
        product_name: i.product_name,
        mrp: i.mrp,
        quantity: i.quantity,
        selling_price: i.selling_price,
        row_total: i.row_total,
      })),
      sub_total: subTotal,
      discount: discountVal,
      total: totalAmount,
      status: newStatus,
      type: billType,
      payments: {
        cash: finalCash,
        upi: finalUpi,
        credit: finalCredit,
      },
    };

    const res = await updateBill(payload);
    setSavingBill(false);

    if (res.error) {
      setBillError(res.error);
    } else if (res.data) {
      setOriginalBill(res.data);
      setBillStatus(res.data.status);
      setUpdatedAt(res.data.updated_at);
      setSaveSuccessMsg('Bill updated successfully without duplicate rows!');

      if (printAfter) {
        setShowPrintModal(true);
      }
    }
  };

  const formatCurrency = (val: number) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <div className="flex flex-1 relative">
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <span className="text-xs text-[var(--text-secondary)]">Loading bill record...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <div className="flex flex-1 relative">
          <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="max-w-md w-full p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-4 shadow-sm">
              <AlertCircle className="w-10 h-10 text-[var(--danger)] mx-auto" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">Unable to open bill</h2>
              <p className="text-xs text-[var(--text-secondary)]">{loadError}</p>
              <button
                type="button"
                onClick={() => router.push('/admin/bills/dashboard')}
                className="erp-btn erp-btn-primary text-xs"
              >
                Back to Bills Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="open-bill-main" className="flex-1 p-3 sm:p-5 lg:p-6 erp-fade-in min-w-0">
          <div className="max-w-[1600px] mx-auto space-y-4">
            
            {/* Top Navigation & Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/bills/dashboard')}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Back to Bills"
                  aria-label="Back to Bills"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      Edit Bill
                    </h1>
                    <span className="erp-badge font-mono text-xs bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                      {billCode}
                    </span>
                    {billStatus === 'paid' && (
                      <span className="erp-badge text-xs bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20 font-semibold">
                        Completed
                      </span>
                    )}
                    {billStatus === 'pending' && (
                      <span className="erp-badge text-xs bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/20 font-semibold">
                        Draft
                      </span>
                    )}
                    {billStatus === 'cancelled' && (
                      <span className="erp-badge text-xs bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20 font-semibold">
                        Cancelled
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Edit existing bill fields and reconcile stock &amp; payments directly
                  </p>
                </div>
              </div>

              {/* Top Right Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadBillData(billDbId || billIdParam)}
                  className="erp-btn erp-btn-outline erp-btn-sm flex items-center gap-1.5 text-xs bg-[var(--surface)] cursor-pointer"
                  title="Reload original bill"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reload</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(true)}
                  className="erp-btn erp-btn-secondary erp-btn-sm flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Success Banner */}
            {saveSuccessMsg && (
              <div
                id="open-bill-success-banner"
                className="p-3 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-xs text-[var(--success)] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveSuccessMsg(null)}
                  className="p-1 hover:text-black cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Error Notification Banner */}
            {billError && (
              <div
                id="open-bill-error-banner"
                className="p-3 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-xs text-[var(--danger)] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{billError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBillError(null)}
                  className="p-1 hover:text-black cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Main 2-Column POS Layout (Same as Create Bill) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              
              {/* LEFT COLUMN: Search & Items Table (8 of 12 cols) */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Search Bar & Barcode Scanner */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative">
                  <label htmlFor="product-search-input" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Add More Products (Name, ID, Barcode)
                  </label>
                  
                  <div className="flex items-center gap-2 relative">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        ref={productSearchInputRef}
                        id="product-search-input"
                        type="text"
                        value={productQuery}
                        onChange={(e) => setProductQuery(e.target.value)}
                        onKeyDown={handleProductSearchKeyDown}
                        placeholder="Type product name or scan barcode to add..."
                        className="erp-input pl-9.5 pr-8 text-xs sm:text-sm font-medium w-full"
                        autoComplete="off"
                      />
                      {productQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductQuery('');
                            setProductResults([]);
                            setShowProductDropdown(false);
                            productSearchInputRef.current?.focus();
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          aria-label="Clear Search"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => productSearchInputRef.current?.focus()}
                      className="erp-btn erp-btn-secondary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold shrink-0 cursor-pointer"
                    >
                      <Scan className="w-4 h-4" />
                      <span>Scan</span>
                    </button>
                  </div>

                  {/* Product Search Autocomplete Dropdown */}
                  {showProductDropdown && (
                    <div
                      id="product-search-dropdown"
                      className="absolute left-4 right-4 top-full mt-1.5 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-[var(--border)]"
                    >
                      {isProductSearching ? (
                        <div className="p-4 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                          <span>Searching products...</span>
                        </div>
                      ) : productResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                          No matching active products found.
                        </div>
                      ) : (
                        productResults.map((prod, idx) => {
                          const isSelected = idx === selectedProductIndex;
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleSelectProduct(prod)}
                              onMouseEnter={() => setSelectedProductIndex(idx)}
                              className={`p-3 cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                                isSelected
                                  ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                                  : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-xs sm:text-sm truncate">
                                  {prod.name}
                                </div>
                                <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                                  <span className="font-mono">Code: {prod.product_id}</span>
                                  <span>•</span>
                                  <span>Stock: {prod.quantity} {prod.unit}</span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="font-bold text-xs sm:text-sm font-mono text-[var(--text-primary)]">
                                  ₹{prod.selling_price.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Items Billing Table */}
                <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs overflow-hidden">
                  <div className="overflow-x-auto min-h-[280px]">
                    <table className="erp-table w-full text-left text-xs">
                      <thead className="erp-thead bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                        <tr>
                          <th className="erp-th py-3 px-3 w-12 text-center">S.NO</th>
                          <th className="erp-th py-3 px-4">PRODUCT NAME</th>
                          <th className="erp-th py-3 px-3 text-right">MRP (₹)</th>
                          <th className="erp-th py-3 px-3 text-center w-28">QUANTITY</th>
                          <th className="erp-th py-3 px-3 text-center w-32">SELLING PRICE (₹)</th>
                          <th className="erp-th py-3 px-4 text-right">ROW TOTAL (₹)</th>
                          <th className="erp-th py-3 px-3 text-center w-12">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="erp-tbody divide-y divide-[var(--border)]">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-16 text-center text-[var(--text-muted)]">
                              <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                <Scan className="w-8 h-8 text-[var(--text-muted)] opacity-60" />
                                <span className="font-semibold text-sm text-[var(--text-primary)]">
                                  No items in bill
                                </span>
                                <p className="text-xs text-[var(--text-secondary)]">
                                  Add products using the search field above.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          items.map((item, idx) => (
                            <tr
                              key={`${item.product_id}-${idx}`}
                              className="hover:bg-[var(--surface-hover)] transition-colors"
                            >
                              <td className="py-2.5 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                                {idx + 1}
                              </td>

                              <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">
                                <div className="font-semibold text-xs sm:text-sm">
                                  {item.product_name}
                                </div>
                                {item.product_code && (
                                  <div className="text-[10px] text-[var(--text-muted)] font-mono">
                                    {item.product_code}
                                  </div>
                                )}
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono text-[var(--text-secondary)]">
                                ₹{Number(item.mrp || 0).toFixed(2)}
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center justify-center">
                                  <input
                                    ref={(el) => {
                                      qtyInputRefs.current[idx] = el;
                                    }}
                                    type="number"
                                    min="0.01"
                                    step="any"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleQuantityChange(idx, parseFloat(e.target.value))
                                    }
                                    className="erp-input w-20 text-center text-xs font-bold font-mono py-1 px-1.5"
                                  />
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center justify-center">
                                  <input
                                    ref={(el) => {
                                      spInputRefs.current[idx] = el;
                                    }}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.selling_price}
                                    onChange={(e) =>
                                      handleSellingPriceChange(idx, parseFloat(e.target.value))
                                    }
                                    className="erp-input w-24 text-center text-xs font-bold font-mono py-1 px-1.5"
                                  />
                                </div>
                              </td>

                              <td className="py-2.5 px-4 text-right font-mono font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                                ₹{Number(item.row_total || 0).toFixed(2)}
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1.5 rounded-md text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors cursor-pointer"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--surface-subtle)]/40 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>
                      Total Items: <strong className="text-[var(--text-primary)]">{items.length}</strong>
                    </span>
                    <span>
                      Subtotal: <strong className="font-mono text-[var(--text-primary)] text-sm">{formatCurrency(subTotal)}</strong>
                    </span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Customer, Payments & Status (4 of 12 cols) */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* 1. Customer Section */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                      <User className="w-4 h-4 text-[var(--primary)]" />
                      <span>Customer Details</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuickCustName('');
                        setQuickCustMobile(customerQuery.trim());
                        setQuickCustPoints(0);
                        setQuickCustCredit(0);
                        setQuickCustError(null);
                        setShowQuickAddModal(true);
                      }}
                      className="erp-btn erp-btn-outline erp-btn-sm text-[11px] py-1 px-2.5 flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Quick Add</span>
                    </button>
                  </div>

                  {selectedCustomer ? (
                    <div className="p-3 rounded-lg bg-[var(--primary-light)]/40 border border-[var(--primary)]/30 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span>{selectedCustomer.name}</span>
                          <span className="font-mono font-normal text-[11px] text-[var(--text-secondary)]">
                            ({selectedCustomer.mobile})
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 mt-1">
                          <span>Points: <strong className="text-[var(--primary)]">{selectedCustomer.available_points}</strong></span>
                          <span>•</span>
                          <span>Credit: <strong className="text-[var(--danger)]">₹{selectedCustomer.credit.toFixed(2)}</strong></span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer"
                        title="Remove customer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        ref={customerSearchInputRef}
                        id="openbill-customer-search-input"
                        type="text"
                        value={customerQuery}
                        onChange={(e) => setCustomerQuery(e.target.value)}
                        placeholder="Search Name or Mobile..."
                        className="erp-input text-xs w-full"
                        autoComplete="off"
                      />

                      {showCustomerDropdown && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-[var(--border)]">
                          {customerResults.map((cust, idx) => (
                            <div
                              key={cust.id}
                              onClick={() => {
                                setSelectedCustomer(cust);
                                setCustomerQuery('');
                                setShowCustomerDropdown(false);
                              }}
                              className="p-2.5 cursor-pointer text-xs flex items-center justify-between gap-2 hover:bg-[var(--surface-hover)]"
                            >
                              <span className="font-semibold text-[var(--text-primary)]">
                                {cust.name} ({cust.mobile})
                              </span>
                              <span className="text-[11px] text-[var(--text-secondary)]">
                                Pts: {cust.available_points}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Payment & Totals Section */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                    <h2 className="text-xs font-bold text-[var(--text-primary)]">
                      Payment &amp; Totals
                    </h2>
                    
                    {/* Bill Status Selector */}
                    <select
                      value={billStatus}
                      onChange={(e) => setBillStatus(e.target.value as BillStatus)}
                      className="text-[11px] font-semibold py-0.5 px-2 rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] cursor-pointer"
                    >
                      <option value="paid">Completed</option>
                      <option value="pending">Draft</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)] text-sm">
                      {formatCurrency(subTotal)}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <label htmlFor="openbill-discount-input" className="text-[var(--text-secondary)] shrink-0">
                      Discount (₹)
                    </label>
                    <input
                      ref={discountInputRef}
                      id="openbill-discount-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      placeholder="0"
                      className="erp-input text-right text-xs font-mono font-bold w-28 py-1"
                    />
                  </div>

                  {/* Total Amount Prominent Banner */}
                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      Total Amount
                    </span>
                    <span className="text-2xl font-black font-mono text-[var(--text-primary)] tracking-tight">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="pt-3 border-t border-[var(--border)] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                        Payment Amounts (₹)
                      </span>
                      <button
                        type="button"
                        onClick={handleSetFullCash}
                        className="text-[11px] text-[var(--primary)] hover:underline font-medium cursor-pointer"
                      >
                        Set Full Cash
                      </button>
                    </div>

                    {/* Cash */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] w-24">
                        <Banknote className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
                        <span>Cash</span>
                      </div>
                      <input
                        ref={cashInputRef}
                        type="number"
                        min="0"
                        step="0.01"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        placeholder="0.00"
                        className="erp-input text-right text-xs font-mono w-full py-1"
                      />
                    </div>

                    {/* UPI */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] w-24">
                        <Smartphone className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                        <span>UPI</span>
                      </div>
                      <input
                        ref={upiInputRef}
                        type="number"
                        min="0"
                        step="0.01"
                        value={upiAmount}
                        onChange={(e) => setUpiAmount(e.target.value)}
                        placeholder="0.00"
                        className="erp-input text-right text-xs font-mono w-full py-1"
                      />
                    </div>

                    {/* Credit */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] w-24">
                        <CreditCard className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
                        <span>Credit</span>
                      </div>
                      <input
                        ref={creditInputRef}
                        type="number"
                        min="0"
                        step="0.01"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        placeholder="0.00"
                        className="erp-input text-right text-xs font-mono w-full py-1"
                      />
                    </div>

                    {/* Payment Status / Balance Notice */}
                    {totalAmount > 0 && (
                      <div className="pt-2 text-[11px] flex items-center justify-between font-mono">
                        <span className="text-[var(--text-secondary)]">Paid: {formatCurrency(totalPaid)}</span>
                        {remainingPayment > 0 ? (
                          <span className="text-[var(--danger)] font-medium">Due: {formatCurrency(remainingPayment)}</span>
                        ) : (
                          <span className="text-[var(--success)] font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Fully Covered
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions: Update & Print / Update Changes */}
                  <div className="pt-3 border-t border-[var(--border)] space-y-2">
                    <button
                      ref={saveAndPrintBtnRef}
                      id="update-and-print-bill-btn"
                      type="button"
                      onClick={() => handleSaveBillUpdates(billStatus, true)}
                      disabled={savingBill || items.length === 0}
                      className="erp-btn erp-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer"
                    >
                      {savingBill ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Bill...</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-4 h-4" />
                          <span>Update &amp; Print</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveBillUpdates('pending', false)}
                        disabled={savingBill || items.length === 0}
                        className="erp-btn erp-btn-outline w-full py-2 text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Save Draft</span>
                      </button>

                      <button
                        id="update-bill-btn"
                        type="button"
                        onClick={() => handleSaveBillUpdates(billStatus, false)}
                        disabled={savingBill || items.length === 0}
                        className="erp-btn erp-btn-secondary w-full py-2 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Bottom Bar: Timestamps / Last Updated Time in Bottom */}
            <div
              id="openbill-last-updated-bar"
              className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-[var(--text-secondary)] shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span>
                  <strong>Last Updated Time:</strong>{' '}
                  <span className="font-mono text-[var(--text-primary)] font-semibold">
                    {formatDateTime(updatedAt)}
                  </span>
                </span>
              </div>

              {createdAt && (
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  Created: {formatDateTime(createdAt)}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Quick Add Customer Modal */}
      {showQuickAddModal && (
        <div
          id="openbill-quick-cust-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs erp-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickAddModal(false);
          }}
        >
          <div className="w-full max-w-md bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl overflow-hidden erp-slide-up">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-subtle)]/40">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Quick Add Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddSubmit} className="p-5 space-y-4">
              {quickCustError && (
                <div className="p-2.5 rounded-md bg-[var(--danger-light)] border border-[var(--danger)] text-xs text-[var(--danger)] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{quickCustError}</span>
                </div>
              )}

              <div className="erp-form-group">
                <label className="erp-label">Mobile Number <span className="text-[var(--danger)]">*</span></label>
                <input
                  type="tel"
                  value={quickCustMobile}
                  onChange={(e) => setQuickCustMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="erp-input text-xs font-mono"
                  required
                  autoFocus
                />
              </div>

              <div className="erp-form-group">
                <label className="erp-label">Full Name <span className="text-[var(--danger)]">*</span></label>
                <input
                  type="text"
                  value={quickCustName}
                  onChange={(e) => setQuickCustName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="erp-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="erp-form-group">
                  <label className="erp-label">Points</label>
                  <input
                    type="number"
                    value={quickCustPoints}
                    onChange={(e) => setQuickCustPoints(e.target.value)}
                    className="erp-input text-xs font-mono"
                  />
                </div>
                <div className="erp-form-group">
                  <label className="erp-label">Initial Credit (₹)</label>
                  <input
                    type="number"
                    value={quickCustCredit}
                    onChange={(e) => setQuickCustCredit(e.target.value)}
                    className="erp-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="erp-btn erp-btn-outline text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickCustSaving}
                  className="erp-btn erp-btn-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {quickCustSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Add &amp; Select</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Receipt Modal */}
      {showPrintModal && (
        <div
          id="openbill-receipt-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs erp-fade-in overflow-y-auto"
        >
          <div
            id="openbill-receipt-modal-card"
            className="w-full max-w-lg bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden erp-slide-up my-6"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-subtle)] print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Bill Receipt ({billCode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div id="printable-receipt-area" className="p-6 bg-white text-black space-y-4 font-mono text-xs">
              <div className="text-center border-b border-dashed border-gray-300 pb-3">
                <h2 className="text-base font-bold tracking-tight">DS DRY FRUITS</h2>
                <p className="text-[11px] text-gray-600">Lakshmi Satyanarayana Enterprises</p>
                <p className="text-[10px] text-gray-500">Retail &amp; Wholesale POS</p>
                <div className="mt-2 text-[11px] flex justify-between border-t border-gray-200 pt-1">
                  <span>Bill No: {billCode}</span>
                  <span>Date: {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {selectedCustomer && (
                <div className="border-b border-dashed border-gray-300 pb-2 text-[11px]">
                  <div>Customer: <strong>{selectedCustomer.name}</strong></div>
                  <div>Mobile: {selectedCustomer.mobile}</div>
                </div>
              )}

              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="py-1">Item</th>
                    <th className="py-1 text-center">Qty</th>
                    <th className="py-1 text-right">Price</th>
                    <th className="py-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-1">{item.product_name}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">₹{item.selling_price.toFixed(2)}</td>
                      <td className="py-1 text-right">₹{item.row_total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subTotal.toFixed(2)}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>-₹{discountVal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-400 pt-1">
                  <span>Grand Total:</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-500 border-t border-dashed border-gray-300 pt-3">
                <p>Thank you for your business!</p>
                <p className="mt-1">Last Updated: {formatDateTime(updatedAt)}</p>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-end gap-2.5 print:hidden">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="erp-btn erp-btn-outline text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="erp-btn erp-btn-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OpenBillPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <OpenBillContent />
    </Suspense>
  );
}
