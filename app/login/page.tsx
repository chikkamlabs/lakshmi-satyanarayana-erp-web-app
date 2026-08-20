'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Eye, EyeOff, Lock, Mail, Loader2, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const routeUserByRole = useCallback(async (userId: string, userObj?: User | null) => {
    let role = (userObj?.user_metadata?.role as string | undefined) || (userObj?.app_metadata?.role as string | undefined);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.role) {
        role = profile.role;
      }
    } catch {
      // If table query fails, fallback to metadata or default
    }

    if (role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/associate/dashboard');
    }
  }, [router]);

  useEffect(() => {
    // Check if user is already logged in
    async function checkActiveSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await routeUserByRole(user.id, user);
        }
      } catch {
        // Continue to show login form if no active session
      }
    }

    checkActiveSession();
  }, [routeUserByRole]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (!email.trim() || !password) {
        setErrorMessage('Please enter both email and password.');
        setLoading(false);
        return;
      }

      if (!isSupabaseConfigured) {
        setErrorMessage('Supabase is not configured yet. Please provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        await routeUserByRole(data.user.id, data.user);
      } else {
        setErrorMessage('Unable to retrieve user details after login.');
        setLoading(false);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred during login.');
      }
      setLoading(false);
    }
  }

  return (
    <main
      id="login-page-container"
      className="erp-flex-center min-h-screen p-4 sm:p-6 erp-fade-in bg-[var(--background)]"
    >
      <div
        id="login-card"
        className="erp-card w-full max-w-[420px] p-6 sm:p-8 erp-slide-up shadow-sm border border-[var(--border)]"
      >
        <div id="login-header" className="text-center mb-6">
          <div
            id="login-logo-badge"
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] font-bold text-lg mb-4 border border-[var(--border)] shadow-xs"
          >
            <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <h1 id="login-page-heading" className="erp-page-title text-2xl font-bold tracking-tight mb-1.5">
            Welcome Page
          </h1>
          <p id="login-page-subtitle" className="erp-body text-sm text-[var(--text-secondary)]">
            Sign in to access your account
          </p>
        </div>

        {errorMessage && (
          <div
            id="login-error-alert"
            className="flex items-start gap-2.5 p-3 mb-5 rounded-lg bg-[var(--danger-light)] border border-[var(--danger)] text-[var(--danger)] text-sm erp-fade-in"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span id="login-error-text" className="font-medium text-xs leading-relaxed">
              {errorMessage}
            </span>
          </div>
        )}

        <form id="login-form" onSubmit={handleLogin} className="erp-content-wrapper gap-4">
          <div id="email-form-group" className="erp-form-group mb-0">
            <label id="email-input-label" htmlFor="login-email-input" className="erp-label mb-1.5 font-medium text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Email Address
            </label>
            <div id="email-input-wrapper" className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-[var(--text-muted)] pointer-events-none z-10" />
              <input
                id="login-email-input"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="erp-input erp-input-icon-left"
              />
            </div>
          </div>

          <div id="password-form-group" className="erp-form-group mb-0">
            <label id="password-input-label" htmlFor="login-password-input" className="erp-label mb-1.5 font-medium text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Password
            </label>
            <div id="password-input-wrapper" className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-[var(--text-muted)] pointer-events-none z-10" />
              <input
                id="login-password-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="erp-input erp-input-icon-left erp-input-icon-right"
              />
              <button
                id="toggle-password-visibility-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={0}
                className="absolute right-3 p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors focus:outline-none z-10 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff id="eye-off-icon" className="w-4 h-4" />
                ) : (
                  <Eye id="eye-icon" className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={loading}
            className="erp-btn erp-btn-primary w-full mt-2 py-2.5 font-medium text-sm rounded-lg transition-all shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 id="loading-spinner-icon" className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn id="login-icon" className="w-4 h-4" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
