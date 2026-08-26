'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Loader2,
  MapPin,
  ShoppingBag,
  Boxes,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  Distributor,
  DistributorStats,
  fetchDistributors,
  getDistributorStats,
} from '@/lib/distributorStore';
import AddDistributorModal from '@/components/adddistributor';
import OpenDistributorModal from '@/components/opendistributor';

export default function DistributorsDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [stats, setStats] = useState<DistributorStats>({
    totalDistributors: 0,
    totalPurchases: 0,
    totalUnitsProcured: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [distRes, statsRes] = await Promise.all([
        fetchDistributors(searchQuery),
        getDistributorStats(),
      ]);

      if (distRes.data) {
        setDistributors(distRes.data);
      }
      if (statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load distributors data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [distRes, statsRes] = await Promise.all([
          fetchDistributors(searchQuery),
          getDistributorStats(),
        ]);
        if (!mounted) return;

        if (distRes.data) {
          setDistributors(distRes.data);
        }
        if (statsRes.stats) {
          setStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Failed to load distributors data:', err);
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
  }, [searchQuery]);

  const handleOpenDistributor = (distributor: Distributor) => {
    setSelectedDistributor(distributor);
    setIsOpenModalOpen(true);
  };

  const handleDistributorAdded = () => {
    loadData(true);
  };

  const handleDistributorUpdated = (updatedDist: Distributor) => {
    setDistributors((prev) =>
      prev.map((d) => (d.id === updatedDist.id ? updatedDist : d))
    );
    loadData(true);
  };

  const handleDistributorDeleted = (deletedId: string) => {
    setDistributors((prev) => prev.filter((d) => d.id !== deletedId));
    loadData(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-distributors-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div id="distributors-dashboard-page" className="space-y-6 max-w-7xl mx-auto">
            {/* Breadcrumb & Navigation */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Link href="/admin/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="font-semibold text-[var(--text-primary)]">Distributors</span>
            </div>

      {/* Main Header & + Add Distributor Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Distributors Directory
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Manage vendors, supplier partners, locations, contact notes, and purchase order histories
          </p>
        </div>

        <button
          id="add-distributor-btn"
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="erp-btn erp-btn-primary flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Distributor</span>
        </button>
      </div>

      {/* Stat Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Distributors */}
        <div className="erp-card p-6 flex flex-col justify-between items-center text-center hover:border-[var(--border-strong)] transition-all">
          <div className="w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              TOTAL DISTRIBUTORS
            </span>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-2">
              {stats.totalDistributors}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Registered vendor suppliers
            </p>
          </div>
          <div className="mt-4 text-[var(--text-secondary)] p-2 rounded-lg bg-[var(--surface-subtle)]">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Total Purchases */}
        <div className="erp-card p-6 flex flex-col justify-between items-center text-center hover:border-[var(--border-strong)] transition-all">
          <div className="w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              TOTAL PURCHASES
            </span>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-2">
              {stats.totalPurchases}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Procurement bills recorded
            </p>
          </div>
          <div className="mt-4 text-[var(--text-secondary)] p-2 rounded-lg bg-[var(--surface-subtle)]">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Total Units Procured */}
        <div className="erp-card p-6 flex flex-col justify-between items-center text-center hover:border-[var(--border-strong)] transition-all">
          <div className="w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              TOTAL UNITS PROCURED
            </span>
            <div className="text-3xl font-bold text-[var(--text-primary)] mt-2">
              {stats.totalUnitsProcured}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Retail & godown additions
            </p>
          </div>
          <div className="mt-4 text-[var(--text-secondary)] p-2 rounded-lg bg-[var(--surface-subtle)]">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Refresh Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            id="distributor-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search distributors by name, ID code (e.g. distri-101), or location..."
            className="erp-input pl-10 pr-4 text-xs h-10 w-full"
          />
        </div>

        <button
          id="distributor-refresh-btn"
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          className="erp-btn erp-btn-outline flex items-center gap-2 bg-[var(--surface)] text-xs font-medium cursor-pointer h-10 px-4 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="erp-card overflow-hidden">
        {/* Card Header Title */}
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-subtle)]/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[var(--text-primary)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Distributors Directory ({distributors.length})
            </h2>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="erp-table w-full">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th text-center w-12 uppercase text-[11px] tracking-wider font-semibold">
                  #
                </th>
                <th className="erp-th text-left uppercase text-[11px] tracking-wider font-semibold">
                  Distributor ID
                </th>
                <th className="erp-th text-left uppercase text-[11px] tracking-wider font-semibold">
                  Distributor Name
                </th>
                <th className="erp-th text-left uppercase text-[11px] tracking-wider font-semibold">
                  Location
                </th>
                <th className="erp-th text-center uppercase text-[11px] tracking-wider font-semibold">
                  Total Purchases
                </th>
                <th className="erp-th text-center uppercase text-[11px] tracking-wider font-semibold">
                  Notes
                </th>
                <th className="erp-th text-right uppercase text-[11px] tracking-wider font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="erp-tbody divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                      <span>Loading distributors...</span>
                    </div>
                  </td>
                </tr>
              ) : distributors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Truck className="w-8 h-8 text-[var(--text-muted)]/50" />
                      <p className="font-medium text-[var(--text-secondary)]">No distributors found</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {searchQuery
                          ? 'No matching supplier records found for your search.'
                          : 'Click "+ Add Distributor" above to register your first supplier partner.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                distributors.map((distributor, idx) => (
                  <tr
                    key={distributor.id}
                    className="hover:bg-[var(--surface-subtle)]/60 transition-colors"
                  >
                    {/* Index */}
                    <td className="erp-td py-3.5 text-center text-xs text-[var(--text-muted)]">
                      {idx + 1}
                    </td>

                    {/* Distributor ID */}
                    <td className="erp-td py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {distributor.distributor_id}
                      </span>
                    </td>

                    {/* Distributor Name */}
                    <td className="erp-td py-3.5 font-semibold text-[var(--text-primary)]">
                      {distributor.distributor_name}
                    </td>

                    {/* Location */}
                    <td className="erp-td py-3.5 text-xs text-[var(--text-secondary)]">
                      {distributor.address ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                          <span>{distributor.address}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>

                    {/* Total Purchases */}
                    <td className="erp-td py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {distributor.total_purchases || 0}{' '}
                        {distributor.total_purchases === 1 ? 'bill' : 'bills'}
                      </span>
                    </td>

                    {/* Notes / Meta info */}
                    <td className="erp-td py-3.5 text-center text-xs text-[var(--text-muted)]">
                      {distributor.mobile || distributor.gstin ? (
                        <span className="text-[var(--text-secondary)]">
                          {distributor.mobile || distributor.gstin}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="erp-td py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDistributor(distributor)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] text-[var(--text-secondary)] shadow-xs transition-colors cursor-pointer"
                        title="Open & Edit Distributor"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-subtle)]/40 flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>
            Showing <strong className="text-[var(--text-primary)]">{distributors.length}</strong> of{' '}
            <strong className="text-[var(--text-primary)]">{stats.totalDistributors}</strong> registered suppliers
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Vendor Directory System
          </span>
        </div>
      </div>

      {/* Add Distributor Modal */}
      <AddDistributorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleDistributorAdded}
      />

      {/* Open Distributor Modal */}
      <OpenDistributorModal
        distributor={selectedDistributor}
        isOpen={isOpenModalOpen}
        onClose={() => {
          setIsOpenModalOpen(false);
          setSelectedDistributor(null);
        }}
        onSuccess={handleDistributorUpdated}
        onDeleteSuccess={handleDistributorDeleted}
      />
          </div>
        </main>
      </div>
    </div>
  );
}
