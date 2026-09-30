/**
 * Staff Contest Creator & Editor Modal (Phase 6)
 *
 * Allows Chapter Coordinators and Administrators to configure tournaments,
 * schedule timing boundaries, allocate problem points, and configure anti-cheat policies.
 */

import React, { useState, useEffect } from 'react';
import { X, Trophy, Plus, Trash2, Calendar, Clock, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '@/src/features/auth';
import { contestService } from '../services/contestService';
import { problemService } from '@/src/features/problems/services/problemService';
import type { ProblemRow } from '@/src/types/database';
import type { ContestDetail, CreateContestInput } from '../types';

interface StaffContestEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  contestToEdit?: ContestDetail | null;
}

export function StaffContestEditorModal({
  isOpen,
  onClose,
  onSaved,
  contestToEdit,
}: StaffContestEditorModalProps) {
  const { session } = useAuth();
  const [availableProblems, setAvailableProblems] = useState<ProblemRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [penaltyMinutes, setPenaltyMinutes] = useState(20);
  const [maxWarnings, setMaxWarnings] = useState(3);
  const [enableProctoring, setEnableProctoring] = useState(true);

  // Selected problems
  const [selectedProblems, setSelectedProblems] = useState<
    Array<{ problemId: string; title: string; points: number }>
  >([]);

  useEffect(() => {
    // Fetch available published problems
    problemService.getProblems().then((res) => {
      if (res.data) {
        setAvailableProblems(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (contestToEdit) {
      setTitle(contestToEdit.title);
      setDescription(contestToEdit.description || '');
      setStartAt(new Date(contestToEdit.startAt).toISOString().slice(0, 16));
      const dur = Math.round(
        (new Date(contestToEdit.endAt).getTime() - new Date(contestToEdit.startAt).getTime()) / 60000
      );
      setDurationMinutes(dur > 0 ? dur : 120);
      setRegistrationDeadline(new Date(contestToEdit.registrationDeadline).toISOString().slice(0, 16));
      setPenaltyMinutes(contestToEdit.rules?.penaltyMinutesPerWrongAnswer ?? 20);
      setMaxWarnings(contestToEdit.rules?.maxWarnings ?? 3);
      setEnableProctoring(contestToEdit.rules?.enableProctoring ?? true);

      if (contestToEdit.problems) {
        setSelectedProblems(
          contestToEdit.problems.map((p) => ({
            problemId: p.problemId,
            title: p.title,
            points: p.points,
          }))
        );
      }
    } else {
      // Default dates: tomorrow 10:00 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const startStr = tomorrow.toISOString().slice(0, 16);
      setStartAt(startStr);

      const reg = new Date(tomorrow.getTime() - 3600000);
      setRegistrationDeadline(reg.toISOString().slice(0, 16));

      setTitle('');
      setDescription('');
      setDurationMinutes(120);
      setPenaltyMinutes(20);
      setMaxWarnings(3);
      setEnableProctoring(true);
      setSelectedProblems([]);
    }
  }, [contestToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddProblem = (problemId: string) => {
    if (!problemId) return;
    const existing = selectedProblems.find((p) => p.problemId === problemId);
    if (existing) return;

    const prob = availableProblems.find((p) => p.id === problemId);
    if (prob) {
      setSelectedProblems([
        ...selectedProblems,
        {
          problemId: prob.id,
          title: prob.title,
          points: 100,
        },
      ]);
    }
  };

  const handleRemoveProblem = (idx: number) => {
    setSelectedProblems(selectedProblems.filter((_, i) => i !== idx));
  };

  const handlePointsChange = (idx: number, points: number) => {
    const updated = [...selectedProblems];
    updated[idx].points = Math.max(1, points);
    setSelectedProblems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;

    if (!title.trim()) {
      setErrorMsg('Tournament title is required.');
      return;
    }
    if (!startAt) {
      setErrorMsg('Start time is required.');
      return;
    }
    if (selectedProblems.length === 0) {
      setErrorMsg('Select at least one problem for the tournament.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const startDate = new Date(startAt);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const regDeadline = registrationDeadline ? new Date(registrationDeadline) : startDate;

    const payload: CreateContestInput = {
      title: title.trim(),
      description: description.trim(),
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      registrationDeadline: regDeadline.toISOString(),
      status: 'scheduled',
      rules: {
        penaltyMinutesPerWrongAnswer: penaltyMinutes,
        maxWarnings,
        enableProctoring,
      },
      problems: selectedProblems.map((p, idx) => ({
        problemId: p.problemId,
        orderIndex: idx,
        points: p.points,
      })),
    };

    try {
      if (contestToEdit) {
        const { error } = await contestService.updateContest(
          contestToEdit.id,
          payload,
          session.access_token
        );
        if (error) throw new Error(error);
      } else {
        const { error } = await contestService.createContest(payload, session.access_token);
        if (error) throw new Error(error);
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Failed to save tournament.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-[#263833] bg-[#0D1A17] p-6 space-y-6 shadow-2xl text-[#F8FAFC] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#263833] pb-4">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-[#F59E0B]" />
            <h2 className="text-lg font-bold text-[#F8FAFC]">
              {contestToEdit ? 'Edit Tournament' : 'Create Chapter Tournament'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F8FAFC] hover:bg-[#12221E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/40 text-xs text-[#EF4444]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1">
                Tournament Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., CodeSprint Chapter Cup 2026"
                className="w-full px-3.5 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-1">
                Description / Brief
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tournament format, eligibility, and rules summary..."
                className="w-full px-3.5 py-2 rounded-lg bg-[#07110F] border border-[#263833] text-[#F8FAFC] text-xs focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#07110F] border border-[#263833]">
            <div>
              <label className="block text-[11px] font-mono text-[#9CA3AF] mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#0D1A17] border border-[#263833] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#9CA3AF] mb-1">
                Duration (Minutes) *
              </label>
              <input
                type="number"
                min={15}
                max={1440}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded bg-[#0D1A17] border border-[#263833] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#9CA3AF] mb-1">
                Registration Deadline
              </label>
              <input
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#0D1A17] border border-[#263833] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
              />
            </div>
          </div>

          {/* Tournament Rules & Proctoring */}
          <div className="p-3.5 rounded-xl bg-[#07110F] border border-[#263833] space-y-3">
            <h3 className="text-xs font-mono font-semibold text-[#10B981] uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Rules &amp; Proctoring Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">
                  Penalty Per Wrong Attempt
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={penaltyMinutes}
                    onChange={(e) => setPenaltyMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-[#0D1A17] border border-[#263833] text-xs text-[#F8FAFC]"
                  />
                  <span className="text-xs text-[#9CA3AF] font-mono">min</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">
                  Max Proctoring Strikes
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={maxWarnings}
                  onChange={(e) => setMaxWarnings(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded bg-[#0D1A17] border border-[#263833] text-xs text-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-3 pt-4">
                <input
                  type="checkbox"
                  id="enableProctoring"
                  checked={enableProctoring}
                  onChange={(e) => setEnableProctoring(e.target.checked)}
                  className="w-4 h-4 rounded text-[#10B981] bg-[#0D1A17] border-[#263833]"
                />
                <label htmlFor="enableProctoring" className="text-xs text-[#F8FAFC] cursor-pointer">
                  Enable Tab Switch &amp; Anti-Cheat Deterrence
                </label>
              </div>
            </div>
          </div>

          {/* Problem Selector & Points */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#F8FAFC]">
                Tournament Problem Set ({selectedProblems.length})
              </label>

              <select
                onChange={(e) => {
                  handleAddProblem(e.target.value);
                  e.target.value = '';
                }}
                defaultValue=""
                className="px-2.5 py-1 rounded bg-[#07110F] border border-[#263833] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#F59E0B]"
              >
                <option value="" disabled>
                  + Add Published Problem
                </option>
                {availableProblems
                  .filter((ap) => !selectedProblems.some((sp) => sp.problemId === ap.id))
                  .map((ap) => (
                    <option key={ap.id} value={ap.id}>
                      {ap.title} ({ap.difficulty})
                    </option>
                  ))}
              </select>
            </div>

            {selectedProblems.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#263833] text-center text-xs text-[#9CA3AF]">
                No problems attached yet. Add at least 1 problem from the dropdown.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProblems.map((prob, idx) => (
                  <div
                    key={prob.problemId}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#07110F] border border-[#263833]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#12221E] border border-[#263833] text-center font-mono text-xs font-bold text-[#F59E0B]">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-xs font-medium text-[#F8FAFC] truncate max-w-xs">
                        {prob.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <label className="text-[10px] text-[#9CA3AF] font-mono">Points:</label>
                        <input
                          type="number"
                          min={10}
                          max={1000}
                          step={10}
                          value={prob.points}
                          onChange={(e) => handlePointsChange(idx, Number(e.target.value))}
                          className="w-16 px-2 py-0.5 rounded bg-[#0D1A17] border border-[#263833] text-xs font-mono text-right text-[#F8FAFC]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProblem(idx)}
                        className="p-1 rounded text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t border-[#263833] pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#263833] text-[#9CA3AF] hover:text-[#F8FAFC] text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#07110F] font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving Tournament...' : contestToEdit ? 'Save Changes' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
