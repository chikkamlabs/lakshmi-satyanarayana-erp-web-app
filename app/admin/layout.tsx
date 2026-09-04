'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminAuth() {
      try {
        if (!isSupabaseConfigured) {
          // If supabase is not configured, redirect to login
          if (isMounted) {
            router.replace('/login');
          }
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          if (isMounted) {
            router.replace('/login');
          }
          return;
        }

        // Check user role
        let role = (user.user_metadata?.role as string | undefined) || 
                   (user.app_metadata?.role as string | undefined);

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.role) {
            role = profile.role;
          }
        } catch {
          // Profile lookup error, fallback to metadata
        }

        if (!isMounted) return;

        if (role === 'admin') {
          setAuthorized(true);
        } else if (role === 'associate') {
          router.replace('/associate/dashboard');
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error('Admin Auth Check Failed:', err);
        if (isMounted) {
          router.replace('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAdminAuth();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isMounted) {
          setAuthorized(false);
          router.replace('/login');
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading || !authorized) {
    return (
      <div
        id="admin-auth-loading"
        className="erp-flex-center min-h-screen bg-[var(--background)] p-6"
      >
        <div className="flex flex-col items-center gap-3 erp-fade-in">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-xs font-medium text-[var(--text-secondary)] tracking-wide">
            Verifying Admin Access...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
