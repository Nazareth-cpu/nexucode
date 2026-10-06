/**
 * Safe Redirect URL Sanitization
 *
 * Prevents Open Redirect vulnerabilities by strictly enforcing that
 * redirect destinations are relative paths starting with a single '/'
 * and rejecting protocol-relative ('//') or external scheme URLs.
 */

export function getSafeRedirectUrl(
  candidate: string | null | undefined,
  defaultUrl: string = '/dashboard'
): string {
  if (!candidate || typeof candidate !== 'string') {
    return defaultUrl;
  }

  const trimmed = candidate.trim();

  // Must begin with a single slash and must NOT begin with double slash (protocol-relative)
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return defaultUrl;
  }

  // Reject Windows-style backslashes or encoded path traversal
  if (trimmed.includes('\\') || trimmed.includes('%5C') || trimmed.includes('%5c')) {
    return defaultUrl;
  }

  // Reject explicit protocols or URI schemes (e.g. javascript:, http:, https:, data:)
  const containsProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed);
  if (containsProtocol) {
    return defaultUrl;
  }

  // Ensure it decodes cleanly and remains a single slash path
  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('\\')) {
      return defaultUrl;
    }
  } catch {
    // Malformed URI sequence
    return defaultUrl;
  }

  return trimmed;
}
