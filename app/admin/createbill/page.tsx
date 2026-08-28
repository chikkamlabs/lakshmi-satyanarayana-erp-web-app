'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Scan,
  X,
  Trash2,
  User,
  UserPlus,
  IndianRupee,
  Smartphone,
  CreditCard,
  Banknote,
  Printer,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  Check,
  Award,
  Coins,
} from 'lucide-react';
import AdminHeader from '../header/page';
import AdminSidebar from '../sidebar/page';
import {
  searchProductsForBilling,
  searchCustomersForBilling,
  quickAddCustomer,
  createBill,
  suggestNextBillId,
  BillItemInput,
  PaymentBreakdown,
  CreatedBillResult,
} from '@/lib/createbillStore';
import { Product } from '@/lib/productsStore';
import { Customer } from '@/lib/customersStore';
import { AssociateRecord } from '@/lib/adminassociateStore';
import AttachAssociate from '@/components/attachassociate';

export default function CreateBillPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bill Meta
  const [billNumber, setBillNumber] = useState('BILL-...');
  const [items, setItems] = useState<BillItemInput[]>([]);
  const [discount, setDiscount] = useState<number | string>(0);

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

  // Associate State
  const [attachedAssociate, setAttachedAssociate] = useState<AssociateRecord | null>(null);
  const [showAttachAssociateModal, setShowAttachAssociateModal] = useState(false);

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

  // Submission / Loading
  const [savingBill, setSavingBill] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const [lastSavedBill, setLastSavedBill] = useState<CreatedBillResult | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // DOM Refs for strict keyboard focus chaining
  const productSearchInputRef = useRef<HTMLInputElement | null>(null);
  const customerSearchInputRef = useRef<HTMLInputElement | null>(null);
  const discountInputRef = useRef<HTMLInputElement | null>(null);
  const cashInputRef = useRef<HTMLInputElement | null>(null);
  const upiInputRef = useRef<HTMLInputElement | null>(null);
  const creditInputRef = useRef<HTMLInputElement | null>(null);
  const saveAndPrintBtnRef = useRef<HTMLButtonElement | null>(null);
  const draftBtnRef = useRef<HTMLButtonElement | null>(null);

  // 2D Array refs for items: [rowIndex][field: 'qty' | 'disc' | 'sp']
  const qtyInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const discInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  const spInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Initialize Next Bill ID on load
  useEffect(() => {
    async function initBillId() {
      const nextId = await suggestNextBillId();
      setBillNumber(nextId);
    }
    initBillId();
  }, []);

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

  // Auto-set full cash helper
  const handleSetFullCash = () => {
    setCashAmount(totalAmount);
    setUpiAmount(0);
    setCreditAmount(0);
  };

  // Add Product to items list
  const handleSelectProduct = (prod: Product) => {
    const existingIndex = items.findIndex((i) => i.product_id === prod.id);
    let targetIndex = 0;

    const prodDiscount = Number(prod.discount || 0);
    const prodSp = Number(
      prod.selling_price ||
        Math.max(0, prod.mrp - (prod.mrp * prodDiscount) / 100)
    );

    if (existingIndex >= 0) {
      // Increment quantity of existing item
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
      // Add new item row
      const newItem: BillItemInput = {
        product_id: prod.id,
        product_name: prod.name,
        product_code: prod.product_id,
        mrp: prod.mrp,
        quantity: 1,
        discount: prodDiscount,
        selling_price: prodSp,
        row_total: Number((1 * prodSp).toFixed(2)),
        available_stock: prod.quantity,
        unit: prod.unit,
      };
      setItems((prev) => [...prev, newItem]);
      targetIndex = items.length;
    }

    // Reset search query & close dropdown
    setProductQuery('');
    setProductResults([]);
    setShowProductDropdown(false);

    // Focus on the newly selected product's Quantity input
    setTimeout(() => {
      qtyInputRefs.current[targetIndex]?.focus();
      qtyInputRefs.current[targetIndex]?.select();
    }, 50);
  };

  // Update item quantity in table
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

  // Update item discount in table (auto calculates selling_price = mrp - (mrp * discount%) / 100)
  const handleItemDiscountChange = (index: number, newDisc: number) => {
    const updated = [...items];
    const disc = isNaN(newDisc) ? 0 : Math.max(0, newDisc);
    const mrp = Number(updated[index].mrp || 0);
    const newSp = Math.max(0, mrp - (mrp * disc) / 100);
    const qty = updated[index].quantity;
    updated[index] = {
      ...updated[index],
      discount: disc,
      selling_price: Number(newSp.toFixed(2)),
      row_total: Number((qty * newSp).toFixed(2)),
    };
    setItems(updated);
  };

  // Update item selling price in table (if entered directly put discount 0)
  const handleSellingPriceChange = (index: number, newSp: number) => {
    const updated = [...items];
    const sp = isNaN(newSp) ? 0 : Math.max(0, newSp);
    const qty = updated[index].quantity;
    updated[index] = {
      ...updated[index],
      discount: 0,
      selling_price: sp,
      row_total: Number((qty * sp).toFixed(2)),
    };
    setItems(updated);
  };

  // Remove item from table
  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setTimeout(() => {
      productSearchInputRef.current?.focus();
    }, 50);
  };

  // Product Search KeyDown
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

  // Keyboard navigation inside the Items Table
  const handleQtyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      discInputRefs.current[index]?.focus();
      discInputRefs.current[index]?.select();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < items.length - 1) {
        qtyInputRefs.current[index + 1]?.focus();
        qtyInputRefs.current[index + 1]?.select();
      } else {
        discInputRefs.current[index]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        qtyInputRefs.current[index - 1]?.focus();
        qtyInputRefs.current[index - 1]?.select();
      } else {
        productSearchInputRef.current?.focus();
        productSearchInputRef.current?.select();
      }
    }
  };

  const handleDiscKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      spInputRefs.current[index]?.focus();
      spInputRefs.current[index]?.select();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      qtyInputRefs.current[index]?.focus();
      qtyInputRefs.current[index]?.select();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < items.length - 1) {
        discInputRefs.current[index + 1]?.focus();
        discInputRefs.current[index + 1]?.select();
      } else {
        spInputRefs.current[index]?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        discInputRefs.current[index - 1]?.focus();
        discInputRefs.current[index - 1]?.select();
      } else {
        qtyInputRefs.current[index]?.focus();
      }
    }
  };

  const handleSpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      discInputRefs.current[index]?.focus();
      discInputRefs.current[index]?.select();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        spInputRefs.current[index - 1]?.focus();
        spInputRefs.current[index - 1]?.select();
      } else {
        discInputRefs.current[index]?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < items.length - 1) {
        spInputRefs.current[index + 1]?.focus();
        spInputRefs.current[index + 1]?.select();
      } else {
        customerSearchInputRef.current?.focus();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (index < items.length - 1) {
        // Next row quantity
        qtyInputRefs.current[index + 1]?.focus();
        qtyInputRefs.current[index + 1]?.select();
      } else {
        // Last product's selling price -> Go to top right Customer section
        customerSearchInputRef.current?.focus();
        customerSearchInputRef.current?.select();
      }
    }
  };

  // Customer Search KeyDown
  const handleCustomerSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCustomerDropdown && customerResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCustomerIndex((prev) => (prev + 1) % customerResults.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCustomerIndex((prev) => (prev - 1 + customerResults.length) % customerResults.length);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (customerResults[selectedCustomerIndex]) {
          const cust = customerResults[selectedCustomerIndex];
          setSelectedCustomer(cust);
          setCustomerQuery('');
          setShowCustomerDropdown(false);
          // Advance to Discount or Cash
          discountInputRef.current?.focus();
          discountInputRef.current?.select();
        }
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      // If customer query is typed and no results, open quick add
      if (customerQuery.trim() && customerResults.length === 0) {
        const isNumeric = /^\d+$/.test(customerQuery.trim());
        if (isNumeric) setQuickCustMobile(customerQuery.trim());
        else setQuickCustName(customerQuery.trim());
        setShowQuickAddModal(true);
      } else {
        // Advance to Payment section
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
      }
    } else if (e.key === 'Escape') {
      setShowCustomerDropdown(false);
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
      // Focus to Payment section
      setTimeout(() => {
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
      }, 50);
    }
  };

  // Payment navigation: Cash -> UPI -> Credit -> Save/Draft buttons
  const handleCashKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      upiInputRef.current?.focus();
      upiInputRef.current?.select();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      discountInputRef.current?.focus();
      discountInputRef.current?.select();
    }
  };

  const handleUpiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      creditInputRef.current?.focus();
      creditInputRef.current?.select();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      cashInputRef.current?.focus();
      cashInputRef.current?.select();
    }
  };

  const handleCreditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      saveAndPrintBtnRef.current?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      upiInputRef.current?.focus();
      upiInputRef.current?.select();
    }
  };

  // Save Bill Handler
  const handleSaveBill = async (status: 'paid' | 'pending', printAfter = false) => {
    if (items.length === 0) {
      setBillError('Please add at least one product to the bill.');
      productSearchInputRef.current?.focus();
      return;
    }

    if (status === 'paid') {
      // Ensure payments sum up or at least credit is assigned
      if (numCredit > 0 && !selectedCustomer) {
        setBillError('Customer must be selected for Credit payment mode.');
        customerSearchInputRef.current?.focus();
        return;
      }
    }

    setSavingBill(true);
    setBillError(null);

    // Auto-fill cash if no payment entered
    let finalCash = numCash;
    let finalUpi = numUpi;
    let finalCredit = numCredit;

    if (finalCash === 0 && finalUpi === 0 && finalCredit === 0 && status === 'paid') {
      finalCash = totalAmount;
    }

    const payload = {
      customer_id: selectedCustomer?.id || null,
      associate_id: attachedAssociate?.id || null,
      items: items.map((i) => ({
        product_id: i.product_id,
        product_name: i.product_name,
        mrp: i.mrp,
        quantity: i.quantity,
        discount: i.discount ?? 0,
        selling_price: i.selling_price,
        row_total: i.row_total,
      })),
      sub_total: subTotal,
      discount: discountVal,
      total: totalAmount,
      status: status === 'paid' ? ('paid' as const) : ('pending' as const),
      payments: {
        cash: finalCash,
        upi: finalUpi,
        credit: finalCredit,
      },
    };

    const res = await createBill(payload);
    setSavingBill(false);

    if (res.error) {
      setBillError(res.error);
    } else if (res.data) {
      setLastSavedBill(res.data);
      if (printAfter) {
        setShowPrintModal(true);
      } else {
        // Reset form for next transaction
        handleResetBillForm();
      }
    }
  };

  // Reset bill form
  const handleResetBillForm = async () => {
    setItems([]);
    setDiscount(0);
    setCashAmount('');
    setUpiAmount('');
    setCreditAmount('');
    setSelectedCustomer(null);
    setAttachedAssociate(null);
    setCustomerQuery('');
    setProductQuery('');
    setBillError(null);
    const nextId = await suggestNextBillId();
    setBillNumber(nextId);
    setTimeout(() => {
      productSearchInputRef.current?.focus();
    }, 100);
  };

  const formatCurrency = (val: number) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="create-bill-main" className="flex-1 p-3 sm:p-5 lg:p-6 erp-fade-in min-w-0">
          <div className="max-w-[1600px] mx-auto space-y-4">
            
            {/* Top Navigation & Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/dashboard')}
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Back to Dashboard"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      Create Bill
                    </h1>
                    <span className="erp-badge font-mono text-xs bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                      {billNumber}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Fast POS Billing with barcode scanning and arrow key navigation
                  </p>
                </div>
              </div>

              {/* Reset / New Bill button */}
              <button
                type="button"
                onClick={handleResetBillForm}
                className="erp-btn erp-btn-outline erp-btn-sm flex items-center gap-1.5 text-xs cursor-pointer bg-[var(--surface)]"
                title="Clear and start new bill"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Bill</span>
              </button>
            </div>

            {/* Error Notification Banner */}
            {billError && (
              <div
                id="create-bill-error-banner"
                className="p-3 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-xs text-[var(--danger)] flex items-center justify-between erp-shake"
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

            {/* Main POS 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              
              {/* LEFT COLUMN: Search & Product Items Table (8 of 12 cols) */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Search Bar & Barcode Scanner */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative">
                  <label htmlFor="product-search-input" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Scan Barcode or Search Product (Name, ID, Barcode)
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
                        placeholder="Type product name or scan barcode..."
                        className="erp-input pl-9.5 pr-8 text-xs sm:text-sm font-medium w-full"
                        autoComplete="off"
                        autoFocus
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
                      title="Ready for Barcode Scanner"
                    >
                      <Scan className="w-4 h-4" />
                      <span>Scan</span>
                    </button>
                  </div>

                  {/* Product Search Autocomplete Dropdown */}
                  {showProductDropdown && (
                    <div
                      id="product-search-dropdown"
                      className="absolute left-4 right-4 top-full mt-1.5 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-72 overflow-y-auto erp-slide-up divide-y divide-[var(--border)]"
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
                                {prod.mrp > prod.selling_price && (
                                  <div className="text-[10px] text-[var(--text-muted)] line-through">
                                    MRP: ₹{prod.mrp.toFixed(2)}
                                  </div>
                                )}
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
                          <th className="erp-th py-3 px-3 w-10 text-center">S.NO</th>
                          <th className="erp-th py-3 px-4">PRODUCT NAME</th>
                          <th className="erp-th py-3 px-2 text-right w-24">MRP (₹)</th>
                          <th className="erp-th py-3 px-2 text-center w-24">QUANTITY</th>
                          <th className="erp-th py-3 px-2 text-center w-24">DISCOUNT (%)</th>
                          <th className="erp-th py-3 px-2 text-center w-28">SELLING PRICE (₹)</th>
                          <th className="erp-th py-3 px-4 text-right w-28">ROW TOTAL (₹)</th>
                          <th className="erp-th py-3 px-2 text-center w-10">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="erp-tbody divide-y divide-[var(--border)]">
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-16 text-center text-[var(--text-muted)]">
                              <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                <Scan className="w-8 h-8 text-[var(--text-muted)] opacity-60" />
                                <span className="font-semibold text-sm text-[var(--text-primary)]">
                                  No items in bill
                                </span>
                                <p className="text-xs text-[var(--text-secondary)]">
                                  Search or scan a product barcode to add it to this bill.
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
                              {/* S.NO */}
                              <td className="py-2.5 px-3 text-center font-mono text-xs text-[var(--text-muted)]">
                                {idx + 1}
                              </td>

                              {/* Product Name */}
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

                              {/* MRP */}
                              <td className="py-2.5 px-2 text-right font-mono text-[var(--text-secondary)]">
                                ₹{Number(item.mrp || 0).toFixed(2)}
                              </td>

                              {/* Quantity Input */}
                              <td className="py-2.5 px-2">
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
                                    onKeyDown={(e) => handleQtyKeyDown(e, idx)}
                                    className="erp-input w-20 text-center text-xs font-bold font-mono py-1 px-1.5 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                  />
                                </div>
                              </td>

                              {/* Discount Input */}
                              <td className="py-2.5 px-2">
                                <div className="flex items-center justify-center">
                                  <input
                                    ref={(el) => {
                                      discInputRefs.current[idx] = el;
                                    }}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.discount ?? 0}
                                    onChange={(e) =>
                                      handleItemDiscountChange(idx, parseFloat(e.target.value))
                                    }
                                    onKeyDown={(e) => handleDiscKeyDown(e, idx)}
                                    className="erp-input w-20 text-center text-xs font-bold font-mono py-1 px-1.5 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                  />
                                </div>
                              </td>

                              {/* Selling Price Input */}
                              <td className="py-2.5 px-2">
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
                                    onKeyDown={(e) => handleSpKeyDown(e, idx)}
                                    className="erp-input w-24 text-center text-xs font-bold font-mono py-1 px-1.5 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                                  />
                                </div>
                              </td>

                              {/* Row Total */}
                              <td className="py-2.5 px-4 text-right font-mono font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                                ₹{Number(item.row_total || 0).toFixed(2)}
                              </td>

                              {/* Action: Delete Row */}
                              <td className="py-2.5 px-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1.5 rounded-md text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors cursor-pointer"
                                  title="Remove Item"
                                  aria-label="Remove Item"
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

                  {/* Table Footer Summary Bar */}
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

              {/* RIGHT COLUMN: Customer, Payment & Totals (4 of 12 cols) */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* 1. Customer Section */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs relative space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                      <User className="w-4 h-4 text-[var(--primary)]" />
                      <span>Customer Details</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Attach Associate Button */}
                      <button
                        type="button"
                        onClick={() => setShowAttachAssociateModal(true)}
                        className={`erp-btn ${
                          attachedAssociate
                            ? 'erp-btn-primary'
                            : 'erp-btn-outline'
                        } erp-btn-sm text-[11px] py-1 px-2 flex items-center gap-1 cursor-pointer`}
                        title="Attach Associate for 2% Reward Points"
                      >
                        <Award className="w-3 h-3" />
                        <span>{attachedAssociate ? 'Associate' : 'Attach Associate'}</span>
                      </button>

                      {/* Quick Add Customer Button */}
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
                        className="erp-btn erp-btn-outline erp-btn-sm text-[11px] py-1 px-2 flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>+ Quick Add</span>
                      </button>
                    </div>
                  </div>

                  {/* Attached Associate Badge / Card */}
                  {attachedAssociate && (
                    <div className="p-2.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-between text-xs erp-slide-up">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center font-bold text-xs shrink-0">
                          {(attachedAssociate.profile?.name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                            <span className="truncate">{attachedAssociate.profile?.name || 'Associate'}</span>
                            <span className="erp-badge erp-badge-secondary font-mono text-[9px] py-0 px-1 shrink-0">
                              {attachedAssociate.associate_id}
                            </span>
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                            <span>{attachedAssociate.profile?.mobile}</span>
                            <span>•</span>
                            <span className="text-[var(--accent)] font-semibold font-mono flex items-center gap-0.5">
                              <Coins className="w-3 h-3 text-[var(--warning)]" />
                              {attachedAssociate.current_points ?? 0} pts
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedAssociate(null)}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer shrink-0 ml-1.5"
                        title="Detach Associate"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Selected Customer View */}
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
                        onClick={() => {
                          setSelectedCustomer(null);
                          setTimeout(() => customerSearchInputRef.current?.focus(), 50);
                        }}
                        className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer"
                        title="Remove customer selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        ref={customerSearchInputRef}
                        id="customer-search-input"
                        type="text"
                        value={customerQuery}
                        onChange={(e) => setCustomerQuery(e.target.value)}
                        onKeyDown={handleCustomerSearchKeyDown}
                        placeholder="Search Name or Mobile (Enter to select)"
                        className="erp-input text-xs w-full"
                        autoComplete="off"
                      />

                      {/* Customer Autocomplete Dropdown */}
                      {showCustomerDropdown && (
                        <div
                          id="customer-search-dropdown"
                          className="absolute left-0 right-0 top-full mt-1 z-50 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-[var(--border)] erp-slide-up"
                        >
                          {isCustomerSearching ? (
                            <div className="p-3 text-center text-xs text-[var(--text-muted)]">
                              Searching customers...
                            </div>
                          ) : customerResults.length === 0 ? (
                            <div className="p-3 text-center text-xs text-[var(--text-muted)]">
                              No customer found. Press Enter to Quick Add.
                            </div>
                          ) : (
                            customerResults.map((cust, idx) => {
                              const isSelected = idx === selectedCustomerIndex;
                              return (
                                <div
                                  key={cust.id}
                                  onClick={() => {
                                    setSelectedCustomer(cust);
                                    setCustomerQuery('');
                                    setShowCustomerDropdown(false);
                                    discountInputRef.current?.focus();
                                    discountInputRef.current?.select();
                                  }}
                                  onMouseEnter={() => setSelectedCustomerIndex(idx)}
                                  className={`p-2.5 cursor-pointer text-xs flex items-center justify-between gap-2 ${
                                    isSelected
                                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                                      : 'hover:bg-[var(--surface-hover)]'
                                  }`}
                                >
                                  <div>
                                    <span className="font-semibold text-[var(--text-primary)]">
                                      {cust.name}
                                    </span>
                                    <span className="text-[11px] text-[var(--text-muted)] ml-1 font-mono">
                                      ({cust.mobile})
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-right text-[var(--text-secondary)]">
                                    <span>Pts: {cust.available_points}</span>
                                    {cust.credit > 0 && (
                                      <span className="ml-2 text-[var(--danger)]">
                                        Cr: ₹{cust.credit}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Payment & Totals Section */}
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
                  <h2 className="text-xs font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
                    Payment & Totals
                  </h2>

                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-[var(--text-primary)] text-sm">
                      {formatCurrency(subTotal)}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <label htmlFor="bill-discount-input" className="text-[var(--text-secondary)] shrink-0">
                      Discount (₹)
                    </label>
                    <input
                      ref={discountInputRef}
                      id="bill-discount-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          cashInputRef.current?.focus();
                          cashInputRef.current?.select();
                        }
                      }}
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

                  {/* Payment Breakdown Inputs */}
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
                        id="payment-cash-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        onKeyDown={handleCashKeyDown}
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
                        id="payment-upi-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={upiAmount}
                        onChange={(e) => setUpiAmount(e.target.value)}
                        onKeyDown={handleUpiKeyDown}
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
                        id="payment-credit-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        onKeyDown={handleCreditKeyDown}
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

                  {/* Bottom POS Actions */}
                  <div className="pt-3 border-t border-[var(--border)] space-y-2">
                    <button
                      ref={saveAndPrintBtnRef}
                      id="save-and-print-bill-btn"
                      type="button"
                      onClick={() => handleSaveBill('paid', true)}
                      disabled={savingBill || items.length === 0}
                      className="erp-btn erp-btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-xs cursor-pointer focus:ring-4 focus:ring-[var(--primary)]/30"
                    >
                      {savingBill ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Bill...</span>
                        </>
                      ) : (
                        <>
                          <Printer className="w-4 h-4" />
                          <span>Save &amp; Print (Enter)</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        ref={draftBtnRef}
                        id="draft-bill-btn"
                        type="button"
                        onClick={() => handleSaveBill('pending', false)}
                        disabled={savingBill || items.length === 0}
                        className="erp-btn erp-btn-outline w-full py-2 text-xs font-medium cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Draft</span>
                      </button>

                      <button
                        id="save-only-bill-btn"
                        type="button"
                        onClick={() => handleSaveBill('paid', false)}
                        disabled={savingBill || items.length === 0}
                        className="erp-btn erp-btn-secondary w-full py-2 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save Only</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </main>
      </div>

      {/* Quick Add Customer Modal */}
      {showQuickAddModal && (
        <div
          id="quick-add-customer-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs erp-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickAddModal(false);
          }}
        >
          <div
            id="quick-add-customer-modal-card"
            className="w-full max-w-md bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl overflow-hidden erp-slide-up"
          >
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

      {/* Print & Bill Receipt Modal */}
      {showPrintModal && lastSavedBill && (
        <div
          id="bill-receipt-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs erp-fade-in overflow-y-auto"
        >
          <div
            id="bill-receipt-modal-card"
            className="w-full max-w-lg bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden erp-slide-up my-6"
          >
            {/* Modal Actions Bar (hidden when printing) */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--surface-subtle)] print:hidden">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[var(--success)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">
                  Bill Saved Successfully!
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  handleResetBillForm();
                }}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-receipt-area" className="p-6 bg-white text-black space-y-4 font-mono text-xs">
              {/* Receipt Header */}
              <div className="text-center border-b border-dashed border-gray-300 pb-3">
                <h2 className="text-base font-bold tracking-tight">DS DRY FRUITS</h2>
                <p className="text-[11px] text-gray-600">Lakshmi Satyanarayana Enterprises</p>
                <p className="text-[10px] text-gray-500">Fast Retail &amp; Wholesale POS</p>
                <div className="mt-2 text-[11px] flex justify-between border-t border-gray-200 pt-1">
                  <span>Bill No: {lastSavedBill.bill_id}</span>
                  <span>Date: {new Date(lastSavedBill.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Customer Info if present */}
              {selectedCustomer && (
                <div className="border-b border-dashed border-gray-300 pb-2 text-[11px]">
                  <div>Customer: <strong>{selectedCustomer.name}</strong></div>
                  <div>Mobile: {selectedCustomer.mobile}</div>
                </div>
              )}

              {/* Items List */}
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

              {/* Totals Breakdown */}
              <div className="border-t border-dashed border-gray-400 pt-2 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{lastSavedBill.sub_total.toFixed(2)}</span>
                </div>
                {lastSavedBill.discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount:</span>
                    <span>-₹{lastSavedBill.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-gray-400 pt-1">
                  <span>Grand Total:</span>
                  <span>₹{lastSavedBill.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="text-center text-[10px] text-gray-500 border-t border-dashed border-gray-300 pt-3">
                <p>Thank you for your business!</p>
                <p>Visit Again</p>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-end gap-2.5 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  handleResetBillForm();
                }}
                className="erp-btn erp-btn-outline text-xs cursor-pointer"
              >
                Done / Next Bill
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="erp-btn erp-btn-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attach Associate Modal */}
      <AttachAssociate
        isOpen={showAttachAssociateModal}
        onClose={() => setShowAttachAssociateModal(false)}
        onSelect={(assoc) => setAttachedAssociate(assoc)}
        selectedAssociateId={attachedAssociate?.id}
      />
    </div>
  );
}
