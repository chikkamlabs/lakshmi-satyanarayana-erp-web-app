'use client';

import React, { useState } from 'react';
import { X, Tag, CheckCircle2, AlertCircle, Loader2, Clock, Calendar, Package, Trash2 } from 'lucide-react';
import { updateCategory, deleteCategory, CategoryStatus, Category } from '@/lib/categoriesStore';

interface OpenCategoryProps {
  category: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedCategory: Category) => void;
  onDeleteSuccess?: (deletedId: string) => void;
}

export default function OpenCategoryModal({
  category,
  isOpen,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: OpenCategoryProps) {
  if (!isOpen || !category) return null;

  return (
    <OpenCategoryModalContent
      category={category}
      onClose={onClose}
      onSuccess={onSuccess}
      onDeleteSuccess={onDeleteSuccess}
    />
  );
}

function OpenCategoryModalContent({
  category,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: {
  category: Category;
  onClose: () => void;
  onSuccess: (updatedCategory: Category) => void;
  onDeleteSuccess?: (deletedId: string) => void;
}) {
  const [categoryId, setCategoryId] = useState(category.category_id || '');
  const [categoryName, setCategoryName] = useState(category.category_name || '');
  const [status, setStatus] = useState<CategoryStatus>(category.status || 'active');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!categoryId.trim()) {
      setError('Category ID is required.');
      return;
    }
    if (!categoryName.trim()) {
      setError('Category Name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateCategory({
      id: category.id,
      category_id: categoryId.trim(),
      category_name: categoryName.trim(),
      status,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      onSuccess({
        ...res.data,
        total_products: category.total_products,
      });
      onClose();
    }
  };

  const handleDelete = async () => {
    if (category.total_products && category.total_products > 0) {
      setError(`Cannot delete category with ${category.total_products} active product(s). Please reassign them first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${category.category_name}" (${category.category_id})?`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    const res = await deleteCategory(category.id);
    setDeleting(false);

    if (res.error) {
      setError(res.error);
    } else {
      if (onDeleteSuccess) onDeleteSuccess(category.id);
      onClose();
    }
  };

  return (
    <div
      id="open-category-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !deleting) onClose();
      }}
    >
      <div
        id="open-category-modal"
        className="w-full max-w-lg bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden erp-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Edit Category
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                  {category.category_id}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Update classification, status, and category code
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading || deleting}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Context Summary Banner */}
        <div className="px-6 py-2.5 bg-[var(--surface-subtle)]/60 border-b border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Products linked:</span>
            <strong className="text-[var(--text-primary)] font-semibold">
              {category.total_products || 0} items
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Created:</span>
            <span>{formatDate(category.created_at)}</span>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 text-xs bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Category ID */}
          <div className="erp-form-group">
            <label className="erp-label" htmlFor="edit-cat-id">
              Category ID <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="edit-cat-id"
              type="text"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="e.g. cat-101"
              className="erp-input font-mono"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Must be unique across all product categories.
            </p>
          </div>

          {/* Category Name */}
          <div className="erp-form-group">
            <label className="erp-label" htmlFor="edit-cat-name">
              Category Name <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="edit-cat-name"
              type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Cashews, Almonds"
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

          {/* Footer with Last Updated Time Displayed Small in the Bottom */}
          <div className="pt-4 border-t border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              {/* Delete Button */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || deleting || (category.total_products ? category.total_products > 0 : false)}
                title={
                  category.total_products && category.total_products > 0
                    ? 'Cannot delete category with products linked'
                    : 'Delete this category'
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                {deleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading || deleting}
                  className="erp-btn erp-btn-outline cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || deleting}
                  className="erp-btn erp-btn-primary flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Update Category
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Last updated timestamp displayed small in the bottom */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-1">
              <Clock className="w-3 h-3" />
              <span>Last updated: {formatDate(category.updated_at || category.created_at)}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
