'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Loader2,
  Gift,
  Search,
  Sparkles,
  CheckCircle2,
  Lock,
  RefreshCw,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import AssociateHeader from '../header/page';
import AssociateSidebar from '../sidebar/page';
import { fetchActiveRewards, RewardRecord } from '@/lib/adminrewardStore';
import { fetchCurrentAssociatePoints } from '@/lib/associatepointsStore';

export default function AssociateDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Associate Points State
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loadingPoints, setLoadingPoints] = useState<boolean>(true);

  // Rewards State
  const [rewards, setRewards] = useState<RewardRecord[]>([]);
  const [loadingRewards, setLoadingRewards] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initial Data Load
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const [pointsRes, rewardsRes] = await Promise.all([
          fetchCurrentAssociatePoints(),
          fetchActiveRewards(),
        ]);

        if (!active) return;

        if (pointsRes.error) {
          console.error('Error loading points:', pointsRes.error);
          setUserPoints(0);
        } else {
          setUserPoints(pointsRes.points ?? 0);
        }

        if (rewardsRes.error) {
          setErrorMessage(rewardsRes.error);
          setRewards([]);
        } else {
          setRewards(rewardsRes.data || []);
        }
      } catch (err: any) {
        if (!active) return;
        console.error('Failed to load initial data:', err);
        setErrorMessage(err?.message || 'Failed to load rewards');
      } finally {
        if (active) {
          setLoadingPoints(false);
          setLoadingRewards(false);
        }
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  // Filter or search rewards
  const searchRewards = useCallback(async (query: string) => {
    setLoadingRewards(true);
    setErrorMessage(null);
    try {
      const res = await fetchActiveRewards(query);
      if (res.error) {
        setErrorMessage(res.error);
        setRewards([]);
      } else {
        setRewards(res.data || []);
      }
    } catch (err: any) {
      console.error('Error searching rewards:', err);
      setErrorMessage(err?.message || 'Search failed');
      setRewards([]);
    } finally {
      setLoadingRewards(false);
    }
  }, []);

  // Handle Search Input
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchQuery(val);
    searchRewards(val);
  }

  async function handleRefreshAll() {
    setLoadingPoints(true);
    setLoadingRewards(true);
    try {
      const [pointsRes, rewardsRes] = await Promise.all([
        fetchCurrentAssociatePoints(),
        fetchActiveRewards(searchQuery),
      ]);

      if (pointsRes.error) {
        setUserPoints(0);
      } else {
        setUserPoints(pointsRes.points ?? 0);
      }

      if (rewardsRes.error) {
        setErrorMessage(rewardsRes.error);
        setRewards([]);
      } else {
        setRewards(rewardsRes.data || []);
      }
    } catch (err: any) {
      console.error('Failed to refresh data:', err);
    } finally {
      setLoadingPoints(false);
      setLoadingRewards(false);
    }
  }

  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AssociateHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AssociateSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar with Points Widget */}
          <div
            id="associate-top-bar"
            className="w-full px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-10 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[var(--warning-light)] text-[var(--warning)]">
                <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] leading-tight">
                  Rewards Catalog
                </h1>
                <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] hidden xs:block">
                  Redeem your earned points for exciting rewards
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                id="associate-points-badge-btn"
                type="button"
                onClick={() => router.push('/associate/points')}
                className="erp-btn erp-btn-outline erp-card-interactive inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-[var(--surface)] border-[var(--border)] shadow-xs hover:border-[var(--warning)] hover:bg-[var(--warning-light)]/30 transition-all cursor-pointer"
                title="View your points transactions ledger"
              >
                <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--warning)] erp-coin-animated shrink-0" />
                <div className="flex items-center gap-1.5 text-left">
                  <span className="text-xs text-[var(--text-secondary)] font-medium hidden sm:inline">
                    My Points:
                  </span>
                  {loadingPoints ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />
                  ) : (
                    <span
                      id="associate-points-counter"
                      className="font-bold text-sm sm:text-base text-[var(--text-primary)] tracking-tight font-mono"
                    >
                      {userPoints} <span className="text-xs font-normal text-[var(--warning-dark)]">pts</span>
                    </span>
                  )}
                </div>
              </button>

              <button
                id="associate-refresh-btn"
                type="button"
                onClick={handleRefreshAll}
                disabled={loadingRewards || loadingPoints}
                className="erp-btn erp-btn-outline p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Refresh Rewards & Points"
              >
                <RefreshCw className={`w-4 h-4 ${loadingRewards ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <main id="associate-rewards-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in max-w-5xl mx-auto w-full">
            <div className="space-y-6">

              {/* Search and Summary Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none z-1" />
                  <input
                    id="associate-search-rewards-input"
                    type="text"
                    placeholder="Search rewards by name..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="erp-input !pl-10 pr-3 py-2 text-sm w-full bg-[var(--background)] border-[var(--border)] focus:bg-[var(--surface)]"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-subtle)] border border-[var(--border)]">
                    <Award className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <strong>{rewards.length}</strong> {rewards.length === 1 ? 'Active Reward' : 'Active Rewards'}
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[var(--success)]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Active
                  </span>
                </div>
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-4 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] text-sm flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    onClick={() => searchRewards(searchQuery)}
                    className="text-xs font-bold underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Loading State */}
              {loadingRewards ? (
                <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5 sm:gap-3.5 md:gap-5">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="erp-card bg-[var(--surface)] border border-[var(--border)] rounded-xl sm:rounded-2xl overflow-hidden animate-pulse flex flex-col md:flex-row"
                    >
                      <div className="w-full md:w-60 lg:w-64 aspect-square bg-[var(--surface-subtle)] shrink-0" />
                      <div className="p-3 sm:p-5 flex-1 space-y-2.5">
                        <div className="h-4 bg-[var(--surface-subtle)] rounded w-3/4" />
                        <div className="h-3 bg-[var(--surface-subtle)] rounded w-1/2" />
                        <div className="h-2 bg-[var(--surface-subtle)] rounded w-full mt-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : rewards.length === 0 ? (
                /* Empty State */
                <div
                  id="associate-no-rewards-card"
                  className="erp-card p-8 sm:p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-xl space-y-3"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--warning-light)] text-[var(--warning)] flex items-center justify-center mx-auto">
                    <Gift className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                    {searchQuery ? 'No matching rewards found' : 'No active rewards available right now'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                    {searchQuery
                      ? `No active rewards match "${searchQuery}". Try clearing your search query.`
                      : 'Please check back soon! New exciting incentives and rewards will be added by the administrator.'}
                  </p>
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        searchRewards('');
                      }}
                      className="erp-btn erp-btn-secondary erp-btn-sm mt-2"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                /* Active Rewards Grid (Flipkart 2-col style on mobile, Horizontal on desktop) */
                <div id="associate-rewards-feed" className="grid grid-cols-2 md:grid-cols-1 gap-2.5 sm:gap-3.5 md:gap-5">
                  {rewards.map((reward) => {
                    const isEligible = userPoints >= reward.points;
                    const pointsNeeded = reward.points - userPoints;
                    const progressPercent = Math.min(100, Math.round((userPoints / reward.points) * 100));

                    return (
                      <article
                        key={reward.id}
                        id={`reward-card-${reward.id}`}
                        className="erp-card bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row"
                      >
                        {/* =========================================
                            MOBILE VIEW: Flipkart 2-Col E-commerce Card (< md)
                            ========================================= */}
                        <div className="flex md:hidden flex-col h-full justify-between">
                          {/* Square Image Box */}
                          <div className="relative w-full aspect-square bg-[var(--surface-subtle)] flex items-center justify-center overflow-hidden border-b border-[var(--border-subtle)]">
                            {reward.reward_url ? (
                              <Image
                                src={reward.reward_url}
                                alt={reward.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 320px"
                                className="object-cover object-center"
                                referrerPolicy="no-referrer"
                                unoptimized={reward.reward_url.startsWith('data:') || reward.reward_url.startsWith('blob:')}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-1 text-[var(--text-muted)]">
                                <Gift className="w-8 h-8 text-[var(--warning)]" />
                                <span className="text-[10px]">Reward</span>
                              </div>
                            )}

                            {/* Prominent Large Points Badge (Mobile) */}
                            <div className="absolute top-2 right-2 z-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface)]/95 backdrop-blur-xs text-[var(--warning-dark)] font-extrabold text-xs sm:text-sm font-mono border border-[var(--border)] shadow-sm">
                                <Coins className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
                                {reward.points} <span className="text-[10px] font-semibold text-[var(--text-secondary)]">pts</span>
                              </span>
                            </div>
                          </div>

                          {/* Details & Progress Box */}
                          <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                            <div>
                              <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] leading-tight line-clamp-1">
                                {reward.name}
                              </h3>
                              {reward.description && (
                                <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5 leading-tight">
                                  {reward.description}
                                </p>
                              )}
                            </div>

                            {/* Compact Points Progress */}
                            <div className="space-y-1 pt-1 border-t border-[var(--border-subtle)]">
                              <div className="w-full h-1.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isEligible ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] leading-none pt-0.5">
                                {isEligible ? (
                                  <span className="text-[var(--success)] font-bold inline-flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                    Eligible
                                  </span>
                                ) : (
                                  <span className="text-[var(--text-secondary)] font-mono text-[10px]">
                                    Need {pointsNeeded} pts
                                  </span>
                                )}
                                <span className="font-mono text-[10px] text-[var(--text-muted)] font-semibold">
                                  {progressPercent}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* =========================================
                            DESKTOP VIEW: Horizontal Card (>= md)
                            ========================================= */}
                        <div className="hidden md:flex flex-row w-full items-stretch">
                          {/* Square Image Box (Left Column) */}
                          <div className="relative w-56 lg:w-64 min-w-[224px] lg:min-w-[256px] aspect-square bg-[var(--surface-subtle)] flex items-center justify-center overflow-hidden shrink-0 border-r border-[var(--border)]">
                            {reward.reward_url ? (
                              <Image
                                src={reward.reward_url}
                                alt={reward.name}
                                fill
                                sizes="256px"
                                className="object-cover object-center transition-transform duration-500 hover:scale-105"
                                referrerPolicy="no-referrer"
                                unoptimized={reward.reward_url.startsWith('data:') || reward.reward_url.startsWith('blob:')}
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2 p-6 text-[var(--text-muted)] text-center">
                                <div className="w-14 h-14 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--warning)] shadow-xs">
                                  <Gift className="w-7 h-7" />
                                </div>
                                <span className="text-xs font-medium">Reward Item</span>
                              </div>
                            )}

                            {/* Active Tag */}
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--surface)]/90 backdrop-blur-xs text-[var(--text-primary)] border border-[var(--border)] shadow-xs">
                                <span className="w-2 h-2 rounded-full bg-[var(--success)] inline-block"></span>
                                Active
                              </span>
                            </div>
                          </div>

                          {/* Content Box (Right Column) */}
                          <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h2 className="text-lg lg:text-xl font-bold text-[var(--text-primary)] leading-tight">
                                    {reward.name}
                                  </h2>
                                  <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Added {formatDate(reward.created_at)}
                                  </span>
                                </div>

                                {/* Big Prominent Points Badge (Desktop) */}
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--warning-light)] text-[var(--warning-dark)] border border-[var(--warning)]/40 font-extrabold text-base lg:text-lg shadow-xs shrink-0 font-mono">
                                  <Coins className="w-5 h-5 text-[var(--warning)] shrink-0" />
                                  <span>{reward.points}</span>
                                  <span className="text-xs font-semibold text-[var(--text-secondary)]">Points</span>
                                </div>
                              </div>

                              {reward.description ? (
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                                  {reward.description}
                                </p>
                              ) : (
                                <p className="text-xs text-[var(--text-muted)] italic">
                                  No additional description provided.
                                </p>
                              )}
                            </div>

                            {/* Progress & Eligibility */}
                            <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5 text-[var(--warning)]" />
                                  Points Progress
                                </span>
                                <span className="font-mono text-xs font-semibold text-[var(--text-primary)]">
                                  {userPoints} / {reward.points} pts ({progressPercent}%)
                                </span>
                              </div>

                              <div className="w-full h-2.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border)]">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isEligible ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                {isEligible ? (
                                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--success)] bg-[var(--success-light)] px-3 py-1.5 rounded-lg border border-[var(--success)]/30">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    <span>You have enough points to claim this reward!</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-subtle)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                                    <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                                    <span>
                                      Need <strong className="text-[var(--warning-dark)] font-mono">{pointsNeeded}</strong> more pts to claim
                                    </span>
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => router.push('/associate/points')}
                                  className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] inline-flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <span>Points history</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
