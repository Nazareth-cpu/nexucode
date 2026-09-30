/**
 * Centralized Problem Authoring Form (Phase 3)
 *
 * Implements the full authoring workflow:
 * DRAFT -> PREVIEW -> VALIDATE -> ADD HIDDEN TESTS -> PUBLISH
 *
 * Enforces the 8 required fields from specification:
 * 1. Statement 2. Input Format 3. Output Format 4. Constraints
 * 5. Examples 6. Explanation 7. Difficulty 8. Tags
 * Plus Title, Slug, Hidden Tests, and Starter Code.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import {
  Save,
  UploadCloud,
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  RefreshCw,
  FileCode,
  Tag,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import type {
  ProblemFormData,
  ProblemDifficulty,
  ProblemStatus,
  ProblemValidationResult,
  ProblemExample,
} from '../types';
import {
  problemService,
  generateSlug,
  validateProblemForPublishing,
} from '../services/problemService';
import { ExamplesEditor } from './ExamplesEditor';
import { HiddenTestsManager } from './HiddenTestsManager';
import { StarterCodeManager } from './StarterCodeManager';
import { ProblemPreviewModal } from './ProblemPreviewModal';
import { ProblemWorkflowSteps } from './ProblemWorkflowSteps';

interface ProblemFormProps {
  initialData?: Partial<ProblemFormData>;
  problemId?: string;
  isEditMode?: boolean;
}

export function ProblemForm({
  initialData,
  problemId,
  isEditMode = false,
}: ProblemFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSlugManual, setIsSlugManual] = useState(Boolean(initialData?.slug));
  const [difficulty, setDifficulty] = useState<ProblemDifficulty>(
    initialData?.difficulty || 'easy'
  );
  const [tags, setTags] = useState<string[]>(
    initialData?.tags || ['Arrays', 'Algorithms']
  );
  const [newTagInput, setNewTagInput] = useState('');
  const [statement, setStatement] = useState(initialData?.statement || '');
  const [inputFormat, setInputFormat] = useState(initialData?.input_format || '');
  const [outputFormat, setOutputFormat] = useState(initialData?.output_format || '');
  const [constraints, setConstraints] = useState(initialData?.constraints || '');
  const [explanation, setExplanation] = useState(initialData?.explanation || '');
  const [examples, setExamples] = useState<ProblemExample[]>(
    initialData?.examples || [
      {
        id: 'ex-1',
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
    ]
  );
  const [status, setStatus] = useState<ProblemStatus>(initialData?.status || 'draft');
  const [testCases, setTestCases] = useState(initialData?.test_cases || []);
  const [languages, setLanguages] = useState(initialData?.languages || []);

  // UI Flow State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'draft' | 'preview' | 'hidden_tests' | 'published'>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Title change syncs slug if not manually altered
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManual && !isEditMode) {
      setSlug(generateSlug(val));
    }
  };

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.trim();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Compile current form object
  const getFormData = (nextStatus?: ProblemStatus): ProblemFormData => ({
    title,
    slug: slug.trim() || generateSlug(title),
    statement,
    input_format: inputFormat,
    output_format: outputFormat,
    constraints,
    examples,
    explanation,
    difficulty,
    tags,
    status: nextStatus || status,
    test_cases: testCases,
    languages,
  });

  // Action: Save Draft (Lenient, allows incomplete work)
  const handleSaveDraft = async () => {
    if (!user) {
      setStatusNotice({ type: 'error', message: 'Authentication required.' });
      return;
    }

    if (!title.trim()) {
      setStatusNotice({ type: 'error', message: 'Problem title is required to save a draft.' });
      return;
    }

    setIsSubmitting(true);
    setStatusNotice({ type: 'warning', message: 'Saving draft to database...' });

    try {
      const data = getFormData('draft');
      let result;

      if (isEditMode && problemId) {
        result = await problemService.updateProblem(problemId, data, user.id);
      } else {
        result = await problemService.createProblem(data, user.id);
      }

      if (result.error) {
        setStatusNotice({ type: 'error', message: result.error.message });
      } else {
        setStatus('draft');
        setStatusNotice({ type: 'success', message: 'Draft saved successfully.' });
        if (!isEditMode && result.data?.slug) {
          navigate(`/problems/manage/${result.data.slug}/edit`, { replace: true });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save draft.';
      setStatusNotice({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action: Validate & Publish
  const handlePublish = async () => {
    if (!user) {
      setStatusNotice({ type: 'error', message: 'Authentication required.' });
      return;
    }

    const data = getFormData('published');
    // Run client validation
    const validation: ProblemValidationResult = validateProblemForPublishing(data, testCases);
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      const errorCount = Object.keys(validation.errors).length;
      const firstError = Object.values(validation.errors)[0];
      setStatusNotice({
        type: 'error',
        message: `Validation failed (${errorCount} requirement${errorCount > 1 ? 's' : ''} missing): ${firstError}`,
      });
      return;
    }

    setIsSubmitting(true);
    setStatusNotice({ type: 'warning', message: 'Publishing problem to catalog...' });

    try {
      let result;
      if (isEditMode && problemId) {
        result = await problemService.publishProblem(problemId, data, user.id);
      } else {
        // Create as published directly
        result = await problemService.createProblem({ ...data, status: 'published' }, user.id);
      }

      if (result.error) {
        setStatusNotice({ type: 'error', message: result.error.message });
      } else {
        setStatus('published');
        setStatusNotice({
          type: 'success',
          message: 'Problem published successfully! Visible to all students in the Problem Bank.',
        });
        setTimeout(() => {
          navigate('/problems/manage');
        }, 1200);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Publishing failed.';
      setStatusNotice({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasHiddenTests = testCases.some((tc) => tc.visibility === 'hidden');

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#263833]">
        <div>
          <button
            type="button"
            onClick={() => navigate('/problems/manage')}
            className="inline-flex items-center gap-1.5 text-xs text-[#9CA3AF] hover:text-[#F59E0B] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Problem Management</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] flex items-center gap-2.5">
            <FileCode className="w-6 h-6 text-[#F59E0B]" />
            <span>{isEditMode ? 'Edit Problem' : 'Author New Problem'}</span>
            <span
              className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                status === 'published'
                  ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30'
                  : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30'
              }`}
            >
              {status}
            </span>
          </h1>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#263833] bg-[#0D1A17] hover:border-[#F59E0B] text-xs font-semibold text-[#F8FAFC] transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#263833] bg-[#12221E] hover:bg-[#12221E]/80 text-xs font-semibold text-[#F59E0B] transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#10B981] hover:bg-[#10B981]/90 text-xs font-semibold text-[#07110F] transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{status === 'published' ? 'Update & Publish' : 'Publish Problem'}</span>
          </button>
        </div>
      </div>

      {/* Visual Workflow Tracker */}
      <ProblemWorkflowSteps
        currentStep={currentStep}
        status={status}
        hasHiddenTests={hasHiddenTests}
        onStepClick={(step) => {
          if (step === 'preview') setIsPreviewOpen(true);
          setCurrentStep(step);
        }}
      />

      {/* Status Notice Toast / Alert */}
      {statusNotice && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs animate-in fade-in duration-200 ${
            statusNotice.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
              : statusNotice.type === 'error'
              ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
              : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            {statusNotice.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {statusNotice.type === 'warning' && <RefreshCw className="w-4 h-4 animate-spin flex-shrink-0" />}
            <span className="font-medium">{statusNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="p-1 hover:opacity-70 transition-opacity"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Authoring Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Core Problem Metadata, Statement, I/O, Examples */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Identifiers */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
              Problem Identity
            </h2>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                Problem Title <span className="text-[#F59E0B]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Two Sum Deluxe"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07110F] border text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 ${
                  validationErrors.title
                    ? 'border-[#EF4444] focus:ring-[#EF4444]'
                    : 'border-[#263833] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
                }`}
              />
              {validationErrors.title && (
                <p className="text-[11px] text-[#EF4444] mt-1">{validationErrors.title}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#F8FAFC]">
                  URL Slug <span className="text-[#F59E0B]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsSlugManual(false);
                    setSlug(generateSlug(title));
                  }}
                  className="text-[10px] text-[#F59E0B] hover:underline font-mono"
                >
                  Regenerate from title
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#9CA3AF]">
                  /problems/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setIsSlugManual(true);
                    setSlug(e.target.value);
                  }}
                  placeholder="two-sum-deluxe"
                  className={`w-full pl-24 pr-3.5 py-2 rounded-lg bg-[#07110F] border text-xs font-mono text-[#F8FAFC] focus:outline-none focus:ring-1 ${
                    validationErrors.slug
                      ? 'border-[#EF4444] focus:ring-[#EF4444]'
                      : 'border-[#263833] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
                  }`}
                />
              </div>
              {validationErrors.slug && (
                <p className="text-[11px] text-[#EF4444] mt-1">{validationErrors.slug}</p>
              )}
            </div>
          </div>

          {/* Section 2: Problem Statement */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-2">
            <label className="block text-xs font-semibold text-[#F8FAFC]">
              Problem Statement <span className="text-[#F59E0B]">*</span>
            </label>
            <p className="text-[11px] text-[#9CA3AF]">
              Clearly articulate the algorithmic challenge, background story, and objectives.
            </p>
            <textarea
              rows={8}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target..."
              className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07110F] border text-xs sm:text-sm text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 leading-relaxed resize-y ${
                validationErrors.statement
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[#263833] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
              }`}
            />
            {validationErrors.statement && (
              <p className="text-[11px] text-[#EF4444] mt-1">{validationErrors.statement}</p>
            )}
          </div>

          {/* Section 3: Input & Output Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-2">
              <label className="block text-xs font-semibold text-[#F8FAFC]">
                Input Format <span className="text-[#F59E0B]">*</span>
              </label>
              <textarea
                rows={4}
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                placeholder="The first line contains an integer T (test cases). Each test case begins with integer N..."
                className={`w-full px-3 py-2 rounded-lg bg-[#07110F] border text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 resize-y ${
                  validationErrors.input_format
                    ? 'border-[#EF4444] focus:ring-[#EF4444]'
                    : 'border-[#263833] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
                }`}
              />
              {validationErrors.input_format && (
                <p className="text-[11px] text-[#EF4444] mt-1">{validationErrors.input_format}</p>
              )}
            </div>

            <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-2">
              <label className="block text-xs font-semibold text-[#F8FAFC]">
                Output Format <span className="text-[#F59E0B]">*</span>
              </label>
              <textarea
                rows={4}
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="For each test case, print the required answer on a new line..."
                className={`w-full px-3 py-2 rounded-lg bg-[#07110F] border text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 resize-y ${
                  validationErrors.output_format
                    ? 'border-[#EF4444] focus:ring-[#EF4444]'
                    : 'border-[#263833] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
                }`}
              />
              {validationErrors.output_format && (
                <p className="text-[11px] text-[#EF4444] mt-1">{validationErrors.output_format}</p>
              )}
            </div>
          </div>

          {/* Section 4: Constraints */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-2">
            <label className="block text-xs font-semibold text-[#F8FAFC]">
              Constraints <span className="text-[#F59E0B]">*</span>
            </label>
            <textarea
              rows={3}
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="1 <= N <= 10^5&#10;-10^9 <= nums[i] <= 10^9"
              className={`w-full px-3 py-2 rounded-lg bg-[#07110F] border text-xs font-mono text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 resize-y ${
                validationErrors.constraints
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[#263833] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
              }`}
            />
            {validationErrors.constraints && (
              <p className="text-[11px] text-[#EF4444] mt-1">{validationErrors.constraints}</p>
            )}
          </div>

          {/* Section 5: Public Examples */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5">
            <ExamplesEditor
              examples={examples}
              onChange={setExamples}
              error={validationErrors.examples}
            />
          </div>

          {/* Section 6: Explanation */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-2">
            <label className="block text-xs font-semibold text-[#F8FAFC]">
              Explanation &amp; Author Notes <span className="text-[#F59E0B]">*</span>
            </label>
            <p className="text-[11px] text-[#9CA3AF]">
              Explain the algorithmic strategy, edge cases, time/space complexity expectations.
            </p>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Using a two-pointer approach or hash map guarantees O(N) runtime..."
              className={`w-full px-3 py-2 rounded-lg bg-[#07110F] border text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:ring-1 resize-y ${
                validationErrors.explanation
                  ? 'border-[#EF4444] focus:ring-[#EF4444]'
                  : 'border-[#263833] focus:border-[#F59E0B] focus:ring-[#F59E0B]'
              }`}
            />
            {validationErrors.explanation && (
              <p className="text-[11px] text-[#EF4444] mt-1">{validationErrors.explanation}</p>
            )}
          </div>
        </div>

        {/* Right 1 Column: Difficulty, Tags, Hidden Tests, Starter Code */}
        <div className="space-y-6">
          {/* Difficulty & Classification */}
          <div className="rounded-xl border border-[#263833] bg-[#0D1A17] p-5 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#F59E0B] font-semibold">
              Classification
            </h2>

            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                Difficulty Level <span className="text-[#F59E0B]">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as ProblemDifficulty[]).map((level) => {
                  const isSelected = difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDifficulty(level)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all border ${
                        isSelected
                          ? level === 'easy'
                            ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                            : level === 'medium'
                            ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]'
                            : 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]'
                          : 'bg-[#07110F] border-[#263833] text-[#9CA3AF] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags Manager */}
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1">
                Topic Tags <span className="text-[#F59E0B]">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g., Dynamic Programming"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] placeholder-[#9CA3AF]/40 focus:outline-none focus:border-[#F59E0B]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-3 py-1.5 rounded-lg bg-[#12221E] hover:bg-[#12221E]/80 text-[#F59E0B] border border-[#263833] text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-1.5 min-h-[32px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#07110F] border border-[#263833] text-[#9CA3AF]"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-[#EF4444] transition-colors"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              {validationErrors.tags && (
                <p className="text-[11px] text-[#EF4444] mt-1">{validationErrors.tags}</p>
              )}
            </div>
          </div>

          {/* Hidden Test Cases Section */}
          <HiddenTestsManager
            testCases={testCases}
            onChange={setTestCases}
            error={validationErrors.test_cases}
          />

          {/* Starter Code Templates Section */}
          <StarterCodeManager
            languages={languages}
            onChange={setLanguages}
          />
        </div>
      </div>

      {/* Student Perspective Preview Modal */}
      <ProblemPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        problem={getFormData()}
      />
    </div>
  );
}
