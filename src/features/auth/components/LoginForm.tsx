/**
 * Login Form Component
 *
 * Consumes useAuth() hook. Does NOT make direct Supabase calls.
 * Provides accessible inputs, client-side validation, error handling,
 * and loading states.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleButton } from './GoogleButton';
import { validateLogin, type LoginFormFields } from '../utils/validation';
import { formatAuthErrorMessage } from '../utils/errorMapper';
import { getSafeRedirectUrl } from '../utils/redirect';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signInWithPassword, signInWithGoogle, isConfigured } = useAuth();

  const [fields, setFields] = useState<LoginFormFields>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleFieldChange = (field: keyof LoginFormFields, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
    // Clear validation error when user begins typing
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (authError) {
      setAuthError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side field validation
    const validationErrors = validateLogin(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await signInWithPassword({
        email: fields.email,
        password: fields.password,
      });

      if (error) {
        setAuthError(formatAuthErrorMessage(error));
        return;
      }

      if (data?.session) {
        if (onSuccess) {
          onSuccess();
        } else {
          const rawRedirect = searchParams.get('redirect');
          const target = getSafeRedirectUrl(rawRedirect, '/dashboard');
          navigate(target, { replace: true });
        }
      }
    } catch (err) {
      console.error('[LoginForm Submission Error]:', err);
      setAuthError('An unexpected error occurred while attempting to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsGoogleSubmitting(true);

    try {
      const rawRedirect = searchParams.get('redirect');
      const target = getSafeRedirectUrl(rawRedirect, '/dashboard');
      const defaultRedirect = typeof window !== 'undefined' ? `${window.location.origin}${target}` : undefined;

      const { error } = await signInWithGoogle({ redirectTo: defaultRedirect });
      if (error) {
        setAuthError(formatAuthErrorMessage(error));
        setIsGoogleSubmitting(false);
      }
      // If successful, Supabase handles redirection to OAuth provider
    } catch (err) {
      console.error('[Google Sign In Error]:', err);
      setAuthError('Failed to initiate Google sign-in. Please try again.');
      setIsGoogleSubmitting(false);
    }
  };

  const isBusy = isSubmitting || isGoogleSubmitting;

  return (
    <div className="w-full space-y-6">
      {!isConfigured && (
        <div className="p-3.5 rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#FBBF24] text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#F59E0B]" />
          <div>
            <p className="font-semibold">Authentication keys not configured</p>
            <p className="text-[#9CA3AF] mt-0.5">
              Please define <code className="font-mono bg-[#08051A] px-1 py-0.5 rounded text-[#F59E0B]">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono bg-[#08051A] px-1 py-0.5 rounded text-[#F59E0B]">VITE_SUPABASE_PUBLISHABLE_KEY</code> in{' '}
              <code className="font-mono bg-[#08051A] px-1 py-0.5 rounded text-[#F8FAFC]">.env.local</code> to authenticate.
            </p>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {authError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 rounded-lg border border-[#EF4444]/60 bg-[#EF4444]/10 text-[#EF4444] text-xs flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#EF4444]" />
          <span className="leading-relaxed font-medium">{authError}</span>
        </div>
      )}

      {/* Google Sign In */}
      <div className="space-y-4">
        <GoogleButton
          onClick={handleGoogleSignIn}
          isLoading={isGoogleSubmitting}
          disabled={isBusy || !isConfigured}
          text="Continue with Google"
        />

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#241D4D]" />
          <span className="absolute px-3 bg-[#0E0B28] text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
            Or sign in with email
          </span>
        </div>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-[#9CA3AF]"
          >
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              disabled={isBusy}
              value={fields.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="student@chapter.edu"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              className={`w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#08051A] border text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.email
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[#241D4D] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
              }`}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="text-xs text-[#EF4444]">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-[#9CA3AF]"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              disabled={isBusy}
              value={fields.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              className={`w-full pl-9 pr-10 py-2 rounded-lg bg-[#08051A] border text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.password
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[#241D4D] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
              }`}
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="login-password-error" className="text-xs text-[#EF4444]">
              {errors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isBusy || !isConfigured}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-semibold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F59E0B] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.99] mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#08051A]" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="pt-2 text-center text-xs text-[#9CA3AF]">
        Don&apos;t have an account?{' '}
        <Link
          to={
            searchParams.get('redirect')
              ? `/register?redirect=${encodeURIComponent(searchParams.get('redirect')!)}`
              : '/register'
          }
          className="text-[#F59E0B] hover:text-[#FBBF24] font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-[#F59E0B] rounded px-1"
        >
          Create student account
        </Link>
      </div>
    </div>
  );
}
