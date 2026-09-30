/**
 * Friendly Error Mapping Utility for Authentication
 *
 * Converts Supabase/internal auth errors into clear, accessible messages for users
 * while logging detailed diagnostic context in development.
 */

import type { AuthServiceError } from '../types';

export function formatAuthErrorMessage(error: AuthServiceError | null): string | null {
  if (!error) return null;

  const msg = error.message.toLowerCase();
  const code = error.code?.toLowerCase();

  // Invalid login credentials
  if (msg.includes('invalid login credentials') || msg.includes('invalid grant') || code === 'invalid_credentials') {
    return 'Incorrect email or password. Please verify your credentials and try again.';
  }

  // User already exists
  if (msg.includes('user already registered') || msg.includes('already exists') || code === 'user_already_exists') {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  // Password requirements
  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'Your password is too weak. Please use at least 6 characters.';
  }

  // Email validation errors
  if (msg.includes('invalid email') || msg.includes('email format')) {
    return 'Please provide a valid email address.';
  }

  // Rate limiting
  if (msg.includes('rate limit') || msg.includes('too many requests') || error.status === 429) {
    return 'Too many attempts. Please wait a few moments before trying again.';
  }

  // Email not confirmed
  if (msg.includes('email not confirmed') || msg.includes('unconfirmed')) {
    return 'Your email address has not been confirmed yet. Please check your inbox for the verification link.';
  }

  // Unconfigured client
  if (code === 'unconfigured_client' || msg.includes('not configured')) {
    return 'Authentication service is not configured. Please supply Supabase environment keys.';
  }

  // Network or fetch issues
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return 'Unable to connect to the authentication service. Please check your network connection.';
  }

  // Fallback to error.message if present, or generic
  return error.message || 'An unexpected authentication error occurred. Please try again.';
}
