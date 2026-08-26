'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Receipt,
  PlusCircle,
  RefreshCw,
  Search,
  Calendar,
  User,
  FolderOpen,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingBag,
  Boxes,
  Loader2,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  fetchBillsDashboard,
  BillRecord,
  BillDashboardStats,
  BillFilters,
} from '@/lib/openbillStore';

// Helper to format date to YYYY-MM-DD
function getFormattedDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminBillingDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Default dates: Today
  const todayStr = useMemo(() => getFormattedDate(new Date()), []);
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activePreset, setActivePreset] = useState<string>('today');

  // Data & Stats
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [stats, setStats] = useState<BillDashboardStats>({
    totalBills: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Bills data
  const loadData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setErrorMessage(null);

      try {
        const filters: BillFilters = {
          searchQuery,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          status: statusFilter,
        };

        const res = await fetchBillsDashboard(filters);

        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setBills(res.data);
          setStats(res.stats);
        }
      } catch (err: any) {
        console.error('Error loading billing dashboard data:', err);
        setErrorMessage('Failed to load bills data.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, fromDate, toDate, statusFilter]
  );

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const filters: BillFilters = {
          searchQuery,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          status: statusFilter,
        };

        const res = await fetchBillsDashboard(filters);
        if (!mounted) return;

        if (res.error) {
          setErrorMessage(res.error);
        } else {
          setBills(res.data);
          setStats(res.stats);
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage('Failed to load bills data.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [searchQuery, fromDate, toDate, statusFilter]);

  // Quick Preset Handlers
  const handleApplyPreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === 'today') {
      const dStr = getFormattedDate(now);
      setFromDate(dStr);
      setToDate(dStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const dStr = getFormattedDate(yest);
      setFromDate(dStr);
      setToDate(dStr);
    } else if (preset === 'week') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      setFromDate(getFormattedDate(startOfWeek));
      setToDate(getFormattedDate(now));
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(getFormattedDate(startOfMonth));
      setToDate(getFormattedDate(now));
    } else if (preset === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFromDate(todayStr);
    setToDate(todayStr);
    setStatusFilter('all');
    setActivePreset('today');
  };

  const formatCurrency = (val: number) => {
    return `₹${Number(val || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-bills-dashboard-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Breadcrumb & Header Section */}
            <div id="billing-dashboard-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1 font-medium">
                  <Link href="/admin/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
                    Home
                  </Link>
                  <span>/</span>
                  <span className="text-[var(--text-secondary)]">Bills</span>
                </div>

                {/* Title & Badge */}
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
                    Billing Dashboard
                  </h1>
                  <span
                    id="total-bills-pill-badge"
                    className="erp-badge font-medium text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]"
                  >
                    Total Bills: {stats.totalBills}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Refresh & Create Bill */}
              <div className="flex items-center gap-2.5">
                <button
                  id="billing-refresh-btn"
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={refreshing || loading}
                  className="erp-btn erp-btn-secondary flex items-center gap-1.5 text-xs sm:text-sm font-medium py-2 px-3.5 border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[var(--primary)]' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  id="billing-create-bill-btn"
                  type="button"
                  onClick={() => router.push('/admin/createbill')}
                  className="erp-btn erp-btn-primary flex items-center gap-2 text-xs sm:text-sm font-semibold py-2 px-4 shadow-xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Bill</span>
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div
                id="billing-error-banner"
                className="p-3.5 rounded-xl bg-[var(--danger-light)] border border-[var(--danger)] text-xs text-[var(--danger)] flex items-center justify-between"
              >
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Summary Stat Cards Grid (3 Cards as shown in reference) */}
            <div id="billing-stats-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              
              {/* Card 1: Total Bills */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    Total Bills
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mt-1">
                    {stats.totalBills}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Total Revenue */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    Total Revenue
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mt-1 font-mono">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Total Items Sold (Qty) */}
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    Total Items Sold (Qty)
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight mt-1 font-mono">
                    {Number(stats.totalItemsSold || 0).toFixed(2)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                  <Boxes className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* Filter Controls Card */}
            <div id="billing-filter-panel" className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
              
              {/* Row 1: Search, From Date, To Date, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
                
                {/* Search by Bill ID */}
                <div className="lg:col-span-4">
                  <label htmlFor="search-bill-id-input" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Search by Bill ID
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      id="search-bill-id-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="bill-260822-1 or 1001..."
                      className="erp-input pl-9 text-xs sm:text-sm w-full font-mono"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* From Date */}
                <div className="lg:col-span-3">
                  <label htmlFor="filter-from-date-input" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>From Date</span>
                  </label>
                  <input
                    id="filter-from-date-input"
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setActivePreset('');
                    }}
                    className="erp-input text-xs sm:text-sm w-full font-mono"
                  />
                </div>

                {/* To Date */}
                <div className="lg:col-span-3">
                  <label htmlFor="filter-to-date-input" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>To Date</span>
                  </label>
                  <input
                    id="filter-to-date-input"
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setActivePreset('');
                    }}
                    className="erp-input text-xs sm:text-sm w-full font-mono"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="lg:col-span-2">
                  <label htmlFor="filter-status-select" className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                    Status
                  </label>
                  <select
                    id="filter-status-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="erp-select text-xs sm:text-sm w-full"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Completed</option>
                    <option value="pending">Draft</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

              </div>

              {/* Row 2: Quick Presets & Reset Filters */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[var(--text-secondary)] mr-1">
                    Quick Presets:
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('today')}
                    className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      activePreset === 'today'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    Today
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('yesterday')}
                    className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      activePreset === 'yesterday'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    Yesterday
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('week')}
                    className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      activePreset === 'week'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    This Week
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('month')}
                    className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      activePreset === 'month'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    This Month
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('all')}
                    className={`px-3 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
                      activePreset === 'all'
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                    }`}
                  >
                    All Time
                  </button>
                </div>

                {/* Reset Filters button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline cursor-pointer ml-auto"
                >
                  Reset Filters
                </button>
              </div>

            </div>

            {/* Bills Record List Card */}
            <div id="billing-records-card" className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs overflow-hidden">
              
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)]">
                <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-sm sm:text-base">
                  <Receipt className="w-4 h-4 text-[var(--primary)]" />
                  <span>Bills Record List</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] font-medium">
                  Showing {bills.length} of {stats.totalBills} records
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto min-h-[300px]">
                <table className="erp-table w-full text-left text-xs">
                  <thead className="erp-thead bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                    <tr>
                      <th className="erp-th py-3.5 px-4 w-14 text-center font-semibold">S.NO</th>
                      <th className="erp-th py-3.5 px-4 font-semibold">BILL ID</th>
                      <th className="erp-th py-3.5 px-4 font-semibold">CUSTOMER NAME &amp; MOBILE</th>
                      <th className="erp-th py-3.5 px-4 text-center font-semibold">TOTAL PRODUCTS &amp; QUANTITY</th>
                      <th className="erp-th py-3.5 px-4 text-right font-semibold">TOTAL PRICE</th>
                      <th className="erp-th py-3.5 px-4 text-center font-semibold">STATUS</th>
                      <th className="erp-th py-3.5 px-4 text-center w-24 font-semibold">ACTION</th>
                    </tr>
                  </thead>

                  <tbody className="erp-tbody divide-y divide-[var(--border)]">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-[var(--text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                            <span className="text-xs">Loading bills records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : bills.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-[var(--text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <Receipt className="w-8 h-8 text-[var(--text-muted)] opacity-50" />
                            <span className="font-semibold text-sm text-[var(--text-primary)]">
                              No bills found
                            </span>
                            <p className="text-xs text-[var(--text-secondary)]">
                              No billing records match the selected date range or filter criteria.
                            </p>
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className="mt-2 erp-btn erp-btn-outline erp-btn-sm text-xs cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      bills.map((bill, index) => {
                        const isCompleted = bill.status === 'paid';
                        const isDraft = bill.status === 'pending';
                        const isCancelled = bill.status === 'cancelled';

                        return (
                          <tr
                            key={bill.id}
                            className="hover:bg-[var(--surface-hover)] transition-colors"
                          >
                            {/* 1. S.NO */}
                            <td className="py-3 px-4 text-center font-mono text-xs text-[var(--text-secondary)]">
                              {index + 1}
                            </td>

                            {/* 2. BILL ID & Date */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-xs sm:text-sm font-mono text-[var(--text-primary)]">
                                {bill.bill_id}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                {formatDateDisplay(bill.created_at)}
                              </div>
                            </td>

                            {/* 3. CUSTOMER NAME & MOBILE */}
                            <td className="py-3 px-4">
                              {bill.customer ? (
                                <div>
                                  <div className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                                    <span>{bill.customer.name}</span>
                                  </div>
                                  <div className="text-[11px] text-[var(--text-secondary)] font-mono ml-5">
                                    {bill.customer.mobile}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs italic text-[var(--text-muted)]">
                                  Walk-in Customer
                                </span>
                              )}
                            </td>

                            {/* 4. TOTAL PRODUCTS & QUANTITY (Pill badge: items / qty) */}
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center justify-center font-mono font-medium text-xs px-2.5 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                                {bill.total_products} / {bill.total_quantity}
                              </span>
                            </td>

                            {/* 5. TOTAL PRICE */}
                            <td className="py-3 px-4 text-right font-mono font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                              {formatCurrency(bill.total)}
                            </td>

                            {/* 6. STATUS */}
                            <td className="py-3 px-4 text-center">
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Completed</span>
                                </span>
                              )}
                              {isDraft && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/20">
                                  <Clock className="w-3 h-3" />
                                  <span>Draft</span>
                                </span>
                              )}
                              {isCancelled && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20">
                                  <XCircle className="w-3 h-3" />
                                  <span>Cancelled</span>
                                </span>
                              )}
                            </td>

                            {/* 7. ACTION: Open button */}
                            <td className="py-3 px-4 text-center">
                              <Link
                                id={`open-bill-btn-${bill.id}`}
                                href={`/admin/bills/openbill?id=${bill.id}`}
                                className="erp-btn erp-btn-outline erp-btn-sm inline-flex items-center gap-1.5 text-xs py-1 px-3 bg-[var(--surface)] hover:bg-[var(--surface-subtle)] border-[var(--border)] transition-colors cursor-pointer"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                <span>Open</span>
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-subtle)]/30 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>
                  Total Records: <strong>{bills.length}</strong>
                </span>
                <span>
                  Total Net Revenue: <strong className="font-mono text-[var(--text-primary)] text-sm">{formatCurrency(stats.totalRevenue)}</strong>
                </span>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
