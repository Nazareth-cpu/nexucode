/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from '@/src/app/providers/AppProviders';
import {
  ProtectedRoute,
  PublicOnlyRoute,
  LoginPage,
  RegisterPage,
  StaffActivationPage,
  AdminRoute,
} from '@/src/features/auth';
import { PlatformOverview } from '@/src/features/dashboard/PlatformOverview';
import { DashboardView } from '@/src/features/dashboard/DashboardView';
import {
  ProblemsView,
  ProblemDetailView,
  ProblemManagementListPage,
  ProblemEditorPage,
  ProblemPreviewPage,
  StaffRoute,
} from '@/src/features/problems';
import {
  ContestsListPage,
  ContestDetailPage,
  ContestArenaPage,
  ContestManagementPage,
} from '@/src/features/contests';
import { LeaderboardView } from '@/src/features/leaderboard/LeaderboardView';
import { ProfileView } from '@/src/features/profile/ProfileView';
import { EventsView, EventManagementPage } from '@/src/features/events';
import { AdminControlView, AdminBootstrapPage } from '@/src/features/admin';
import { AuthenticatedLayout } from '@/src/components/layout/AuthenticatedLayout';

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Overview */}
          <Route path="/" element={<PlatformOverview />} />

          {/* Dedicated One-Time First Administrator Bootstrap Route */}
          <Route path="/admin/bootstrap" element={<AdminBootstrapPage />} />

          {/* Staff Onboarding & Account Activation (One-time token claiming) */}
          <Route path="/staff/activate" element={<StaffActivationPage />} />
          <Route path="/activate" element={<StaffActivationPage />} />

          {/* Public-Only Authentication Routes (Redirect to /dashboard if already logged in) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected Routes (Redirect to /login with preserved redirect param if unauthenticated) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
              {/* Student-facing Routes */}
              <Route path="/dashboard" element={<DashboardView />} />
              <Route path="/problems" element={<ProblemsView />} />
              <Route path="/problems/:slug" element={<ProblemDetailView />} />
              <Route path="/problems/:slug/workspace" element={<ProblemDetailView />} />
              <Route path="/contests" element={<ContestsListPage />} />
              <Route path="/contests/:id" element={<ContestDetailPage />} />
              <Route path="/contests/:id/arena" element={<ContestArenaPage />} />
              <Route path="/contests/:id/arena/:problemSlug" element={<ContestArenaPage />} />
              <Route path="/leaderboard" element={<LeaderboardView />} />
              <Route path="/profile" element={<ProfileView />} />
              <Route path="/events" element={<EventsView />} />

              {/* Staff Routes (Event Coordinator & Platform Administrator) */}
              {/* Authorization Matrix: Problems (Coordinator, Admin), Events (Coordinator, Admin) */}
              <Route element={<StaffRoute />}>
                {/* Problem Management */}
                <Route path="/problems/manage" element={<ProblemManagementListPage />} />
                <Route path="/problems/manage/new" element={<ProblemEditorPage />} />
                <Route path="/problems/manage/:slug/edit" element={<ProblemEditorPage />} />
                <Route path="/problems/manage/:slug/preview" element={<ProblemPreviewPage />} />
                <Route path="/coordinator/problems" element={<ProblemManagementListPage />} />

                {/* Event Management */}
                <Route path="/events/manage" element={<EventManagementPage />} />
                <Route path="/coordinator/events" element={<EventManagementPage />} />
                <Route path="/coordinator" element={<EventManagementPage />} />
              </Route>

              {/* Admin ONLY Routes */}
              {/* Authorization Matrix: Contests (Admin ONLY), Admin Control (Admin ONLY) */}
              <Route element={<AdminRoute />}>
                {/* Contest Management */}
                <Route path="/contests/manage" element={<ContestManagementPage />} />
                <Route path="/contests/new" element={<ContestManagementPage />} />
                <Route path="/admin/contests" element={<ContestManagementPage />} />

                {/* Administrative Controls & Role Provisioning */}
                <Route path="/admin" element={<AdminControlView />} />
                <Route path="/admin/roles" element={<AdminControlView />} />
                <Route path="/admin/users" element={<AdminControlView />} />
                <Route path="/admin/problems" element={<ProblemManagementListPage />} />
                <Route path="/admin/events" element={<EventManagementPage />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
