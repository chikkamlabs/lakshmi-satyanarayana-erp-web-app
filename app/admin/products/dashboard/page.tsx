'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Tag,
  Boxes,
  Layers,
  Filter,
  SlidersHorizontal,
  IndianRupee,
} from 'lucide-react';
import AdminHeader from '../../header/page';
import AdminSidebar from '../../sidebar/page';
import {
  Product,
  ProductStats,
  CategoryOption,
  fetchProducts,
  getProductStats,
  fetchCategoriesForDropdown,
} from '@/lib/productsStore';
import AddProductModal from '@/components/addproduct';
import OpenProductModal from '@/components/openproduct';

export default function ProductsDashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [stats, setStats] = useState<ProductStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockCount: 0,
    totalStockUnits: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);

  const loadData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const [prodRes, statsRes, catRes] = await Promise.all([
          fetchProducts(searchQuery, selectedCategory, statusFilter, lowStockOnly),
          getProductStats(),
          fetchCategoriesForDropdown(),
        ]);

        if (prodRes.data) {
          setProducts(prodRes.data);
        }
        if (statsRes.stats) {
          setStats(statsRes.stats);
        }
        if (catRes.data) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Failed to load products data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, selectedCategory, statusFilter, lowStockOnly]
  );

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [prodRes, statsRes, catRes] = await Promise.all([
          fetchProducts(searchQuery, selectedCategory, statusFilter, lowStockOnly),
          getProductStats(),
          fetchCategoriesForDropdown(),
        ]);
        if (!mounted) return;

        if (prodRes.data) {
          setProducts(prodRes.data);
        }
        if (statsRes.stats) {
          setStats(statsRes.stats);
        }
        if (catRes.data) {
          setCategories(catRes.data);
        }
      } catch (err) {
        console.error('Failed to load products data:', err);
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
  }, [searchQuery, selectedCategory, statusFilter, lowStockOnly]);

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsOpenModalOpen(true);
  };

  const handleProductAdded = () => {
    loadData(true);
  };

  const handleProductUpdated = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    loadData(true);
  };

  const handleProductDeleted = (deletedId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    loadData(true);
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val)) return '₹0.00';
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main id="admin-products-main" className="flex-1 p-4 sm:p-6 lg:p-8 erp-fade-in min-w-0">
          <div id="products-dashboard-page" className="space-y-6 max-w-7xl mx-auto">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <Link href="/admin/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="font-semibold text-[var(--text-primary)]">Products</span>
            </div>

            {/* Main Header & + Add Product Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                      Product Inventory
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      Manage product catalog, inventory levels, selling prices, and low stock alerts
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <button
                  id="products-refresh-btn"
                  type="button"
                  onClick={() => loadData(true)}
                  disabled={refreshing || loading}
                  className="erp-btn erp-btn-outline flex items-center gap-2 bg-[var(--surface)] text-xs font-medium cursor-pointer"
                  title="Refresh Inventory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  id="add-product-btn"
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="erp-btn erp-btn-primary flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Products */}
              <div className="erp-stat-card bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title text-xs text-[var(--text-secondary)] font-medium">
                    Total Products
                  </span>
                  <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="erp-stat-value text-2xl font-bold text-[var(--text-primary)]">
                    {loading ? '—' : stats.totalProducts}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">catalog items</span>
                </div>
              </div>

              {/* Active Products */}
              <div className="erp-stat-card bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title text-xs text-[var(--text-secondary)] font-medium">
                    Active Catalog
                  </span>
                  <div className="p-2 rounded-lg bg-[var(--success-light)] text-[var(--success)]">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="erp-stat-value text-2xl font-bold text-[var(--success)]">
                    {loading ? '—' : stats.activeProducts}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">billing enabled</span>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div
                onClick={() => setLowStockOnly((prev) => !prev)}
                className={`erp-stat-card bg-[var(--surface)] p-4 rounded-xl border shadow-xs transition-all cursor-pointer ${
                  lowStockOnly
                    ? 'border-[var(--danger)] ring-2 ring-[var(--danger)]/20'
                    : 'border-[var(--border)] hover:border-[var(--danger)]'
                }`}
                title="Click to toggle low stock filter"
              >
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title text-xs text-[var(--text-secondary)] font-medium">
                    Low Stock Alerts
                  </span>
                  <div className="p-2 rounded-lg bg-[var(--danger-light)] text-[var(--danger)]">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="erp-stat-value text-2xl font-bold text-[var(--danger)]">
                      {loading ? '—' : stats.lowStockCount}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">needs restock</span>
                  </div>
                  {stats.lowStockCount > 0 && (
                    <span className="erp-badge erp-badge-danger text-[10px]">
                      {lowStockOnly ? 'Filtered' : 'Filter View'}
                    </span>
                  )}
                </div>
              </div>

              {/* Total Stock Units */}
              <div className="erp-stat-card bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="erp-stat-title text-xs text-[var(--text-secondary)] font-medium">
                    Total Units in Stock
                  </span>
                  <div className="p-2 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="erp-stat-value text-2xl font-bold text-[var(--text-primary)]">
                    {loading ? '—' : stats.totalStockUnits.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">aggregate units</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    id="products-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, code, SKU, or category..."
                    className="erp-input pl-9.5 text-xs w-full"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 min-w-[150px]">
                    <Tag className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 hidden sm:inline-block" />
                    <select
                      id="products-category-filter"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="erp-select text-xs flex-1 bg-[var(--surface)]"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.category_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <select
                    id="products-status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="erp-select text-xs w-28 bg-[var(--surface)]"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  {/* Low Stock Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setLowStockOnly((prev) => !prev)}
                    className={`erp-btn text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer transition-colors ${
                      lowStockOnly
                        ? 'bg-[var(--danger)] text-white hover:bg-[var(--danger-hover)]'
                        : 'erp-btn-outline bg-[var(--surface)]'
                    }`}
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 ${lowStockOnly ? 'text-white' : 'text-[var(--danger)]'}`} />
                    <span>Low Stock Only</span>
                  </button>
                </div>
              </div>

              {/* Active Filter Chips */}
              {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'all' || lowStockOnly) && (
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-secondary)] flex-wrap">
                  <span className="text-[11px] font-medium text-[var(--text-muted)]">Active Filters:</span>
                  {searchQuery && (
                    <span className="erp-badge bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)] gap-1">
                      Query: &quot;{searchQuery}&quot;
                      <button type="button" onClick={() => setSearchQuery('')} className="hover:text-[var(--danger)]">
                        ×
                      </button>
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="erp-badge bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)] gap-1">
                      Category: {categories.find((c) => c.id === selectedCategory)?.category_name || selectedCategory}
                      <button type="button" onClick={() => setSelectedCategory('all')} className="hover:text-[var(--danger)]">
                        ×
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="erp-badge bg-[var(--surface-subtle)] text-[var(--text-secondary)] border border-[var(--border)] gap-1">
                      Status: {statusFilter}
                      <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-[var(--danger)]">
                        ×
                      </button>
                    </span>
                  )}
                  {lowStockOnly && (
                    <span className="erp-badge erp-badge-danger gap-1">
                      Low Stock Only
                      <button type="button" onClick={() => setLowStockOnly(false)} className="hover:text-black">
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setStatusFilter('all');
                      setLowStockOnly(false);
                    }}
                    className="text-[11px] text-[var(--primary)] hover:underline ml-1 cursor-pointer"
                  >
                    Reset All
                  </button>
                </div>
              )}
            </div>

            {/* Products Table Container */}
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="erp-table w-full text-left text-xs">
                  <thead className="erp-thead bg-[var(--surface-subtle)]/70 text-[var(--text-secondary)] border-b border-[var(--border)]">
                    <tr>
                      <th className="erp-th py-3.5 px-4 font-semibold">Product Name & Code</th>
                      <th className="erp-th py-3.5 px-4 font-semibold">Category</th>
                      <th className="erp-th py-3.5 px-4 font-semibold">Quantity</th>
                      <th className="erp-th py-3.5 px-4 font-semibold">Selling Price</th>
                      <th className="erp-th py-3.5 px-4 font-semibold">MRP</th>
                      <th className="erp-th py-3.5 px-4 font-semibold">Low Stock Limit</th>
                      <th className="erp-th py-3.5 px-4 font-semibold">Status</th>
                      <th className="erp-th py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="erp-tbody divide-y divide-[var(--border)]">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
                            <span>Loading product catalog...</span>
                          </div>
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-[var(--text-muted)]">
                          <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                            <div className="p-3 rounded-full bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                              <Package className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-sm text-[var(--text-primary)]">
                              No products found
                            </span>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {searchQuery || selectedCategory !== 'all' || statusFilter !== 'all' || lowStockOnly
                                ? 'No products match the selected search or filter criteria.'
                                : 'No products have been added to the catalog yet. Click "+ Add Product" to create the first one.'}
                            </p>
                            {(searchQuery || selectedCategory !== 'all' || statusFilter !== 'all' || lowStockOnly) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchQuery('');
                                  setSelectedCategory('all');
                                  setStatusFilter('all');
                                  setLowStockOnly(false);
                                }}
                                className="erp-btn erp-btn-outline erp-btn-sm text-xs mt-2 cursor-pointer"
                              >
                                Clear Filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const isLow = Number(product.quantity) < Number(product.low_stock);
                        return (
                          <tr
                            key={product.id}
                            className={`hover:bg-[var(--surface-hover)] transition-colors ${
                              isLow ? 'bg-[var(--danger-light)]/25' : ''
                            }`}
                          >
                            {/* Product Name & Code */}
                            <td className="py-3.5 px-4 font-medium text-[var(--text-primary)]">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-xs sm:text-sm text-[var(--text-primary)]">
                                  {product.name}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
                                    {product.product_id}
                                  </span>
                                  {isLow && (
                                    <span className="erp-badge erp-badge-danger text-[10px] py-0 px-1.5 font-normal">
                                      Low Stock
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                                <Tag className="w-3 h-3 text-[var(--text-muted)]" />
                                <span>{product.category?.category_name || 'Uncategorized'}</span>
                              </div>
                            </td>

                            {/* Quantity Column with low stock conditional alert */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`font-mono text-sm font-bold ${
                                      isLow
                                        ? 'text-[var(--danger)] bg-[var(--danger-light)] px-1.5 py-0.5 rounded border border-[var(--danger)]'
                                        : 'text-[var(--text-primary)]'
                                    }`}
                                  >
                                    {product.quantity}
                                  </span>
                                  <span className="text-[11px] text-[var(--text-secondary)]">
                                    {product.unit}
                                  </span>
                                </div>
                                {isLow && (
                                  <span className="text-[10px] text-[var(--danger)] font-medium flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Below {product.low_stock} {product.unit}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Selling Price */}
                            <td className="py-3.5 px-4 font-mono font-medium text-[var(--text-primary)]">
                              {formatCurrency(product.selling_price)}
                            </td>

                            {/* MRP */}
                            <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">
                              {formatCurrency(product.mrp)}
                            </td>

                            {/* Low Stock Threshold */}
                            <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)]">
                              {product.low_stock} {product.unit}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              {product.status === 'active' ? (
                                <span className="erp-badge erp-badge-success text-xs">
                                  Active
                                </span>
                              ) : (
                                <span className="erp-badge erp-badge-secondary text-xs">
                                  Inactive
                                </span>
                              )}
                            </td>

                            {/* Actions: Open Button */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenProduct(product)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] text-[var(--text-secondary)] shadow-xs transition-colors cursor-pointer"
                                title="Open & Edit Product"
                              >
                                <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                                <span>Open</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface-subtle)]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                <span>
                  Showing <strong className="text-[var(--text-primary)]">{products.length}</strong> of{' '}
                  <strong className="text-[var(--text-primary)]">{stats.totalProducts}</strong> products
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Inventory Master System
                </span>
              </div>
            </div>

            {/* Add Product Modal */}
            <AddProductModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onSuccess={handleProductAdded}
            />

            {/* Open Product Modal */}
            <OpenProductModal
              product={selectedProduct}
              isOpen={isOpenModalOpen}
              onClose={() => {
                setIsOpenModalOpen(false);
                setSelectedProduct(null);
              }}
              onSuccess={handleProductUpdated}
              onDeleteSuccess={handleProductDeleted}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
