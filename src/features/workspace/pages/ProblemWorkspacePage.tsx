/**
 * Problem Workspace Page (Phase 4)
 *
 * Dedicated coding workspace route: /problems/:slug/workspace (and /problems/:slug)
 * Authenticated students load published problems, select languages, and code in Monaco.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/src/features/auth';
import { problemService, ProblemWithRelations } from '@/src/features/problems';
import { WorkspaceLayout } from '../components/WorkspaceLayout';
import { RefreshCw, AlertCircle, ArrowLeft, Lock } from 'lucide-react';

export function ProblemWorkspacePage() {
  const params = useParams<{ slug?: string; id?: string }>();
  const slugOrId = params.slug || params.id;
  const { user, profile } = useAuth();

  const [problem, setProblem] = useState<ProblemWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const role = profile?.role || 'student';
  const isStaff = role === 'coordinator' || role === 'admin';

  useEffect(() => {
    if (!slugOrId || typeof slugOrId !== 'string' || slugOrId.trim().length === 0) {
      setIsLoading(false);
      setErrorMessage('No problem specified. Please select a valid problem from the Problem Bank.');
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    problemService
      .getProblemBySlug(slugOrId.trim())
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error || !data) {
          setErrorMessage(error?.message || 'The requested problem could not be found.');
          setProblem(null);
          return;
        }

        // Access check: If not published, only authorized staff may view
        if (data.status !== 'published' && !isStaff) {
          setErrorMessage('This problem is currently in draft mode and not available for practice.');
          setProblem(null);
          return;
        }

        setProblem(data);
      })
      .catch((err) => {
        if (isMounted) {
          setErrorMessage('A network or service error occurred while retrieving the problem.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slugOrId, isStaff]);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-[#F59E0B]" />
        <div className="text-center space-y-1">
          <h2 className="text-sm font-semibold text-[#F8FAFC]">Loading Coding Workspace</h2>
          <p className="text-xs text-[#9CA3AF] font-mono">
            Retrieving problem specification and starter templates...
          </p>
        </div>
      </div>
    );
  }

  // Error / Not Found / Draft State
  if (errorMessage || !problem) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-5">
        <div className="p-8 rounded-2xl border border-[#241D4D] bg-[#0E0B28] space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h1 className="text-lg font-bold text-[#F8FAFC]">Problem Unavailable</h1>
            <p className="text-xs text-[#9CA3AF] max-w-sm mx-auto leading-relaxed">
              {errorMessage || 'The problem you are trying to access does not exist or has been archived.'}
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/problems"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F59E0B] hover:bg-[#FBBF24] text-[#08051A] text-xs font-semibold transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Problem Catalog</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Monaco Coding Workspace
  return <WorkspaceLayout problem={problem} userId={user?.id || 'anon'} />;
}
