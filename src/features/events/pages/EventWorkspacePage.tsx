/**
 * Technical Event Coding Workspace Page
 *
 * Mandatory Full-Screen Coding Workspace for Chapter Hackathons & Technical Sprints.
 * Features:
 * 1. Server-authoritative 3-Strike Integrity Enforcement
 * 2. Mandatory browser full-screen enforcement
 * 3. Event challenge countdown timer & problem navigator
 * 4. Academic integrity proctoring (full-screen exits, tab switching, paste deterrence)
 * 5. Immediate revocation and re-entry denial on 3rd strike
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  LogOut,
  AlertTriangle,
  Code2,
  RefreshCw,
  Maximize2,
  CheckCircle2,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { problemService, ProblemWithRelations } from '@/src/features/problems';
import { WorkspaceLayout } from '@/src/features/workspace/components/WorkspaceLayout';
import { useContestProctoring } from '@/src/features/contests/hooks/useContestProctoring';
import { ViolationWarningModal } from '@/src/features/contests/components/ViolationWarningModal';
import { eventService } from '../services/eventService';

interface EventChallengeItem {
  id: string;
  problemId: string;
  title: string;
  slug: string;
  points: number;
}

const DEFAULT_EVENT_PROBLEMS: EventChallengeItem[] = [
  { id: 'ep-1', problemId: 'seed-1', title: 'Two Sum', slug: 'two-sum', points: 100 },
  { id: 'ep-2', problemId: 'seed-2', title: 'Add Two Numbers', slug: 'add-two-numbers', points: 200 },
  { id: 'ep-3', problemId: 'seed-5', title: 'Valid Parentheses', slug: 'valid-parentheses', points: 150 },
];

export function EventWorkspacePage() {
  const { id: eventId = 'evt-1', problemSlug } = useParams<{ id: string; problemSlug?: string }>();
  const navigate = useNavigate();
  const { user, session } = useAuth();

  const [eventProblems, setEventProblems] = useState<EventChallengeItem[]>(DEFAULT_EVENT_PROBLEMS);
  const [eventTitle, setEventTitle] = useState('Technical Event Workspace');
  const [activeProblemSummary, setActiveProblemSummary] = useState<EventChallengeItem>(
    DEFAULT_EVENT_PROBLEMS[0]
  );
  const [activeProblemFull, setActiveProblemFull] = useState<ProblemWithRelations | null>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);
  const [serverCheckDone, setServerCheckDone] = useState(false);
  const [isServerDisqualified, setIsServerDisqualified] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // 1. Fetch Event Detail & Problems + Check server-authoritative participation state on mount
  useEffect(() => {
    if (!session?.access_token) return;

    eventService.getEventDetail(eventId, session.access_token).then((evt) => {
      if (evt) {
        setEventTitle(evt.title);
        if (evt.problems && evt.problems.length > 0) {
          const mapped: EventChallengeItem[] = evt.problems.map((p) => ({
            id: `ep-${p.problemId}`,
            problemId: p.problemId,
            title: p.title,
            slug: p.slug,
            points: p.points,
          }));
          setEventProblems(mapped);

          let target = mapped[0];
          if (problemSlug) {
            const match = mapped.find((item) => item.slug === problemSlug);
            if (match) target = match;
          }
          setActiveProblemSummary(target);
        }
      }
    });

    eventService.startParticipation(eventId, session.access_token).then((res) => {
      if (res.isDisqualified) {
        setIsServerDisqualified(true);
      } else if (!res.success && res.error) {
        setServerError(res.error);
      }
      setServerCheckDone(true);
    });
  }, [eventId, session?.access_token, problemSlug]);

  // 2. Proctoring Hook for Technical Event Workspace
  const {
    warnings,
    maxWarnings,
    isDisqualified: isHookDisqualified,
    activeNotice,
    dismissNotice,
    reportViolation,
  } = useContestProctoring({
    eventId,
    scopeType: 'event',
    enabled: serverCheckDone,
    initialWarnings: isServerDisqualified ? 3 : 0,
    isContestLive: true,
  });

  const isDisqualified = isServerDisqualified || isHookDisqualified;

  // 3. Mandatory Browser Full-Screen Mode State & Listener
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(document.fullscreenElement));
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active && !isDisqualified) {
        reportViolation('fullscreen_exit', {
          reason: 'Exited mandatory event full-screen mode',
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isDisqualified, reportViolation]);

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch {
      // Browser permissions fallback
      setIsFullscreen(true);
    }
  };

  // 4. Select active problem
  useEffect(() => {
    let target = DEFAULT_EVENT_PROBLEMS[0];
    if (problemSlug) {
      const match = DEFAULT_EVENT_PROBLEMS.find((p) => p.slug === problemSlug);
      if (match) target = match;
    }
    setActiveProblemSummary(target);
  }, [problemSlug]);

  // 5. Fetch full problem definition for Monaco workspace
  useEffect(() => {
    if (!activeProblemSummary?.slug) return;

    let isCancelled = false;
    setIsLoadingProblem(true);

    problemService.getProblemBySlug(activeProblemSummary.slug).then((res) => {
      if (!isCancelled && res.data) {
        setActiveProblemFull(res.data);
      }
      if (!isCancelled) {
        setIsLoadingProblem(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeProblemSummary?.slug]);

  const handleProblemChange = (prob: EventChallengeItem) => {
    setActiveProblemSummary(prob);
    navigate(`/events/${eventId}/workspace/${prob.slug}`, { replace: true });
  };

  // Disqualified View: Participation permanently revoked
  if (isDisqualified) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-[#EF4444]/60 bg-[#180A0A] p-6 space-y-4 text-center shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-[#EF4444] mx-auto animate-pulse" />
          <div className="inline-block px-3 py-0.5 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] text-[11px] font-mono font-bold uppercase">
            3 Strikes Enforced
          </div>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Participation Permanently Revoked</h2>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">
            You have reached the maximum allowed integrity strikes (3). Your active participation in this technical event has been revoked, session invalidated, and workspace locked.
          </p>
          <div className="pt-2">
            <Link
              to="/events"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-all shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span>Return to Events</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8 bg-[#08051A]">
      {/* ----------------- TOP EVENT WORKSPACE BAR ----------------- */}
      <header className="h-14 border-b border-[#241D4D] bg-[#0E0B28] px-4 flex items-center justify-between gap-3 flex-shrink-0 z-20">
        {/* Left: Event Title & Challenge Selector */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F8FAFC] transition-colors p-1 rounded hover:bg-[#130F35] flex-shrink-0"
            title="Exit Event Workspace"
          >
            <LogOut className="w-4 h-4 rotate-180" />
            <span className="hidden md:inline font-mono font-bold text-[#F8FAFC]">
              CodeStorm Sprint
            </span>
          </button>

          <span className="text-[#241D4D] hidden md:inline">|</span>

          {/* Problem Selector Pills */}
          <div className="flex items-center gap-1.5">
            {DEFAULT_EVENT_PROBLEMS.map((prob, idx) => {
              const isSelected = activeProblemSummary.problemId === prob.problemId;
              const letter = String.fromCharCode(65 + idx);

              return (
                <button
                  key={prob.problemId}
                  type="button"
                  onClick={() => handleProblemChange(prob)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    isSelected
                      ? 'bg-[#F59E0B] text-[#08051A] font-bold shadow-sm'
                      : 'bg-[#08051A] text-[#9CA3AF] border border-[#241D4D] hover:text-[#F8FAFC]'
                  }`}
                >
                  <span>{letter}</span>
                  <span className="text-[10px] opacity-75">{prob.points}p</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Technical Event Sprint Tag & Full-screen Status */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Strikes Counter */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border border-[#241D4D] bg-[#08051A]">
            <ShieldAlert className={`w-3.5 h-3.5 ${warnings > 0 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`} />
            <span className={warnings > 0 ? 'text-[#F59E0B] font-bold' : 'text-[#9CA3AF]'}>
              Strikes: {warnings}/{maxWarnings}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]">
            <Clock className="w-3.5 h-3.5" />
            <span>Sprint Active</span>
          </div>

          {!isFullscreen && (
            <button
              type="button"
              onClick={enterFullscreen}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F59E0B] text-[#08051A] text-xs font-bold shadow animate-pulse"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </button>
          )}
        </div>
      </header>

      {/* ----------------- WORKSPACE BODY ----------------- */}
      <main className="flex-1 relative overflow-hidden">
        {isLoadingProblem || !activeProblemFull ? (
          <div className="h-full flex items-center justify-center space-y-2">
            <Code2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
            <p className="text-xs text-[#9CA3AF] font-mono">Loading technical event challenge...</p>
          </div>
        ) : (
          <WorkspaceLayout
            key={activeProblemFull.id}
            problem={activeProblemFull}
            userId={user?.id || 'anon'}
            backUrl={`/events`}
            backLabel="Events"
          />
        )}
      </main>

      {/* ----------------- MANDATORY FULL-SCREEN OVERLAY ----------------- */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full rounded-2xl border border-[#F59E0B]/50 bg-[#0E0B28] p-6 space-y-4 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] mx-auto shadow-inner">
              <Maximize2 className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-[#F8FAFC]">Mandatory Full-Screen Mode</h2>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Technical event guidelines require participants to code in full-screen mode. The challenge workspace is locked until full-screen is activated. Exiting full-screen generates integrity strikes.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={enterFullscreen}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-bold text-xs transition-all shadow-md active:scale-95"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Enter Full-Screen Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/events')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-transparent text-[#9CA3AF] hover:text-[#F8FAFC] text-xs transition-colors"
              >
                <span>Return to Events Catalog</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- EXIT CONFIRMATION MODAL ----------------- */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full rounded-2xl border border-[#241D4D] bg-[#0E0B28] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Exit Event Workspace?</h3>
                <p className="text-xs text-[#9CA3AF]">
                  Are you sure you want to return to the events catalog?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[#241D4D] bg-[#08051A] text-[#F8FAFC] text-xs font-semibold hover:bg-[#130F35] transition-colors"
              >
                Stay in Workspace
              </button>
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="px-3.5 py-1.5 rounded-lg bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold transition-colors"
              >
                Exit to Events
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- VIOLATION WARNING MODAL ----------------- */}
      {activeNotice && (
        <ViolationWarningModal
          notice={activeNotice}
          onAcknowledge={dismissNotice}
          exitUrl="/events"
          exitLabel="Return to Events"
        />
      )}
    </div>
  );
}
