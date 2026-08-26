'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { createCategory, suggestNextCategoryId, CategoryStatus, Category } from '@/lib/categoriesStore';

interface AddCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCategory: Category) => void;
}

export default function AddCategoryModal({ isOpen, onClose, onSuccess }: AddCategoryProps) {
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [status, setStatus] = useState<CategoryStatus>('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      suggestNextCategoryId().then((nextId) => {
        setCategoryId(nextId);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setCategoryId('');
    setCategoryName('');
    setStatus('active');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId.trim()) {
      setError('Category ID is required (e.g. cat-101)');
      return;
    }
    if (!categoryName.trim()) {
      setError('Category Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createCategory({
      category_id: categoryId.trim(),
      category_name: categoryName.trim(),
      status,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      onSuccess(res.data);
      handleClose();
    }
  };

  return (
    <div
      id="add-category-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div
        id="add-category-modal"
        className="w-full max-w-lg bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden erp-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Add New Category
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Create a product category in the inventory master
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 text-xs bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Category ID */}
          <div className="erp-form-group">
            <label className="erp-label" htmlFor="add-cat-id">
              Category ID <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="add-cat-id"
              type="text"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="e.g. cat-101"
              className="erp-input font-mono"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Unique identifier code used for classification & SKUs.
            </p>
          </div>

          {/* Category Name */}
          <div className="erp-form-group">
            <label className="erp-label" htmlFor="add-cat-name">
              Category Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="add-cat-name"
              type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Cashews, Almonds, Pistachios"
              className="erp-input"
            />
          </div>

          {/* Status */}
          <div className="erp-form-group">
            <label className="erp-label">
              Status <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  status === 'active'
                    ? 'border-[var(--success)] bg-[var(--success-light)] text-[var(--success)] shadow-xs'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  status === 'inactive'
                    ? 'border-[var(--secondary)] bg-[var(--surface-subtle)] text-[var(--text-primary)] font-semibold shadow-xs'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
                Inactive
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)] mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="erp-btn erp-btn-outline cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="erp-btn erp-btn-primary flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Category...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
