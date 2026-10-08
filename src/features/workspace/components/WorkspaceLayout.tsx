/**
 * Responsive Monaco Coding Workspace Layout — Exact Implementation of Reference Panel 04
 *
 * Implements:
 * - Breadcrumb Navigation: < Problems > Problem Title
 * - Split Workspace: Left Problem Statement, Right Monaco Dark Editor
 * - Language selector, Run and Submit buttons
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Send,
  Sliders,
  History,
  RefreshCw,
  BookOpen,
  Code2,
  Terminal,
} from 'lucide-react';
import type { ProblemWithRelations } from '@/src/features/problems';
import { LanguageSelector } from './LanguageSelector';
import { MonacoWorkspaceEditor } from './MonacoWorkspaceEditor';
import { ProblemStatementPanel } from './ProblemStatementPanel';
import { useWorkspaceStorage } from '../hooks/useWorkspaceStorage';
import {
  useSubmission,
  ExecutionResultPanel,
  SubmissionHistoryModal,
} from '@/src/features/submissions';

interface WorkspaceLayoutProps {
  problem: ProblemWithRelations;
  userId: string;
  contestId?: string;
  eventId?: string;
  onSubmissionSuccess?: (result: any) => void;
  backUrl?: string;
  backLabel?: string;
}

export function WorkspaceLayout({
  problem,
  userId,
  contestId,
  eventId,
  onSubmissionSuccess,
  backUrl = '/problems',
  backLabel = 'Problems',
}: WorkspaceLayoutProps) {
  const [mobileTab, setMobileTab] = useState<'statement' | 'editor' | 'console'>('editor');

  const dbStarterCodes: Record<string, string> = {};
  if (problem.languages && problem.languages.length > 0) {
    problem.languages.forEach((l) => {
      dbStarterCodes[l.language] = l.starter_code;
    });
  }

  const {
    currentLanguage,
    selectLanguage,
    currentCode,
    updateCode,
    resetToStarterCode,
    isCustomCode,
  } = useWorkspaceStorage({
    userId,
    problemId: problem.id,
    databaseStarterCodes: dbStarterCodes,
    initialLanguage: 'python',
  });

  const {
    executionState,
    runResult,
    submitResult,
    errorMessage,
    isConsoleOpen,
    setIsConsoleOpen,
    isCustomInputOpen,
    setIsCustomInputOpen,
    customStdin,
    setCustomStdin,
    history,
    isLoadingHistory,
    isHistoryOpen,
    setIsHistoryOpen,
    runCode,
    submitCode,
  } = useSubmission({ problem, contestId, eventId, onSubmissionSuccess });

  const isPending = executionState === 'running' || executionState === 'submitting';

  useEffect(() => {
    if (isPending && window.innerWidth < 1024) {
      setMobileTab('console');
    }
  }, [isPending]);

  // Global Keyboard Shortcuts (Ctrl+Enter to Run; Ctrl+Shift+Enter to Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          submitCode(currentCode, currentLanguage);
        } else {
          runCode(currentCode, currentLanguage, { useCustomInput: isCustomInputOpen });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCode, currentLanguage, isCustomInputOpen, runCode, submitCode]);

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] min-h-[640px] space-y-3">
      {/* ----------------- BREADCRUMB & CONTROLS HEADER (Panel 04) ----------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-[#0E0B28] border border-[#241D4D] shadow-xl text-[#F8FAFC]">
        {/* Breadcrumb: < Problems > Two Sum */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#94A3B8]">
          <Link
            to={backUrl}
            className="flex items-center gap-1 hover:text-[#FBBF24] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[#A855F7]" />
            <span>{backLabel}</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="text-[#F8FAFC] font-extrabold truncate max-w-[200px]">
            {problem.title}
          </span>
        </div>

        {/* Mobile View Switcher */}
        <div className="flex lg:hidden items-center justify-center p-1 rounded-xl bg-[#08051A] border border-[#241D4D] text-xs">
          <button
            type="button"
            onClick={() => setMobileTab('statement')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mobileTab === 'statement' ? 'bg-[#7C3AED] text-white font-bold' : 'text-[#94A3B8]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Problem</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mobileTab === 'editor' ? 'bg-[#7C3AED] text-white font-bold' : 'text-[#94A3B8]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('console')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mobileTab === 'console' ? 'bg-[#7C3AED] text-white font-bold' : 'text-[#94A3B8]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Result</span>
          </button>
        </div>

        {/* Right Controls: Language Selector, History, Run & Submit */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <LanguageSelector
            selectedLanguage={currentLanguage}
            onSelectLanguage={selectLanguage}
          />

          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            title="View Submission History"
            className="p-2 rounded-xl bg-[#15103A] hover:bg-[#1E174D] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#241D4D] transition-colors"
          >
            <History className="w-4 h-4 text-[#A855F7]" />
          </button>

          <button
            type="button"
            onClick={() => setIsCustomInputOpen(!isCustomInputOpen)}
            title="Custom Stdin"
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isCustomInputOpen
                ? 'border-[#F59E0B] bg-[#F59E0B]/20 text-[#FBBF24]'
                : 'border-[#241D4D] bg-[#15103A] text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Run Code Button (Purple - Panel 04) */}
          <button
            type="button"
            onClick={() => runCode(currentCode, currentLanguage, { useCustomInput: isCustomInputOpen })}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-extrabold text-xs transition-all shadow-md shadow-[#7C3AED]/20 active:scale-95 disabled:opacity-50"
          >
            {executionState === 'running' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white fill-white" />
            )}
            <span>Run</span>
          </button>

          {/* Submit Button (Amber - Panel 04) */}
          <button
            type="button"
            onClick={() => submitCode(currentCode, currentLanguage)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] font-extrabold text-xs transition-all shadow-md shadow-[#F59E0B]/20 active:scale-95 disabled:opacity-50"
          >
            {executionState === 'submitting' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#08051A]" />
            ) : (
              <Send className="w-3.5 h-3.5 text-[#08051A]" />
            )}
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* ----------------- SPLIT WORKSPACE (Panel 04) ----------------- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 overflow-hidden">
        {/* Left Column: Problem Statement Panel */}
        <div
          className={`h-full overflow-hidden ${
            mobileTab === 'statement' ? 'block' : 'hidden lg:block'
          }`}
        >
          <ProblemStatementPanel problem={problem} />
        </div>

        {/* Right Column: Monaco Editor + Result Panel */}
        <div
          className={`h-full flex flex-col min-h-0 overflow-hidden ${
            mobileTab === 'editor' ? 'block' : mobileTab === 'console' ? 'hidden' : 'hidden lg:flex'
          }`}
        >
          {/* Monaco Editor */}
          <div className="flex-1 min-h-[300px] overflow-hidden">
            <MonacoWorkspaceEditor
              language={currentLanguage}
              code={currentCode}
              onChange={updateCode}
              onResetStarter={resetToStarterCode}
              isCustomCode={isCustomCode}
              problemId={problem.id}
            />
          </div>

          {/* Custom Input Drawer */}
          {isCustomInputOpen && (
            <div className="mt-2.5 p-3 rounded-2xl border border-[#241D4D] bg-[#0E0B28] space-y-2 select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#F59E0B] flex items-center gap-1.5">
                  <Sliders className="w-3 h-3" />
                  <span>Custom Standard Input (stdin):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomInputOpen(false)}
                  className="text-[11px] text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  Hide
                </button>
              </div>
              <textarea
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                placeholder="Enter input data to pass to stdin for trial execution..."
                rows={3}
                className="w-full p-2.5 rounded-xl bg-[#08051A] border border-[#241D4D] text-xs font-mono text-[#F8FAFC] focus:border-[#7C3AED] focus:outline-none transition-colors resize-none"
              />
            </div>
          )}

          {/* Execution Result & Verdict Panel */}
          {(isConsoleOpen || executionState !== 'idle') && (
            <div className="mt-2.5 max-h-[320px] overflow-hidden">
              <ExecutionResultPanel
                state={executionState}
                runResult={runResult}
                submitResult={submitResult}
                errorMessage={errorMessage}
                onClose={() => setIsConsoleOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Mobile Console View */}
        {mobileTab === 'console' && (
          <div className="h-full overflow-y-auto lg:hidden">
            <ExecutionResultPanel
              state={executionState}
              runResult={runResult}
              submitResult={submitResult}
              errorMessage={errorMessage}
            />
          </div>
        )}
      </div>

      <SubmissionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        isLoading={isLoadingHistory}
        problemTitle={problem.title}
      />
    </div>
  );
}
