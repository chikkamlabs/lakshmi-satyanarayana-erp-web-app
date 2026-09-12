'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Receipt,
  IndianRupee,
  UserCheck,
  Users,
  Package,
  Plus,
  UserPlus,
  Loader2,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import AdminHeader from '../header/page';
import AdminSidebar from '../sidebar/page';
import AddProductModal from '@/components/addproduct';

interface AdminDashboardStats {
  totalBills: number;
  totalSaleToday: number;
  totalCustomers: number;
  totalAssociates: number;
  totalProducts: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const [stats, setStats] = useState<AdminDashboardStats>({
    totalBills: 0,
    totalSaleToday: 0,
    totalCustomers: 0,
    totalAssociates: 0,
    totalProducts: 0,
  });

  const billButtonRef = useRef<HTMLButtonElement | null>(null);

  const fetchDashboardMetrics = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      }

      // Calculate start of today (local time)
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString();

      const [
        billsRes,
        todayBillsRes,
        customersRes,
        associatesRes,
        productsRes,
      ] = await Promise.all([
        supabase.from('bills').select('*', { count: 'exact', head: true }),
        supabase.from('bills').select('total').gte('created_at', startOfToday),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('associates').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
      ]);

      const totalBills = billsRes.count ?? 0;
      const totalSaleToday = (todayBillsRes.data ?? []).reduce(
        (sum, b) => sum + (Number(b.total) || 0),
        0
      );
      const totalCustomers = customersRes.count ?? 0;
      const totalAssociates = associatesRes.count ?? 0;
      const totalProducts = productsRes.count ?? 0;

      setStats({
        totalBills,
        totalSaleToday,
        totalCustomers,
        totalAssociates,
        totalProducts,
      });
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      ).toISOString();

      try {
        const [
          billsRes,
          todayBillsRes,
          customersRes,
          associatesRes,
          productsRes,
        ] = await Promise.all([
          supabase.from('bills').select('*', { count: 'exact', head: true }),
          supabase.from('bills').select('total').gte('created_at', startOfToday),
          supabase.from('customers').select('*', { count: 'exact', head: true }),
          supabase.from('associates').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }),
        ]);

        if (isMounted) {
          const totalBills = billsRes.count ?? 0;
          const totalSaleToday = (todayBillsRes.data ?? []).reduce(
            (sum, b) => sum + (Number(b.total) || 0),
            0
          );
          const totalCustomers = customersRes.count ?? 0;
          const totalAssociates = associatesRes.count ?? 0;
          const totalProducts = productsRes.count ?? 0;

          setStats({
            totalBills,
            totalSaleToday,
            totalCustomers,
            totalAssociates,
            totalProducts,
          });
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Keyboard shortcut: When on admin/dashboard and user taps Enter, focus and open create bill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        const isInput =
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA' ||
          target?.isContentEditable;
        if (!isInput && !isAddProductOpen) {
          e.preventDefault();
          if (billButtonRef.current) {
            billButtonRef.current.focus();
          }
          router.push('/admin/createbill');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router, isAddProductOpen]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main
          id="admin-dashboard-container"
          className="flex-1 p-4 sm:p-6 erp-fade-in relative min-h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full"
        >
          {/* Dashboard Header with Title and Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="erp-page-title text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                Admin Dashboard
              </h1>
              <p className="erp-small text-[var(--text-secondary)] mt-1">
                Overview of sales, inventory, customers, and business activities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fetchDashboardMetrics(true)}
                disabled={refreshing}
                className="erp-btn erp-btn-outline erp-btn-sm flex items-center gap-1.5 cursor-pointer"
                title="Refresh Metrics"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                id="dashboard-add-product-btn"
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="erp-btn erp-btn-primary erp-btn-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>

              <Link
                id="dashboard-add-associate-btn"
                href="/admin/associates/addassociate"
                className="erp-btn erp-btn-secondary erp-btn-sm flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Associate</span>
              </Link>

              <Link
                id="dashboard-add-customer-btn"
                href="/admin/customers/addcustomer"
                className="erp-btn erp-btn-outline erp-btn-sm flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Add Customer</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {/* 1. Total Bills */}
            <Link
              href="/admin/bills/dashboard"
              className="erp-card erp-card-interactive p-4 flex flex-col justify-between group"
              id="stat-total-bills"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Total Bills
                </span>
                <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                  ) : (
                    stats.totalBills.toLocaleString('en-IN')
                  )}
                </span>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
              </div>
            </Link>

            {/* 2. Total Sale (Today) */}
            <div
              className="erp-card p-4 flex flex-col justify-between border-[var(--success)]/20 bg-[var(--surface)]"
              id="stat-total-sale-today"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Total Sale (Today)
                </span>
                <div className="w-9 h-9 rounded-lg bg-[var(--success)]/10 flex items-center justify-center text-[var(--success)]">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[var(--success)]">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                  ) : (
                    formatCurrency(stats.totalSaleToday)
                  )}
                </span>
              </div>
            </div>

            {/* 3. Total Customers */}
            <Link
              href="/admin/customers/dashboard"
              className="erp-card erp-card-interactive p-4 flex flex-col justify-between group"
              id="stat-total-customers"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Total Customers
                </span>
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                  ) : (
                    stats.totalCustomers.toLocaleString('en-IN')
                  )}
                </span>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>

            {/* 4. Total Associates */}
            <Link
              href="/admin/associates/dashboard"
              className="erp-card erp-card-interactive p-4 flex flex-col justify-between group"
              id="stat-total-associates"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Total Associates
                </span>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                  ) : (
                    stats.totalAssociates.toLocaleString('en-IN')
                  )}
                </span>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-amber-600 transition-colors" />
              </div>
            </Link>

            {/* 5. Total Products */}
            <Link
              href="/admin/products/dashboard"
              className="erp-card erp-card-interactive p-4 flex flex-col justify-between group"
              id="stat-total-products"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Total Products
                </span>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                  ) : (
                    stats.totalProducts.toLocaleString('en-IN')
                  )}
                </span>
                <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-purple-600 transition-colors" />
              </div>
            </Link>
          </div>

          {/* Quick Action Cards Section */}
          <div className="erp-card p-5 sm:p-6 mb-8">
            <h2 className="erp-section-title text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-4">
              Quick Management Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Add Product Card */}
              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="erp-card erp-card-interactive p-4 flex items-center gap-3 text-left w-full cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Add Product
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Create new SKU with pricing &amp; stock
                  </p>
                </div>
              </button>

              {/* Add Associate Card */}
              <Link
                href="/admin/associates/addassociate"
                className="erp-card erp-card-interactive p-4 flex items-center gap-3 text-left w-full group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Add Associate
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Register new associate &amp; commission
                  </p>
                </div>
              </Link>

              {/* Add Customer Card */}
              <Link
                href="/admin/customers/addcustomer"
                className="erp-card erp-card-interactive p-4 flex items-center gap-3 text-left w-full group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Add Customer
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Save customer contact &amp; credit limit
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Bottom Right Bill Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <button
              ref={billButtonRef}
              id="admin-create-bill-floating-btn"
              type="button"
              onClick={() => router.push('/admin/createbill')}
              className="erp-btn erp-btn-primary py-3 px-5 rounded-xl shadow-lg hover:shadow-xl flex items-center gap-3 text-sm font-semibold cursor-pointer border border-[var(--primary)]/20 transition-all hover:scale-105 active:scale-95 group focus:ring-4 focus:ring-[var(--primary)]/30 focus:outline-none"
              title="Create New Bill (Press Enter on Keyboard)"
            >
              <div className="p-1 rounded-md bg-white/20">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold leading-tight">
                  Create Bill
                </span>
                <span className="text-[10px] text-white/80 font-normal leading-tight">
                  POS Billing
                </span>
              </div>
              <div className="ml-1 px-2 py-0.5 rounded bg-black/20 text-[11px] font-mono text-white/90 border border-white/20 flex items-center gap-1 shadow-inner">
                <span>Enter ↵</span>
              </div>
            </button>
          </div>

          {/* Add Product Modal */}
          {isAddProductOpen && (
            <AddProductModal
              isOpen={isAddProductOpen}
              onClose={() => setIsAddProductOpen(false)}
              onSuccess={() => {
                setIsAddProductOpen(false);
                fetchDashboardMetrics(true);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
