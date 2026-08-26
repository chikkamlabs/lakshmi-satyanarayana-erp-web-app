'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  Category,
  CategoryStats,
  fetchCategories,
  getCategoryStats,
} from '@/lib/categoriesStore';
import AddCategoryModal from '@/components/addcategory';
import OpenCategoryModal from '@/components/opencategory';

export default function CategoryDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<CategoryStats>({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [catRes, statsRes] = await Promise.all([
        fetchCategories(searchQuery, statusFilter),
        getCategoryStats(),
      ]);

      if (catRes.data) {
        setCategories(catRes.data);
      }
      if (statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load category data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [catRes, statsRes] = await Promise.all([
          fetchCategories(searchQuery, statusFilter),
          getCategoryStats(),
        ]);
        if (!mounted) return;

        if (catRes.data) {
          setCategories(catRes.data);
        }
        if (statsRes.stats) {
          setStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Failed to load category data:', err);
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
  }, [searchQuery, statusFilter]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleOpenCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsOpenModalOpen(true);
  };

  const handleCategoryAdded = () => {
    loadData(true);
  };

  const handleCategoryUpdated = (updatedCat: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCat.id ? updatedCat : c))
    );
    loadData(true);
  };

  const handleCategoryDeleted = (deletedId: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== deletedId));
    loadData(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-categories-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div id="category-dashboard-page" className="space-y-6 max-w-7xl mx-auto">
            {/* Breadcrumb & Top Bar */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Link href="/admin/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="font-semibold text-[var(--text-primary)]">Categories</span>
            </div>

      {/* Main Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-[var(--text-primary)]" />
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Category Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Manage product categories and inventory classifications
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            id="category-refresh-btn"
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="erp-btn erp-btn-outline flex items-center gap-2 bg-[var(--surface)] text-xs font-medium cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            id="add-category-btn"
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="erp-btn erp-btn-primary flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Stat Cards (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {/* Total Categories */}
        <div className="erp-card p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Total Categories
            </span>
            <div className="p-2 rounded-lg bg-[var(--surface-subtle)] text-[var(--text-primary)]">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {stats.totalCategories}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              All registered categories
            </p>
          </div>
        </div>

        {/* Active Categories */}
        <div className="erp-card p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Active
            </span>
            <div className="p-2 rounded-lg bg-[var(--success-light)] text-[var(--success)]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {stats.activeCategories}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Available for products
            </p>
          </div>
        </div>

        {/* Inactive Categories */}
        <div className="erp-card p-5 flex flex-col justify-between hover:border-[var(--border-strong)] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Inactive
            </span>
            <div className="p-2 rounded-lg bg-[var(--surface-subtle)] text-[var(--text-muted)]">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              {stats.inactiveCategories}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Archived or disabled
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            id="category-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search category name or ID (e.g. cat-101)..."
            className="erp-input pl-10 pr-4 text-xs h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="category-status-select" className="text-xs font-medium text-[var(--text-secondary)] shrink-0">
            Status:
          </label>
          <select
            id="category-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="erp-select text-xs h-10 py-1.5 px-3 min-w-[130px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Categories Table Container */}
      <div className="erp-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table w-full">
            <thead className="erp-thead">
              <tr>
                <th className="erp-th text-left uppercase text-[11px] tracking-wider font-semibold">
                  Category ID
                </th>
                <th className="erp-th text-left uppercase text-[11px] tracking-wider font-semibold">
                  Category Name
                </th>
                <th className="erp-th text-left uppercase text-[11px] tracking-wider font-semibold">
                  Status
                </th>
                <th className="erp-th text-left uppercase text-[11px] tracking-wider font-semibold">
                  Total Products
                </th>
                <th className="erp-th text-left uppercase text-[11px] tracking-wider font-semibold">
                  Created Date
                </th>
                <th className="erp-th text-right uppercase text-[11px] tracking-wider font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="erp-tbody divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                      <span>Loading categories...</span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[var(--text-muted)]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Tag className="w-8 h-8 text-[var(--text-muted)]/50" />
                      <p className="font-medium text-[var(--text-secondary)]">No categories found</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {searchQuery || statusFilter !== 'all'
                          ? 'Try adjusting your search query or filter.'
                          : 'Click "+ Add Category" above to register your first product classification.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-[var(--surface-subtle)]/60 transition-colors"
                  >
                    {/* Category ID badge */}
                    <td className="erp-td py-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {category.category_id}
                      </span>
                    </td>

                    {/* Category Name */}
                    <td className="erp-td py-3.5 font-semibold text-[var(--text-primary)]">
                      {category.category_name}
                    </td>

                    {/* Status badge */}
                    <td className="erp-td py-3.5">
                      {category.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Total Products (Count from products table) */}
                    <td className="erp-td py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                        <Package className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>
                          {category.total_products || 0}{' '}
                          <span className="text-[var(--text-muted)]">
                            {category.total_products === 1 ? 'item' : 'items'}
                          </span>
                        </span>
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="erp-td py-3.5 text-xs text-[var(--text-secondary)]">
                      {formatDate(category.created_at)}
                    </td>

                    {/* Action Open Button */}
                    <td className="erp-td py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenCategory(category)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] text-[var(--text-secondary)] shadow-xs transition-colors cursor-pointer"
                        title="Open & Edit Category"
                      >
                        <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                        <span>Open</span>
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
            Showing <strong className="text-[var(--text-primary)]">{categories.length}</strong> of{' '}
            <strong className="text-[var(--text-primary)]">{stats.totalCategories}</strong> categories
          </span>
          <span className="text-[11px] text-[var(--text-muted)]">
            Category Master System
          </span>
        </div>
      </div>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleCategoryAdded}
      />

      {/* Open Category Modal */}
      <OpenCategoryModal
        category={selectedCategory}
        isOpen={isOpenModalOpen}
        onClose={() => {
          setIsOpenModalOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={handleCategoryUpdated}
        onDeleteSuccess={handleCategoryDeleted}
      />
          </div>
        </main>
      </div>
    </div>
  );
}
