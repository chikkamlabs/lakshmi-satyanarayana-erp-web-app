'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  CreditCard,
  UserPlus,
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Phone,
  X,
  ArrowUpDown,
  History,
  Receipt,
  Coins,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import AddCustomerTransactionModal from '@/components/AddCustomerTransactionModal';
import {
  fetchCustomers,
  getCustomerStats,
  Customer,
  CustomerStats,
} from '@/lib/customersStore';

export default function AdminCustomersDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({ totalCustomers: 0, totalCredit: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Add Transaction Modal state
  const [selectedCustomerForTx, setSelectedCustomerForTx] = useState<Customer | null>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [custRes, statsRes] = await Promise.all([
        fetchCustomers(),
        getCustomerStats(),
      ]);

      if (custRes.error) {
        setErrorMessage(custRes.error);
      } else {
        setCustomers(custRes.data);
      }

      if (!statsRes.error) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      console.error('Error loading customers directory:', err);
      setErrorMessage('Failed to load customers data.');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [custRes, statsRes] = await Promise.all([
          fetchCustomers(),
          getCustomerStats(),
        ]);
        if (!mounted) return;

        if (custRes.error) {
          setErrorMessage(custRes.error);
        } else {
          setCustomers(custRes.data);
        }

        if (!statsRes.error) {
          setStats(statsRes.stats);
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage('Failed to load customers data.');
      } finally {
        if (mounted) {
          setLoading(false);
          setStatsLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  // Instant typing search computation
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((item) => {
      const name = item.name?.toLowerCase() || '';
      const mobile = item.mobile?.toLowerCase() || '';
      const address = item.address?.toLowerCase() || '';
      return name.includes(q) || mobile.includes(q) || address.includes(q);
    });
  }, [customers, searchQuery]);

  function handleOpenTxModal(customer: Customer) {
    setSelectedCustomerForTx(customer);
    setIsTxModalOpen(true);
  }

  function handleTxSuccess(updatedCustomer?: Customer) {
    if (updatedCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === updatedCustomer.id ? { ...c, credit: updatedCustomer.credit } : c))
      );
    }
    loadData();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-customers-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Bar: Title & Add Customer Button */}
            <div
              id="admin-customers-header"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)]">
                    <Users className="w-5 h-5" />
                  </div>
                  <h1 id="admin-customers-title" className="erp-page-title text-xl sm:text-2xl">
                    Customer Directory
                  </h1>
                </div>
                <p className="erp-small text-[var(--text-secondary)]">
                  Manage retail client accounts, loyalty points, and credit ledgers
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="admin-customers-refresh-btn"
                  type="button"
                  onClick={() => loadData()}
                  disabled={loading}
                  className="erp-btn erp-btn-outline erp-btn-sm"
                  title="Refresh Directory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <Link
                  id="admin-add-customer-btn"
                  href="/admin/customers/addcustomer"
                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Customer</span>
                </Link>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                id="admin-customers-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Notice: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Stat Cards: Total Customers & Total Outstanding Credit */}
            <div id="admin-customers-stats-grid" className="erp-grid-2">
              {/* Stat 1: Total Customers */}
              <div
                id="stat-total-customers-card"
                className="erp-stat-card border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title">Total Customers</span>
                  <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                {statsLoading ? (
                  <div className="erp-skeleton h-8 w-24 rounded-md"></div>
                ) : (
                  <div id="stat-total-customers-value" className="erp-stat-value">
                    {stats.totalCustomers}
                  </div>
                )}
                <span className="erp-small text-[var(--text-muted)]">
                  Registered customer profiles in database
                </span>
              </div>

              {/* Stat 2: Total Outstanding Credit */}
              <div
                id="stat-total-credit-card"
                className="erp-stat-card border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title">Total Outstanding Credit</span>
                  <div className="p-2 rounded-lg bg-[var(--warning-light)] text-[var(--warning)]">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
                {statsLoading ? (
                  <div className="erp-skeleton h-8 w-32 rounded-md"></div>
                ) : (
                  <div id="stat-total-credit-value" className="erp-stat-value text-[var(--text-primary)]">
                    ₹{stats.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                )}
                <span className="erp-small text-[var(--text-muted)]">
                  Cumulative outstanding balance calculated from customers.credit
                </span>
              </div>
            </div>

            {/* Live Typing Search Bar */}
            <div id="admin-customers-search-card" className="erp-card p-3 sm:p-4">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
                <input
                  id="admin-customers-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer name (e.g. Rahul, Priya)..."
                  className="erp-input erp-input-icon-left text-sm py-2 pr-9"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Customers Table List */}
            <div id="admin-customers-table-wrapper" className="erp-card overflow-hidden">
              <div className="erp-card-header">
                <div className="flex items-center gap-2">
                  <h2 className="erp-card-title">Customers Directory</h2>
                  <span className="erp-badge erp-badge-secondary">
                    {filteredCustomers.length} {filteredCustomers.length === 1 ? 'record' : 'records'}
                  </span>
                </div>
                {searchQuery && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Filtering for &quot;{searchQuery}&quot;
                  </span>
                )}
              </div>

              {loading ? (
                <div className="p-8 space-y-3">
                  <div className="erp-skeleton h-10 w-full rounded-md"></div>
                  <div className="erp-skeleton h-10 w-full rounded-md"></div>
                  <div className="erp-skeleton h-10 w-full rounded-md"></div>
                  <div className="erp-skeleton h-10 w-full rounded-md"></div>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div id="admin-customers-empty-state" className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    {searchQuery ? 'No matching customers found' : 'No customers added yet'}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-5">
                    {searchQuery
                      ? `We couldn't find any customer matching "${searchQuery}". Check the name, mobile number, or address.`
                      : 'Get started by creating your first customer profile to manage points, bills, and credit.'}
                  </p>
                  {!searchQuery && (
                    <Link
                      id="empty-add-customer-btn"
                      href="/admin/customers/addcustomer"
                      className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Customer</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="erp-table-container border-0 rounded-none">
                  <table id="admin-customers-table" className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Mobile Number</th>
                        <th className="erp-th">Customer Name</th>
                        <th className="erp-th">Points</th>
                        <th className="erp-th">Credit (₹)</th>
                        <th className="erp-th">Total Bills</th>
                        <th className="erp-th">Status</th>
                        <th className="erp-th text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="erp-tbody">
                      {filteredCustomers.map((cust) => {
                        const name = cust.name || 'Unnamed Customer';
                        const mobile = cust.mobile || 'No Mobile';
                        const points = Number(cust.available_points || 0).toFixed(2);
                        const credit = Number(cust.credit || 0);
                        const totalBills = cust.total_bills ?? 0;
                        const status = cust.status || 'active';

                        return (
                          <tr key={cust.id} id={`customer-row-${cust.id}`}>
                            {/* Mobile Number Column */}
                            <td className="erp-td">
                              <div className="flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
                                <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span>{mobile}</span>
                              </div>
                            </td>

                            {/* Customer Name Column */}
                            <td className="erp-td">
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-[var(--text-primary)]">
                                  {name}
                                </span>
                                {cust.address && (
                                  <span className="text-xs text-[var(--text-muted)] truncate max-w-xs">
                                    {cust.address}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Points Column */}
                            <td className="erp-td">
                              <span className="text-sm font-medium text-[var(--text-primary)]">
                                {points}
                              </span>
                            </td>

                            {/* Credit (₹) Column */}
                            <td className="erp-td">
                              <span className={`text-sm font-bold ${credit > 0 ? 'text-[var(--warning)]' : 'text-[var(--text-primary)]'}`}>
                                ₹{credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </td>

                            {/* Total Bills Column */}
                            <td className="erp-td">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)]">
                                <Receipt className="w-3 h-3 text-[var(--text-muted)]" />
                                {totalBills}
                              </span>
                            </td>

                            {/* Status Column */}
                            <td className="erp-td">
                              {status === 'active' ? (
                                <span className="erp-badge erp-badge-success text-[11px]">
                                  <span className="erp-badge-dot"></span>
                                  Active
                                </span>
                              ) : (
                                <span className="erp-badge erp-badge-danger text-[11px]">
                                  <span className="erp-badge-dot"></span>
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Actions Column: Add Transaction, Transactions, Open */}
                            <td className="erp-td text-right">
                              <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                                <button
                                  id={`add-trans-btn-${cust.id}`}
                                  type="button"
                                  onClick={() => handleOpenTxModal(cust)}
                                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                                  title="Add credit/payment transaction"
                                >
                                  <ArrowUpDown className="w-3.5 h-3.5" />
                                  <span>Add Transaction</span>
                                </button>

                                <Link
                                  id={`transactions-btn-${cust.id}`}
                                  href={`/admin/customers/transactions?id=${cust.id}`}
                                  className="erp-btn erp-btn-secondary erp-btn-sm inline-flex items-center gap-1.5"
                                  title="View ledger transactions"
                                >
                                  <History className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                                  <span>Transactions</span>
                                </Link>

                                <Link
                                  id={`open-customer-btn-${cust.id}`}
                                  href={`/admin/customers/opencustomer?id=${cust.id}`}
                                  className="erp-btn erp-btn-outline erp-btn-sm inline-flex items-center gap-1.5"
                                  title="Open & edit customer details"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-[var(--primary)]" />
                                  <span>Open</span>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Add Transaction Modal */}
      <AddCustomerTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setSelectedCustomerForTx(null);
        }}
        customer={selectedCustomerForTx}
        onSuccess={handleTxSuccess}
      />
    </div>
  );
}
