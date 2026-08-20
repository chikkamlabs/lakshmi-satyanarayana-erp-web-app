'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut } from 'lucide-react';
import AdminHeader from '../header/page';
import AdminSidebar from '../sidebar/page';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <AdminHeader onMenuClick={() => setSidebarOpen((prev) => !prev)} />
      
      <div className="flex flex-1 relative">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          id="admin-dashboard-container"
          className="erp-flex-center flex-1 p-6 erp-fade-in"
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
        </main>
      </div>
    </div>
  );
}
