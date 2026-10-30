import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { PublicLayout } from './components/layouts/PublicLayout';
import { VoterLayout } from './components/layouts/VoterLayout';
import { CandidateLayout } from './components/layouts/CandidateLayout';
import { AdminLayout } from './components/layouts/AdminLayout';

// Route Protection
import { ProtectedRoute } from './components/routes/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { RegisterPage } from './pages/public/RegisterPage';
import { LoginPage } from './pages/public/LoginPage';
import { PublicElectionsPage } from './pages/public/PublicElectionsPage';

// Voter Pages
import { VoterProfile } from './pages/voter/VoterProfile';
import { VoterElections } from './pages/voter/VoterElections';
import { VoterVotePage } from './pages/voter/VoterVotePage';
import { VoterResults } from './pages/voter/VoterResults';

// Candidate Pages
import { CandidateProfile } from './pages/candidate/CandidateProfile';
import { CandidateElections } from './pages/candidate/CandidateElections';
import { CandidateElectionDetail } from './pages/candidate/CandidateElectionDetail';
import { CandidateResults } from './pages/candidate/CandidateResults';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ViewVoters } from './pages/admin/ViewVoters';
import { ViewCandidates } from './pages/admin/ViewCandidates';
import { AdminElections } from './pages/admin/AdminElections';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminResults } from './pages/admin/AdminResults';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/elections" element={<PublicElectionsPage />} />
        </Route>

        {/* Voter Routes */}
        <Route
          path="/voter"
          element={
            <ProtectedRoute allowedRole="VOTER">
              <VoterLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/voter/profile" replace />} />
          <Route path="dashboard" element={<VoterProfile />} />
          <Route path="profile" element={<VoterProfile />} />
          <Route path="elections" element={<VoterElections />} />
          <Route path="elections/:electionId" element={<VoterVotePage />} />
          <Route path="results" element={<VoterResults />} />
        </Route>

        {/* Candidate Routes */}
        <Route
          path="/candidate"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <CandidateLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/candidate/profile" replace />} />
          <Route path="dashboard" element={<CandidateProfile />} />
          <Route path="profile" element={<CandidateProfile />} />
          <Route path="elections" element={<CandidateElections />} />
          <Route path="elections/:electionId" element={<CandidateElectionDetail />} />
          <Route path="results" element={<CandidateResults />} />
        </Route>

        {/* Admin Public Route (Standalone Login) */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="voters" element={<ViewVoters />} />
          <Route path="candidates" element={<ViewCandidates />} />
          <Route path="elections" element={<AdminElections />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="results" element={<AdminResults />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
