'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Coins,
  UserPlus,
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Phone,
  X,
  PlusCircle,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  fetchAssociates,
  getAssociatesStats,
  AssociateRecord,
  AssociatesStats,
} from '@/lib/adminassociateStore';

export default function AdminAssociatesDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [associates, setAssociates] = useState<AssociateRecord[]>([]);
  const [stats, setStats] = useState<AssociatesStats>({ totalAssociates: 0, totalPoints: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [assocRes, statsRes] = await Promise.all([
        fetchAssociates(),
        getAssociatesStats(),
      ]);

      if (assocRes.error) {
        setErrorMessage(assocRes.error);
      } else {
        setAssociates(assocRes.data);
      }

      if (!statsRes.error) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      console.error('Error loading associates dashboard:', err);
      setErrorMessage('Failed to load associates data.');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [assocRes, statsRes] = await Promise.all([
          fetchAssociates(),
          getAssociatesStats(),
        ]);
        if (!mounted) return;

        if (assocRes.error) {
          setErrorMessage(assocRes.error);
        } else {
          setAssociates(assocRes.data);
        }

        if (!statsRes.error) {
          setStats(statsRes.stats);
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage('Failed to load associates data.');
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
  const filteredAssociates = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return associates;
    return associates.filter((item) => {
      const name = item.profile?.name?.toLowerCase() || '';
      const mobile = item.profile?.mobile?.toLowerCase() || '';
      const assocId = item.associate_id?.toLowerCase() || '';
      const email = item.profile?.email?.toLowerCase() || '';
      return name.includes(q) || mobile.includes(q) || assocId.includes(q) || email.includes(q);
    });
  }, [associates, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-associates-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Bar: Title & Create Associate Button */}
            <div
              id="admin-associates-header"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)]">
                    <Users className="w-5 h-5" />
                  </div>
                  <h1 id="admin-associates-title" className="erp-page-title text-xl sm:text-2xl">
                    Associates
                  </h1>
                </div>
                <p className="erp-small text-[var(--text-secondary)]">
                  Manage field associates, monitor distributed points, and configure access.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="admin-associates-refresh-btn"
                  type="button"
                  onClick={() => loadData()}
                  disabled={loading}
                  className="erp-btn erp-btn-outline erp-btn-sm"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <Link
                  id="admin-create-associate-btn"
                  href="/admin/associates/addassociate"
                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Associate</span>
                </Link>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                id="admin-associates-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Notice: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Stat Cards: Total Associates & Total Points */}
            <div id="admin-associates-stats-grid" className="erp-grid-2">
              {/* Stat 1: Total Associates */}
              <div
                id="stat-total-associates-card"
                className="erp-stat-card border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title">Total Associates</span>
                  <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                {statsLoading ? (
                  <div className="erp-skeleton h-8 w-24 rounded-md"></div>
                ) : (
                  <div id="stat-total-associates-value" className="erp-stat-value">
                    {stats.totalAssociates}
                  </div>
                )}
                <span className="erp-small text-[var(--text-muted)]">
                  Registered associate accounts
                </span>
              </div>

              {/* Stat 2: Total Points */}
              <div
                id="stat-total-points-card"
                className="erp-stat-card border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title">Total Points</span>
                  <div className="p-2 rounded-lg bg-[var(--warning-light)] text-[var(--warning)]">
                    <Coins className="w-5 h-5 erp-coin-animated" />
                  </div>
                </div>
                {statsLoading ? (
                  <div className="erp-skeleton h-8 w-28 rounded-md"></div>
                ) : (
                  <div id="stat-total-points-value" className="erp-stat-value text-[var(--text-primary)]">
                    {stats.totalPoints.toLocaleString()}
                  </div>
                )}
                <span className="erp-small text-[var(--text-muted)]">
                  Cumulative points across all associates
                </span>
              </div>
            </div>

            {/* Live Typing Search Bar */}
            <div id="admin-associates-search-card" className="erp-card p-3 sm:p-4">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
                <input
                  id="admin-associates-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to instantly search by name, mobile, associate ID..."
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

            {/* Associates Table List */}
            <div id="admin-associates-table-wrapper" className="erp-card overflow-hidden">
              <div className="erp-card-header">
                <div className="flex items-center gap-2">
                  <h2 className="erp-card-title">Associates Directory</h2>
                  <span className="erp-badge erp-badge-secondary">
                    {filteredAssociates.length} {filteredAssociates.length === 1 ? 'record' : 'records'}
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
              ) : filteredAssociates.length === 0 ? (
                <div id="admin-associates-empty-state" className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    {searchQuery ? 'No matching associates found' : 'No associates added yet'}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-5">
                    {searchQuery
                      ? `We couldn't find any associate matching "${searchQuery}". Check the name, mobile number, or associate ID.`
                      : 'Get started by onboarding your first associate to assign points and track bills.'}
                  </p>
                  {!searchQuery && (
                    <Link
                      id="empty-create-associate-btn"
                      href="/admin/associates/addassociate"
                      className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Create Associate</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="erp-table-container border-0 rounded-none">
                  <table id="admin-associates-table" className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th">Name & ID</th>
                        <th className="erp-th">Mobile</th>
                        <th className="erp-th">Current Points</th>
                        <th className="erp-th text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="erp-tbody">
                      {filteredAssociates.map((assoc) => {
                        const name = assoc.profile?.name || 'Unnamed Associate';
                        const mobile = assoc.profile?.mobile || 'No Mobile';
                        const assocId = assoc.associate_id || 'N/A';
                        const currentPoints = assoc.current_points ?? 0;
                        const status = assoc.profile?.status || 'active';

                        return (
                          <tr key={assoc.id} id={`associate-row-${assoc.id}`}>
                            {/* Name & ID Column */}
                            <td className="erp-td">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-[var(--text-primary)]">
                                    {name}
                                  </span>
                                  {status === 'active' ? (
                                    <span className="erp-badge erp-badge-success text-[10px] py-0 px-1.5">
                                      <span className="erp-badge-dot"></span>
                                      Active
                                    </span>
                                  ) : (
                                    <span className="erp-badge erp-badge-danger text-[10px] py-0 px-1.5">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                <span className="erp-code mt-0.5 text-xs text-[var(--text-secondary)] inline-block w-fit">
                                  ID: {assocId}
                                </span>
                              </div>
                            </td>

                            {/* Mobile Column */}
                            <td className="erp-td">
                              <div className="flex items-center gap-1.5 text-sm text-[var(--text-primary)]">
                                <Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span>{mobile}</span>
                              </div>
                            </td>

                            {/* Current Points Column */}
                            <td className="erp-td">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--warning-light)] text-[var(--warning)] font-bold text-sm">
                                <Coins className="w-4 h-4 erp-coin-animated" />
                                <span id={`associate-points-${assoc.id}`}>{currentPoints}</span>
                              </div>
                            </td>

                            {/* Action: Add Transaction, Points & Open Buttons Column */}
                            <td className="erp-td text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  id={`add-transc-btn-${assoc.id}`}
                                  href={`/admin/associates/addtransc?id=${assoc.id}`}
                                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-1.5"
                                  title="Add points transaction for associate"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Add Trans</span>
                                </Link>

                                <Link
                                  id={`points-associate-btn-${assoc.id}`}
                                  href={`/admin/associates/updatepoints?id=${assoc.id}`}
                                  className="erp-btn erp-btn-secondary erp-btn-sm inline-flex items-center gap-1.5 hover:border-[var(--warning)] hover:text-[var(--warning-dark)]"
                                  title="Manage and update points"
                                >
                                  <Coins className="w-3.5 h-3.5 text-[var(--warning)]" />
                                  <span>Points</span>
                                </Link>

                                <Link
                                  id={`open-associate-btn-${assoc.id}`}
                                  href={`/admin/associates/openassociate?id=${assoc.id}`}
                                  className="erp-btn erp-btn-outline erp-btn-sm inline-flex items-center gap-1.5 hover:bg-[var(--surface-subtle)]"
                                >
                                  <span>Open</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-[var(--primary)]" />
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
    </div>
  );
}
