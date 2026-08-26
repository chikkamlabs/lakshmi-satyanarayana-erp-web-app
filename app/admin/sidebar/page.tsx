'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Receipt,
  Package,
  Users,
  UserCheck,
  Tag,
  Truck,
  Gift,
  Wallet,
  X,
} from 'lucide-react';

export default function AdminSidebar(props: any) {
  const pathname = usePathname();
  const isOpen = Boolean(props?.isOpen);
  const onClose = props?.onClose;

  const adminNavItems = [
    { name: 'Home', href: '/admin/dashboard', icon: Home },
    { name: 'Bills', href: '/admin/bills/dashboard', icon: Receipt },
    { name: 'Payments', href: '/admin/payments/dashboard', icon: Wallet },
    { name: 'Products', href: '/admin/products/dashboard', icon: Package },
    { name: 'Categories', href: '/admin/categories/dashboard', icon: Tag },
    { name: 'Distributors', href: '/admin/distributors/dashboard', icon: Truck },
    { name: 'Associates', href: '/admin/associates/dashboard', icon: Users },
    { name: 'Customers', href: '/admin/customers/dashboard', icon: UserCheck },
    { name: 'Rewards', href: '/admin/rewards/dashboard', icon: Gift },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="admin-sidebar-mobile-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="admin-sidebar"
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 bg-[var(--surface)] border-r border-[var(--border)]
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16
          ${isOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Header Inside Sidebar */}
        <div
          id="admin-sidebar-mobile-header"
          className="flex items-center justify-between p-4 border-b border-[var(--border)] lg:hidden"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--text-primary)]">
              Admin Menu
            </span>
          </div>
          {onClose && (
            <button
              id="admin-sidebar-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav id="admin-sidebar-nav" className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === '/admin/dashboard' && pathname === '/admin') ||
              (item.href.includes('/products') && pathname?.startsWith('/admin/products')) ||
              (item.href.includes('/categories') && pathname?.startsWith('/admin/categories')) ||
              (item.href.includes('/distributors') && pathname?.startsWith('/admin/distributors')) ||
              (item.href.includes('/associates') && pathname?.startsWith('/admin/associates')) ||
              (item.href.includes('/customers') && pathname?.startsWith('/admin/customers')) ||
              (item.href.includes('/rewards') && pathname?.startsWith('/admin/rewards')) ||
              (item.href.includes('/payments') && pathname?.startsWith('/admin/payments')) ||
              (item.href.includes('/bills') && (pathname?.startsWith('/admin/bills') || pathname?.startsWith('/admin/createbill')));

            return (
              <Link
                key={item.name}
                id={`admin-nav-${item.name.toLowerCase()}`}
                href={item.href}
                onClick={onClose}
                className={`erp-sidebar-item ${
                  isActive ? 'erp-sidebar-item-active' : ''
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div
          id="admin-sidebar-footer"
          className="p-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]"
        >
          <div className="flex items-center justify-between">
            <span>Admin Portal</span>
            <span className="erp-badge erp-badge-primary">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
