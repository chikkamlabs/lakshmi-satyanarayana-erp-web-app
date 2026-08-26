'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowUpRight,
  Banknote,
  Smartphone,
  CreditCard,
  TrendingUp,
  Filter,
  Calendar,
  Search,
  RotateCw,
  Eye,
  Phone,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import {
  PaymentRecord,
  PaymentDashboardStats,
  fetchPaymentDashboard,
  formatCurrency,
  formatDateTime,
  getTodayDateString,
} from '@/lib/paymentsStore';
import ExpensesModal from '@/components/expenses';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';

export default function PaymentDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const today = getTodayDateString();

  // Date & Search Filters (Default to Today)
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data & State
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentDashboardStats>({
    totalSale: 0,
    totalCash: 0,
    totalUpi: 0,
    totalCredit: 0,
    totalBillsCount: 0,
    totalExpenses: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Expenses Modal State
  const [isExpensesOpen, setIsExpensesOpen] = useState<boolean>(false);

  // Fetch Payment Dashboard Data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchPaymentDashboard({
        fromDate,
        toDate,
        searchQuery,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setRecords(res.data);
        setStats(res.stats);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load payments dashboard data');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, searchQuery]);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchPaymentDashboard({
          fromDate,
          toDate,
          searchQuery,
        });

        if (!active) return;
        if (res.error) {
          setError(res.error);
        } else {
          setRecords(res.data);
          setStats(res.stats);
        }
      } catch (err: any) {
        if (active) setError(err?.message || 'Failed to load payments dashboard data');
      } finally {
        if (active) setLoading(false);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [fromDate, toDate, searchQuery]);

  // Reset to Today action
  const handleResetToToday = () => {
    const t = getTodayDateString();
    setFromDate(t);
    setToDate(t);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-payments-dashboard-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* 1. Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-1 font-medium">
                  <Link href="/admin/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
                    Home
                  </Link>
                  <span>/</span>
                  <span className="text-[var(--text-secondary)]">Payments</span>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      Payment Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      Overview of total sales, payment modes, and daily expenses
                    </p>
                  </div>
                </div>
              </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Total Expenses Action Button / Pill */}
          <button
            type="button"
            id="header-total-expenses-btn"
            onClick={() => setIsExpensesOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-amber-200/80 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 text-xs font-semibold shadow-xs transition-all cursor-pointer group"
          >
            <TrendingUp className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            <span>Total Expenses</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-bold text-xs">
              {formatCurrency(stats.totalExpenses)}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            id="payments-refresh-btn"
            onClick={loadDashboardData}
            disabled={loading}
            title="Refresh Data"
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-xs transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards (5 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: TOTAL SALE */}
        <div
          id="stat-total-sale"
          className="erp-card p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              TOTAL SALE
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {formatCurrency(stats.totalSale)}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">
              Cash + UPI + Credit ({stats.totalBillsCount} bill{stats.totalBillsCount === 1 ? '' : 's'})
            </p>
          </div>
        </div>

        {/* Card 2: TOTAL CASH */}
        <div
          id="stat-total-cash"
          className="erp-card p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              TOTAL CASH
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              {formatCurrency(stats.totalCash)}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Received in cash payments
            </p>
          </div>
        </div>

        {/* Card 3: TOTAL UPI */}
        <div
          id="stat-total-upi"
          className="erp-card p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              TOTAL UPI
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-sky-600 tracking-tight">
              {formatCurrency(stats.totalUpi)}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Online UPI transactions
            </p>
          </div>
        </div>

        {/* Card 4: TOTAL CREDIT */}
        <div
          id="stat-total-credit"
          className="erp-card p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              TOTAL CREDIT
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {formatCurrency(stats.totalCredit)}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Outstanding customer credits
            </p>
          </div>
        </div>

        {/* Card 5: TOTAL EXPENSES */}
        <div
          id="stat-total-expenses"
          onClick={() => setIsExpensesOpen(true)}
          className="erp-card p-4 rounded-xl border border-rose-100 bg-[var(--surface)] shadow-xs hover:border-rose-300 transition-all flex flex-col justify-between cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-rose-700 uppercase">
              TOTAL EXPENSES
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <div className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1 group-hover:underline">
              <span>View Expenses table</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Payments Section */}
      <div className="erp-card p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
            <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
            <span>Filter Payments by Date</span>
          </div>
          <button
            type="button"
            id="payments-reset-today-btn"
            onClick={handleResetToToday}
            className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
          >
            Reset to Today
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          {/* Date From */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Date From:
            </label>
            <div className="relative">
              <input
                type="date"
                id="payments-date-from"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] cursor-pointer font-medium"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Date To:
            </label>
            <div className="relative">
              <input
                type="date"
                id="payments-date-to"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] cursor-pointer font-medium"
              />
            </div>
          </div>

          {/* Search Bill ID / Customer */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Search Bill ID / Customer:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="payments-search-input"
                placeholder="Search by Bill ID (e.g. BILL-...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Payment Records Table Card */}
      <div className="erp-card rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs overflow-hidden">
        {/* Table Header Strip */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Payment Records
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Showing {records.length} bill{records.length === 1 ? '' : 's'} in selected range
            </p>
          </div>
          <div className="text-xs text-[var(--text-secondary)] font-medium">
            Range: <span className="font-semibold text-[var(--text-primary)]">{fromDate || 'Start'}</span> to <span className="font-semibold text-[var(--text-primary)]">{toDate || 'Today'}</span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading && records.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-[var(--text-muted)] space-y-3">
              <RotateCw className="w-7 h-7 animate-spin text-[var(--primary)]" />
              <p className="text-sm">Loading payment records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
              <Wallet className="w-12 h-12 text-[var(--text-muted)] mb-3 stroke-[1.5]" />
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                No payment records found
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mt-1">
                There are no bills or payment transactions recorded matching the selected date filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  <th className="py-3 px-4">BILL ID</th>
                  <th className="py-3 px-4">DATE & TIME</th>
                  <th className="py-3 px-4">CUSTOMER DETAILS</th>
                  <th className="py-3 px-4">TOTAL (₹)</th>
                  <th className="py-3 px-4">CASH (₹)</th>
                  <th className="py-3 px-4">UPI (₹)</th>
                  <th className="py-3 px-4">CREDIT (₹)</th>
                  <th className="py-3 px-4 text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs text-[var(--text-primary)]">
                {records.map((bill) => (
                  <tr
                    key={bill.id}
                    className="hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    {/* Bill ID */}
                    <td className="py-3.5 px-4 font-bold text-[var(--text-primary)] whitespace-nowrap">
                      {bill.bill_id}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDateTime(bill.date_time)}
                    </td>

                    {/* Customer Details */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {bill.customer ? (
                        <div>
                          <div className="font-bold text-[var(--text-primary)]">
                            {bill.customer.name}
                          </div>
                          {bill.customer.mobile ? (
                            <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] mt-0.5">
                              <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                              <span>{bill.customer.mobile}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] italic">No mobile</span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-[var(--text-secondary)]">
                            Walk-in Customer
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)] italic">
                            No mobile
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Total (₹) */}
                    <td className="py-3.5 px-4 font-extrabold text-[var(--text-primary)] whitespace-nowrap">
                      {formatCurrency(bill.total)}
                    </td>

                    {/* Cash (₹) */}
                    <td className="py-3.5 px-4 font-bold text-emerald-600 whitespace-nowrap">
                      {bill.cash > 0 ? formatCurrency(bill.cash) : <span className="text-[var(--text-muted)] font-normal">-</span>}
                    </td>

                    {/* UPI (₹) */}
                    <td className="py-3.5 px-4 font-bold text-sky-600 whitespace-nowrap">
                      {bill.upi > 0 ? formatCurrency(bill.upi) : <span className="text-[var(--text-muted)] font-normal">-</span>}
                    </td>

                    {/* Credit (₹) */}
                    <td className="py-3.5 px-4 font-bold text-amber-600 whitespace-nowrap">
                      {bill.credit > 0 ? formatCurrency(bill.credit) : <span className="text-[var(--text-muted)] font-normal">-</span>}
                    </td>

                    {/* Action View */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <Link
                        href={`/admin/bills/openbill?id=${bill.id}`}
                        id={`view-bill-${bill.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[var(--border)] hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium text-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. Expenses Modal / Drawer Component */}
      <ExpensesModal
        isOpen={isExpensesOpen}
        onClose={() => setIsExpensesOpen(false)}
        initialFromDate={fromDate}
        initialToDate={toDate}
        onExpenseChanged={loadDashboardData}
      />
          </div>
        </main>
      </div>
    </div>
  );
}
