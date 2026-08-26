'use client';

import React, { useState } from 'react';
import { X, Truck, CheckCircle2, AlertCircle, Loader2, MapPin, Phone, Building2, Calendar, ShoppingBag, Clock, Trash2 } from 'lucide-react';
import { updateDistributor, deleteDistributor, DistributorStatus, Distributor } from '@/lib/distributorStore';

interface OpenDistributorProps {
  distributor: Distributor | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedDistributor: Distributor) => void;
  onDeleteSuccess?: (deletedId: string) => void;
}

export default function OpenDistributorModal({
  distributor,
  isOpen,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: OpenDistributorProps) {
  if (!isOpen || !distributor) return null;

  return (
    <OpenDistributorModalContent
      distributor={distributor}
      onClose={onClose}
      onSuccess={onSuccess}
      onDeleteSuccess={onDeleteSuccess}
    />
  );
}

function OpenDistributorModalContent({
  distributor,
  onClose,
  onSuccess,
  onDeleteSuccess,
}: {
  distributor: Distributor;
  onClose: () => void;
  onSuccess: (updatedDistributor: Distributor) => void;
  onDeleteSuccess?: (deletedId: string) => void;
}) {
  const [distributorId, setDistributorId] = useState(distributor.distributor_id || '');
  const [distributorName, setDistributorName] = useState(distributor.distributor_name || '');
  const [address, setAddress] = useState(distributor.address || '');
  const [mobile, setMobile] = useState(distributor.mobile || '');
  const [gstin, setGstin] = useState(distributor.gstin || '');
  const [status, setStatus] = useState<DistributorStatus>(distributor.status || 'active');
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
    if (!distributorId.trim()) {
      setError('Distributor ID is required.');
      return;
    }
    if (!distributorName.trim()) {
      setError('Distributor Name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateDistributor({
      id: distributor.id,
      distributor_id: distributorId.trim(),
      distributor_name: distributorName.trim(),
      address: address.trim() || undefined,
      mobile: mobile.trim() || undefined,
      gstin: gstin.trim() || undefined,
      status,
    });

    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      onSuccess({
        ...res.data,
        total_purchases: distributor.total_purchases,
      });
      onClose();
    }
  };

  const handleDelete = async () => {
    if (distributor.total_purchases && distributor.total_purchases > 0) {
      setError(`Cannot delete distributor with ${distributor.total_purchases} purchase bill(s) recorded.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete distributor "${distributor.distributor_name}" (${distributor.distributor_id})?`)) {
      return;
    }

    setDeleting(true);
    setError(null);

    const res = await deleteDistributor(distributor.id);
    setDeleting(false);

    if (res.error) {
      setError(res.error);
    } else {
      if (onDeleteSuccess) onDeleteSuccess(distributor.id);
      onClose();
    }
  };

  return (
    <div
      id="open-distributor-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && !deleting) onClose();
      }}
    >
      <div
        id="open-distributor-modal"
        className="w-full max-w-xl bg-[var(--surface)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden erp-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  Edit Distributor
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                  {distributor.distributor_id}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Update vendor details, contact info, and tax identification
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
            <ShoppingBag className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Purchases recorded:</span>
            <strong className="text-[var(--text-primary)] font-semibold">
              {distributor.total_purchases || 0} bill{distributor.total_purchases === 1 ? '' : 's'}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Registered:</span>
            <span>{formatDate(distributor.created_at)}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 text-xs bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: ID & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="erp-form-group">
              <label className="erp-label" htmlFor="edit-distri-id">
                Distributor ID <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="edit-distri-id"
                type="text"
                required
                value={distributorId}
                onChange={(e) => setDistributorId(e.target.value)}
                placeholder="e.g. distri-101"
                className="erp-input font-mono"
              />
            </div>

            <div className="erp-form-group">
              <label className="erp-label" htmlFor="edit-distri-name">
                Distributor Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="edit-distri-name"
                type="text"
                required
                value={distributorName}
                onChange={(e) => setDistributorName(e.target.value)}
                placeholder="e.g. Raju Dry Fruits"
                className="erp-input"
              />
            </div>
          </div>

          {/* Row 2: Location / Address & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="erp-form-group">
              <label className="erp-label flex items-center gap-1.5" htmlFor="edit-distri-address">
                <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Location / City</span>
              </label>
              <input
                id="edit-distri-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Hyderabad, Mumbai"
                className="erp-input"
              />
            </div>

            <div className="erp-form-group">
              <label className="erp-label flex items-center gap-1.5" htmlFor="edit-distri-mobile">
                <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Contact / Mobile</span>
              </label>
              <input
                id="edit-distri-mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="e.g. 9876543210"
                className="erp-input"
              />
            </div>
          </div>

          {/* Row 3: GSTIN & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="erp-form-group">
              <label className="erp-label flex items-center gap-1.5" htmlFor="edit-distri-gstin">
                <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>GSTIN</span>
              </label>
              <input
                id="edit-distri-gstin"
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                placeholder="e.g. 36AAAAA0000A1Z5"
                className="erp-input uppercase font-mono text-xs"
              />
            </div>

            <div className="erp-form-group">
              <label className="erp-label">
                Status <span className="text-[var(--danger)]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
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
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
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
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              {/* Delete Button */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || deleting || (distributor.total_purchases ? distributor.total_purchases > 0 : false)}
                title={
                  distributor.total_purchases && distributor.total_purchases > 0
                    ? 'Cannot delete distributor with recorded purchase bills'
                    : 'Delete this distributor'
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
                      Update Distributor
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Last updated timestamp */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-1">
              <Clock className="w-3 h-3" />
              <span>Last updated: {formatDate(distributor.updated_at || distributor.created_at)}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
