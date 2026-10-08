/**
 * Problem Examples Editor (Phase 3)
 *
 * Manages structured public examples (Input, Output, Explanation).
 * At least 1 complete example is required prior to publishing.
 */

import React from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import type { ProblemExample } from '../types';

interface ExamplesEditorProps {
  examples: ProblemExample[];
  onChange: (examples: ProblemExample[]) => void;
  error?: string;
}

export function ExamplesEditor({ examples, onChange, error }: ExamplesEditorProps) {
  const handleAddExample = () => {
    const newEx: ProblemExample = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      input: '',
      output: '',
      explanation: '',
    };
    onChange([...examples, newEx]);
  };

  const handleRemoveExample = (index: number) => {
    if (examples.length <= 1) {
      // Keep at least one empty template
      onChange([
        {
          id: `ex-${Date.now()}`,
          input: '',
          output: '',
          explanation: '',
        },
      ]);
      return;
    }
    const updated = examples.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateField = (
    index: number,
    field: keyof ProblemExample,
    value: string
  ) => {
    const updated = [...examples];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-semibold text-[#F8FAFC]">
            Public Problem Examples <span className="text-[#F59E0B]">*</span>
          </label>
          <p className="text-[11px] text-[#9CA3AF] mt-0.5">
            Provide sample input and expected output for students to test their solutions against.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddExample}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#130F35] hover:bg-[#130F35]/80 text-[#F59E0B] hover:text-[#FBBF24] border border-[#241D4D] text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Example</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 p-2.5 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {examples.map((example, idx) => (
          <div
            key={example.id || idx}
            className="rounded-xl border border-[#241D4D] bg-[#08051A] p-4 space-y-3 relative group"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#241D4D]/80">
              <span className="text-xs font-mono font-medium text-[#F59E0B]">
                Example {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveExample(idx)}
                title="Remove Example"
                className="text-[#9CA3AF] hover:text-[#EF4444] p-1 rounded transition-colors"
                aria-label={`Remove Example ${idx + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#9CA3AF] mb-1">
                  Input: <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={example.input}
                  onChange={(e) => handleUpdateField(idx, 'input', e.target.value)}
                  placeholder="e.g., nums = [2,7,11,15], target = 9"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E0B28] border border-[#241D4D] text-xs font-mono text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] resize-y"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#9CA3AF] mb-1">
                  Expected Output: <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={example.output}
                  onChange={(e) => handleUpdateField(idx, 'output', e.target.value)}
                  placeholder="e.g., [0,1]"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E0B28] border border-[#241D4D] text-xs font-mono text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] resize-y"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#9CA3AF] mb-1">
                Explanation (Optional):
              </label>
              <input
                type="text"
                value={example.explanation || ''}
                onChange={(e) => handleUpdateField(idx, 'explanation', e.target.value)}
                placeholder="e.g., Because nums[0] + nums[1] == 9, we return [0, 1]."
                className="w-full px-3 py-2 rounded-lg bg-[#0E0B28] border border-[#241D4D] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
