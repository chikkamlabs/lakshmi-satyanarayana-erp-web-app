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
  Clock,
  Calendar,
  Trash2,
  AlertTriangle,
  Percent,
} from 'lucide-react';
import {
  updateProduct,
  deleteProduct,
  fetchCategoriesForDropdown,
  ProductStatus,
  Product,
  CategoryOption,
} from '@/lib/productsStore';

interface OpenProductProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
  onDeleteSuccess?: (deletedId: string) => void;
}

const COMMON_UNITS = ['Piece', 'Packet', 'Box', 'Kg', 'Tin', 'Gram', 'Liter', 'Meter'];

export default function OpenProductModal({
  product,
  isOpen,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: OpenProductProps) {
  if (!isOpen || !product) return null;

  return (
    <OpenProductModalContent
      product={product}
      onClose={onClose}
      onSuccess={onSuccess}
      onDeleteSuccess={onDeleteSuccess}
    />
  );
}

function OpenProductModalContent({
  product,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: {
  product: Product;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
  onDeleteSuccess?: (deletedId: string) => void;
}) {
  const [name, setName] = useState(product.name || '');
  const [productId, setProductId] = useState(product.product_id || '');
  const [categoryId, setCategoryId] = useState(product.category_id || '');
  const [quantity, setQuantity] = useState<number | string>(product.quantity ?? 0);
  const [mrp, setMrp] = useState<number | string>(product.mrp ?? 0);
  const [discount, setDiscount] = useState<number | string>(product.discount ?? 0);
  const [sellingPrice, setSellingPrice] = useState<number | string>(product.selling_price ?? 0);
  const [lowStock, setLowStock] = useState<number | string>(product.low_stock ?? 10);
  const [unit, setUnit] = useState(product.unit || 'Piece');
  const [status, setStatus] = useState<ProductStatus>(product.status || 'active');

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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

    async function loadCategories() {
      try {
        const res = await fetchCategoriesForDropdown();
        if (active && res.data) {
          setCategories(res.data);
        }
      } catch (err) {
        console.error('Error fetching categories in open product:', err);
      } finally {
        if (active) setLoadingCategories(false);
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (!productId.trim()) {
      setError('Product Code is required.');
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

    setSaving(true);
    setError(null);

    const res = await updateProduct({
      id: product.id,
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

    setSaving(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      onSuccess(res.data);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    setError(null);

    const res = await deleteProduct(product.id);
    setDeleting(false);

    if (res.error) {
      setError(res.error);
      setConfirmDelete(false);
    } else {
      if (onDeleteSuccess) {
        onDeleteSuccess(product.id);
      }
      onClose();
    }
  };

  const isLowStock = Number(quantity) < Number(lowStock);

  return (
    <div
      id="open-product-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs erp-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="open-product-modal-card"
        className="w-full max-w-2xl bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl overflow-hidden erp-slide-up my-8 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  Edit Product
                </h2>
                <span className="erp-badge font-mono text-[11px] bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {product.product_id}
                </span>
                {status === 'active' ? (
                  <span className="erp-badge erp-badge-success text-[10px]">Active</span>
                ) : (
                  <span className="erp-badge erp-badge-secondary text-[10px]">Inactive</span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Update product parameters, inventory counts, and pricing
              </p>
            </div>
          </div>
          <button
            id="close-open-product-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Low Stock Banner inside Modal */}
        {isLowStock && (
          <div className="px-6 py-2.5 bg-[var(--danger-light)] border-b border-[var(--danger)] text-xs text-[var(--danger)] flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Low Stock Alert: Current stock ({quantity} {unit}) is below the threshold ({lowStock} {unit}).
              </span>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div
              id="open-product-error-banner"
              className="p-3.5 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-xs text-[var(--danger)] flex items-start gap-2 erp-shake"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Product ID / Code */}
            <div className="erp-form-group">
              <label htmlFor="edit-product-id" className="erp-label flex items-center justify-between">
                <span>Product Code / SKU <span className="text-[var(--danger)]">*</span></span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Unique ID</span>
              </label>
              <input
                id="edit-product-id"
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value.toUpperCase())}
                className="erp-input uppercase font-mono text-xs font-semibold"
                required
              />
            </div>

            {/* Category Selection */}
            <div className="erp-form-group">
              <label htmlFor="edit-product-category" className="erp-label">
                Category <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                id="edit-product-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="erp-select text-xs"
                disabled={loadingCategories || categories.length === 0}
                required
              >
                {loadingCategories ? (
                  <option value="">Loading categories...</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name} ({c.category_id})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Product Name (Full Width) */}
            <div className="erp-form-group sm:col-span-2">
              <label htmlFor="edit-product-name" className="erp-label">
                Product Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="edit-product-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="erp-input text-xs"
                required
              />
            </div>

            {/* Quantity */}
            <div className="erp-form-group">
              <label htmlFor="edit-product-quantity" className="erp-label flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Quantity <span className="text-[var(--danger)]">*</span></span>
              </label>
              <input
                id="edit-product-quantity"
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`erp-input text-xs font-mono font-bold ${
                  isLowStock ? 'border-[var(--danger)] bg-[var(--danger-light)] text-[var(--danger)]' : ''
                }`}
                required
              />
            </div>

            {/* Measurement Unit */}
            <div className="erp-form-group">
              <label htmlFor="edit-product-unit" className="erp-label">
                Measurement Unit <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="edit-product-unit"
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
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
              <label htmlFor="edit-product-mrp" className="erp-label flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>MRP / Retail Price (₹) <span className="text-[var(--danger)]">*</span></span>
              </label>
              <input
                id="edit-product-mrp"
                type="number"
                step="0.01"
                min="0"
                value={mrp}
                onChange={(e) => handleMrpChange(e.target.value)}
                className="erp-input text-xs font-mono"
                required
              />
            </div>

            {/* Discount */}
            <div className="erp-form-group">
              <label htmlFor="edit-product-discount" className="erp-label flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Discount (%)</span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Auto calculates SP</span>
              </label>
              <input
                id="edit-product-discount"
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
              <label htmlFor="edit-product-selling-price" className="erp-label flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[var(--success)]" />
                  <span>Selling Price (₹) <span className="text-[var(--danger)]">*</span></span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-normal">Direct entry sets disc=0</span>
              </label>
              <input
                id="edit-product-selling-price"
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => handleSellingPriceChange(e.target.value)}
                className="erp-input text-xs font-mono font-semibold"
                required
              />
            </div>

            {/* Low Stock Threshold */}
            <div className="erp-form-group">
              <label htmlFor="edit-product-low-stock" className="erp-label flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[var(--warning)]" />
                <span>Low Stock Threshold <span className="text-[var(--danger)]">*</span></span>
              </label>
              <input
                id="edit-product-low-stock"
                type="number"
                step="any"
                min="0"
                value={lowStock}
                onChange={(e) => setLowStock(e.target.value)}
                className="erp-input text-xs font-mono"
                required
              />
            </div>

            {/* Status */}
            <div className="erp-form-group">
              <label htmlFor="edit-product-status" className="erp-label">
                Status <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                id="edit-product-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="erp-select text-xs"
              >
                <option value="active">Active (Available for billing)</option>
                <option value="inactive">Inactive (Discontinued)</option>
              </select>
            </div>

          </div>

          {/* Timestamps & Info Summary Box */}
          <div className="p-3.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <span>
                Created: <strong className="text-[var(--text-primary)]">{formatDate(product.created_at)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <span>
                Last Updated: <strong className="text-[var(--text-primary)]">{formatDate(product.updated_at)}</strong>
              </span>
            </div>
          </div>

          {/* Bottom Action Controls & Small Last Updated Display */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Delete / Danger Option */}
            <div className="flex items-center">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--danger)] font-medium">Are you sure?</span>
                  <button
                    id="confirm-delete-product-btn"
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="erp-btn erp-btn-danger text-xs py-1 px-2.5 cursor-pointer"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="erp-btn erp-btn-ghost text-xs py-1 px-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  id="delete-product-btn"
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving || deleting}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger-light)] py-1.5 px-2.5 rounded-md border border-transparent hover:border-[var(--danger)] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Product</span>
                </button>
              )}
            </div>

            {/* Right Buttons with small last updated text at bottom */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2.5">
                <button
                  id="cancel-edit-product-btn"
                  type="button"
                  onClick={onClose}
                  disabled={saving || deleting}
                  className="erp-btn erp-btn-outline text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  id="save-edit-product-btn"
                  type="submit"
                  disabled={saving || deleting || loadingCategories}
                  className="erp-btn erp-btn-primary flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

              {/* Last Updated small text at bottom */}
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 pr-0.5">
                <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                Last updated: {formatDate(product.updated_at)}
              </span>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
