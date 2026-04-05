import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useAuth,
} from '@clerk/clerk-react';
import { api } from './lib/api';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportPage } from './pages/ReportPage';
import { CaseDetailPage } from './pages/CaseDetailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export function App() {
  const { getToken } = useAuth();

  // Wire Clerk auth token into API client
  useEffect(() => {
    api.setAuthTokenGetter(async () => getToken());
  }, [getToken]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/case/:caseId" element={<CaseDetailPage />} />
      </Route>

      {/* Catch-all — prevents route enumeration */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
