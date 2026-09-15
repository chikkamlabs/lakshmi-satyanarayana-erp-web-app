'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  ArrowLeft,
  Layers,
} from 'lucide-react';
import {
  createMultipleProducts,
  suggestNextProductId,
  fetchCategoriesForDropdown,
  Product,
  CategoryOption,
} from '@/lib/productsStore';

interface AddProductProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProducts?: Product[] | Product) => void;
}

export interface ProductRowItem {
  id: string; // unique key for react state
  productId: string;
  name: string;
  categoryId: string;
  mrp: string | number; // MRP (₹)
  discount: string | number; // Discount (%)
  sellingPrice: string | number; // S.P (₹)
  quantity: string | number; // Quantity / Stock
  lowStock: string | number; // Low Stock Alert Threshold
  unit: string; // Unit
}

const COMMON_UNITS = ['Piece', 'Packet', 'Box', 'Kg', 'Tin', 'Gram', 'Liter', 'Meter', 'Dozen', 'Bundle'];

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductProps) {
  if (!isOpen) return null;

  return <AddProductContent onClose={onClose} onSuccess={onSuccess} />;
}

function computeNextCode(currentCode: string, offset: number = 1): string {
  if (!currentCode) return `PRD-${1000 + offset}`;
  const match = currentCode.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10) + offset;
    return `${prefix}${num}`;
  }
  return `${currentCode}-${offset}`;
}

