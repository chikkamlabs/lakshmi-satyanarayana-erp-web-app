'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FilterX,
  Receipt,
  RotateCcw,
  Loader2,
  ChevronLeft,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  History,
} from 'lucide-react';
import AssociateHeader from '../header/page';
import AssociateSidebar from '../sidebar/page';
import {
  fetchAssociatePointsTransactions,
  AssociatePointsSummary,
  AssociatePointsTransaction,
} from '@/lib/associatepointsStore';

export default function AssociatePointsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<AssociatePointsSummary>({
    current_points: 0,
    total_transactions: 0,
    total_add_count: 0,
    total_add_points: 0,
    total_subtract_count: 0,
    total_subtract_points: 0,
  });
  const [transactions, setTransactions] = useState<AssociatePointsTransaction[]>([]);

  // Filter state: Select date
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAssociatePointsTransactions(selectedDate);
        if (!isCancelled) {
          if (result.error) {
            setError(result.error);
          }
          setSummary(result.summary);
          setTransactions(result.transactions);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load points data:', err);
          setError(err?.message || 'Failed to load points data');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const result = await fetchAssociatePointsTransactions(selectedDate);
      if (result.error) {
        setError(result.error);
      }
      setSummary(result.summary);
      setTransactions(result.transactions);
    } catch (err: any) {
      console.error('Failed to refresh points data:', err);
      setError(err?.message || 'Failed to refresh points data');
    } finally {
      setRefreshing(false);
    }
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedDate(e.target.value);
  }

  function handleClearDateFilter() {
    setSelectedDate('');
  }

  function handleSetToday() {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }

  function formatDate(isoString: string): { date: string; time: string } {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return { date: isoString, time: '' };

      const date = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const time = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { date, time };
    } catch {
      return { date: isoString, time: '' };
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AssociateHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AssociateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 erp-fade-in">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Link
                  id="points-back-to-dashboard-link"
                  href="/associate/dashboard"
                  className="erp-btn erp-btn-outline erp-btn-sm p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Back to Dashboard"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 id="points-page-title" className="erp-page-title text-xl sm:text-2xl">
                    Points Ledger
                  </h1>
                  <p className="erp-small text-xs sm:text-sm text-[var(--text-secondary)]">
                    Track your current points balance, transaction history, and bill credits
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="points-refresh-btn"
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading || refreshing}
                  className="erp-btn erp-btn-secondary erp-btn-sm"
                  title="Refresh points history"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Error banner if any */}
            {error && (
              <div
                id="points-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)]/30 text-[var(--danger)] text-sm flex items-start gap-3"
              >
                <div className="font-medium">Error: {error}</div>
              </div>
            )}

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Total Current Points */}
              <div
                id="stat-current-points-card"
                className="erp-card p-5 border-l-4 border-l-[var(--warning)] bg-gradient-to-br from-[var(--surface)] to-[var(--warning-light)]/40 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Total Current Points
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      {loading ? (
                        <div className="h-8 w-24 erp-skeleton" />
                      ) : (
                        <span
                          id="stat-current-points-value"
                          className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight"
                        >
                          {summary.current_points.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[var(--warning)]">PTS</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/20 shadow-xs">
                    <Coins className="w-6 h-6 erp-coin-animated" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
                  <span>Available for reward redemptions</span>
                </div>
              </div>

              {/* 2. Total Transactions (Sum + Subtract rows) */}
              <div
                id="stat-total-transactions-card"
                className="erp-card p-5 border-l-4 border-l-[var(--primary)] bg-[var(--surface)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Total Transactions
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      {loading ? (
                        <div className="h-8 w-16 erp-skeleton" />
                      ) : (
                        <span
                          id="stat-total-transactions-value"
                          className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight"
                        >
                          {summary.total_transactions}
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-muted)]">rows</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 shadow-xs">
                    <History className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--success)] font-medium">
                    {summary.total_add_count} added (+)
                  </span>
                  <span className="text-[var(--text-muted)]">•</span>
                  <span className="text-[var(--danger)] font-medium">
                    {summary.total_subtract_count} subtracted (-)
                  </span>
                </div>
              </div>

              {/* 3. Total Points Added (Sum) */}
              <div
                id="stat-points-added-card"
                className="erp-card p-5 border-l-4 border-l-[var(--success)] bg-[var(--surface)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Points Added (+)
                    </span>
                    <div className="mt-2 flex items-baseline gap-1">
                      {loading ? (
                        <div className="h-8 w-20 erp-skeleton" />
                      ) : (
                        <span
                          id="stat-points-added-value"
                          className="text-3xl font-extrabold text-[var(--success)] tracking-tight"
                        >
                          +{summary.total_add_points.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[var(--success)]">PTS</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20 shadow-xs">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-[var(--text-secondary)]">
                  <span>{summary.total_add_count} addition {summary.total_add_count === 1 ? 'row' : 'rows'}</span>
                </div>
              </div>

              {/* 4. Total Points Subtracted */}
              <div
                id="stat-points-subtracted-card"
                className="erp-card p-5 border-l-4 border-l-[var(--danger)] bg-[var(--surface)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Points Subtracted (-)
                    </span>
                    <div className="mt-2 flex items-baseline gap-1">
                      {loading ? (
                        <div className="h-8 w-20 erp-skeleton" />
                      ) : (
                        <span
                          id="stat-points-subtracted-value"
                          className="text-3xl font-extrabold text-[var(--danger)] tracking-tight"
                        >
                          -{summary.total_subtract_points.toLocaleString()}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-[var(--danger)]">PTS</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20 shadow-xs">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-[var(--text-secondary)]">
                  <span>{summary.total_subtract_count} subtraction {summary.total_subtract_count === 1 ? 'row' : 'rows'}</span>
                </div>
              </div>

            </div>

            {/* Filter & Action Section: Select Date */}
            <div
              id="points-filter-container"
              className="erp-card p-4 sm:p-5 bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Calendar className="w-4 h-4 text-[var(--primary)]" />
                  <span>Filter by Date:</span>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <input
                    id="points-date-filter-input"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="erp-input py-1.5 px-3 text-sm rounded-lg max-w-[200px]"
                    aria-label="Select date filter"
                  />
                  {selectedDate && (
                    <button
                      id="points-clear-date-filter-btn"
                      type="button"
                      onClick={handleClearDateFilter}
                      className="erp-btn erp-btn-outline erp-btn-sm text-xs py-1.5 px-2.5 inline-flex items-center gap-1 text-[var(--danger)] hover:bg-[var(--danger-light)] border-[var(--danger)]/40"
                      title="Clear date filter"
                    >
                      <FilterX className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
                <button
                  id="points-filter-today-btn"
                  type="button"
                  onClick={handleSetToday}
                  className="erp-btn erp-btn-ghost erp-btn-sm text-xs py-1.5 px-2.5 text-[var(--primary)] hover:bg-[var(--primary-light)]"
                >
                  Today
                </button>
              </div>

              {/* Status information */}
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 self-end md:self-auto">
                {selectedDate ? (
                  <span className="erp-badge erp-badge-primary">
                    Filtered: {selectedDate} ({transactions.length} {transactions.length === 1 ? 'row' : 'rows'})
                  </span>
                ) : (
                  <span>Showing all {transactions.length} transactions</span>
                )}
              </div>
            </div>

            {/* List of Transactions Section */}
            <div id="points-transactions-container" className="erp-card overflow-hidden">
              <div className="erp-card-header bg-[var(--surface-subtle)]/50 py-3.5 px-4 sm:px-6 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[var(--warning)]" />
                  <h2 className="erp-card-title text-sm sm:text-base font-semibold">
                    Transaction History
                  </h2>
                </div>
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {transactions.length} {transactions.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="p-8 sm:p-12 text-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">Loading points transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                /* Empty State */
                <div id="points-empty-state" className="p-8 sm:p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto border border-[var(--border)]">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    No points transactions found
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                    {selectedDate
                      ? `No points activity recorded for the selected date (${selectedDate}). Try selecting a different date or clearing the filter.`
                      : 'You do not have any points additions or deductions recorded yet.'}
                  </p>
                  {selectedDate && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleClearDateFilter}
                        className="erp-btn erp-btn-secondary erp-btn-sm"
                      >
                        Clear Date Filter
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table id="points-transactions-table" className="erp-table">
                      <thead className="erp-thead">
                        <tr>
                          <th className="erp-th">Type / Calc</th>
                          <th className="erp-th">Points</th>
                          <th className="erp-th">Balance Points</th>
                          <th className="erp-th">Bill ID</th>
                          <th className="erp-th">Description / Note</th>
                          <th className="erp-th">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="erp-tbody">
                        {transactions.map((tx, idx) => {
                          const isAdd = tx.calc === 'add';
                          const { date, time } = formatDate(tx.created_at);

                          return (
                            <tr
                              key={tx.id || idx}
                              id={`points-row-${tx.id || idx}`}
                              className="hover:bg-[var(--surface-subtle)] transition-colors"
                            >
                              {/* Type with Color Badge */}
                              <td className="erp-td">
                                {isAdd ? (
                                  <span className="erp-badge erp-badge-success inline-flex items-center gap-1.5 font-semibold text-xs">
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    Sum (Add)
                                  </span>
                                ) : (
                                  <span className="erp-badge erp-badge-danger inline-flex items-center gap-1.5 font-semibold text-xs">
                                    <ArrowDownLeft className="w-3.5 h-3.5" />
                                    Subtract
                                  </span>
                                )}
                              </td>

                              {/* Points with Color */}
                              <td className="erp-td">
                                <div className="flex items-center gap-1.5 font-bold text-sm">
                                  <span
                                    className={
                                      isAdd
                                        ? 'text-[var(--success)]'
                                        : 'text-[var(--danger)]'
                                    }
                                  >
                                    {isAdd ? `+${tx.points}` : `-${tx.points}`}
                                  </span>
                                  <span className="text-xs font-normal text-[var(--text-muted)]">
                                    pts
                                  </span>
                                </div>
                              </td>

                              {/* Balance Points */}
                              <td className="erp-td">
                                <span className="font-semibold text-sm text-[var(--text-primary)]">
                                  {tx.balance_points.toLocaleString()} pts
                                </span>
                              </td>

                              {/* Bill ID */}
                              <td className="erp-td">
                                {tx.bill_number ? (
                                  <span className="erp-code font-mono text-xs text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded border border-[var(--primary)]/20">
                                    {tx.bill_number}
                                  </span>
                                ) : tx.bill_id ? (
                                  <span className="erp-code font-mono text-xs text-[var(--text-secondary)]">
                                    {tx.bill_id}
                                  </span>
                                ) : (
                                  <span className="text-xs text-[var(--text-muted)] italic">
                                    -
                                  </span>
                                )}
                              </td>

                              {/* Description */}
                              <td className="erp-td">
                                <span className="text-xs text-[var(--text-secondary)] max-w-xs block truncate" title={tx.description || ''}>
                                  {tx.description || (isAdd ? 'Points Credit' : 'Points Debit')}
                                </span>
                              </td>

                              {/* Created At */}
                              <td className="erp-td whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="text-xs font-medium text-[var(--text-primary)]">
                                    {date}
                                  </span>
                                  <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {time}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View */}
                  <div className="md:hidden divide-y divide-[var(--border)]">
                    {transactions.map((tx, idx) => {
                      const isAdd = tx.calc === 'add';
                      const { date, time } = formatDate(tx.created_at);

                      return (
                        <div
                          key={tx.id || idx}
                          id={`points-mobile-card-${tx.id || idx}`}
                          className="p-4 space-y-3 bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition-colors"
                        >
                          {/* Header of card: Type Badge + Points */}
                          <div className="flex items-center justify-between">
                            {isAdd ? (
                              <span className="erp-badge erp-badge-success inline-flex items-center gap-1 text-xs">
                                <ArrowUpRight className="w-3 h-3" />
                                Sum (Add)
                              </span>
                            ) : (
                              <span className="erp-badge erp-badge-danger inline-flex items-center gap-1 text-xs">
                                <ArrowDownLeft className="w-3 h-3" />
                                Subtract
                              </span>
                            )}

                            <span
                              className={`font-bold text-base ${
                                isAdd ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                              }`}
                            >
                              {isAdd ? `+${tx.points}` : `-${tx.points}`} pts
                            </span>
                          </div>

                          {/* Middle: Details */}
                          <div className="grid grid-cols-2 gap-2 text-xs bg-[var(--surface-subtle)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                            <div>
                              <span className="text-[var(--text-muted)] block">Balance</span>
                              <span className="font-semibold text-[var(--text-primary)]">
                                {tx.balance_points.toLocaleString()} pts
                              </span>
                            </div>
                            <div>
                              <span className="text-[var(--text-muted)] block">Bill ID</span>
                              <span className="font-medium text-[var(--text-primary)]">
                                {tx.bill_number || tx.bill_id || '-'}
                              </span>
                            </div>
                          </div>

                          {/* Footer: Description & Time */}
                          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] pt-1">
                            <span className="truncate max-w-[180px]">
                              {tx.description || (isAdd ? 'Points Credit' : 'Points Debit')}
                            </span>
                            <span className="text-[var(--text-muted)] shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {date}, {time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
