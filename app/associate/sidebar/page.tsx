'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Receipt,
  Gift,
  X,
} from 'lucide-react';

export default function AssociateSidebar(props: any) {
  const pathname = usePathname();
  const isOpen = Boolean(props?.isOpen);
  const onClose = props?.onClose;

  const associateNavItems = [
    { name: 'Home', href: '/associate/dashboard', icon: Home },
    { name: 'Bills', href: '/associate/bills', icon: Receipt },
    { name: 'Rewards', href: '/associate/rewards', icon: Gift },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="associate-sidebar-mobile-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container - Mobile First Focus */}
      <aside
        id="associate-sidebar"
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-64 sm:w-72 bg-[var(--surface)] border-r border-[var(--border)]
          flex flex-col transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16
          ${isOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Header Inside Sidebar */}
        <div
          id="associate-sidebar-mobile-header"
          className="flex items-center justify-between p-4 border-b border-[var(--border)] lg:hidden"
        >
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-[var(--text-primary)]">
              Associate Menu
            </span>
          </div>
          {onClose && (
            <button
              id="associate-sidebar-close-btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors active:scale-95 cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav id="associate-sidebar-nav" className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {associateNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/associate/dashboard' && pathname === '/associate');

            return (
              <Link
                key={item.name}
                id={`associate-nav-${item.name.toLowerCase()}`}
                href={item.href}
                onClick={onClose}
                className={`erp-sidebar-item py-3 px-3.5 text-base sm:text-sm ${
                  isActive ? 'erp-sidebar-item-active' : ''
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-4 sm:h-4 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Info */}
        <div
          id="associate-sidebar-footer"
          className="p-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)]"
        >
          <div className="flex items-center justify-between">
            <span>Associate Portal</span>
            <span className="erp-badge erp-badge-secondary">Active</span>
          </div>
        </div>
      </aside>
    </>
  );
}