function AddProductContent({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (newProducts?: Product[] | Product) => void;
}) {
  // Initially single row only
  const [rows, setRows] = useState<ProductRowItem[]>([
    {
      id: 'row-1',
      productId: 'Prod-101',
      name: '',
      categoryId: '',
      mrp: '',
      discount: '0',
      sellingPrice: '',
      quantity: '0',
      lowStock: '10',
      unit: 'Piece',
    },
  ]);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories & auto-suggest initial ID
  useEffect(() => {
    let active = true;

    async function initializeModal() {
      try {
        const [catRes, nextCode] = await Promise.all([
          fetchCategoriesForDropdown(),
          suggestNextProductId(),
        ]);

        if (!active) return;

        let defaultCatId = '';
        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
          const firstActive = catRes.data.find((c) => c.status === 'active') || catRes.data[0];
          defaultCatId = firstActive.id;
        }

        const baseCode = nextCode || 'Prod-101';
        setRows([
          {
            id: 'row-1',
            productId: baseCode,
            name: '',
            categoryId: defaultCatId,
            mrp: '',
            discount: '0',
            sellingPrice: '',
            quantity: '0',
            lowStock: '10',
            unit: 'Piece',
          },
        ]);
      } catch (err) {
        console.error('Error initializing add products view:', err);
      } finally {
        if (active) setLoadingData(false);
      }
    }

    initializeModal();

    return () => {
      active = false;
    };
  }, []);

  // Update a single field on a row with MRP / Discount / Selling Price calculations
  const updateRowField = (rowIndex: number, field: keyof ProductRowItem, value: any) => {
    setRows((prev) => {
      const next = [...prev];
      if (!next[rowIndex]) return next;

      const currentRow = { ...next[rowIndex], [field]: value };

      if (field === 'mrp') {
        const mrpNum = parseFloat(value);
        const discNum = parseFloat(String(currentRow.discount));
        if (!isNaN(mrpNum)) {
          if (!isNaN(discNum) && discNum > 0) {
            currentRow.sellingPrice = Math.max(0, mrpNum - (mrpNum * discNum) / 100).toFixed(2);
          } else if (!currentRow.sellingPrice || Number(currentRow.sellingPrice) === 0) {
            currentRow.sellingPrice = mrpNum.toFixed(2);
          }
        }
      } else if (field === 'discount') {
        const mrpNum = parseFloat(String(currentRow.mrp));
        const discNum = parseFloat(value);
        if (!isNaN(mrpNum)) {
          if (!isNaN(discNum) && discNum >= 0) {
            currentRow.sellingPrice = Math.max(0, mrpNum - (mrpNum * discNum) / 100).toFixed(2);
          } else {
            currentRow.sellingPrice = mrpNum.toFixed(2);
          }
        }
      }

      next[rowIndex] = currentRow;
      return next;
    });
  };

  // Add a new row below
  const handleAddRow = (afterIndex?: number) => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1];
      const nextCode = lastRow?.productId
        ? computeNextCode(lastRow.productId, 1)
        : `Prod-${101 + prev.length}`;

      const defaultCat = categories.find((c) => c.status === 'active')?.id || categories[0]?.id || '';

      const newRow: ProductRowItem = {
        id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: nextCode,
        name: '',
        categoryId: defaultCat,
        mrp: '',
        discount: '0',
        sellingPrice: '',
        quantity: '0',
        lowStock: '10',
        unit: 'Piece',
      };

      if (afterIndex !== undefined && afterIndex >= 0 && afterIndex < prev.length) {
        const copy = [...prev];
        copy.splice(afterIndex + 1, 0, newRow);
        return copy;
      }

      return [...prev, newRow];
    });

    // Focus the newly added row's product name after state update
    setTimeout(() => {
      const targetIndex = afterIndex !== undefined ? afterIndex + 1 : rows.length;
      const targetElem = document.getElementById(`cell-${targetIndex}-1`) || document.getElementById(`cell-${targetIndex}-0`);
      targetElem?.focus();
    }, 50);
  };

  // Remove a row
  const handleRemoveRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== rowIndex));
  };

  // Total columns in each row for arrow navigation:
  // 0: Product ID (product_id)
  // 1: Product Name (name)
  // 2: Category (category_id)
  // 3: MRP (mrp)
  // 4: Discount % (discount)
  // 5: Selling Price (selling_price)
  // 6: Quantity / Stock (quantity)
  // 7: Low Stock (low_stock)
  // 8: Unit (unit)
  // 9: Tick Button (small check button)
  const TOTAL_COLS = 10;

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    rowIndex: number,
    colIndex: number
  ) => {
    if (e.key === 'ArrowRight') {
      if (colIndex < TOTAL_COLS - 1) {
        e.preventDefault();
        const nextElem = document.getElementById(`cell-${rowIndex}-${colIndex + 1}`);
        nextElem?.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (colIndex > 0) {
        e.preventDefault();
        const prevElem = document.getElementById(`cell-${rowIndex}-${colIndex - 1}`);
        prevElem?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      if (rowIndex < rows.length - 1) {
        e.preventDefault();
        const downElem = document.getElementById(`cell-${rowIndex + 1}-${colIndex}`);
        downElem?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      if (rowIndex > 0) {
        e.preventDefault();
        const upElem = document.getElementById(`cell-${rowIndex - 1}-${colIndex}`);
        upElem?.focus();
      }
    } else if (e.key === 'Enter') {
      // If at the tick button (column 9) and press Enter: create new row below
      if (colIndex === 9) {
        e.preventDefault();
        handleAddRow(rowIndex);
      }
    }
  };

  // Confirm products and insert into Supabase
  const handleConfirmProducts = async () => {
    setError(null);

    // Validate rows
    const validRows = rows.filter((r) => r.productId.trim() || r.name.trim());
    if (validRows.length === 0) {
      setError('Please fill in at least one product row.');
      return;
    }

    // Check individual row validity
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      const rowNum = i + 1;
      if (!r.productId.trim()) {
        setError(`Row #${rowNum}: Product ID / Code is required.`);
        return;
      }
      if (!r.name.trim()) {
        setError(`Row #${rowNum} (${r.productId}): Product Name is required.`);
        return;
      }
      if (!r.categoryId) {
        setError(`Row #${rowNum} (${r.name}): Category is required.`);
        return;
      }
      const qty = Number(r.quantity || 0);
      if (isNaN(qty) || qty < 0) {
        setError(`Row #${rowNum}: Quantity must be 0 or a positive number.`);
        return;
      }
      const sp = Number(r.sellingPrice || 0);
      if (isNaN(sp) || sp < 0) {
        setError(`Row #${rowNum}: Selling price cannot be negative.`);
        return;
      }
      const mrpVal = Number(r.mrp || 0);
      if (isNaN(mrpVal) || mrpVal < 0) {
        setError(`Row #${rowNum}: MRP cannot be negative.`);
        return;
      }
      const discVal = Number(r.discount || 0);
      if (isNaN(discVal) || discVal < 0) {
        setError(`Row #${rowNum}: Discount cannot be negative.`);
        return;
      }
      const lowStockVal = Number(r.lowStock || 0);
      if (isNaN(lowStockVal) || lowStockVal < 0) {
        setError(`Row #${rowNum}: Low Stock Threshold cannot be negative.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const inputs = validRows.map((r) => {
        const mrpNum = Number(r.mrp || 0);
        const discNum = Number(r.discount || 0);
        const spNum = Number(r.sellingPrice || 0);
        const qtyNum = Number(r.quantity || 0);
        const lowStockNum = Number(r.lowStock || 10);

        return {
          name: r.name.trim(),
          product_id: r.productId.trim().toUpperCase(),
          category_id: r.categoryId,
          quantity: qtyNum,
          discount: discNum,
          selling_price: spNum > 0 ? spNum : mrpNum > 0 ? mrpNum : 0,
          mrp: mrpNum > 0 ? mrpNum : spNum > 0 ? spNum : 0,
          low_stock: lowStockNum,
          unit: r.unit || 'Piece',
          status: 'active' as const, // default initial status put true (active)
        };
      });

      const res = await createMultipleProducts(inputs);

      if (res.error) {
        setError(res.error);
        setSubmitting(false);
      } else {
        setSubmitting(false);
        onSuccess(res.data || undefined);
        onClose();
      }
    } catch (err: any) {
      console.error('Error inserting products:', err);
      setError(err?.message || 'Failed to insert products.');
      setSubmitting(false);
    }
  };

  return (
    <div
      id="add-product-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-5 lg:p-6 bg-black/60 backdrop-blur-xs erp-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        id="add-product-modal-card"
        className="w-full max-w-[98vw] xl:max-w-[1520px] my-4 space-y-4 erp-slide-up pb-6"
      >
        {/* Top Back Navigation */}
        <div className="flex items-center justify-start">
          <button
            id="back-to-products-dashboard-btn"
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="erp-btn erp-btn-outline bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-medium gap-2 px-3.5 py-2 shadow-xs cursor-pointer border-[var(--border)] text-[var(--text-primary)]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Products Dashboard</span>
          </button>
        </div>

        {/* Card 1: Top Hero Header Banner */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#34241d] text-[#e8d5c4] flex items-center justify-center shrink-0 shadow-xs">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                Add New Products
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                Enter products in single-row format. Use Left / Right arrow keys to navigate across fields.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)]">
              <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Total Rows: {rows.length}</span>
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            id="add-products-error-banner"
            className="p-4 rounded-xl bg-[var(--danger-light)] border border-[var(--danger)] text-xs text-[var(--danger)] flex items-start gap-2.5 shadow-xs"
          >
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs text-[var(--danger)] font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Card 2: Main Products Entry Table */}
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs overflow-hidden flex flex-col">
          {/* Table Card Header */}
          <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#78350f]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                PRODUCT ENTRY TABLE ({rows.length} {rows.length === 1 ? 'PRODUCT' : 'PRODUCTS'})
              </span>
            </div>
            <span className="text-[11px] text-[var(--text-muted)] font-medium">
              Navigate with Left / Right arrow keys within each row. Tap Enter on tick button to add row below.
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto min-h-[160px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#fcfaf7] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                <tr>
                  <th className="py-3 px-2 text-center w-8 text-[11px] uppercase tracking-wider">#</th>
                  <th className="py-3 px-2 min-w-[120px] text-[11px] uppercase tracking-wider">
                    PRODUCT ID <span className="text-[var(--danger)]">*</span>
                  </th>
                  <th className="py-3 px-2 min-w-[200px] text-[11px] uppercase tracking-wider">
                    PRODUCT NAME <span className="text-[var(--danger)]">*</span>
                  </th>
                  <th className="py-3 px-2 min-w-[150px] text-[11px] uppercase tracking-wider">
                    CATEGORY <span className="text-[var(--danger)]">*</span>
                  </th>
                  <th className="py-3 px-2 min-w-[95px] text-[11px] uppercase tracking-wider">MRP (₹)</th>
                  <th className="py-3 px-2 min-w-[85px] text-[11px] uppercase tracking-wider">DISC (%)</th>
                  <th className="py-3 px-2 min-w-[95px] text-[11px] uppercase tracking-wider">
                    S.P (₹) <span className="text-[var(--danger)]">*</span>
                  </th>
                  <th className="py-3 px-2 min-w-[90px] text-[11px] uppercase tracking-wider">
                    Q (STOCK) <span className="text-[var(--danger)]">*</span>
                  </th>
                  <th className="py-3 px-2 min-w-[85px] text-[11px] uppercase tracking-wider">LOW STOCK</th>
                  <th className="py-3 px-2 min-w-[95px] text-[11px] uppercase tracking-wider">UNIT</th>
                  <th className="py-3 px-2 text-center w-20 text-[11px] uppercase tracking-wider">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface)]">
                {rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[var(--surface-hover)]/70 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-2.5 px-2 text-center text-xs font-semibold text-[var(--text-secondary)]">
                      {rowIndex + 1}
                    </td>

                    {/* Product ID (Col 0) */}
                    <td className="py-2 px-2">
                      <input
                        id={`cell-${rowIndex}-0`}
                        type="text"
                        value={row.productId}
                        onChange={(e) => updateRowField(rowIndex, 'productId', e.target.value.toUpperCase())}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 0)}
                        placeholder="Prod-101"
                        className="w-full erp-input py-1.5 px-2 text-xs font-mono uppercase bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      />
                    </td>

                    {/* Product Name (Col 1) */}
                    <td className="py-2 px-2">
                      <input
                        id={`cell-${rowIndex}-1`}
                        type="text"
                        value={row.name}
                        onChange={(e) => updateRowField(rowIndex, 'name', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 1)}
                        placeholder="e.g. PVC Conduit Pipe 25mm"
                        className="w-full erp-input py-1.5 px-2.5 text-xs bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      />
                    </td>

                    {/* Category (Col 2) */}
                    <td className="py-2 px-2">
                      <select
                        id={`cell-${rowIndex}-2`}
                        value={row.categoryId}
                        onChange={(e) => updateRowField(rowIndex, 'categoryId', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 2)}
                        className="w-full erp-select py-1.5 px-2 text-xs bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      >
                        {categories.length === 0 ? (
                          <option value="">No Categories</option>
                        ) : (
                          categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.category_name}
                            </option>
                          ))
                        )}
                      </select>
                    </td>

                    {/* MRP (₹) (Col 3) */}
                    <td className="py-2 px-2">
                      <input
                        id={`cell-${rowIndex}-3`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.mrp}
                        onChange={(e) => updateRowField(rowIndex, 'mrp', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 3)}
                        placeholder="0.00"
                        className="w-full erp-input py-1.5 px-2 text-xs font-mono bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      />
                    </td>

                    {/* Discount % (Col 4) */}
                    <td className="py-2 px-2">
                      <input
                        id={`cell-${rowIndex}-4`}
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        value={row.discount}
                        onChange={(e) => updateRowField(rowIndex, 'discount', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 4)}
                        placeholder="0"
                        className="w-full erp-input py-1.5 px-2 text-xs font-mono bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      />
                    </td>

                    {/* Selling Price S.P (₹) (Col 5) */}
                    <td className="py-2 px-2">
                      <input
                        id={`cell-${rowIndex}-5`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.sellingPrice}
                        onChange={(e) => updateRowField(rowIndex, 'sellingPrice', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 5)}
                        placeholder="0.00"
                        className="w-full erp-input py-1.5 px-2 text-xs font-mono font-semibold bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      />
                    </td>

                    {/* Quantity Q (Stock) (Col 6) */}
                    <td className="py-2 px-2">
                      <input
                        id={`cell-${rowIndex}-6`}
                        type="number"
                        step="any"
                        min="0"
                        value={row.quantity}
                        onChange={(e) => updateRowField(rowIndex, 'quantity', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 6)}
                        placeholder="0"
                        className="w-full erp-input py-1.5 px-2 text-xs font-mono font-semibold bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      />
                    </td>

                    {/* Low Stock Threshold (Col 7) */}
                    <td className="py-2 px-2">
                      <input
                        id={`cell-${rowIndex}-7`}
                        type="number"
                        step="any"
                        min="0"
                        value={row.lowStock}
                        onChange={(e) => updateRowField(rowIndex, 'lowStock', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 7)}
                        placeholder="10"
                        className="w-full erp-input py-1.5 px-2 text-xs font-mono bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      />
                    </td>

                    {/* Unit (Col 8) */}
                    <td className="py-2 px-2">
                      <select
                        id={`cell-${rowIndex}-8`}
                        value={row.unit}
                        onChange={(e) => updateRowField(rowIndex, 'unit', e.target.value)}
                        onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 8)}
                        className="w-full erp-select py-1.5 px-1.5 text-xs bg-[var(--surface)] focus:border-[#78350f] focus:ring-1 focus:ring-[#78350f]"
                      >
                        {COMMON_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Actions: Tick button (Col 9) + Delete button */}
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Small Tick Button: pressing Enter on it adds a new row below */}
                        <button
                          id={`cell-${rowIndex}-9`}
                          type="button"
                          onClick={() => handleAddRow(rowIndex)}
                          onKeyDown={(e) => handleCellKeyDown(e, rowIndex, 9)}
                          title="Add row below (or Press Enter)"
                          className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] hover:bg-[#34241d] hover:text-white text-[var(--text-secondary)] flex items-center justify-center transition-colors cursor-pointer focus:ring-2 focus:ring-[#78350f] focus:outline-none"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Row Button */}
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(rowIndex)}
                            title="Delete this row"
                            className="w-7 h-7 rounded-md text-[var(--danger)] hover:bg-[var(--danger-light)] flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Card Bottom Action Bar */}
          <div className="p-4 bg-[var(--surface-subtle)]/40 border-t border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <button
              id="add-another-product-row-btn"
              type="button"
              onClick={() => handleAddRow()}
              className="px-4 py-2.5 rounded-xl bg-[#34241d] hover:bg-[#251a14] text-white text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>(+) Add Another Product Row</span>
            </button>

            <span className="text-xs text-[var(--text-secondary)] font-medium">
              Ready to insert <strong className="text-[var(--text-primary)]">{rows.length}</strong> product {rows.length === 1 ? 'item' : 'items'} into the database
            </span>
          </div>
        </div>

        {/* Card 3: Bottom Actions Confirmation Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs flex items-center justify-between gap-4">
          <button
            id="cancel-add-products-btn"
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="erp-btn erp-btn-outline text-xs px-5 py-2.5 rounded-xl cursor-pointer border-[var(--border)]"
          >
            Cancel
          </button>

          <button
            id="confirm-products-btn"
            type="button"
            onClick={handleConfirmProducts}
            disabled={submitting || loadingData}
            className="px-6 py-2.5 rounded-xl bg-[#34241d] hover:bg-[#251a14] text-white text-xs font-semibold inline-flex items-center gap-2.5 shadow-sm transition-colors cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Inserting products into database...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4.5 h-4.5 text-[#f59e0b]" />
                <span>Confirm products (Insert into products)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
