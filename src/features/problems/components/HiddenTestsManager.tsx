/**
 * Staff-Facing Hidden Test Cases Manager (Phase 3)
 *
 * Securely associates hidden test cases with problems for future judging.
 * Strictly protected: hidden test cases are never exposed to students.
 */

import React, { useState } from 'react';
import {
  FileCode2,
  Plus,
  Trash2,
  ShieldCheck,
  Clock,
  HardDrive,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import type { ProblemTestCaseItem } from '../types';

interface HiddenTestsManagerProps {
  testCases: ProblemTestCaseItem[];
  onChange: (testCases: ProblemTestCaseItem[]) => void;
  error?: string;
}

export function HiddenTestsManager({
  testCases,
  onChange,
  error,
}: HiddenTestsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newInput, setNewInput] = useState('');
  const [newExpectedOutput, setNewExpectedOutput] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTimeoutMs, setNewTimeoutMs] = useState(1000);
  const [newMemoryLimitKb, setNewMemoryLimitKb] = useState(262144); // 256MB in KB
  const [localError, setLocalError] = useState<string | null>(null);

  const hiddenCases = testCases.filter((tc) => tc.visibility === 'hidden');

  const handleAddHiddenTest = () => {
    if (!newInput.trim() || !newExpectedOutput.trim()) {
      setLocalError('Both test input and expected output are required.');
      return;
    }

    const newTestCase: ProblemTestCaseItem = {
      id: `tc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      storage_path: `inline://${encodeURIComponent(newInput.slice(0, 50))}`,
      visibility: 'hidden',
      input_data: newInput,
      expected_output: newExpectedOutput,
      metadata: {
        description: newDescription || `Hidden Test #${hiddenCases.length + 1}`,
        timeout_ms: Number(newTimeoutMs) || 1000,
        memory_limit_kb: Number(newMemoryLimitKb) || 262144,
      },
    };

    onChange([...testCases, newTestCase]);
    setNewInput('');
    setNewExpectedOutput('');
    setNewDescription('');
    setLocalError(null);
    setIsAdding(false);
  };

  const handleRemoveTest = (indexToRemove: number) => {
    const updated = testCases.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-4 rounded-xl border border-[#241D4D] bg-[#0E0B28] p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#241D4D]">
        <div>
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-sm font-semibold text-[#F8FAFC]">
              Hidden Judging Test Cases <span className="text-[#F59E0B]">*</span>
            </h3>
            <span className="text-[10px] font-mono uppercase bg-[#130F35] text-[#10B981] border border-[#10B981]/30 px-2 py-0.5 rounded font-medium">
              Staff Only • RLS Protected
            </span>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-1">
            Authoritative evaluation suite used by the platform judge. These test cases are strictly
            hidden from students and cannot be queried from public client sessions.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Hidden Test</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Inline Test Case Creator */}
      {isAdding && (
        <div className="rounded-xl border border-[#F59E0B]/40 bg-[#08051A] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#F59E0B] flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>New Hidden Test Case</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setLocalError(null);
              }}
              className="text-xs text-[#9CA3AF] hover:text-[#F8FAFC]"
            >
              Cancel
            </button>
          </div>

          {localError && (
            <div className="text-xs text-[#EF4444] bg-[#EF4444]/10 p-2 rounded border border-[#EF4444]/30">
              {localError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-[#9CA3AF] font-mono mb-1">
                Description / Test Scope:
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="e.g., Extreme boundary N=10^5"
                className="w-full px-3 py-1.5 rounded-lg bg-[#0E0B28] border border-[#241D4D] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] font-mono mb-1">
                Execution Timeout (ms):
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="number"
                  value={newTimeoutMs}
                  onChange={(e) => setNewTimeoutMs(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0E0B28] border border-[#241D4D] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-[#9CA3AF] font-mono mb-1">
                Memory Limit (KB):
              </label>
              <div className="relative">
                <HardDrive className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="number"
                  value={newMemoryLimitKb}
                  onChange={(e) => setNewMemoryLimitKb(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#0E0B28] border border-[#241D4D] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#9CA3AF] mb-1">
                Raw Input Data: <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                rows={4}
                value={newInput}
                onChange={(e) => setNewInput(e.target.value)}
                placeholder="Enter exact raw input provided via STDIN to student program..."
                className="w-full px-3 py-2 rounded-lg bg-[#0E0B28] border border-[#241D4D] text-xs font-mono text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#F59E0B] resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#9CA3AF] mb-1">
                Expected Output: <span className="text-[#EF4444]">*</span>
              </label>
              <textarea
                rows={4}
                value={newExpectedOutput}
                onChange={(e) => setNewExpectedOutput(e.target.value)}
                placeholder="Enter exact expected output provided via STDOUT..."
                className="w-full px-3 py-2 rounded-lg bg-[#0E0B28] border border-[#241D4D] text-xs font-mono text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#F59E0B] resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleAddHiddenTest}
              className="px-4 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-[#08051A] text-xs font-semibold transition-all shadow-sm"
            >
              Attach Test Case
            </button>
          </div>
        </div>
      )}

      {/* List of Attached Test Cases */}
      {hiddenCases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#241D4D] p-6 text-center space-y-2">
          <EyeOff className="w-6 h-6 text-[#9CA3AF] mx-auto opacity-40" />
          <p className="text-xs text-[#9CA3AF]">
            No hidden test cases attached yet. At least one hidden test is required to publish this problem.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {testCases.map((tc, idx) => (
            <div
              key={tc.id || idx}
              className="flex items-center justify-between p-3 rounded-lg border border-[#241D4D] bg-[#08051A] text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#130F35] border border-[#241D4D] flex items-center justify-center text-[10px] font-mono text-[#F59E0B] font-bold">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#F8FAFC]">
                      {tc.metadata?.description || `Hidden Case #${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.2 rounded border border-[#10B981]/30">
                      {tc.visibility}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[#9CA3AF] font-mono mt-0.5">
                    <span>Limit: {tc.metadata?.timeout_ms || 1000}ms</span>
                    <span>Mem: {Math.round((tc.metadata?.memory_limit_kb || 262144) / 1024)}MB</span>
                    {tc.input_data && (
                      <span className="truncate max-w-[180px]">
                        In: {tc.input_data.slice(0, 20)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveTest(idx)}
                className="text-[#9CA3AF] hover:text-[#EF4444] p-1.5 rounded transition-colors"
                title="Remove Test Case"
                aria-label={`Remove Test Case ${idx + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
