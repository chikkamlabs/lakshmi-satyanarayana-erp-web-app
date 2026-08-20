'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Save,
  User,
  Mail,
  Phone,
  Hash,
  Coins,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  Shield,
  RefreshCw,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  fetchAssociateById,
  updateAssociate,
  AssociateRecord,
  UpdateAssociateInput,
  fetchAssociates,
} from '@/lib/adminassociateStore';

function OpenAssociateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const associateIdParam = searchParams.get('id') || '';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(Boolean(associateIdParam));
  const [isSaving, setIsSaving] = useState(false);
  const [associate, setAssociate] = useState<AssociateRecord | null>(null);
  const [allAssociates, setAllAssociates] = useState<AssociateRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>(associateIdParam);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<UpdateAssociateInput>({
    id: '',
    associate_id: '',
    name: '',
    email: '',
    mobile: '',
    current_points: 0,
    status: 'active',
  });

  const reloadCurrentAssociate = useCallback(async (idToLoad: string) => {
    if (!idToLoad) return;
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetchAssociateById(idToLoad);
      if (res.error) {
        setErrorMessage(res.error);
        setAssociate(null);
      } else if (res.data) {
        setAssociate(res.data);
        setFormData({
          id: res.data.id,
          associate_id: res.data.associate_id,
          name: res.data.profile?.name || '',
          email: res.data.profile?.email || '',
          mobile: res.data.profile?.mobile || '',
          current_points: res.data.current_points ?? 0,
          status: res.data.profile?.status || 'active',
        });
      }
    } catch (err: any) {
      console.error('Error loading associate:', err);
      setErrorMessage('Failed to load associate details.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch list of all associates if needed for quick switcher
  useEffect(() => {
    let mounted = true;
    async function loadDirectory() {
      try {
        const res = await fetchAssociates();
        if (mounted && !res.error && res.data) {
          setAllAssociates(res.data);
        }
      } catch (e) {
        console.error('Error fetching directory:', e);
      }
    }
    loadDirectory();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!associateIdParam) {
      return;
    }

    async function loadData() {
      try {
        const res = await fetchAssociateById(associateIdParam);
        if (!mounted) return;

        if (res.error) {
          setErrorMessage(res.error);
          setAssociate(null);
        } else if (res.data) {
          setAssociate(res.data);
          setFormData({
            id: res.data.id,
            associate_id: res.data.associate_id,
            name: res.data.profile?.name || '',
            email: res.data.profile?.email || '',
            mobile: res.data.profile?.mobile || '',
            current_points: res.data.current_points ?? 0,
            status: res.data.profile?.status || 'active',
          });
        }
      } catch (err: any) {
        if (mounted) {
          setErrorMessage('Failed to load associate details.');
        }
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
  }, [associateIdParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'current_points' ? Math.max(0, parseInt(value, 10) || 0) : value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSelectAssociate = (newId: string) => {
    setSelectedId(newId);
    if (newId) {
      router.push(`/admin/associates/openassociate?id=${newId}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim() || !formData.associate_id.trim()) {
      setErrorMessage('All fields (Name, Email, Mobile, Associate ID) are required.');
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateAssociate(formData);

      if (result.error) {
        setErrorMessage(result.error);
      } else if (result.data) {
        setAssociate(result.data);
        setSuccessMessage('Associate details have been successfully updated!');
      }
    } catch (err: any) {
      console.error('Update error:', err);
      setErrorMessage(err?.message || 'Failed to update associate.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="open-associate-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Top Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4">
              <Link
                id="open-back-to-associates-link"
                href="/admin/associates/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Associates Directory</span>
              </Link>

              {/* Associate Quick Selector */}
              {allAssociates.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] font-medium hidden sm:inline">
                    Select Associate:
                  </span>
                  <select
                    id="associate-switcher-select"
                    value={selectedId}
                    onChange={(e) => handleSelectAssociate(e.target.value)}
                    className="erp-select text-xs py-1 px-2.5 max-w-xs"
                  >
                    <option value="">-- Choose an Associate --</option>
                    {allAssociates.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.profile?.name || 'Unnamed'} ({a.associate_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Alert Messages */}
            {errorMessage && (
              <div
                id="open-associate-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3 text-sm erp-fade-in"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Error: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {successMessage && (
              <div
                id="open-associate-success-banner"
                className="p-4 rounded-lg bg-[var(--success-light)] border border-[var(--success)] text-[var(--success)] flex items-start gap-3 text-sm erp-fade-in"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Updated: </span>
                  {successMessage}
                </div>
              </div>
            )}

            {loading ? (
              <div className="erp-card p-8 space-y-4">
                <div className="erp-skeleton h-12 w-1/3 rounded-md"></div>
                <div className="erp-skeleton h-10 w-full rounded-md"></div>
                <div className="erp-skeleton h-10 w-full rounded-md"></div>
                <div className="erp-skeleton h-10 w-full rounded-md"></div>
              </div>
            ) : !associate ? (
              <div id="no-associate-selected" className="erp-card p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  {selectedId ? 'Associate Not Found' : 'No Associate Selected'}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-6">
                  {selectedId
                    ? 'The requested associate record could not be found or may have been removed.'
                    : 'Please select an associate from the dropdown above or return to the directory.'}
                </p>
                <Link
                  href="/admin/associates/dashboard"
                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Go to Directory</span>
                </Link>
              </div>
            ) : (
              /* Associate Edit Card */
              <div id="edit-associate-card" className="erp-card erp-slide-up">
                {/* Header with Quick Badge Summary */}
                <div className="erp-card-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                      <Edit className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 id="open-associate-title" className="erp-card-title text-lg font-bold">
                          {associate.profile?.name || 'Associate Details'}
                        </h1>
                        <span
                          className={`erp-badge ${
                            formData.status === 'active' ? 'erp-badge-success' : 'erp-badge-danger'
                          }`}
                        >
                          <span className="erp-badge-dot"></span>
                          {formData.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="erp-card-subtitle text-xs">
                        Associate ID: <span className="font-mono font-bold text-[var(--text-primary)]">{formData.associate_id}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--warning-light)] text-[var(--warning)] font-bold text-sm border border-[var(--border)]">
                      <Coins className="w-4 h-4 erp-coin-animated" />
                      <span>{formData.current_points} Points</span>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSubmit} className="erp-card-body space-y-6">
                  
                  {/* Grid 1: Basic Identifiers */}
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] pb-1">
                      Associate Table Attributes
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Associate ID */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit_associate_id" className="erp-label flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Associate ID *</span>
                        </label>
                        <input
                          id="edit_associate_id"
                          name="associate_id"
                          type="text"
                          required
                          value={formData.associate_id}
                          onChange={handleChange}
                          className="erp-input"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Current Points */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit_current_points" className="erp-label flex items-center gap-1.5">
                          <Coins className="w-3.5 h-3.5 text-[var(--warning)]" />
                          <span>Current Points *</span>
                        </label>
                        <input
                          id="edit_current_points"
                          name="current_points"
                          type="number"
                          min="0"
                          required
                          value={formData.current_points}
                          onChange={handleChange}
                          className="erp-input"
                          disabled={isSaving}
                        />
                        <p className="erp-helper-text">Directly update associate points balance</p>
                      </div>
                    </div>
                  </div>

                  {/* Grid 2: Profile & Contact Attributes */}
                  <div className="space-y-4 pt-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] pb-1">
                      Profile Attributes (Profiles Table)
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="erp-form-group mb-0 sm:col-span-2">
                        <label htmlFor="edit_name" className="erp-label flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          id="edit_name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="erp-input"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Email */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit_email" className="erp-label flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Email Address *</span>
                        </label>
                        <input
                          id="edit_email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="erp-input"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Mobile */}
                      <div className="erp-form-group mb-0">
                        <label htmlFor="edit_mobile" className="erp-label flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Mobile Number *</span>
                        </label>
                        <input
                          id="edit_mobile"
                          name="mobile"
                          type="tel"
                          required
                          value={formData.mobile}
                          onChange={handleChange}
                          className="erp-input"
                          disabled={isSaving}
                        />
                      </div>

                      {/* Status */}
                      <div className="erp-form-group mb-0 sm:col-span-2">
                        <label htmlFor="edit_status" className="erp-label flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Account Status</span>
                        </label>
                        <select
                          id="edit_status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="erp-select"
                          disabled={isSaving}
                        >
                          <option value="active">Active (Access allowed)</option>
                          <option value="inactive">Inactive (Account locked)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* System & Metadata (Read-Only) */}
                  <div className="p-3.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)] space-y-2 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        Auth User ID:
                      </span>
                      <span className="font-mono text-[var(--text-primary)]">{associate.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        Registered On:
                      </span>
                      <span>
                        {associate.created_at
                          ? new Date(associate.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Submit Button Controls */}
                  <div className="pt-4 flex items-center justify-between border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => reloadCurrentAssociate(associate.id)}
                      disabled={isSaving}
                      className="erp-btn erp-btn-ghost erp-btn-sm inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <Link
                        href="/admin/associates/dashboard"
                        className="erp-btn erp-btn-secondary erp-btn-sm"
                      >
                        Cancel
                      </Link>

                      <button
                        id="save-associate-btn"
                        type="submit"
                        disabled={isSaving}
                        className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2 cursor-pointer"
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
    </div>
  );
}

export default function OpenAssociatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <OpenAssociateContent />
    </Suspense>
  );
}
