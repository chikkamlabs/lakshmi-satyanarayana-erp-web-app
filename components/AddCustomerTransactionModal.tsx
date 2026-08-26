'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpDown,
  PlusCircle,
  MinusCircle,
  AlertCircle,
  CheckCircle2,
  Receipt,
  User,
  Phone,
} from 'lucide-react';
import {
  Customer,
  createCustomerTransaction,
  CustomerTransactionCalc,
} from '@/lib/customersStore';

interface AddCustomerTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess?: (updatedCustomer?: Customer) => void;
}

export default function AddCustomerTransactionModal({
  isOpen,
  onClose,
  customer,
  onSuccess,
}: AddCustomerTransactionModalProps) {
  const [calculation, setCalculation] = useState<CustomerTransactionCalc>('sum');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClose = () => {
    setCalculation('sum');
    setAmount('');
    setNotes('');
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  if (!isOpen || !customer) return null;

  const currentCredit = Number(customer.credit) || 0;
  const numAmount = parseFloat(amount) || 0;
  const projectedCredit = calculation === 'sum'
    ? currentCredit + numAmount
    : currentCredit - numAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    if (!amount || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await createCustomerTransaction({
        customer_id: customer.id,
        calculation,
        amount: numAmount,
        notes: notes.trim() || undefined,
      });

      if (res.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(
          calculation === 'sum'
            ? `Successfully added ₹${numAmount.toFixed(2)} to credit balance.`
            : `Successfully settled ₹${numAmount.toFixed(2)} from credit balance.`
        );
        setTimeout(() => {
          onSuccess?.({
            ...customer,
            credit: res.newCredit,
          });
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error('Error adding transaction:', err);
      setErrorMessage(err?.message || 'Failed to record transaction.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      id="add-customer-transaction-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs erp-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleClose();
        }
      }}
    >
      <div
        id="add-customer-transaction-dialog"
        className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden erp-slide-up"
      >
        {/* Modal Header */}
        <div className="erp-card-header bg-[var(--surface-subtle)] border-b border-[var(--border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-transaction-title" className="erp-card-title text-base">
                Record Customer Transaction
              </h2>
              <p className="erp-small text-[var(--text-secondary)]">
                Adjust customer credit ledger balance
              </p>
            </div>
          </div>
          <button
            id="modal-transaction-close-btn"
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Context Card */}
        <div className="p-5 bg-[var(--surface)] border-b border-[var(--border-subtle)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="font-semibold text-sm text-[var(--text-primary)]">
                {customer.name}
              </span>
              <span className="erp-badge erp-badge-secondary text-[11px]">
                <Phone className="w-3 h-3 inline mr-1" />
                {customer.mobile}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-[var(--text-muted)] block">Current Credit</span>
              <span className="font-bold text-sm text-[var(--text-primary)]">
                ₹{currentCredit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Alerts */}
          {errorMessage && (
            <div
              id="modal-transaction-error"
              className="p-3 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] text-xs flex items-start gap-2 erp-fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              id="modal-transaction-success"
              className="p-3 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] text-xs flex items-start gap-2 erp-fade-in"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Calculation Type Toggle Buttons */}
          <div>
            <label className="erp-label">
              Calculation Type <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button
                type="button"
                id="calc-type-sum-btn"
                onClick={() => setCalculation('sum')}
                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  calculation === 'sum'
                    ? 'bg-[var(--warning-light)] border-[var(--warning)] text-[var(--warning)] shadow-xs'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Sum (+ Add Credit)</span>
              </button>

              <button
                type="button"
                id="calc-type-subtract-btn"
                onClick={() => setCalculation('subtract')}
                className={`p-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  calculation === 'subtract'
                    ? 'bg-[var(--success-light)] border-[var(--success)] text-[var(--success)] shadow-xs'
                    : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <MinusCircle className="w-4 h-4" />
                <span>Subtract (- Settle)</span>
              </button>
            </div>
            <p className="erp-helper-text">
              {calculation === 'sum'
                ? 'Increases outstanding credit balance (e.g. credit sale or loan).'
                : 'Decreases outstanding credit balance (e.g. customer cash payment or settlement).'}
            </p>
          </div>

          {/* Amount Input */}
          <div className="erp-form-group mb-0">
            <label htmlFor="transaction-amount-input" className="erp-label">
              Amount (₹) <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--text-secondary)]">
                ₹
              </span>
              <input
                id="transaction-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="erp-input pl-8 text-base font-semibold"
                autoFocus
              />
            </div>
            {numAmount > 0 && (
              <div className="flex items-center justify-between text-xs mt-1.5 px-1 text-[var(--text-secondary)]">
                <span>Updated Projected Balance:</span>
                <span className={`font-bold ${projectedCredit > 0 ? 'text-[var(--warning)]' : 'text-[var(--success)]'}`}>
                  ₹{projectedCredit.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Notes / Remarks */}
          <div className="erp-form-group mb-0">
            <label htmlFor="transaction-notes-input" className="erp-label">
              Notes / Remarks <span className="text-xs text-[var(--text-muted)] font-normal">(Optional)</span>
            </label>
            <textarea
              id="transaction-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Cash payment received, credit purchase on bill..."
              className="erp-textarea text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
            <button
              id="modal-transaction-cancel-btn"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="erp-btn erp-btn-outline erp-btn-sm"
            >
              Cancel
            </button>
            <button
              id="modal-transaction-submit-btn"
              type="submit"
              disabled={loading || !amount || numAmount <= 0}
              className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
            >
              <ArrowUpDown className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Saving...' : 'Save Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
