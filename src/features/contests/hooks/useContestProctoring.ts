/**
 * Nexus Code — Contest & Event Proctoring Hook
 *
 * Server-authoritative integrity monitoring during live competitive sessions:
 * 1. Full-screen exit detection (mandatory full-screen mode)
 * 2. Tab switching & window focus loss detection
 * 3. External paste detection (> 120 chars)
 * 4. Workspace tampering / DevTools shortcut detection
 * 5. Strict 3-Strike enforcement with immediate revocation and re-entry denial
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/src/features/auth';
import { contestService } from '../services/contestService';
import { eventService } from '@/src/features/events/services/eventService';
import type { ContestRuleConfig, ViolationType } from '../types';

interface UseContestProctoringOptions {
  contestId?: string;
  eventId?: string;
  scopeType?: 'contest' | 'event';
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
  eventId,
  scopeType = 'contest',
  enabled,
  rules,
  initialWarnings = 0,
  isContestLive,
  onDisqualification,
}: UseContestProctoringOptions) {
  const { session } = useAuth();
  const maxWarnings = rules?.maxWarnings ?? 3;

  const [warnings, setWarnings] = useState<number>(initialWarnings);
  const [isDisqualified, setIsDisqualified] = useState<boolean>(initialWarnings >= maxWarnings);
  const [activeNotice, setActiveNotice] = useState<ActiveViolationNotice | null>(null);

  const isProctoringActive = enabled && (rules?.enableProctoring ?? true) && isContestLive && !isDisqualified;
  const lastReportedTimeRef = useRef<number>(0);

  // Synchronize initial warnings if updated from server
  useEffect(() => {
    if (initialWarnings >= maxWarnings) {
      setWarnings(initialWarnings);
      setIsDisqualified(true);
    }
  }, [initialWarnings, maxWarnings]);

  const reportViolation = useCallback(
    async (type: ViolationType, evidence: Record<string, unknown> = {}) => {
      if (!isProctoringActive || !session?.access_token) return;

      const targetId = scopeType === 'contest' ? contestId : eventId;
      if (!targetId) return;

      const now = Date.now();
      // Debounce: prevent duplicate violation burst within 3.5 seconds
      if (now - lastReportedTimeRef.current < 3500) return;
      lastReportedTimeRef.current = now;

      try {
        let responseData: any = null;

        if (scopeType === 'contest') {
          const res = await contestService.recordViolation(
            targetId,
            type,
            evidence,
            session.access_token
          );
          responseData = res.data;
        } else {
          const res = await eventService.recordViolation(
            targetId,
            type,
            evidence,
            session.access_token
          );
          responseData = res.data;
        }

        if (responseData) {
          const strikeCount = responseData.warningNumber;
          const isDQ = responseData.isDisqualified || strikeCount >= maxWarnings;

          setWarnings(strikeCount);
          if (isDQ) {
            setIsDisqualified(true);
            if (typeof document !== 'undefined' && document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
            if (onDisqualification) {
              onDisqualification();
            }
          }

          let title = 'Proctoring Violation';
          let message = `Integrity violation detected (${type.replace('_', ' ')}).`;

          if (type === 'fullscreen_exit') {
            title = 'Full-Screen Exit Detected!';
            message = 'Mandatory tournament full-screen mode was exited. Focus must remain strictly within the contest workspace.';
          } else if (type === 'tab_switch') {
            title = 'Tab / Window Switch Detected!';
            message = 'Navigating away from the active coding arena is strictly logged. Remaining in the arena is required.';
          } else if (type === 'paste_detected') {
            title = 'External Code Paste Detected!';
            message = 'Pasting external code into the editor is flagged for academic integrity review.';
          } else if (type === 'unauthorized_navigation') {
            title = 'Platform Navigation Attempt!';
            message = 'Attempting to wander through platform pages during an active session is prohibited.';
          } else if (type === 'workspace_misuse') {
            title = 'Workspace Tampering Detected!';
            message = 'Opening developer tools or unauthorized shortcuts is strictly prohibited.';
          }

          setActiveNotice({
            type,
            title,
            message,
            warningNumber: strikeCount,
            maxWarnings,
            isDisqualified: isDQ,
          });
        }
      } catch (err) {
        console.error('Failed to log proctoring violation:', err);
      }
    },
    [contestId, eventId, isProctoringActive, maxWarnings, onDisqualification, scopeType, session?.access_token]
  );

  // 1. Tab / Document Visibility Monitoring
  useEffect(() => {
    if (!isProctoringActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isProctoringActive) {
        reportViolation('tab_switch', {
          reason: 'document_hidden',
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleWindowBlur = () => {
      if (isProctoringActive && !document.fullscreenElement) {
        reportViolation('tab_switch', {
          reason: 'window_blur',
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isProctoringActive, reportViolation]);

  // 2. Mandatory Full-Screen Exit Monitoring
  useEffect(() => {
    if (!isProctoringActive) return;

    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      if (!active && isProctoringActive) {
        reportViolation('fullscreen_exit', {
          reason: 'fullscreen_element_null',
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isProctoringActive, reportViolation]);

  // 3. Large External Paste Monitoring
  useEffect(() => {
    if (!isProctoringActive) return;

    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') || '';
      // Flag external paste if exceeding 120 characters
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

  // 4. Developer Tools, Shortcut Tampering & Right-Click Inspection Prevention
  useEffect(() => {
    if (!isProctoringActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'i', 'j', 'c'].includes(e.key)) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
        reportViolation('workspace_misuse', {
          shortcut: e.key,
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('workspace_misuse', {
        action: 'context_menu_inspect',
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isProctoringActive, reportViolation]);

  const dismissNotice = useCallback(() => {
    if (!isDisqualified) {
      setActiveNotice(null);
    }
  }, [isDisqualified]);

  return {
    warnings,
    maxWarnings,
    isDisqualified,
    activeNotice,
    dismissNotice,
    reportViolation,
    isProctoringActive,
  };
}
