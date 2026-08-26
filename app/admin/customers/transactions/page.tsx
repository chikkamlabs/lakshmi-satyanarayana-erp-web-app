'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  History,
  ArrowLeft,
  ArrowUpDown,
  PlusCircle,
  MinusCircle,
  Receipt,
  Phone,
  Calendar,
  AlertCircle,
  RefreshCw,
  X,
  User,
  Filter,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import AddCustomerTransactionModal from '@/components/AddCustomerTransactionModal';
import {
  fetchCustomerById,
  fetchCustomerTransactions,
  fetchCustomers,
  Customer,
  CustomerTransaction,
  CustomerTransactionCalc,
} from '@/lib/customersStore';

function TransactionsContent() {
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get('id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerIdParam);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'sum' | 'subtract'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Add Transaction Modal
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);

  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Load data on mount or when filters / selectedCustomerId change
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        // Fetch customer details if selectedCustomerId exists
        if (selectedCustomerId) {
          const custRes = await fetchCustomerById(selectedCustomerId);
          if (!mounted) return;
          if (custRes.error) {
            setErrorMessage(custRes.error);
          } else {
            setCustomer(custRes.data);
          }
        }

        // Fetch customer list for switcher
        const allCustRes = await fetchCustomers();
        if (!mounted) return;
        if (allCustRes.data) {
          setAllCustomers(allCustRes.data);
          if (!selectedCustomerId && allCustRes.data.length > 0) {
            setSelectedCustomerId(allCustRes.data[0].id);
            setCustomer(allCustRes.data[0]);
          }
        }

        // Fetch transactions
        const txRes = await fetchCustomerTransactions({
          customer_id: selectedCustomerId || undefined,
          type: typeFilter,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        if (!mounted) return;
        if (txRes.error) {
          setErrorMessage(txRes.error);
        } else {
          setTransactions(txRes.data);
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('Error loading transactions:', err);
        setErrorMessage('Failed to load transaction records.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [selectedCustomerId, typeFilter, startDate, endDate, refreshKey]);

  // Handler for customer dropdown change
  function handleCustomerSelect(id: string) {
    setSelectedCustomerId(id);
    const found = allCustomers.find((c) => c.id === id);
    if (found) {
      setCustomer(found);
    }
  }

  function handleTxSuccess(updatedCustomer?: Customer) {
    if (updatedCustomer && customer?.id === updatedCustomer.id) {
      setCustomer((prev) => (prev ? { ...prev, credit: updatedCustomer.credit } : prev));
    }
    setRefreshKey((k) => k + 1);
  }

  // Format date helper
  function formatTxDate(dateStr: string) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }) + ' ' + date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="customer-transactions-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Bar Header */}
            <div
              id="customer-transactions-header"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)]">
                    <History className="w-5 h-5" />
                  </div>
                  <h1 id="customer-transactions-title" className="erp-page-title text-xl sm:text-2xl">
                    Customer Ledger Transactions
                  </h1>
                </div>
                <p className="erp-small text-[var(--text-secondary)]">
                  Credit additions, payments, and bill settlements ledger
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  id="back-to-directory-btn"
                  href="/admin/customers/dashboard"
                  className="erp-btn erp-btn-outline erp-btn-sm inline-flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Customer Directory</span>
                </Link>

                <button
                  id="header-add-transaction-btn"
                  type="button"
                  onClick={() => setIsTxModalOpen(true)}
                  disabled={!customer}
                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                id="transactions-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Notice: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Customer Summary Card (Matches Reference Screenshot 2) */}
            <div id="customer-ledger-summary-card" className="erp-card p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                
                {/* Left: Customer Info & Selector */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2.5 rounded-full bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] shrink-0 mt-0.5 sm:mt-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 id="ledger-customer-name" className="text-lg font-bold text-[var(--text-primary)]">
                        {customer ? customer.name : 'Select a Customer'}
                      </h2>
                      {customer && (
                        <span
                          id="ledger-customer-status"
                          className={`erp-badge ${
                            customer.status === 'active' ? 'erp-badge-success' : 'erp-badge-danger'
                          } text-[11px]`}
                        >
                          <span className="erp-badge-dot"></span>
                          {customer.status}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                      {customer && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[var(--text-muted)]" />
                          {customer.mobile}
                        </span>
                      )}
                      {allCustomers.length > 1 && (
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-[var(--text-muted)]">Switch:</span>
                          <select
                            id="customer-switcher-select"
                            value={selectedCustomerId}
                            onChange={(e) => handleCustomerSelect(e.target.value)}
                            className="text-xs bg-[var(--surface)] border border-[var(--border)] rounded px-2 py-0.5 text-[var(--text-primary)] cursor-pointer"
                          >
                            {allCustomers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.mobile})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Loyalty Points & Current Credit Balance */}
                {customer && (
                  <div className="flex items-center gap-6 sm:gap-8 pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border-subtle)] self-end md:self-auto">
                    <div className="text-right">
                      <span className="erp-small text-[var(--text-secondary)] block">Loyalty Points</span>
                      <span id="ledger-loyalty-points" className="text-base font-bold text-[var(--text-primary)]">
                        {Number(customer.available_points || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="erp-small text-[var(--text-secondary)] block">Current Credit Balance</span>
                      <span
                        id="ledger-credit-balance"
                        className={`text-xl sm:text-2xl font-bold ${
                          Number(customer.credit || 0) > 0 ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        ₹{Number(customer.credit || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Filter Bar Card (Matches Reference Screenshot 2) */}
            <div id="customer-ledger-filter-card" className="erp-card p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                
                {/* Left: Type Filter Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mr-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Type:</span>
                  </div>

                  <div className="inline-flex rounded-lg border border-[var(--border)] p-1 bg-[var(--surface-subtle)] gap-1">
                    <button
                      type="button"
                      id="filter-type-all"
                      onClick={() => setTypeFilter('all')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        typeFilter === 'all'
                          ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      All Transactions
                    </button>

                    <button
                      type="button"
                      id="filter-type-sum"
                      onClick={() => setTypeFilter('sum')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer ${
                        typeFilter === 'sum'
                          ? 'bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Sum (+)</span>
                    </button>

                    <button
                      type="button"
                      id="filter-type-subtract"
                      onClick={() => setTypeFilter('subtract')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer ${
                        typeFilter === 'subtract'
                          ? 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)] font-semibold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <MinusCircle className="w-3 h-3" />
                      <span>Subtract (-)</span>
                    </button>
                  </div>
                </div>

                {/* Right: Date Range Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] mr-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="filter-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="erp-input text-xs py-1.5 px-2.5 w-36"
                      placeholder="dd-mm-yyyy"
                    />
                    <span className="text-xs text-[var(--text-muted)]">to</span>
                    <input
                      id="filter-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="erp-input text-xs py-1.5 px-2.5 w-36"
                      placeholder="dd-mm-yyyy"
                    />

                    {(startDate || endDate) && (
                      <button
                        type="button"
                        id="clear-date-filter-btn"
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                        }}
                        className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]"
                        title="Clear date filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Transactions Table List */}
            <div id="customer-transactions-table-wrapper" className="erp-card overflow-hidden">
              <div className="erp-card-header">
                <div className="flex items-center gap-2">
                  <h2 className="erp-card-title">Ledger Entries</h2>
                  <span className="erp-badge erp-badge-secondary">
                    {transactions.length} {transactions.length === 1 ? 'record' : 'records'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setRefreshKey((k) => k + 1)}
                  disabled={loading}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title="Refresh table"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {loading ? (
                <div className="p-8 space-y-3">
                  <div className="erp-skeleton h-10 w-full rounded-md"></div>
                  <div className="erp-skeleton h-10 w-full rounded-md"></div>
                  <div className="erp-skeleton h-10 w-full rounded-md"></div>
                  <div className="erp-skeleton h-10 w-full rounded-md"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div id="transactions-empty-state" className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    No ledger transactions recorded yet
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-5">
                    {typeFilter !== 'all' || startDate || endDate
                      ? 'No entries match your selected filter criteria. Try adjusting the date range or transaction type.'
                      : 'Record credit additions, bill settlements, or customer loan payments to build the ledger.'}
                  </p>
                  {customer && (
                    <button
                      id="empty-add-transaction-btn"
                      type="button"
                      onClick={() => setIsTxModalOpen(true)}
                      className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      <span>Add First Transaction</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="erp-table-container border-0 rounded-none">
                  <table id="customer-transactions-table" className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Date & Time</th>
                        <th className="erp-th">Calculation</th>
                        <th className="erp-th">Amount (₹)</th>
                        <th className="erp-th">Bill Reference</th>
                        <th className="erp-th">Notes / Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="erp-tbody">
                      {transactions.map((tx) => {
                        const isSum = tx.calculation === 'sum';
                        const amountFormatted = Number(tx.amount || 0).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });

                        return (
                          <tr key={tx.id} id={`tx-row-${tx.id}`}>
                            {/* Date & Time Column */}
                            <td className="erp-td whitespace-nowrap">
                              <span className="text-xs sm:text-sm text-[var(--text-primary)] font-medium">
                                {formatTxDate(tx.created_at)}
                              </span>
                            </td>

                            {/* Calculation Column */}
                            <td className="erp-td">
                              {isSum ? (
                                <span className="erp-badge erp-badge-warning inline-flex items-center gap-1 py-0.5 px-2 text-xs">
                                  <PlusCircle className="w-3 h-3" />
                                  <span>Sum (+ Credit)</span>
                                </span>
                              ) : (
                                <span className="erp-badge erp-badge-success inline-flex items-center gap-1 py-0.5 px-2 text-xs">
                                  <MinusCircle className="w-3 h-3" />
                                  <span>Subtract (- Settle)</span>
                                </span>
                              )}
                            </td>

                            {/* Amount Column */}
                            <td className="erp-td whitespace-nowrap">
                              <span
                                className={`font-bold text-sm ${
                                  isSum ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
                                }`}
                              >
                                {isSum ? `+₹${amountFormatted}` : `-₹${amountFormatted}`}
                              </span>
                            </td>

                            {/* Bill Reference Column */}
                            <td className="erp-td">
                              {tx.bill?.bill_id ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-mono font-medium text-[var(--text-primary)]">
                                  <Receipt className="w-3 h-3 text-[var(--text-muted)]" />
                                  #{tx.bill.bill_id}
                                </span>
                              ) : (
                                <span className="text-xs italic text-[var(--text-muted)]">
                                  Manual Entry
                                </span>
                              )}
                            </td>

                            {/* Notes / Remarks Column */}
                            <td className="erp-td">
                              <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                                {tx.notes || '—'}
                              </span>
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
        onClose={() => setIsTxModalOpen(false)}
        customer={customer}
        onSuccess={handleTxSuccess}
      />
    </div>
  );
}

export default function CustomerTransactionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading transactions...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
