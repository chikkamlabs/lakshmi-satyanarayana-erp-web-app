'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  IndianRupee,
  Layers,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import {
  createProduct,
  suggestNextProductId,
  fetchCategoriesForDropdown,
  ProductStatus,
  Product,
  CategoryOption,
} from '@/lib/productsStore';

interface AddProductProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
}

const COMMON_UNITS = ['Piece', 'Packet', 'Box', 'Kg', 'Tin', 'Gram', 'Liter', 'Meter'];

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductProps) {
  if (!isOpen) return null;

  return <AddProductModalContent onClose={onClose} onSuccess={onSuccess} />;
}

function AddProductModalContent({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
}) {
  const [name, setName] = useState('');
  const [productId, setProductId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState<number | string>('0');
  const [mrp, setMrp] = useState<number | string>('0');
  const [discount, setDiscount] = useState<number | string>('0');
  const [sellingPrice, setSellingPrice] = useState<number | string>('0');
  const [lowStock, setLowStock] = useState<number | string>('10');
  const [unit, setUnit] = useState('Piece');
  const [status, setStatus] = useState<ProductStatus>('active');

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto calculate selling price when MRP changes (selling_price = mrp - (mrp * discount%) / 100)
  const handleMrpChange = (val: string) => {
    setMrp(val);
    const mrpNum = parseFloat(val);
    const discNum = parseFloat(String(discount));
    if (!isNaN(mrpNum)) {
      if (!isNaN(discNum) && discNum > 0) {
        const calculatedSp = Math.max(0, mrpNum - (mrpNum * discNum) / 100);
        setSellingPrice(calculatedSp.toFixed(2));
      } else {
        // If discount is 0 or not set, and selling price was matching or 0
        if (Number(sellingPrice) === 0 || Number(sellingPrice) > mrpNum) {
          setSellingPrice(mrpNum.toFixed(2));
        }
      }
    }
  };

  // Auto calculate selling price when discount% changes (selling_price = mrp - (mrp * discount%) / 100)
  const handleDiscountChange = (val: string) => {
    setDiscount(val);
    const mrpNum = parseFloat(String(mrp));
    const discNum = parseFloat(val);
    if (!isNaN(mrpNum)) {
      if (!isNaN(discNum)) {
        const calculatedSp = Math.max(0, mrpNum - (mrpNum * discNum) / 100);
        setSellingPrice(calculatedSp.toFixed(2));
      } else {
        setSellingPrice(mrpNum.toFixed(2));
      }
    }
  };

  // If selling_price entered directly put discount 0
  const handleSellingPriceChange = (val: string) => {
    setSellingPrice(val);
    setDiscount('0');
  };

  useEffect(() => {
    let active = true;

    async function initializeModal() {
      try {
        const [catRes, nextCode] = await Promise.all([
          fetchCategoriesForDropdown(),
          suggestNextProductId(),
        ]);

        if (!active) return;

        if (catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
          // Auto select first active category
          const firstActive = catRes.data.find((c) => c.status === 'active') || catRes.data[0];
          setCategoryId(firstActive.id);
        }

        if (nextCode) {
          setProductId(nextCode);
        }
      } catch (err) {
        console.error('Error initializing add product modal:', err);
      } finally {
        if (active) setLoadingCategories(false);
      }
    }

    initializeModal();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!productId.trim()) {
      setError('Product ID / Code is required.');
      return;
    }
    if (!categoryId) {
      setError('Please select a Category.');
      return;
    }

    const qtyNum = Number(quantity);
    const spNum = Number(sellingPrice);
    const mrpNum = Number(mrp);
    const discNum = Number(discount);
    const lowStockNum = Number(lowStock);

    if (isNaN(qtyNum) || qtyNum < 0) {
      setError('Quantity must be 0 or a positive number.');
      return;
    }
    if (isNaN(mrpNum) || mrpNum < 0) {
      setError('MRP must be 0 or a positive amount.');
      return;
    }
    if (isNaN(discNum) || discNum < 0) {
      setError('Discount must be 0 or a positive amount.');
      return;
    }
    if (isNaN(spNum) || spNum < 0) {
      setError('Selling Price must be 0 or a positive amount.');
      return;
    }
    if (isNaN(lowStockNum) || lowStockNum < 0) {
      setError('Low Stock threshold must be 0 or a positive number.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await createProduct({
      name: name.trim(),
      product_id: productId.trim(),
      category_id: categoryId,
      quantity: qtyNum,
      discount: discNum,
      selling_price: spNum,
      mrp: mrpNum,
      low_stock: lowStockNum,
      unit: unit.trim() || 'Piece',
      status,
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      onSuccess(res.data);
      onClose();
    }
  };

  return (
    <div
      id="add-product-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs erp-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-product-modal-card"
        className="w-full max-w-2xl bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl overflow-hidden erp-slide-up my-8 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                Add New Product
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Create a product master record with inventory & pricing details
              </p>
            </div>
          </div>
          <button
            id="close-add-product-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div
              id="add-product-error-banner"
              className="p-3.5 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-xs text-[var(--danger)] flex items-start gap-2 erp-shake"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Grid Layout for Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Product ID / Code */}
            <div className="erp-form-group">
              <label htmlFor="add-product-id" className="erp-label flex items-center justify-between">
                <span>Product Code / SKU <span className="text-[var(--danger)]">*</span></span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Unique ID</span>
              </label>
              <input
                id="add-product-id"
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value.toUpperCase())}
                placeholder="e.g. PRD-1001"
                className="erp-input uppercase font-mono text-xs"
                required
              />
            </div>

            {/* Category Dropdown */}
            <div className="erp-form-group">
              <label htmlFor="add-product-category" className="erp-label">
                Category <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="relative">
                <select
                  id="add-product-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="erp-select text-xs"
                  disabled={loadingCategories || categories.length === 0}
                  required
                >
                  {loadingCategories ? (
                    <option value="">Loading categories...</option>
                  ) : categories.length === 0 ? (
                    <option value="">No categories found (Create one first)</option>
                  ) : (
                    categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.category_name} ({c.category_id}) {c.status === 'inactive' ? '— (Inactive)' : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Product Name (Full Width) */}
            <div className="erp-form-group sm:col-span-2">
              <label htmlFor="add-product-name" className="erp-label">
                Product Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="add-product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. W180 Jumbo Raw Cashew Nuts 500g"
                className="erp-input text-xs"
                required
              />
            </div>

            {/* Stock Quantity */}
            <div className="erp-form-group">
              <label htmlFor="add-product-quantity" className="erp-label flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Initial Stock Quantity <span className="text-[var(--danger)]">*</span></span>
              </label>
              <input
                id="add-product-quantity"
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="erp-input text-xs font-mono"
                required
              />
            </div>

            {/* Measurement Unit */}
            <div className="erp-form-group">
              <label htmlFor="add-product-unit" className="erp-label">
                Measurement Unit <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="add-product-unit"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Piece"
                  className="erp-input text-xs flex-1"
                  required
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="erp-select text-xs w-28 bg-[var(--surface-subtle)]"
                  title="Preset Units"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* MRP */}
            <div className="erp-form-group">
              <label htmlFor="add-product-mrp" className="erp-label flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>MRP / Retail Price (₹) <span className="text-[var(--danger)]">*</span></span>
              </label>
              <input
                id="add-product-mrp"
                type="number"
                step="0.01"
                min="0"
                value={mrp}
                onChange={(e) => handleMrpChange(e.target.value)}
                placeholder="0.00"
                className="erp-input text-xs font-mono"
                required
              />
            </div>

            {/* Discount */}
            <div className="erp-form-group">
              <label htmlFor="add-product-discount" className="erp-label flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Discount (%)</span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Auto calculates SP</span>
              </label>
              <input
                id="add-product-discount"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder="0.00%"
                className="erp-input text-xs font-mono"
              />
            </div>

            {/* Selling Price */}
            <div className="erp-form-group">
              <label htmlFor="add-product-selling-price" className="erp-label flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[var(--success)]" />
                  <span>Selling Price (₹) <span className="text-[var(--danger)]">*</span></span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Direct entry sets disc=0</span>
              </label>
              <input
                id="add-product-selling-price"
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
                placeholder="0.00"
                className="erp-input text-xs font-mono font-semibold"
                required
              />
            </div>

            {/* Low Stock Alert Threshold */}
            <div className="erp-form-group">
              <label htmlFor="add-product-low-stock" className="erp-label flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[var(--warning)]" />
                <span>Low Stock Threshold <span className="text-[var(--danger)]">*</span></span>
              </label>
              <input
                id="add-product-low-stock"
                type="number"
                step="any"
                min="0"
                value={lowStock}
                onChange={(e) => setLowStock(e.target.value)}
                placeholder="10"
                className="erp-input text-xs font-mono"
                required
              />
              <span className="erp-helper-text">
                Alerts triggered when stock falls below this quantity.
              </span>
            </div>

            {/* Status */}
            <div className="erp-form-group">
              <label htmlFor="add-product-status" className="erp-label">
                Initial Status <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                id="add-product-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="erp-select text-xs"
              >
                <option value="active">Active (Available for billing)</option>
                <option value="inactive">Inactive (Hidden/Discontinued)</option>
              </select>
            </div>

          </div>

          {/* Pricing Preview Summary Box */}
          <div className="p-3.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] text-xs flex flex-wrap items-center justify-between gap-2">
            <div className="text-[var(--text-secondary)]">
              Calculated Margin:{' '}
              <strong className="text-[var(--text-primary)]">
                {Number(mrp) > 0 && Number(sellingPrice) > 0
                  ? `₹${(Number(mrp) - Number(sellingPrice)).toFixed(2)} (${(
                      ((Number(mrp) - Number(sellingPrice)) / Number(mrp)) *
                      100
                    ).toFixed(1)}% disc)`
                  : '—'}
              </strong>
            </div>
            <div className="text-[var(--text-secondary)]">
              Stock Units: <strong className="text-[var(--primary)]">{quantity} {unit}</strong>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              id="cancel-add-product-btn"
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="erp-btn erp-btn-outline text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-add-product-btn"
              type="submit"
              disabled={submitting || loadingCategories}
              className="erp-btn erp-btn-primary flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
