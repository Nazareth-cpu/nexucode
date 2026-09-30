/**
 * Contest Proctoring & Violation Deterrence Hook (Phase 6)
 *
 * Actively monitors participant environment during live contests:
 * 1. Tab switching / document visibility loss
 * 2. Window focus loss
 * 3. Clipboard pasting of external code
 *
 * Logs authoritative violations to PostgreSQL / server engine and warns/disqualifies users.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/src/features/auth';
import { contestService } from '../services/contestService';
import type { ContestRuleConfig, ViolationType } from '../types';

interface UseContestProctoringOptions {
  contestId: string;
  enabled: boolean;
  rules?: ContestRuleConfig;
  initialWarnings?: number;
  isContestLive: boolean;
  onDisqualification?: () => void;
}

export interface ActiveViolationNotice {
  type: ViolationType;
  title: string;
  message: string;
  warningNumber: number;
  maxWarnings: number;
  isDisqualified: boolean;
}

export function useContestProctoring({
  contestId,
  enabled,
  rules,
  initialWarnings = 0,
  isContestLive,
  onDisqualification,
}: UseContestProctoringOptions) {
  const { session } = useAuth();
  const [warnings, setWarnings] = useState<number>(initialWarnings);
  const [isDisqualified, setIsDisqualified] = useState<boolean>(false);
  const [activeNotice, setActiveNotice] = useState<ActiveViolationNotice | null>(null);

  const maxWarnings = rules?.maxWarnings ?? 3;
  const isProctoringActive = enabled && (rules?.enableProctoring ?? true) && isContestLive && !isDisqualified;

  const lastReportedTimeRef = useRef<number>(0);

  const reportViolation = useCallback(
    async (type: ViolationType, evidence: Record<string, unknown> = {}) => {
      if (!isProctoringActive || !session?.access_token) return;

      const now = Date.now();
      // Debounce: prevent duplicate triggers within 3 seconds
      if (now - lastReportedTimeRef.current < 3000) return;
      lastReportedTimeRef.current = now;

      try {
        const { data, error } = await contestService.recordViolation(
          contestId,
          type,
          evidence,
          session.access_token
        );

        if (!error && data) {
          setWarnings(data.warningNumber);
          if (data.isDisqualified) {
            setIsDisqualified(true);
            if (onDisqualification) {
              onDisqualification();
            }
          }

          let title = 'Proctoring Warning';
          let message = `Violation detected (${type.replace('_', ' ')}).`;

          if (type === 'tab_switch') {
            title = 'Tab Switch Detected!';
            message = 'Navigating away from the contest arena is strictly logged. Remaining focus is required.';
          } else if (type === 'paste_detected') {
            title = 'External Paste Detected!';
            message = 'Pasting external code into the workspace is flagged for academic integrity review.';
          }

          setActiveNotice({
            type,
            title,
            message,
            warningNumber: data.warningNumber,
            maxWarnings: data.maxWarnings,
            isDisqualified: data.isDisqualified,
          });
        }
      } catch (err) {
        console.error('Failed to log proctoring violation:', err);
      }
    },
    [contestId, isProctoringActive, onDisqualification, session?.access_token]
  );

  // Tab / Document Visibility Monitoring
  useEffect(() => {
    if (!isProctoringActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('tab_switch', {
          reason: 'document_hidden',
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleWindowBlur = () => {
      // Focus lost to external app or window
      reportViolation('tab_switch', {
        reason: 'window_blur',
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isProctoringActive, reportViolation]);

  // Large External Paste Monitoring
  useEffect(() => {
    if (!isProctoringActive) return;

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') || '';
      // If student pastes more than 120 characters at once, report warning
      if (text.length > 120) {
        reportViolation('paste_detected', {
          length: text.length,
          preview: text.slice(0, 40) + '...',
          timestamp: new Date().toISOString(),
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isProctoringActive, reportViolation]);

  const dismissNotice = useCallback(() => {
    setActiveNotice(null);
  }, []);

  return {
    warnings,
    maxWarnings,
    isDisqualified,
    activeNotice,
    dismissNotice,
    isProctoringActive,
  };
}
