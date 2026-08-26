'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  UserCheck,
  User,
  Phone,
  Coins,
  CreditCard,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  History,
  Receipt,
  ArrowUpDown,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import AddCustomerTransactionModal from '@/components/AddCustomerTransactionModal';
import {
  fetchCustomerById,
  updateCustomer,
  fetchCustomers,
  Customer,
  UpdateCustomerInput,
} from '@/lib/customersStore';

function OpenCustomerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerIdParam = searchParams.get('id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(Boolean(customerIdParam));
  const [isSaving, setIsSaving] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState<string>(customerIdParam);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Transaction modal
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Form State for editing all fields
  const [formData, setFormData] = useState<UpdateCustomerInput>({
    id: '',
    name: '',
    mobile: '',
    status: 'active',
    available_points: 0,
    credit: 0,
    address: '',
  });

  const loadCustomer = useCallback(async (idToLoad: string) => {
    if (!idToLoad) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetchCustomerById(idToLoad);
      if (res.error) {
        setErrorMessage(res.error);
        setCustomer(null);
      } else if (res.data) {
        setCustomer(res.data);
        setFormData({
          id: res.data.id,
          name: res.data.name || '',
          mobile: res.data.mobile || '',
          status: res.data.status || 'active',
          available_points: Number(res.data.available_points) || 0,
          credit: Number(res.data.credit) || 0,
          address: res.data.address || '',
        });
      }
    } catch (err: any) {
      console.error('Error loading customer:', err);
      setErrorMessage('Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load customer and directory
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const res = await fetchCustomers();
        if (!mounted) return;
        if (!res.error && res.data) {
          setAllCustomers(res.data);
        }

        const targetId = customerIdParam || (res.data && res.data.length > 0 ? res.data[0].id : '');
        if (targetId) {
          setSelectedId(targetId);
          setLoading(true);
          const custRes = await fetchCustomerById(targetId);
          if (!mounted) return;
          if (custRes.error) {
            setErrorMessage(custRes.error);
            setCustomer(null);
          } else if (custRes.data) {
            setCustomer(custRes.data);
            setFormData({
              id: custRes.data.id,
              name: custRes.data.name || '',
              mobile: custRes.data.mobile || '',
              status: custRes.data.status || 'active',
              available_points: Number(custRes.data.available_points) || 0,
              credit: Number(custRes.data.credit) || 0,
              address: custRes.data.address || '',
            });
          }
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error('Error loading customer:', err);
        setErrorMessage('Failed to load customer profile.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [customerIdParam]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'available_points' || name === 'credit'
          ? value === '' ? 0 : Number(value)
          : value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedId(id);
    router.replace(`/admin/customers/opencustomer?id=${id}`);
    loadCustomer(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.name.trim()) {
      setErrorMessage('Customer name is required.');
      return;
    }

    if (!formData.mobile.trim()) {
      setErrorMessage('Customer mobile number is required.');
      return;
    }

    if (formData.available_points < 0) {
      setErrorMessage('Available loyalty points cannot be negative.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateCustomer(formData);

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage('Customer profile updated successfully!');
        if (result.data) {
          setCustomer((prev) => (prev ? { ...prev, ...result.data } : result.data));
        }
      }
    } catch (err: any) {
      console.error('Update customer error:', err);
      setErrorMessage(err?.message || 'Failed to update customer.');
    } finally {
      setIsSaving(false);
    }
  };

  function handleTxSuccess(updatedCustomer?: Customer) {
    if (selectedId) {
      loadCustomer(selectedId);
    }
  }

  function formatMetaDate(dateStr?: string) {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
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

        <main id="open-customer-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <Link
                  id="back-to-directory-btn"
                  href="/admin/customers/dashboard"
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
                  title="Back to Customer Directory"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 id="open-customer-title" className="erp-page-title text-xl sm:text-2xl">
                    {customer ? `Customer Profile: ${customer.name}` : 'Open Customer'}
                  </h1>
                  <p className="erp-small text-[var(--text-secondary)]">
                    View and update customer information, credit balances, and loyalty points.
                  </p>
                </div>
              </div>

              {/* Quick Customer Switcher */}
              {allCustomers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)] hidden sm:inline">Select Profile:</span>
                  <select
                    id="customer-picker-select"
                    value={selectedId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="erp-select text-xs py-1.5 px-3 max-w-xs"
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

            {/* Notifications */}
            {errorMessage && (
              <div
                id="open-customer-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3 erp-fade-in"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Notice: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {successMessage && (
              <div
                id="open-customer-success-banner"
                className="p-4 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] flex items-start gap-3 erp-fade-in"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Success: </span>
                  {successMessage}
                </div>
              </div>
            )}

            {loading ? (
              <div className="erp-card p-10 space-y-4">
                <div className="erp-skeleton h-8 w-1/3 rounded-md"></div>
                <div className="erp-skeleton h-12 w-full rounded-md"></div>
                <div className="erp-skeleton h-12 w-full rounded-md"></div>
                <div className="erp-skeleton h-24 w-full rounded-md"></div>
              </div>
            ) : !customer ? (
              <div className="erp-card p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  Customer Not Found
                </h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-5">
                  Please select a customer from the directory or choose from the dropdown above.
                </p>
                <Link
                  href="/admin/customers/dashboard"
                  className="erp-btn erp-btn-primary erp-btn-sm"
                >
                  Return to Customer Directory
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Meta Overview Card */}
                <div id="customer-meta-card" className="erp-card p-4 sm:p-5 shadow-xs bg-[var(--surface)]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold text-base">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-bold text-[var(--text-primary)]">{customer.name}</h2>
                          <span
                            className={`erp-badge ${
                              customer.status === 'active' ? 'erp-badge-success' : 'erp-badge-danger'
                            } text-[11px]`}
                          >
                            <span className="erp-badge-dot"></span>
                            {customer.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-0.5">
                          <span>Joined: {formatMetaDate(customer.created_at)}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-medium text-[var(--text-secondary)]">
                            <Receipt className="w-3 h-3" />
                            {customer.total_bills ?? 0} Bills Total
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action shortcuts */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        id="open-customer-add-tx-btn"
                        onClick={() => setIsTxModalOpen(true)}
                        className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-1.5"
                        title="Add credit/payment transaction"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>Add Transaction</span>
                      </button>

                      <Link
                        id="open-customer-view-tx-btn"
                        href={`/admin/customers/transactions?id=${customer.id}`}
                        className="erp-btn erp-btn-secondary erp-btn-sm inline-flex items-center gap-1.5"
                        title="View full ledger"
                      >
                        <History className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        <span>Ledger</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Edit Form Card */}
                <form id="edit-customer-form" onSubmit={handleSubmit} className="erp-card shadow-sm">
                  <div className="erp-card-header bg-[var(--surface-subtle)] border-b border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[var(--primary)]" />
                      <h2 className="erp-card-title">Edit Customer Details</h2>
                    </div>
                    <span className="erp-small text-[var(--text-muted)]">Modify any customer attribute</span>
                  </div>

                  <div className="erp-card-body p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* Field 1: Customer Name */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit-customer-name-input" className="erp-label">
                          Customer Name <span className="text-[var(--danger)]">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="edit-customer-name-input"
                            name="name"
                            type="text"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="erp-input erp-input-icon-left"
                          />
                        </div>
                      </div>

                      {/* Field 2: Mobile Number */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit-customer-mobile-input" className="erp-label">
                          Mobile Number <span className="text-[var(--danger)]">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="edit-customer-mobile-input"
                            name="mobile"
                            type="tel"
                            required
                            value={formData.mobile}
                            onChange={handleChange}
                            className="erp-input erp-input-icon-left"
                          />
                        </div>
                      </div>

                      {/* Field 3: Status */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit-customer-status-select" className="erp-label">
                          Account Status <span className="text-[var(--danger)]">*</span>
                        </label>
                        <div className="relative">
                          <Activity className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <select
                            id="edit-customer-status-select"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="erp-select erp-input-icon-left cursor-pointer"
                          >
                            <option value="active">Active (Can purchase & earn points)</option>
                            <option value="inactive">Inactive (Suspended / Closed)</option>
                          </select>
                        </div>
                      </div>

                      {/* Field 4: Available Points */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit-customer-points-input" className="erp-label">
                          Available Points
                        </label>
                        <div className="relative">
                          <Coins className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="edit-customer-points-input"
                            name="available_points"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.available_points}
                            onChange={handleChange}
                            className="erp-input erp-input-icon-left"
                          />
                        </div>
                      </div>

                      {/* Field 5: Credit (₹) */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit-customer-credit-input" className="erp-label">
                          Outstanding Credit (₹)
                        </label>
                        <div className="relative">
                          <CreditCard className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            id="edit-customer-credit-input"
                            name="credit"
                            type="number"
                            step="0.01"
                            value={formData.credit}
                            onChange={handleChange}
                            className="erp-input erp-input-icon-left font-semibold"
                          />
                        </div>
                      </div>

                      {/* Field 6: Address */}
                      <div className="erp-form-group mb-0 sm:col-span-2">
                        <label htmlFor="edit-customer-address-input" className="erp-label">
                          Address
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                          <textarea
                            id="edit-customer-address-input"
                            name="address"
                            rows={3}
                            value={formData.address || ''}
                            onChange={handleChange}
                            placeholder="Customer billing or delivery address..."
                            className="erp-textarea pl-10 resize-none text-sm"
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Form Footer */}
                  <div className="erp-card-footer flex items-center justify-between px-6 py-4">
                    <button
                      type="button"
                      onClick={() => loadCustomer(customer.id)}
                      disabled={isSaving}
                      className="erp-btn erp-btn-ghost erp-btn-sm inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Changes</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <Link
                        id="cancel-edit-customer-btn"
                        href="/admin/customers/dashboard"
                        className="erp-btn erp-btn-outline erp-btn-sm"
                      >
                        Cancel
                      </Link>
                      <button
                        id="save-customer-btn"
                        type="submit"
                        disabled={isSaving}
                        className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

              </div>
            )}

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

export default function OpenCustomerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading customer details...</div>}>
      <OpenCustomerContent />
    </Suspense>
  );
}
