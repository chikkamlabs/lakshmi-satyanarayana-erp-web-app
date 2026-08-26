'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  User,
  Phone,
  Coins,
  CreditCard,
  MapPin,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import { createCustomer, CreateCustomerInput } from '@/lib/customersStore';

export default function AddCustomerPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCustomerInput>({
    name: '',
    mobile: '',
    status: 'active',
    available_points: 0,
    credit: 0,
    address: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.name.trim()) {
      setErrorMessage('Please enter the customer full name.');
      return;
    }

    if (!formData.mobile.trim()) {
      setErrorMessage('Please enter a valid mobile number.');
      return;
    }

    if (formData.available_points !== undefined && formData.available_points < 0) {
      setErrorMessage('Available points cannot be negative.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createCustomer(formData);

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage(`Customer "${formData.name}" added successfully!`);
        setTimeout(() => {
          router.push('/admin/customers/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Customer submit error:', err);
      setErrorMessage(err?.message || 'Failed to create customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="add-customer-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Top Navigation & Breadcrumb */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <Link
                  id="back-to-customers-btn"
                  href="/admin/customers/dashboard"
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors"
                  title="Back to Customer Directory"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 id="add-customer-page-title" className="erp-page-title text-xl sm:text-2xl">
                    Add New Customer
                  </h1>
                  <p className="erp-small text-[var(--text-secondary)]">
                    Register a client account with contact details, loyalty points, and initial credit balance.
                  </p>
                </div>
              </div>
            </div>

            {/* Notifications */}
            {errorMessage && (
              <div
                id="add-customer-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3 erp-fade-in"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Error: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {successMessage && (
              <div
                id="add-customer-success-banner"
                className="p-4 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] flex items-start gap-3 erp-fade-in"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Success: </span>
                  {successMessage}
                </div>
              </div>
            )}

            {/* Add Customer Form Card */}
            <form id="add-customer-form" onSubmit={handleSubmit} className="erp-card shadow-sm">
              <div className="erp-card-header bg-[var(--surface-subtle)] border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[var(--primary)]" />
                  <h2 className="erp-card-title">Customer Information</h2>
                </div>
                <span className="erp-badge erp-badge-primary text-xs">New Client Profile</span>
              </div>

              <div className="erp-card-body p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Field 1: Customer Name */}
                  <div className="erp-form-group mb-0">
                    <label htmlFor="customer-name-input" className="erp-label">
                      Customer Name <span className="text-[var(--danger)]">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="customer-name-input"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Ramesh Kumar"
                        className="erp-input erp-input-icon-left"
                      />
                    </div>
                    <p className="erp-helper-text">Full legal or business contact name.</p>
                  </div>

                  {/* Field 2: Mobile Number */}
                  <div className="erp-form-group mb-0">
                    <label htmlFor="customer-mobile-input" className="erp-label">
                      Mobile Number <span className="text-[var(--danger)]">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="customer-mobile-input"
                        name="mobile"
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        className="erp-input erp-input-icon-left"
                      />
                    </div>
                    <p className="erp-helper-text">Used for client identification and billing.</p>
                  </div>

                  {/* Field 3: Status */}
                  <div className="erp-form-group mb-0">
                    <label htmlFor="customer-status-select" className="erp-label">
                      Account Status <span className="text-[var(--danger)]">*</span>
                    </label>
                    <div className="relative">
                      <Activity className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        id="customer-status-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="erp-select erp-input-icon-left cursor-pointer"
                      >
                        <option value="active">Active (Can purchase & earn points)</option>
                        <option value="inactive">Inactive (Suspended / Closed)</option>
                      </select>
                    </div>
                    <p className="erp-helper-text">Customer operational status.</p>
                  </div>

                  {/* Field 4: Available Points */}
                  <div className="erp-form-group mb-0">
                    <label htmlFor="customer-points-input" className="erp-label">
                      Available Points
                    </label>
                    <div className="relative">
                      <Coins className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="customer-points-input"
                        name="available_points"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.available_points}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="erp-input erp-input-icon-left"
                      />
                    </div>
                    <p className="erp-helper-text">Initial loyalty points balance (default: 0.00).</p>
                  </div>

                  {/* Field 5: Credit (₹) */}
                  <div className="erp-form-group mb-0">
                    <label htmlFor="customer-credit-input" className="erp-label">
                      Initial Credit (₹)
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="customer-credit-input"
                        name="credit"
                        type="number"
                        step="0.01"
                        value={formData.credit}
                        onChange={handleChange}
                        placeholder="0.00"
                        className="erp-input erp-input-icon-left"
                      />
                    </div>
                    <p className="erp-helper-text">Initial outstanding credit balance in rupees.</p>
                  </div>

                  {/* Field 6: Address */}
                  <div className="erp-form-group mb-0 sm:col-span-2">
                    <label htmlFor="customer-address-input" className="erp-label">
                      Customer Address <span className="text-xs text-[var(--text-muted)] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
                      <textarea
                        id="customer-address-input"
                        name="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="e.g. Shop #4, Gandhi Road, Main Market, City..."
                        className="erp-textarea pl-10 resize-none text-sm"
                      />
                    </div>
                    <p className="erp-helper-text">Billing, shipping, or location address notes.</p>
                  </div>

                </div>
              </div>

              {/* Form Footer Actions */}
              <div className="erp-card-footer flex items-center justify-end gap-3 px-6 py-4">
                <Link
                  id="cancel-add-customer-btn"
                  href="/admin/customers/dashboard"
                  className="erp-btn erp-btn-outline erp-btn-sm"
                >
                  Cancel
                </Link>
                <button
                  id="submit-customer-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Customer...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Save Customer</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </main>
      </div>
    </div>
  );
}
