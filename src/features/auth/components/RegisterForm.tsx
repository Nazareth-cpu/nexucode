/**
 * Registration Form Component
 *
 * Consumes useAuth() hook. Does NOT call Supabase Auth directly.
 * Strict Role Rule: NO role selector exists; all public registrations are student members.
 * Distinguishes between immediate session vs email-verification-required states.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleButton } from './GoogleButton';
import { validateRegistration, type RegisterFormFields } from '../utils/validation';
import { formatAuthErrorMessage } from '../utils/errorMapper';
import { getSafeRedirectUrl } from '../utils/redirect';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MailCheck,
  ArrowRight,
} from 'lucide-react';

export interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signInWithGoogle, isConfigured } = useAuth();

  const [fields, setFields] = useState<RegisterFormFields>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    collegeId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Email verification required state
  const [verificationRequired, setVerificationRequired] = useState<{
    email: string;
  } | null>(null);

  const handleFieldChange = (field: keyof RegisterFormFields, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }));
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
    const validationErrors = validateRegistration(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await signUp({
        email: fields.email,
        password: fields.password,
        displayName: fields.displayName,
        collegeId: fields.collegeId || undefined,
      });

      if (error) {
        setAuthError(formatAuthErrorMessage(error));
        return;
      }

      // Check whether session was immediately established or verification is required
      if (data?.session) {
        // State 1: Immediate active session available
        if (onSuccess) {
          onSuccess();
        } else {
          const rawRedirect = searchParams.get('redirect');
          const target = getSafeRedirectUrl(rawRedirect, '/dashboard');
          navigate(target, { replace: true });
        }
      } else if (data?.user) {
        // State 2: User registered successfully, but Supabase requires email verification
        setVerificationRequired({ email: fields.email });
      }
    } catch (err) {
      console.error('[RegisterForm Submission Error]:', err);
      setAuthError('An unexpected error occurred while creating your account. Please try again.');
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

  // Render Verification Instruction State if Supabase requires email confirmation
  if (verificationRequired) {
    return (
      <div className="w-full space-y-6 text-center py-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center">
          <MailCheck className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-[#F8FAFC]">Check your email</h3>
          <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
            We have sent a verification link to{' '}
            <span className="font-medium text-[#F8FAFC]">{verificationRequired.email}</span>.
            Please verify your address to activate your student account.
          </p>
        </div>

        <div className="rounded-xl border border-[#241D4D] bg-[#08051A] p-4 text-xs text-[#9CA3AF] text-left space-y-2">
          <div className="flex items-center gap-2 text-[#F8FAFC] font-medium">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>Next steps:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[#9CA3AF] pl-1">
            <li>Open the confirmation email in your inbox.</li>
            <li>Click the verification link to confirm your account.</li>
            <li>Return to sign in to access chapter contests.</li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-semibold text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F59E0B] shadow-sm active:scale-[0.99]"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setVerificationRequired(null)}
            className="text-xs text-[#9CA3AF] hover:text-[#F8FAFC] py-1 transition-colors"
          >
            Back to registration form
          </button>
        </div>
      </div>
    );
  }

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
              <code className="font-mono bg-[#08051A] px-1 py-0.5 rounded text-[#F8FAFC]">.env.local</code> to register.
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
          text="Sign up with Google"
        />

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#241D4D]" />
          <span className="absolute px-3 bg-[#0E0B28] text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF]">
            Or register with email
          </span>
        </div>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Display Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-display-name"
            className="block text-xs font-medium text-[#9CA3AF]"
          >
            Display name / Full name <span className="text-[#F59E0B]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <User className="w-4 h-4" />
            </div>
            <input
              id="reg-display-name"
              type="text"
              autoComplete="name"
              disabled={isBusy}
              value={fields.displayName}
              onChange={(e) => handleFieldChange('displayName', e.target.value)}
              placeholder="Ada Lovelace"
              aria-invalid={!!errors.displayName}
              aria-describedby={errors.displayName ? 'reg-name-error' : undefined}
              className={`w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#08051A] border text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.displayName
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[#241D4D] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
              }`}
            />
          </div>
          {errors.displayName && (
            <p id="reg-name-error" className="text-xs text-[#EF4444]">
              {errors.displayName}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-email"
            className="block text-xs font-medium text-[#9CA3AF]"
          >
            College / Personal Email <span className="text-[#F59E0B]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              disabled={isBusy}
              value={fields.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="student@chapter.edu"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'reg-email-error' : undefined}
              className={`w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#08051A] border text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.email
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[#241D4D] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
              }`}
            />
          </div>
          {errors.email && (
            <p id="reg-email-error" className="text-xs text-[#EF4444]">
              {errors.email}
            </p>
          )}
        </div>

        {/* Optional College/Student ID */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="reg-college-id"
              className="block text-xs font-medium text-[#9CA3AF]"
            >
              College / Student Roll ID{' '}
              <span className="text-[#9CA3AF]/70 font-normal">(optional)</span>
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <GraduationCap className="w-4 h-4" />
            </div>
            <input
              id="reg-college-id"
              type="text"
              disabled={isBusy}
              value={fields.collegeId}
              onChange={(e) => handleFieldChange('collegeId', e.target.value)}
              placeholder="e.g. 21CS042"
              className="w-full pl-9 pr-3.5 py-2 rounded-lg bg-[#08051A] border border-[#241D4D] text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-password"
            className="block text-xs font-medium text-[#9CA3AF]"
          >
            Password <span className="text-[#F59E0B]">*</span>{' '}
            <span className="text-[11px] text-[#9CA3AF]/70 font-normal">(min. 6 characters)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isBusy}
              value={fields.password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'reg-password-error' : undefined}
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
            <p id="reg-password-error" className="text-xs text-[#EF4444]">
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="reg-confirm-password"
            className="block text-xs font-medium text-[#9CA3AF]"
          >
            Confirm password <span className="text-[#F59E0B]">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#9CA3AF]">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="reg-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              disabled={isBusy}
              value={fields.confirmPassword}
              onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'reg-confirm-password-error' : undefined}
              className={`w-full pl-9 pr-10 py-2 rounded-lg bg-[#08051A] border text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.confirmPassword
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[#241D4D] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
              }`}
            />
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="reg-confirm-password-error" className="text-xs text-[#EF4444]">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Role Enforcement Notice (Explicitly confirms student membership) */}
        <div className="p-3 rounded-lg bg-[#08051A] border border-[#241D4D] text-[11px] text-[#9CA3AF] flex items-center justify-between">
          <span>Membership Level</span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#F59E0B] bg-[#0E0B28] px-2 py-0.5 rounded border border-[#241D4D]">
            Chapter Student Member
          </span>
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
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create Student Account</span>
          )}
        </button>
      </form>

      {/* Footer Navigation */}
      <div className="pt-2 text-center text-xs text-[#9CA3AF]">
        Already have a student account?{' '}
        <Link
          to={
            searchParams.get('redirect')
              ? `/login?redirect=${encodeURIComponent(searchParams.get('redirect')!)}`
              : '/login'
          }
          className="text-[#F59E0B] hover:text-[#FBBF24] font-medium hover:underline focus:outline-none focus:ring-1 focus:ring-[#F59E0B] rounded px-1"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
