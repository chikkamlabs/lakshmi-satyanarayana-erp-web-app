'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Lock,
  Mail,
  Phone,
  User,
  Hash,
  Coins,
  Activity,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import { createAssociate, suggestNextAssociateId, CreateAssociateInput } from '@/lib/adminassociateStore';

export default function AddAssociatePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAssociateInput>({
    associate_id: '',
    name: '',
    email: '',
    mobile: '',
    password: '',
    current_points: 0,
    status: 'active',
  });

  useEffect(() => {
    suggestNextAssociateId().then((nextId) => {
      setFormData((prev) => ({
        ...prev,
        associate_id: prev.associate_id || nextId,
      }));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'current_points' ? Number(value) : value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.name.trim()) {
      setErrorMessage('Please enter the associate\'s full name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!formData.mobile.trim()) {
      setErrorMessage('Please enter a valid mobile phone number.');
      return;
    }

    if (!formData.associate_id.trim()) {
      setErrorMessage('Please enter a unique Associate ID (e.g. ASC-101).');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createAssociate(formData);

      if (result.error) {
        setErrorMessage(result.error);
      } else {
        setSuccessMessage(`Associate "${formData.name}" created successfully with ID: ${formData.associate_id}!`);
        // Reset form or navigate after short delay
        setTimeout(() => {
          router.push('/admin/associates/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMessage(err?.message || 'Failed to create associate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="add-associate-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-3xl mx-auto space-y-6">

            {/* Breadcrumb & Navigation */}
            <div className="flex items-center justify-between">
              <Link
                id="back-to-associates-link"
                href="/admin/associates/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Associates Directory</span>
              </Link>
            </div>

            {/* Card Form */}
            <div id="add-associate-card" className="erp-card erp-slide-up">
              {/* Header */}
              <div className="erp-card-header">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 id="add-associate-title" className="erp-card-title text-lg font-bold">
                      Create New Associate
                    </h1>
                    <p className="erp-card-subtitle">
                      Provision credentials in Supabase Auth and configure profile & initial points.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="erp-card-body space-y-5">
                {/* Feedback Alerts */}
                {errorMessage && (
                  <div
                    id="add-associate-error"
                    className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3 text-sm erp-fade-in"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Creation Error: </span>
                      {errorMessage}
                    </div>
                  </div>
                )}

                {successMessage && (
                  <div
                    id="add-associate-success"
                    className="p-4 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] flex items-start gap-3 text-sm erp-fade-in"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Success! </span>
                      {successMessage}
                    </div>
                  </div>
                )}

                {/* Section 1: Associate Identification */}
                <div className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] pb-1">
                    1. Associate Details (Associates Table)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Associate ID */}
                    <div className="erp-form-group mb-0">
                      <label htmlFor="associate_id" className="erp-label flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Associate ID *</span>
                      </label>
                      <input
                        id="associate_id"
                        name="associate_id"
                        type="text"
                        required
                        value={formData.associate_id}
                        onChange={handleChange}
                        placeholder="e.g. ASC-101 or ASC001"
                        className="erp-input"
                        disabled={isSubmitting}
                      />
                      <p className="erp-helper-text">Unique alphanumeric identifier</p>
                    </div>

                    {/* Initial Current Points */}
                    <div className="erp-form-group mb-0">
                      <label htmlFor="current_points" className="erp-label flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-[var(--warning)]" />
                        <span>Initial Current Points</span>
                      </label>
                      <input
                        id="current_points"
                        name="current_points"
                        type="number"
                        min="0"
                        value={formData.current_points}
                        onChange={handleChange}
                        placeholder="0"
                        className="erp-input"
                        disabled={isSubmitting}
                      />
                      <p className="erp-helper-text">Starting points balance (default 0)</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Profile & Contact Information */}
                <div className="space-y-4 pt-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] pb-1">
                    2. Profile & Contact Information (Profiles Table)
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="erp-form-group mb-0 sm:col-span-2">
                      <label htmlFor="name" className="erp-label flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Full Name *</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Ramesh Kumar"
                        className="erp-input"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Email */}
                    <div className="erp-form-group mb-0">
                      <label htmlFor="email" className="erp-label flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Email Address *</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="associate@example.com"
                        className="erp-input"
                        disabled={isSubmitting}
                      />
                      <p className="erp-helper-text">Used for auth login & notifications</p>
                    </div>

                    {/* Mobile */}
                    <div className="erp-form-group mb-0">
                      <label htmlFor="mobile" className="erp-label flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Mobile Number *</span>
                      </label>
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        required
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="e.g. 9876543210"
                        className="erp-input"
                        disabled={isSubmitting}
                      />
                      <p className="erp-helper-text">Unique mobile number for identification</p>
                    </div>

                    {/* Status */}
                    <div className="erp-form-group mb-0 sm:col-span-2">
                      <label htmlFor="status" className="erp-label flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Account Status</span>
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="erp-select"
                        disabled={isSubmitting}
                      >
                        <option value="active">Active (Can log in and earn points)</option>
                        <option value="inactive">Inactive (Account suspended)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Supabase Auth Password */}
                <div className="space-y-4 pt-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] pb-1">
                    3. Credentials (auth.users)
                  </h2>

                  <div className="erp-form-group mb-0">
                    <label htmlFor="password" className="erp-label flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 6 characters password"
                        className="erp-input erp-input-icon-right"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        tabIndex={-1}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="erp-helper-text">
                      The associate will use this email and password to log in to the Associate Portal.
                    </p>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--border)]">
                  <Link
                    href="/admin/associates/dashboard"
                    className="erp-btn erp-btn-secondary erp-btn-sm"
                  >
                    Cancel
                  </Link>

                  <button
                    id="submit-create-associate-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating Associate...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Create Associate</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
