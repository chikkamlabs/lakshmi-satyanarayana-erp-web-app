'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, Receipt, Plus, Sparkles } from 'lucide-react';
import AdminHeader from '../header/page';
import AdminSidebar from '../sidebar/page';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const billButtonRef = useRef<HTMLButtonElement | null>(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  // Keyboard shortcut: When on admin/dashboard and user taps Enter, focus and open create bill
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
        if (!isInput) {
          e.preventDefault();
          if (billButtonRef.current) {
            billButtonRef.current.focus();
          }
          router.push('/admin/createbill');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />
      
      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          id="admin-dashboard-container"
          className="erp-flex-center flex-1 p-6 erp-fade-in relative min-h-[calc(100vh-4rem)]"
        >
          <div
            id="admin-dashboard-card"
            className="erp-card w-full max-w-md text-center p-8 erp-slide-up"
          >
            <div
              id="admin-badge"
              className="erp-badge erp-badge-primary mb-4"
            >
              <span className="erp-badge-dot"></span>
              Administrator
            </div>
            <h1
              id="admin-greeting-heading"
              className="erp-page-title mb-6"
            >
              Hi admin
            </h1>

            <div id="admin-actions-container" className="erp-flex-center gap-3">
              <Link
                id="admin-to-login-link"
                href="/login"
                className="erp-btn erp-btn-secondary erp-btn-sm"
              >
                Login Page
              </Link>
              <button
                id="admin-logout-btn"
                onClick={handleLogout}
                className="erp-btn erp-btn-outline erp-btn-sm cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          </div>

          {/* Bottom Right Bill Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <button
              ref={billButtonRef}
              id="admin-create-bill-floating-btn"
              type="button"
              onClick={() => router.push('/admin/createbill')}
              className="erp-btn erp-btn-primary py-3 px-5 rounded-xl shadow-lg hover:shadow-xl flex items-center gap-3 text-sm font-semibold cursor-pointer border border-[var(--primary)]/20 transition-all hover:scale-105 active:scale-95 group focus:ring-4 focus:ring-[var(--primary)]/30 focus:outline-none"
              title="Create New Bill (Press Enter on Keyboard)"
            >
              <div className="p-1 rounded-md bg-white/20">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold leading-tight">Create Bill</span>
                <span className="text-[10px] text-white/80 font-normal leading-tight">POS Billing</span>
              </div>
              <div className="ml-1 px-2 py-0.5 rounded bg-black/20 text-[11px] font-mono text-white/90 border border-white/20 flex items-center gap-1 shadow-inner">
                <span>Enter ↵</span>
              </div>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

