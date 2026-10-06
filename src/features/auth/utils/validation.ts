/**
 * Form Validation Utilities for Authentication
 */

export interface RegisterFormFields {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  collegeId?: string;
}

export interface LoginFormFields {
  email: string;
  password: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
}

export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Display name is required.';
  }
  if (trimmed.length < 2) {
    return 'Display name must be at least 2 characters.';
  }
  return null;
}

export function validateRegistration(fields: RegisterFormFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const nameError = validateDisplayName(fields.displayName);
  if (nameError) errors.displayName = nameError;

  const emailError = validateEmail(fields.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(fields.password);
  if (passwordError) errors.password = passwordError;

  if (!fields.confirmPassword) {
    errors.confirmPassword = 'Confirm password is required.';
  } else if (fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function validateLogin(fields: LoginFormFields): Record<string, string> {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(fields.email);
  if (emailError) errors.email = emailError;

  if (!fields.password) {
    errors.password = 'Password is required.';
  }

  return errors;
}
