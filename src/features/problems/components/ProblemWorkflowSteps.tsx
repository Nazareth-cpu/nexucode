/**
 * Problem Authoring Workflow Steps Indicator (Phase 3)
 *
 * Visually communicates the strict lifecycle:
 * DRAFT -> PREVIEW -> VALIDATE -> ADD HIDDEN TESTS -> PUBLISH -> ATTACH TO CONTEST
 */

import React from 'react';
import {
  FileEdit,
  Eye,
  CheckCircle2,
  FileCode2,
  UploadCloud,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import type { ProblemStatus } from '../types';

interface ProblemWorkflowStepsProps {
  currentStep: 'draft' | 'preview' | 'hidden_tests' | 'published';
  status: ProblemStatus;
  hasHiddenTests: boolean;
  onStepClick?: (step: 'draft' | 'preview' | 'hidden_tests') => void;
}

export function ProblemWorkflowSteps({
  currentStep,
  status,
  hasHiddenTests,
  onStepClick,
}: ProblemWorkflowStepsProps) {
  const steps = [
    {
      id: 'draft',
      label: '1. Draft',
      icon: FileEdit,
      isDone: true,
      isActive: currentStep === 'draft' && status === 'draft',
    },
    {
      id: 'preview',
      label: '2. Preview',
      icon: Eye,
      isDone: currentStep === 'preview' || status === 'published',
      isActive: currentStep === 'preview',
    },
    {
      id: 'hidden_tests',
      label: '3. Hidden Tests',
      icon: FileCode2,
      isDone: hasHiddenTests,
      isActive: currentStep === 'hidden_tests',
    },
    {
      id: 'publish',
      label: '4. Publish',
      icon: UploadCloud,
      isDone: status === 'published',
      isActive: status === 'published',
    },
    {
      id: 'contest',
      label: '5. Attach to Contest',
      icon: Trophy,
      isDone: false,
      isActive: false,
      optional: true,
    },
  ];

  return (
    <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-3 sm:p-4 overflow-x-auto">
      <div className="flex items-center min-w-[580px] justify-between gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  if (onStepClick && (step.id === 'draft' || step.id === 'preview' || step.id === 'hidden_tests')) {
                    onStepClick(step.id as 'draft' | 'preview' | 'hidden_tests');
                  }
                }}
                disabled={step.id === 'publish' || step.id === 'contest'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  step.isActive
                    ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40 shadow-sm'
                    : step.isDone
                    ? 'text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 hover:bg-[#10B981]/20'
                    : 'text-[#9CA3AF] bg-[#07110F] border border-[#263833]/60 hover:text-[#F8FAFC]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="whitespace-nowrap">{step.label}</span>
                {step.optional && (
                  <span className="text-[10px] text-[#9CA3AF] font-mono bg-[#12221E] px-1 py-0.2 rounded">
                    Phase 4
                  </span>
                )}
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-[#263833] flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
