'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Gift,
  Plus,
  Search,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Coins,
  X,
  ImageIcon,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  fetchRewards,
  getRewardsStats,
  RewardRecord,
  RewardsStats,
} from '@/lib/adminrewardStore';

export default function AdminRewardsDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [stats, setStats] = useState<RewardsStats>({ totalRewards: 0, activeRewards: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [rewardsRes, statsRes] = await Promise.all([
        fetchRewards(),
        getRewardsStats(),
      ]);

      if (rewardsRes.error) {
        setErrorMessage(rewardsRes.error);
      } else {
        setRewards(rewardsRes.data);
      }

      if (!statsRes.error) {
        setStats(statsRes.stats);
      }
    } catch (err: any) {
      console.error('Error loading rewards dashboard:', err);
      setErrorMessage('Failed to load rewards data.');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [rewardsRes, statsRes] = await Promise.all([
          fetchRewards(),
          getRewardsStats(),
        ]);
        if (!mounted) return;

        if (rewardsRes.error) {
          setErrorMessage(rewardsRes.error);
        } else {
          setRewards(rewardsRes.data);
        }

        if (!statsRes.error) {
          setStats(statsRes.stats);
        }
      } catch (err: any) {
        if (!mounted) return;
        setErrorMessage('Failed to load rewards data.');
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
  const filteredRewards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return rewards;
    return rewards.filter((item) => {
      const name = item.name?.toLowerCase() || '';
      const desc = item.description?.toLowerCase() || '';
      const points = item.points?.toString() || '';
      return name.includes(q) || desc.includes(q) || points.includes(q);
    });
  }, [rewards, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-rewards-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Bar: Title & Add Reward Button */}
            <div
              id="admin-rewards-header"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border)] pb-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)]">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h1 id="admin-rewards-title" className="erp-page-title text-xl sm:text-2xl">
                    Rewards
                  </h1>
                </div>
                <p className="erp-small text-[var(--text-secondary)]">
                  Manage incentive catalog, redemption points threshold, and reward assets.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="admin-rewards-refresh-btn"
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
                  id="admin-add-reward-btn"
                  href="/admin/rewards/addreward"
                  className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Reward</span>
                </Link>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                id="admin-rewards-error-banner"
                className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">Notice: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Stat Card: Total Rewards Count */}
            <div id="admin-rewards-stats-grid" className="erp-grid-2">
              <div
                id="stat-total-rewards-card"
                className="erp-stat-card border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title">Total Rewards</span>
                  <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                    <Gift className="w-5 h-5" />
                  </div>
                </div>
                {statsLoading ? (
                  <div className="erp-skeleton h-8 w-24 rounded-md"></div>
                ) : (
                  <div id="stat-total-rewards-value" className="erp-stat-value">
                    {stats.totalRewards}
                  </div>
                )}
                <span className="erp-small text-[var(--text-muted)]">
                  Catalog items configured in system
                </span>
              </div>

              <div
                id="stat-active-rewards-card"
                className="erp-stat-card border-[var(--border)] hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title">Active Rewards</span>
                  <div className="p-2 rounded-lg bg-[var(--success-light)] text-[var(--success)]">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
                {statsLoading ? (
                  <div className="erp-skeleton h-8 w-24 rounded-md"></div>
                ) : (
                  <div id="stat-active-rewards-value" className="erp-stat-value text-[var(--success)]">
                    {stats.activeRewards}
                  </div>
                )}
                <span className="erp-small text-[var(--text-muted)]">
                  Currently available for associate redemption
                </span>
              </div>
            </div>

            {/* Live Typing Search Bar */}
            <div id="admin-rewards-search-card" className="erp-card p-3 sm:p-4">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
                <input
                  id="admin-rewards-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to instantly search rewards by title, points..."
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

            {/* Rewards Table List */}
            <div id="admin-rewards-table-wrapper" className="erp-card overflow-hidden">
              <div className="erp-card-header">
                <div className="flex items-center gap-2">
                  <h2 className="erp-card-title">Rewards Catalog</h2>
                  <span className="erp-badge erp-badge-secondary">
                    {filteredRewards.length} {filteredRewards.length === 1 ? 'reward' : 'rewards'}
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
              ) : filteredRewards.length === 0 ? (
                <div id="admin-rewards-empty-state" className="p-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)] flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                    {searchQuery ? 'No matching rewards found' : 'No rewards added yet'}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto mb-5">
                    {searchQuery
                      ? `We couldn't find any rewards matching "${searchQuery}".`
                      : 'Add your first reward catalog item with points and upload its media image.'}
                  </p>
                  {!searchQuery && (
                    <Link
                      id="empty-add-reward-btn"
                      href="/admin/rewards/addreward"
                      className="erp-btn erp-btn-primary erp-btn-sm inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Reward</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="erp-table-container border-0 rounded-none">
                  <table id="admin-rewards-table" className="erp-table">
                    <thead className="erp-thead">
                      <tr>
                        <th className="erp-th w-16">Image</th>
                        <th className="erp-th">Reward</th>
                        <th className="erp-th">Points</th>
                        <th className="erp-th">Status</th>
                        <th className="erp-th text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="erp-tbody">
                      {filteredRewards.map((reward) => {
                        const name = reward.name || 'Unnamed Reward';
                        const points = reward.points || 0;
                        const status = reward.status || 'active';
                        const imageUrl = reward.reward_url;

                        return (
                          <tr
                            key={reward.id}
                            id={`admin-reward-row-${reward.id}`}
                            className="hover:bg-[var(--surface-subtle)] transition-colors"
                          >
                            {/* Image very small (1*1 cm: exact 1cm x 1cm size) */}
                            <td className="erp-td w-16">
                              <div
                                id={`reward-img-container-${reward.id}`}
                                style={{ width: '1cm', height: '1cm', minWidth: '1cm', minHeight: '1cm' }}
                                className="rounded-md bg-[var(--surface-subtle)] border border-[var(--border)] overflow-hidden flex items-center justify-center relative shrink-0 shadow-2xs"
                              >
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={name}
                                    style={{ width: '1cm', height: '1cm' }}
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                      // Fallback on image load error
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <ImageIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                )}
                              </div>
                            </td>

                            {/* Reward Details */}
                            <td className="erp-td">
                              <div>
                                <span className="font-medium text-[var(--text-primary)] block">
                                  {name}
                                </span>
                                {reward.description && (
                                  <span className="text-xs text-[var(--text-secondary)] line-clamp-1 max-w-md mt-0.5">
                                    {reward.description}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Points with Coin badge */}
                            <td className="erp-td">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning-border)] font-semibold text-xs">
                                <Coins className="w-3.5 h-3.5 shrink-0" />
                                <span>{points.toLocaleString()} pts</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="erp-td">
                              <span
                                className={`erp-badge ${
                                  status === 'active' ? 'erp-badge-success' : 'erp-badge-secondary'
                                }`}
                              >
                                <span className="erp-badge-dot"></span>
                                {status === 'active' ? 'Active' : 'Inactive'}
                              </span>
                            </td>

                            {/* Open button */}
                            <td className="erp-td text-right">
                              <Link
                                id={`open-reward-btn-${reward.id}`}
                                href={`/admin/rewards/openreward?id=${reward.id}`}
                                className="erp-btn erp-btn-outline erp-btn-sm inline-flex items-center gap-1.5"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3 text-[var(--text-secondary)]" />
                              </Link>
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
