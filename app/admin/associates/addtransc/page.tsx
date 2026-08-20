'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Receipt,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Lock,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  fetchAllAssociatesForPoints,
  fetchAssociateDetail,
  fetchAvailableBills,
  createAssociatePointsTransaction,
  AssociateSimpleOption,
  BillOption,
  PointsCalculationType,
} from '@/lib/associatepointsStore';

function AddTransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const associateIdParam = searchParams.get('id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [associates, setAssociates] = useState<AssociateSimpleOption[]>([]);
  const [bills, setBills] = useState<BillOption[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>(associateIdParam);
  const [selectedAssociateObj, setSelectedAssociateObj] = useState<AssociateSimpleOption | null>(null);
  const [points, setPoints] = useState<number | ''>('');
  const [calc, setCalc] = useState<PointsCalculationType>('add');
  const [billId, setBillId] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Load associates and bills
  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingData(true);
      try {
        const [assocRes, billsRes, detailRes] = await Promise.all([
          fetchAllAssociatesForPoints(),
          fetchAvailableBills(),
          associateIdParam ? fetchAssociateDetail(associateIdParam) : Promise.resolve({ data: null, error: null }),
        ]);

        if (!active) return;

        if (assocRes.data) {
          setAssociates(assocRes.data);
        }

        if (detailRes.data) {
          setSelectedAssociateObj(detailRes.data);
          setSelectedAssociateId(detailRes.data.id);
        } else if (associateIdParam) {
          setSelectedAssociateId(associateIdParam);
        } else if (assocRes.data && assocRes.data.length > 0) {
          setSelectedAssociateId(assocRes.data[0].id);
          setSelectedAssociateObj(assocRes.data[0]);
        }

        if (billsRes.data) {
          setBills(billsRes.data);
        }
      } catch (err) {
        console.error('Error loading options for transaction:', err);
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadOptions();

    return () => {
      active = false;
    };
  }, [associateIdParam]);

  // Selected associate object from list or direct detail
  const currentAssociate =
    selectedAssociateObj ||
    associates.find((a) => a.id === selectedAssociateId || a.associate_id === selectedAssociateId) ||
    (associates.length > 0 && !associateIdParam ? associates[0] : null);

  const currentPoints = currentAssociate?.current_points ?? 0;

  // Auto calculated balance points preview (based on current_points & now points)
  const numericPoints = typeof points === 'number' ? points : 0;
  const calculatedBalance = calc === 'add'
    ? currentPoints + numericPoints
    : currentPoints - numericPoints;

  const isBalanceNegative = calc === 'subtract' && numericPoints > currentPoints;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const targetAssociateId = (
      selectedAssociateId ||
      associateIdParam ||
      currentAssociate?.id ||
      currentAssociate?.associate_id ||
      ''
    ).trim();

    if (!targetAssociateId) {
      setErrorMessage('Associate ID is missing. Please select an associate.');
      return;
    }

    if (typeof points !== 'number' || points <= 0) {
      setErrorMessage('Points must be a positive integer greater than 0.');
      return;
    }

    if (calc === 'subtract' && points > currentPoints) {
      setErrorMessage(`Cannot deduct ${points} points. The associate only has ${currentPoints} points available.`);
      return;
    }

    const finalBillId = billId.trim();

    setIsSubmitting(true);

    try {
      // Direct Supabase database insertion and balance calculation in store
      const result = await createAssociatePointsTransaction({
        associate_id: targetAssociateId,
        points: Math.floor(points),
        calc,
        bill_id: finalBillId || null,
        description: description.trim() || null,
      });

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage(`Successfully recorded ${calc === 'add' ? 'addition' : 'deduction'} of ${points} points! New balance in database: ${result.new_balance} pts.`);
        setTimeout(() => {
          router.push(`/admin/associates/updatepoints?id=${targetAssociateId}`);
        }, 1200);
      }
    } catch (err: any) {
      console.error('Failed to submit points transaction:', err);
      setErrorMessage(err?.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-addtransc-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Back Button & Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Link
                  id="addtransc-back-btn"
                  href={selectedAssociateId ? `/admin/associates/updatepoints?id=${selectedAssociateId}` : '/admin/associates/dashboard'}
                  className="erp-btn erp-btn-outline erp-btn-sm p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Back to Points Ledger"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)]">
                      <Coins className="w-4 h-4" />
                    </div>
                    <h1 id="addtransc-page-title" className="erp-page-title text-xl sm:text-2xl">
                      Add Points Transaction
                    </h1>
                  </div>
                  <p className="erp-small text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                    Record points sum (credit) or subtraction (debit) directly to the associate&apos;s ledger
                  </p>
                </div>
              </div>

              {currentAssociate && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
                  <span className="text-xs text-[var(--text-secondary)]">Current Points:</span>
                  <span className="font-bold text-sm text-[var(--warning-dark)]">{currentAssociate.current_points} pts</span>
                </div>
              )}
            </div>

            {/* Success Alert */}
            {successMessage && (
              <div
                id="addtransc-success-banner"
                className="p-4 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] flex items-start gap-3 erp-fade-in"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Success! </span>
                  {successMessage}
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div
                id="addtransc-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3 erp-fade-in"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Notice: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Form Card */}
            <div className="erp-card p-6 sm:p-8 bg-[var(--surface)] border border-[var(--border)] shadow-sm">
              {loadingData ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Loading associate & transaction data...</p>
                </div>
              ) : (
                <form id="addtransc-form" onSubmit={handleSubmit} className="space-y-6">

                  {/* Field 1: Associate (Locked if navigated with associate id) */}
                  <div className="erp-form-group">
                    <label className="erp-label flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[var(--primary)]" />
                        Associate {associateIdParam && <span className="text-xs text-[var(--text-muted)] font-normal flex items-center gap-1"><Lock className="w-3 h-3 text-[var(--text-muted)]" /> (Locked)</span>}
                      </span>
                      {currentAssociate && (
                        <span className="text-xs text-[var(--text-muted)] font-normal">
                          Current Balance: <strong className="text-[var(--text-primary)]">{currentPoints} pts</strong>
                        </span>
                      )}
                    </label>

                    {associateIdParam && currentAssociate ? (
                      /* Readonly Locked Card for Associate */
                      <div className="p-3.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-sm">
                            {currentAssociate.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {currentAssociate.name}
                              </span>
                              <span className="erp-code font-mono text-xs text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded">
                                {currentAssociate.associate_id}
                              </span>
                            </div>
                            <span className="text-xs text-[var(--text-secondary)]">
                              Current Points: <strong className="text-[var(--warning-dark)] font-bold">{currentPoints} pts</strong>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] bg-[var(--surface)] px-2.5 py-1 rounded-md border border-[var(--border-subtle)]">
                          <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Fixed</span>
                        </div>
                      </div>
                    ) : (
                      /* Associate Selector if no ID provided in URL */
                      <select
                        id="form-associate-id"
                        value={selectedAssociateId}
                        onChange={(e) => setSelectedAssociateId(e.target.value)}
                        required
                        className="erp-select text-sm py-2 px-3"
                      >
                        <option value="" disabled>Select Associate</option>
                        {associates.map((assoc) => (
                          <option key={assoc.id} value={assoc.id}>
                            {assoc.name} ({assoc.associate_id}) — Current: {assoc.current_points} pts
                          </option>
                        ))}
                      </select>
                    )}
                    <span className="erp-helper-text">
                      {associateIdParam ? 'Associate ID is bound from the points ledger.' : 'Select which associate this points transaction applies to.'}
                    </span>
                  </div>

                  {/* Field 2 & 3: Calc (sum/subtract) and Points */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Field: calc (points_calculation enum: 'add' | 'subtract') */}
                    <div className="erp-form-group">
                      <label className="erp-label flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-[var(--secondary)]" />
                        Calculation Type (calc) <span className="text-[var(--danger)]">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <button
                          id="form-calc-add-btn"
                          type="button"
                          onClick={() => setCalc('add')}
                          className={`p-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
                            calc === 'add'
                              ? 'bg-[var(--success-light)] border-[var(--success)] text-[var(--success)] shadow-xs ring-2 ring-[var(--success)]/20'
                              : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                          }`}
                        >
                          <ArrowUpRight className="w-4 h-4" />
                          <span>Sum / Add (+)</span>
                        </button>

                        <button
                          id="form-calc-subtract-btn"
                          type="button"
                          onClick={() => setCalc('subtract')}
                          className={`p-3 rounded-lg border flex items-center justify-center gap-2 text-sm font-semibold transition-all cursor-pointer ${
                            calc === 'subtract'
                              ? 'bg-[var(--danger-light)] border-[var(--danger)] text-[var(--danger)] shadow-xs ring-2 ring-[var(--danger)]/20'
                              : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                          }`}
                        >
                          <ArrowDownLeft className="w-4 h-4" />
                          <span>Subtract (-)</span>
                        </button>
                      </div>
                      <span className="erp-helper-text">
                        Choose whether to add (credit) or deduct (debit) points.
                      </span>
                    </div>

                    {/* Field: Now points (INTEGER > 0) */}
                    <div className="erp-form-group">
                      <label htmlFor="form-points" className="erp-label flex items-center gap-1.5">
                        <Hash className="w-4 h-4 text-[var(--primary)]" />
                        Now Points (points) <span className="text-[var(--danger)]">*</span>
                      </label>
                      <input
                        id="form-points"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g. 50"
                        value={points}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          setPoints(isNaN(val as number) ? '' : val);
                        }}
                        required
                        className="erp-input text-sm py-2 px-3"
                      />
                      <span className="erp-helper-text">
                        Enter points to {calc === 'add' ? 'add' : 'deduct'} (must be &gt; 0).
                      </span>
                    </div>

                  </div>

                  {/* Auto Calculated Balance Points (Readonly - Cannot be changed by user) */}
                  <div className="erp-form-group">
                    <label htmlFor="form-calculated-balance-points" className="erp-label flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-[var(--warning)]" />
                        Balance Points (Auto Calculated) <span className="text-xs text-[var(--text-muted)] font-normal flex items-center gap-1"><Lock className="w-3 h-3 text-[var(--text-muted)]" /> (Read-only)</span>
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        Formula: {currentPoints} {calc === 'add' ? '+' : '-'} {numericPoints} = <strong>{calculatedBalance}</strong>
                      </span>
                    </label>

                    <div className="relative">
                      <input
                        id="form-calculated-balance-points"
                        type="text"
                        readOnly
                        disabled
                        value={`${calculatedBalance} pts`}
                        className={`erp-input text-base font-bold font-mono py-2.5 px-3.5 bg-[var(--surface-subtle)] cursor-not-allowed ${
                          isBalanceNegative
                            ? 'text-[var(--danger)] border-[var(--danger)]'
                            : 'text-[var(--text-primary)] border-[var(--border)]'
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Auto</span>
                      </div>
                    </div>

                    {isBalanceNegative ? (
                      <span className="erp-error-text text-xs text-[var(--danger)] font-medium">
                        Insufficient points! Deduction cannot exceed current balance of {currentPoints} points.
                      </span>
                    ) : (
                      <span className="erp-helper-text">
                        Auto calculated from current points ({currentPoints}) and now points ({numericPoints}) based on {calc === 'add' ? 'sum (+)' : 'subtraction (-)'}.
                      </span>
                    )}
                  </div>

                  {/* Field 4: Associated Bill ID (bill_id UUID optional) */}
                  <div className="erp-form-group">
                    <label htmlFor="form-bill-id" className="erp-label flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[var(--text-muted)]" />
                      Associated Bill ID (bill_id) <span className="text-xs font-normal text-[var(--text-muted)]">(Optional)</span>
                    </label>
                    <select
                      id="form-bill-id"
                      value={billId}
                      onChange={(e) => setBillId(e.target.value)}
                      className="erp-select text-sm py-2 px-3"
                    >
                      <option value="">-- No Bill Associated (Manual adjustment) --</option>
                      {bills.map((b) => (
                        <option key={b.id} value={b.id}>
                          Bill #{b.bill_id} {b.total ? `(₹${b.total})` : ''}
                        </option>
                      ))}
                    </select>
                    <span className="erp-helper-text">
                      Select an existing sales bill from the list to link this points transaction, or leave blank.
                    </span>
                  </div>

                  {/* Field 5: Description (description TEXT optional) */}
                  <div className="erp-form-group">
                    <label htmlFor="form-description" className="erp-label flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                      Description / Note (description) <span className="text-xs font-normal text-[var(--text-muted)]">(Optional)</span>
                    </label>
                    <textarea
                      id="form-description"
                      rows={3}
                      placeholder="e.g. Incentive bonus for monthly sales milestone, reward adjustment, or billing credit"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="erp-textarea text-sm py-2 px-3 resize-none"
                    />
                    <span className="erp-helper-text">
                      Detailed memo describing the reason for this points adjustment.
                    </span>
                  </div>

                  {/* Submit Button & Actions */}
                  <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-3">
                    <Link
                      id="form-cancel-btn"
                      href={selectedAssociateId ? `/admin/associates/updatepoints?id=${selectedAssociateId}` : '/admin/associates/dashboard'}
                      className="erp-btn erp-btn-secondary erp-btn-md"
                    >
                      Cancel
                    </Link>

                    <button
                      id="form-submit-transaction-btn"
                      type="submit"
                      disabled={isSubmitting || isBalanceNegative || !selectedAssociateId || typeof points !== 'number' || points <= 0}
                      className="erp-btn erp-btn-primary erp-btn-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Transaction...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Record Transaction</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminAddTranscPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <AddTransactionContent />
    </Suspense>
  );
}
