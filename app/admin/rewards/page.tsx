'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRewardsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/rewards/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="erp-card p-6 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium text-[var(--text-secondary)]">
          Redirecting to Rewards Dashboard...
        </span>
      </div>
    </div>
  );
}
