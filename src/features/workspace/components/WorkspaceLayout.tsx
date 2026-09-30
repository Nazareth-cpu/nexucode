/**
 * Responsive Monaco Coding Workspace Layout (Phase 4)
 *
 * Provides a split-screen or mobile-tabbed competitive programming environment.
 * Connects the problem statement, language selector, and Monaco editor.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Code2,
  BookOpen,
  Terminal,
  Play,
  Send,
  HelpCircle,
  History,
  Sliders,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import type { ProblemWithRelations } from '@/src/features/problems';
import { LanguageSelector } from './LanguageSelector';
import { MonacoWorkspaceEditor } from './MonacoWorkspaceEditor';
import { ProblemStatementPanel } from './ProblemStatementPanel';
import { useWorkspaceStorage } from '../hooks/useWorkspaceStorage';
import type { SupportedWorkspaceLanguage } from '../types';
import {
  useSubmission,
  ExecutionResultPanel,
  SubmissionHistoryModal,
} from '@/src/features/submissions';

interface WorkspaceLayoutProps {
  problem: ProblemWithRelations;
  userId: string;
  contestId?: string;
  onSubmissionSuccess?: (result: any) => void;
  backUrl?: string;
  backLabel?: string;
}

export function WorkspaceLayout({
  problem,
  userId,
  contestId,
  onSubmissionSuccess,
  backUrl = '/problems',
  backLabel = 'Problems',
}: WorkspaceLayoutProps) {
  // Mobile tab state: 'statement' | 'editor' | 'console'
  const [mobileTab, setMobileTab] = useState<'statement' | 'editor' | 'console'>('editor');

  // Extract database starter codes if present
  const dbStarterCodes: Record<string, string> = {};
  if (problem.languages && problem.languages.length > 0) {
    problem.languages.forEach((l) => {
      dbStarterCodes[l.language] = l.starter_code;
    });
  }

  // Scoped workspace storage hook
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

  // Phase 5: Submission & Execution Engine Hook (Supports Contest ID)
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
    resetResults,
  } = useSubmission({ problem, contestId, onSubmissionSuccess });

  const isPending = executionState === 'running' || executionState === 'submitting';

  // Automatically switch mobile tab to console when execution triggers
  useEffect(() => {
    if (isPending) {
      if (window.innerWidth < 1024) {
        setMobileTab('console');
      }
    }
  }, [isPending]);

  // Global Keyboard Shortcuts: Ctrl/Cmd + Enter to Run; Ctrl/Cmd + Shift + Enter to Submit
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
    <div className="flex flex-col h-[calc(100vh-4.5rem)] min-h-[640px] space-y-3">
      {/* Top Workspace Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-[#263833] bg-[#0D1A17] select-none shadow-sm">
        {/* Left: Navigation & Problem Title */}
        <div className="flex items-center gap-3">
          <Link
            to={backUrl}
            className="flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F59E0B] transition-colors font-medium p-1 rounded hover:bg-[#12221E]"
            title={`Return to ${backLabel}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">{backLabel}</span>
          </Link>

          <span className="text-[#263833] hidden md:inline">|</span>

          <div className="flex items-center gap-2 truncate">
            <h1 className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate">
              {problem.title}
            </h1>
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                problem.difficulty === 'easy'
                  ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                  : problem.difficulty === 'medium'
                  ? 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'
                  : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30'
              }`}
            >
              {problem.difficulty}
            </span>
          </div>
        </div>

        {/* Center: Mobile View Switcher (Only visible on screens < 1024px) */}
        <div className="flex lg:hidden items-center justify-center p-1 rounded-lg bg-[#07110F] border border-[#263833] text-xs">
          <button
            type="button"
            onClick={() => setMobileTab('statement')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mobileTab === 'statement'
                ? 'bg-[#12221E] text-[#F59E0B] font-semibold'
                : 'text-[#9CA3AF]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Problem</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mobileTab === 'editor'
                ? 'bg-[#12221E] text-[#F59E0B] font-semibold'
                : 'text-[#9CA3AF]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('console')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
              mobileTab === 'console'
                ? 'bg-[#12221E] text-[#F59E0B] font-semibold'
                : 'text-[#9CA3AF]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Result</span>
          </button>
        </div>

        {/* Right: Language Selector & Phase 5 Execution Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Confirmed 6-Language Selector */}
          <LanguageSelector
            selectedLanguage={currentLanguage}
            onSelectLanguage={selectLanguage}
          />

          {/* Submission History Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            title="View Submission History"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#263833] bg-[#07110F] hover:bg-[#12221E] text-[#9CA3AF] hover:text-[#F8FAFC] text-xs font-medium transition-colors"
          >
            <History className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="hidden xl:inline">History</span>
            {history.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#12221E] border border-[#263833] text-[#F59E0B] font-semibold">
                {history.length}
              </span>
            )}
          </button>

          {/* Custom Input Toggle */}
          <button
            type="button"
            onClick={() => setIsCustomInputOpen(!isCustomInputOpen)}
            title="Custom Testcase Stdin"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isCustomInputOpen
                ? 'border-[#F59E0B]/50 bg-[#12221E] text-[#F59E0B]'
                : 'border-[#263833] bg-[#07110F] text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Custom Input</span>
          </button>

          {/* Phase 5 Execution Controls: Run & Submit */}
          <div className="flex items-center gap-2 pl-1 border-l border-[#263833]">
            {/* Run Code Button */}
            <button
              type="button"
              onClick={() => runCode(currentCode, currentLanguage, { useCustomInput: isCustomInputOpen })}
              disabled={isPending}
              title="Run against sample test cases (Ctrl + Enter)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#263833] bg-[#12221E] hover:bg-[#1A312B] text-[#F8FAFC] text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {executionState === 'running' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F59E0B]" />
              ) : (
                <Play className="w-3.5 h-3.5 text-[#10B981] fill-[#10B981]/20" />
              )}
              <span className="hidden sm:inline">
                {executionState === 'running' ? 'Running...' : 'Run Code'}
              </span>
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => submitCode(currentCode, currentLanguage)}
              disabled={isPending}
              title="Submit solution for authoritative evaluation (Ctrl + Shift + Enter)"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {executionState === 'submitting' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#07110F]" />
              ) : (
                <Send className="w-3.5 h-3.5 fill-[#07110F]/20" />
              )}
              <span>{executionState === 'submitting' ? 'Evaluating...' : 'Submit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Grid (Desktop: 2 Columns; Mobile: Active Tab) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 overflow-hidden">
        {/* Left Column: Problem Statement Panel */}
        <div
          className={`h-full overflow-hidden ${
            mobileTab === 'statement' ? 'block' : 'hidden lg:block'
          }`}
        >
          <ProblemStatementPanel problem={problem} />
        </div>

        {/* Right Column: Monaco Code Editor + Custom Stdin & Result Panel */}
        <div
          className={`h-full flex flex-col min-h-0 overflow-hidden ${
            mobileTab === 'editor' ? 'block' : mobileTab === 'console' ? 'hidden' : 'hidden lg:flex'
          }`}
        >
          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[300px] overflow-hidden">
            <MonacoWorkspaceEditor
              language={currentLanguage}
              code={currentCode}
              onChange={updateCode}
              onResetStarter={resetToStarterCode}
              isCustomCode={isCustomCode}
            />
          </div>

          {/* Custom Input Drawer (Collapsible) */}
          {isCustomInputOpen && (
            <div className="mt-2.5 p-3 rounded-xl border border-[#263833] bg-[#0D1A17] space-y-2 select-none">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#F59E0B] flex items-center gap-1.5">
                  <Sliders className="w-3 h-3" />
                  <span>Custom Standard Input (stdin):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomInputOpen(false)}
                  className="text-[11px] text-[#9CA3AF] hover:text-[#F8FAFC]"
                >
                  Hide
                </button>
              </div>
              <textarea
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                placeholder="Enter input data to pass to stdin for trial execution..."
                rows={3}
                className="w-full p-2.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs font-mono text-[#F8FAFC] focus:border-[#F59E0B] focus:outline-none transition-colors resize-none"
              />
            </div>
          )}

          {/* Execution Result & Verdict Panel (Bottom Desktop Drawer) */}
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

        {/* Mobile Dedicated Console View (Only when mobileTab === 'console') */}
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

      {/* Submission History Modal */}
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

