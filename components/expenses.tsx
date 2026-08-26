'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Plus,
  Calendar,
  Search,
  RotateCw,
  Edit2,
  Trash2,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Banknote,
  Smartphone,
  CreditCard,
  ReceiptText,
} from 'lucide-react';
import {
  Expense,
  PaymentType,
  fetchExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  formatCurrency,
  formatDateTime,
  getTodayDateString,
} from '@/lib/paymentsStore';

interface ExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFromDate?: string;
  initialToDate?: string;
  onExpenseChanged?: () => void;
}

export default function ExpensesModal({
  isOpen,
  onClose,
  initialFromDate,
  initialToDate,
  onExpenseChanged,
}: ExpensesModalProps) {
  const today = getTodayDateString();
  const [fromDate, setFromDate] = useState<string>(initialFromDate || today);
  const [toDate, setToDate] = useState<string>(initialToDate || today);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState<string>('');
  const [formType, setFormType] = useState<PaymentType>('cash');
  const [formNotes, setFormNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch expenses when open or filters change
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchExpenses({
        fromDate,
        toDate,
        searchQuery,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setExpenses(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, searchQuery]);

  useEffect(() => {
    let active = true;
    if (isOpen) {
      async function init() {
        try {
          setLoading(true);
          setError(null);
          const res = await fetchExpenses({
            fromDate,
            toDate,
            searchQuery,
          });

          if (!active) return;
          if (res.error) {
            setError(res.error);
          } else {
            setExpenses(res.data);
          }
        } catch (err: any) {
          if (active) setError(err?.message || 'Failed to load expenses');
        } finally {
          if (active) setLoading(false);
        }
      }

      init();
    }
    return () => {
      active = false;
    };
  }, [isOpen, fromDate, toDate, searchQuery]);

  // Quick Flash Alert helper
  const flashSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingExpenseId(null);
    setFormAmount('');
    setFormType('cash');
    setFormNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setFormAmount(exp.amount.toString());
    setFormType(exp.type);
    setFormNotes(exp.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpenseId(null);
    setFormAmount('');
    setFormNotes('');
    setFormError(null);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(formAmount);
    if (isNaN(numAmt) || numAmt <= 0) {
      setFormError('Please enter a valid expense amount greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingExpenseId) {
        // Update existing expense
        const res = await updateExpense(editingExpenseId, {
          amount: numAmt,
          type: formType,
          notes: formNotes,
        });

        if (res.error) {
          setFormError(res.error);
          return;
        }

        flashSuccess('Expense updated successfully.');
      } else {
        // Add new expense
        const res = await addExpense({
          amount: numAmt,
          type: formType,
          notes: formNotes,
        });

        if (res.error) {
          setFormError(res.error);
          return;
        }

        flashSuccess('Expense recorded successfully.');
      }

      handleCloseForm();
      await loadExpenses();
      if (onExpenseChanged) onExpenseChanged();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;

    try {
      setLoading(true);
      const res = await deleteExpense(id);
      if (res.error) {
        setError(res.error);
      } else {
        flashSuccess('Expense deleted.');
        await loadExpenses();
        if (onExpenseChanged) onExpenseChanged();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToday = () => {
    const t = getTodayDateString();
    setFromDate(t);
    setToDate(t);
    setSearchQuery('');
  };

  // Calculations
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalCashExpenses = expenses.filter((e) => e.type === 'cash').reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalUpiExpenses = expenses.filter((e) => e.type === 'upi').reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalCreditExpenses = expenses.filter((e) => e.type === 'credit').reduce((sum, e) => sum + Number(e.amount || 0), 0);

  if (!isOpen) return null;

  return (
    <div
      id="expenses-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity overflow-y-auto"
    >
      <div
        id="expenses-modal-container"
        className="relative w-full max-w-4xl bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
              <TrendingDown className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Daily Expenses Management
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Track and log store expenditures, supply costs, and operational outflows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="expenses-refresh-btn"
              onClick={loadExpenses}
              disabled={loading}
              title="Refresh Expenses"
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              id="expenses-close-btn"
              onClick={onClose}
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-rose-50 hover:text-rose-600 text-[var(--text-secondary)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Summary Metric Strip */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Total Selected Range Expenses */}
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/70 flex flex-col justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-rose-700 uppercase">
                Total Expenses
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-xl font-bold text-rose-800">
                  {formatCurrency(totalAmount)}
                </span>
                <span className="text-xs text-rose-600 font-medium">
                  {expenses.length} record{expenses.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Cash Outflow */}
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-emerald-700 uppercase">
                  Cash Paid
                </span>
                <Banknote className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-base font-bold text-emerald-800 mt-1">
                {formatCurrency(totalCashExpenses)}
              </span>
            </div>

            {/* UPI Outflow */}
            <div className="p-3.5 rounded-lg border border-sky-200 bg-sky-50/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-sky-700 uppercase">
                  UPI Online
                </span>
                <Smartphone className="w-3.5 h-3.5 text-sky-600" />
              </div>
              <span className="text-base font-bold text-sky-800 mt-1">
                {formatCurrency(totalUpiExpenses)}
              </span>
            </div>

            {/* Credit Outflow */}
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/60 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider text-amber-700 uppercase">
                  Credit / Due
                </span>
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="text-base font-bold text-amber-800 mt-1">
                {formatCurrency(totalCreditExpenses)}
              </span>
            </div>
          </div>
        </div>

        {/* Date Filter & Action Toolbar */}
        <div className="p-5 pb-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--surface)] p-3 rounded-lg border border-[var(--border)]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[var(--background)] px-2.5 py-1.5 rounded-md border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="font-medium">From:</span>
                <input
                  type="date"
                  id="expenses-from-date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--background)] px-2.5 py-1.5 rounded-md border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span className="font-medium">To:</span>
                <input
                  type="date"
                  id="expenses-to-date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-transparent border-0 text-xs font-semibold text-[var(--text-primary)] focus:outline-hidden cursor-pointer"
                />
              </div>

              <button
                type="button"
                id="expenses-reset-today-btn"
                onClick={handleResetToday}
                className="px-2.5 py-1.5 rounded-md border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="expenses-search-input"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-md border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary)]"
                />
              </div>

              <button
                type="button"
                id="expenses-add-new-btn"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inline Add / Edit Form Drawer */}
        {isFormOpen && (
          <div className="mx-5 mb-4 p-4 rounded-xl border border-rose-200 bg-rose-50/40 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {editingExpenseId ? 'Edit Expense Record' : 'Record New Expense'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-2.5 rounded-md bg-rose-100/80 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="expense-form-amount"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 100.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-semibold"
                    autoFocus
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="expense-form-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as PaymentType)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 capitalize"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / Online</option>
                    <option value="credit">Credit / Due</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Notes / Description
                  </label>
                  <input
                    type="text"
                    id="expense-form-notes"
                    placeholder="e.g. Tea, cleaning, packaging supplies"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  id="expense-form-cancel-btn"
                  onClick={handleCloseForm}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="expense-form-submit-btn"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  ) : editingExpenseId ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{editingExpenseId ? 'Update Expense' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Expenses List / Table */}
        <div className="flex-1 px-5 pb-5 overflow-y-auto min-h-[260px]">
          {loading && expenses.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-2">
              <RotateCw className="w-6 h-6 animate-spin text-[var(--primary)]" />
              <p className="text-sm">Loading expense records...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-12 px-4 rounded-xl border border-dashed border-[var(--border)] text-center flex flex-col items-center justify-center">
              <TrendingDown className="w-10 h-10 text-[var(--text-muted)] mb-2 stroke-[1.5]" />
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                No expenses found
              </h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mt-1">
                There are no expense records logged for the selected dates {fromDate} to {toDate}.
              </p>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Expense</span>
              </button>
            </div>
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    <th className="py-2.5 px-3.5">Date & Time</th>
                    <th className="py-2.5 px-3.5">Amount (₹)</th>
                    <th className="py-2.5 px-3.5">Payment Type</th>
                    <th className="py-2.5 px-3.5">Notes</th>
                    <th className="py-2.5 px-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs text-[var(--text-primary)]">
                  {expenses.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap text-[var(--text-secondary)]">
                        {formatDateTime(item.created_at)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-bold text-rose-600">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            item.type === 'cash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.type === 'upi'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.type === 'cash' && <Banknote className="w-3 h-3" />}
                          {item.type === 'upi' && <Smartphone className="w-3 h-3" />}
                          {item.type === 'credit' && <CreditCard className="w-3 h-3" />}
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-[var(--text-secondary)] max-w-xs truncate">
                        {item.notes || <span className="text-[var(--text-muted)] italic">No notes</span>}
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap space-x-1">
                        <button
                          type="button"
                          id={`edit-expense-${item.id}`}
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`delete-expense-${item.id}`}
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-md hover:bg-rose-50 text-[var(--text-secondary)] hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>
            Total: <strong className="text-[var(--text-primary)]">{expenses.length}</strong> items in selected range
          </span>
          <button
            type="button"
            id="expenses-done-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
