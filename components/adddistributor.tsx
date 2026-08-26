'use client';

import React, { useState, useEffect } from 'react';
import { X, Truck, CheckCircle2, AlertCircle, Loader2, MapPin, Phone, Building2 } from 'lucide-react';
import { createDistributor, suggestNextDistributorId, DistributorStatus, Distributor } from '@/lib/distributorStore';

interface AddDistributorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDistributor: Distributor) => void;
}

export default function AddDistributorModal({
  isOpen,
  onClose,
  onSuccess,
}: AddDistributorProps) {
  const [distributorId, setDistributorId] = useState('');
  const [distributorName, setDistributorName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstin, setGstin] = useState('');
  const [status, setStatus] = useState<DistributorStatus>('active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      suggestNextDistributorId().then((nextId) => {
        setDistributorId(nextId);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setDistributorId('');
    setDistributorName('');
    setAddress('');
    setMobile('');
    setGstin('');
    setStatus('active');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorId.trim()) {
      setError('Distributor ID is required (e.g. distri-101)');
      return;
    }
    if (!distributorName.trim()) {
      setError('Distributor / Vendor Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await createDistributor({
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
      onSuccess(res.data);
      handleClose();
    }
  };

  return (
    <div
      id="add-distributor-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) handleClose();
      }}
    >
      <div
        id="add-distributor-modal"
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
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Add New Distributor
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Register a new vendor or wholesale supplier partner
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

          {/* Row 1: ID & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="erp-form-group">
              <label className="erp-label" htmlFor="add-distri-id">
                Distributor ID <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="add-distri-id"
                type="text"
                required
                value={distributorId}
                onChange={(e) => setDistributorId(e.target.value)}
                placeholder="e.g. distri-101"
                className="erp-input font-mono"
              />
            </div>

            <div className="erp-form-group">
              <label className="erp-label" htmlFor="add-distri-name">
                Distributor Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="add-distri-name"
                type="text"
                required
                value={distributorName}
                onChange={(e) => setDistributorName(e.target.value)}
                placeholder="e.g. Raju Dry Fruits, KL Brothers"
                className="erp-input"
              />
            </div>
          </div>

          {/* Row 2: Location / Address & Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="erp-form-group">
              <label className="erp-label flex items-center gap-1.5" htmlFor="add-distri-address">
                <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Location / City</span>
              </label>
              <input
                id="add-distri-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Hyderabad, Mumbai"
                className="erp-input"
              />
            </div>

            <div className="erp-form-group">
              <label className="erp-label flex items-center gap-1.5" htmlFor="add-distri-mobile">
                <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Contact / Mobile</span>
              </label>
              <input
                id="add-distri-mobile"
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
              <label className="erp-label flex items-center gap-1.5" htmlFor="add-distri-gstin">
                <Building2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>GSTIN (Optional)</span>
              </label>
              <input
                id="add-distri-gstin"
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
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Distributor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
