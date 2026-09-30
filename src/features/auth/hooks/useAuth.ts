/**
 * Reusable Auth Hook
 *
 * Exposes centralized authentication state and operations to consumer components.
 */

import { useAuthContext } from '../context/AuthContext';
import type { AuthContextValue } from '../types';

export function useAuth(): AuthContextValue {
  return useAuthContext();
}
