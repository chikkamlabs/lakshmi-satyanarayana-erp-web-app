'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FilterX,
  PlusCircle,
  RotateCcw,
  Loader2,
  ChevronLeft,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  History,
  Receipt,
  User,
  Filter,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  fetchAssociatePointsTransactionsAdmin,
  fetchAssociateDetail,
  fetchAllAssociatesForPoints,
  AssociatePointsSummary,
  AssociatePointsTransaction,
  AssociateSimpleOption,
} from '@/lib/associatepointsStore';

function UpdatePointsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const associateIdParam = searchParams.get('id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>(associateIdParam);
  const [associateInfo, setAssociateInfo] = useState<AssociateSimpleOption | null>(null);
  const [allAssociates, setAllAssociates] = useState<AssociateSimpleOption[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter States: Select Date, Calc (all | add | subtract)
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCalc, setSelectedCalc] = useState<'all' | 'add' | 'subtract'>('all');

  // Points Data
  const [summary, setSummary] = useState<AssociatePointsSummary>({
    current_points: 0,
    total_transactions: 0,
    total_add_count: 0,
    total_add_points: 0,
    total_subtract_count: 0,
    total_subtract_points: 0,
  });
  const [transactions, setTransactions] = useState<AssociatePointsTransaction[]>([]);

  // Load list of associates for dropdown switcher
  useEffect(() => {
    let active = true;
    async function loadAssociatesList() {
      try {
        const res = await fetchAllAssociatesForPoints();
        if (active && res.data) {
          setAllAssociates(res.data);
          if (!selectedAssociateId && !associateIdParam && res.data.length > 0) {
            setSelectedAssociateId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching associates list:', err);
      }
    }
    loadAssociatesList();
    return () => {
      active = false;
    };
  }, [associateIdParam, selectedAssociateId]);

  // Load Points Data & Associate Info
  useEffect(() => {
    const currentId = associateIdParam || selectedAssociateId;
    if (!currentId) {
      return;
    }

    let isCancelled = false;

    async function loadPointsData() {
      setLoading(true);
      setError(null);

      try {
        const [assocRes, pointsRes] = await Promise.all([
          fetchAssociateDetail(currentId),
          fetchAssociatePointsTransactionsAdmin(currentId, selectedDate, selectedCalc),
        ]);

        if (!isCancelled) {
          if (assocRes.data) {
            setAssociateInfo(assocRes.data);
          }
          if (pointsRes.error) {
            setError(pointsRes.error);
          }
          setSummary(pointsRes.summary);
          setTransactions(pointsRes.transactions);
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

    loadPointsData();

    return () => {
      isCancelled = true;
    };
  }, [associateIdParam, selectedAssociateId, selectedDate, selectedCalc]);

  async function handleRefresh() {
    if (!selectedAssociateId) return;
    setRefreshing(true);
    setError(null);
    try {
      const [assocRes, pointsRes] = await Promise.all([
        fetchAssociateDetail(selectedAssociateId),
        fetchAssociatePointsTransactionsAdmin(selectedAssociateId, selectedDate, selectedCalc),
      ]);
      if (assocRes.data) {
        setAssociateInfo(assocRes.data);
      }
      if (pointsRes.error) {
        setError(pointsRes.error);
      }
      setSummary(pointsRes.summary);
      setTransactions(pointsRes.transactions);
    } catch (err: any) {
      console.error('Failed to refresh points data:', err);
      setError(err?.message || 'Failed to refresh points data');
    } finally {
      setRefreshing(false);
    }
  }

  function handleAssociateChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value;
    setSelectedAssociateId(newId);
    router.replace(`/admin/associates/updatepoints?id=${newId}`);
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
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-update-points-main" className="flex-1 flex flex-col min-w-0 p-4 sm:p-6 lg:p-8 erp-fade-in">
          <div className="w-full max-w-7xl mx-auto space-y-6">

            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Link
                  id="points-back-to-associates-btn"
                  href="/admin/associates/dashboard"
                  className="erp-btn erp-btn-outline erp-btn-sm p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  title="Back to Associates Directory"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[var(--warning-light)] text-[var(--warning)]">
                      <Coins className="w-4 h-4 erp-coin-animated" />
                    </div>
                    <h1 id="admin-update-points-title" className="erp-page-title text-xl sm:text-2xl">
                      Associate Points Management
                    </h1>
                  </div>
                  <p className="erp-small text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                    View transaction ledgers, inspect sum and subtract records, and add points adjustments
                  </p>
                </div>
              </div>

              {/* Action Buttons: Add Transaction & Refresh */}
              <div className="flex items-center gap-3">
                <button
                  id="admin-points-refresh-btn"
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading || refreshing || !selectedAssociateId}
                  className="erp-btn erp-btn-secondary erp-btn-sm"
                  title="Refresh points history"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <Link
                  id="admin-add-transaction-btn"
                  href={selectedAssociateId ? `/admin/associates/addtransc?id=${selectedAssociateId}` : '/admin/associates/addtransc'}
                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Transaction</span>
                </Link>
              </div>
            </div>

            {/* Associate Switcher & Active Associate Context */}
            <div
              id="admin-associate-context-card"
              className="erp-card p-4 sm:p-5 bg-[var(--surface)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {associateInfo?.name || summary.associate_name || 'Select Associate'}
                    </span>
                    {(associateInfo?.associate_id || summary.associate_id) && (
                      <span className="erp-code font-mono text-xs text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded">
                        {associateInfo?.associate_id || summary.associate_id}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Current Balance: <strong className="text-[var(--warning-dark)] font-bold">{summary.current_points.toLocaleString()} pts</strong>
                  </span>
                </div>
              </div>

              {/* Associate Selector Dropdown */}
              {allAssociates.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="associate-selector" className="text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                    Switch Associate:
                  </label>
                  <select
                    id="associate-selector"
                    value={selectedAssociateId}
                    onChange={handleAssociateChange}
                    className="erp-select text-xs sm:text-sm py-1.5 px-3 min-w-[200px]"
                  >
                    {allAssociates.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.associate_id || 'No ID'}) - {item.current_points} pts
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Error banner if any */}
            {error && (
              <div
                id="admin-points-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)]/30 text-[var(--danger)] text-sm flex items-start gap-3"
              >
                <div className="font-medium">Notice: {error}</div>
              </div>
            )}

            {/* Summary Stat Cards: Total Transactions, Sum & Subtract total rows */}
            <div id="admin-points-stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Total Current Points */}
              <div
                id="admin-stat-current-points-card"
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
                          id="admin-stat-current-points-val"
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
                  <span>Current active balance</span>
                </div>
              </div>

              {/* 2. Total Transactions (Sum + Subtract rows) */}
              <div
                id="admin-stat-total-transactions-card"
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
                          id="admin-stat-total-transactions-val"
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

              {/* 3. Sum (Add) Total Rows & Points */}
              <div
                id="admin-stat-points-added-card"
                className="erp-card p-5 border-l-4 border-l-[var(--success)] bg-[var(--surface)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Sum Total Rows (Add)
                    </span>
                    <div className="mt-2 flex items-baseline gap-1">
                      {loading ? (
                        <div className="h-8 w-20 erp-skeleton" />
                      ) : (
                        <span
                          id="admin-stat-points-added-val"
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
                <div className="mt-3 text-xs text-[var(--text-secondary)] font-medium">
                  <span>{summary.total_add_count} addition {summary.total_add_count === 1 ? 'row' : 'rows'}</span>
                </div>
              </div>

              {/* 4. Subtract Total Rows & Points */}
              <div
                id="admin-stat-points-subtracted-card"
                className="erp-card p-5 border-l-4 border-l-[var(--danger)] bg-[var(--surface)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Subtract Total Rows
                    </span>
                    <div className="mt-2 flex items-baseline gap-1">
                      {loading ? (
                        <div className="h-8 w-20 erp-skeleton" />
                      ) : (
                        <span
                          id="admin-stat-points-subtracted-val"
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
                <div className="mt-3 text-xs text-[var(--text-secondary)] font-medium">
                  <span>{summary.total_subtract_count} subtraction {summary.total_subtract_count === 1 ? 'row' : 'rows'}</span>
                </div>
              </div>

            </div>

            {/* Filters Section: Select Date & Calc (sum/subtract) */}
            <div
              id="admin-points-filters-card"
              className="erp-card p-4 sm:p-5 bg-[var(--surface)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                
                {/* Date Filter */}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Date:</span>
                  <input
                    id="admin-points-date-filter"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="erp-input py-1 px-2.5 text-xs sm:text-sm rounded-lg max-w-[170px]"
                    aria-label="Filter by date"
                  />
                  {selectedDate && (
                    <button
                      id="admin-clear-date-filter-btn"
                      type="button"
                      onClick={handleClearDateFilter}
                      className="erp-btn erp-btn-outline erp-btn-sm text-xs py-1 px-2 text-[var(--danger)] hover:bg-[var(--danger-light)] border-[var(--danger)]/30"
                      title="Clear date filter"
                    >
                      <FilterX className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    id="admin-date-today-btn"
                    type="button"
                    onClick={handleSetToday}
                    className="erp-btn erp-btn-ghost erp-btn-sm text-xs py-1 px-2 text-[var(--primary)]"
                  >
                    Today
                  </button>
                </div>

                {/* Calc Filter (Sum / Subtract / All) */}
                <div className="flex items-center gap-2 border-l border-[var(--border)] pl-4">
                  <Filter className="w-4 h-4 text-[var(--secondary)]" />
                  <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">Calc:</span>
                  <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 bg-[var(--surface-subtle)]">
                    <button
                      id="filter-calc-all-btn"
                      type="button"
                      onClick={() => setSelectedCalc('all')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                        selectedCalc === 'all'
                          ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      All
                    </button>
                    <button
                      id="filter-calc-add-btn"
                      type="button"
                      onClick={() => setSelectedCalc('add')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all inline-flex items-center gap-1 ${
                        selectedCalc === 'add'
                          ? 'bg-[var(--success-light)] text-[var(--success)] shadow-xs font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                      Sum (Add)
                    </button>
                    <button
                      id="filter-calc-subtract-btn"
                      type="button"
                      onClick={() => setSelectedCalc('subtract')}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all inline-flex items-center gap-1 ${
                        selectedCalc === 'subtract'
                          ? 'bg-[var(--danger-light)] text-[var(--danger)] shadow-xs font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <ArrowDownLeft className="w-3 h-3" />
                      Subtract
                    </button>
                  </div>
                </div>

              </div>

              {/* Status Info Badge */}
              <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2 self-end md:self-auto">
                <span className="erp-badge erp-badge-secondary">
                  Showing {transactions.length} {transactions.length === 1 ? 'row' : 'rows'}
                </span>
              </div>
            </div>

            {/* Display all transactions one by one */}
            <div id="admin-points-transactions-card" className="erp-card overflow-hidden">
              <div className="erp-card-header bg-[var(--surface-subtle)]/50 py-3.5 px-4 sm:px-6 flex items-center justify-between border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-[var(--warning)]" />
                  <h2 className="erp-card-title text-sm sm:text-base font-semibold">
                    Points Transactions Ledger
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
                <div id="admin-points-empty-state" className="p-8 sm:p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto border border-[var(--border)]">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    No points transactions found
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                    {selectedDate || selectedCalc !== 'all'
                      ? 'No transactions matched your active filters. Try resetting the filters or add a new transaction.'
                      : 'No points addition or deduction records found for this associate.'}
                  </p>
                  <div className="pt-2 flex items-center justify-center gap-3">
                    {(selectedDate || selectedCalc !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDate('');
                          setSelectedCalc('all');
                        }}
                        className="erp-btn erp-btn-secondary erp-btn-sm"
                      >
                        Clear Filters
                      </button>
                    )}
                    <Link
                      href={selectedAssociateId ? `/admin/associates/addtransc?id=${selectedAssociateId}` : '/admin/associates/addtransc'}
                      className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Transaction</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table id="admin-points-transactions-table" className="erp-table">
                      <thead className="erp-thead">
                        <tr>
                          <th className="erp-th">Calc (Type)</th>
                          <th className="erp-th">Points</th>
                          <th className="erp-th">Balance Points</th>
                          <th className="erp-th">Bill ID</th>
                          <th className="erp-th">Description / Note</th>
                          <th className="erp-th">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="erp-tbody">
                        {transactions.map((tx, idx) => {
                          const isAdd = tx.calc === 'add';
                          const { date, time } = formatDate(tx.created_at);

                          return (
                            <tr
                              key={tx.id || idx}
                              id={`admin-points-row-${tx.id || idx}`}
                              className="hover:bg-[var(--surface-subtle)] transition-colors"
                            >
                              {/* Calc Type */}
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

                              {/* Points */}
                              <td className="erp-td">
                                <div className="flex items-center gap-1 font-bold text-sm">
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
                                <span className="font-bold text-sm text-[var(--text-primary)]">
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
                          id={`admin-points-mobile-card-${tx.id || idx}`}
                          className="p-4 space-y-3 bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition-colors"
                        >
                          {/* Card Top: Calc badge & points */}
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

                          {/* Balance & Bill */}
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

                          {/* Description & Created at */}
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

export default function AdminUpdatePointsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <UpdatePointsContent />
    </Suspense>
  );
}
