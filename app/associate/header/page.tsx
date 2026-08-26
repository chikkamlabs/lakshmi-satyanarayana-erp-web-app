'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LogOut, Menu } from 'lucide-react';

export default function AssociateHeader(props: any) {
  const router = useRouter();
  const onMenuClick = props?.onMenuClick;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header
      id="associate-header"
      className="erp-header w-full border-b border-[var(--border)] bg-[var(--surface)] px-3 sm:px-6 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30"
    >
      {/* Left: Menu Toggle (Mobile) + Logo & Company Name */}
      <div id="associate-header-left" className="flex items-center gap-2 sm:gap-3">
        {onMenuClick && (
          <button
            id="associate-menu-toggle-btn"
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] lg:hidden transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Image
          id="associate-header-logo"
          src="/lse_logo.png"
          alt="Lakshmi Satyanarayana Enterprises Logo"
          width={32}
          height={32}
          className="rounded-md shrink-0"
          priority
        />
        <span
          id="associate-header-brand-title"
          className="font-semibold text-xs sm:text-base text-[var(--text-primary)] tracking-tight whitespace-nowrap hidden xs:inline-block sm:inline-block"
        >
          Lakshmi Satyanarayana Enterprises
        </span>
      </div>

      {/* Middle: Greeting */}
      <div id="associate-header-middle" className="flex items-center justify-center">
        <span
          id="associate-header-greeting"
          className="font-medium text-xs sm:text-base text-[var(--secondary)] px-2.5 sm:px-3 py-1 rounded-md bg-[var(--secondary-light)] border border-[var(--border)] whitespace-nowrap"
        >
          Hi associate
        </span>
      </div>

      {/* Right: Logout */}
      <div id="associate-header-right" className="flex items-center">
        <button
          id="associate-header-logout-btn"
          type="button"
          onClick={handleLogout}
          className="erp-btn erp-btn-outline erp-btn-sm inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer text-xs sm:text-sm text-[var(--danger)] border-[var(--danger)] hover:bg-[var(--danger-light)] px-2.5 sm:px-3"
        >
          <LogOut id="associate-logout-icon" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--danger)]" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
