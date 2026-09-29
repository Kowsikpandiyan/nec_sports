import React, { useContext, useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Layouts
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';

// Pages
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

import DepartmentList from '../pages/departments/DepartmentList';
import DepartmentDetail from '../pages/departments/DepartmentDetail';
import DepartmentForm from '../pages/departments/DepartmentForm';

import PlayerList from '../pages/players/PlayerList';
import PlayerDetail from '../pages/players/PlayerDetail';
import PlayerForm from '../pages/players/PlayerForm';

import SportList from '../pages/sports/SportList';
import SportForm from '../pages/sports/SportForm';

import TournamentList from '../pages/tournaments/TournamentList';
import TournamentDetail from '../pages/tournaments/TournamentDetail';
import TournamentForm from '../pages/tournaments/TournamentForm';

import TeamList from '../pages/teams/TeamList';
import TeamDetail from '../pages/teams/TeamDetail';
import TeamForm from '../pages/teams/TeamForm';

import MatchList from '../pages/matches/MatchList';
import MatchDetail from '../pages/matches/MatchDetail';

import LiveScoreBoard from '../pages/live/LiveScoreBoard';
import ScorerPanel from '../pages/live/ScorerPanel';

import PointsTable from '../pages/pointsTable/PointsTable';
import Gallery from '../pages/gallery/Gallery';
import PublicGallery from '../pages/gallery/PublicGallery';
import Reports from '../pages/reports/Reports';
import AIStudio from '../pages/ai/AIStudio';

/**
 * Main Layout wrapper with Navbar and Sidebar
 */
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/**
 * Route Guard for logged-in users only
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/**
 * Route Guard for unauthenticated pages (Login, ForgotPassword etc.)
 */
const PublicOnlyRoute = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Pages Layout (rendered inside AppLayout so public visitors can browse too) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/live" element={<LiveScoreBoard />} />
        <Route path="/points-table" element={<PointsTable />} />
        <Route path="/highlights" element={<PublicGallery />} />
        
        {/* Protected general user pathways */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/matches/:id" element={<MatchDetail />} />
          <Route path="/ai-studio" element={<AIStudio />} />
        </Route>

        {/* Coordinator + Admin Pages */}
        <Route element={<ProtectedRoute allowedRoles={['superAdmin', 'coordinator']} />}>
          <Route path="/departments" element={<DepartmentList />} />
          <Route path="/departments/new" element={<DepartmentForm />} />
          <Route path="/departments/:id" element={<DepartmentDetail />} />
          <Route path="/departments/:id/edit" element={<DepartmentForm />} />

          <Route path="/players" element={<PlayerList />} />
          <Route path="/players/new" element={<PlayerForm />} />
          <Route path="/players/:id" element={<PlayerDetail />} />
          <Route path="/players/:id/edit" element={<PlayerForm />} />

          <Route path="/teams" element={<TeamList />} />
          <Route path="/teams/new" element={<TeamForm />} />
          <Route path="/teams/:id" element={<TeamDetail />} />
        </Route>

        {/* SuperAdmin ONLY Pages */}
        <Route element={<ProtectedRoute allowedRoles={['superAdmin']} />}>
          <Route path="/sports" element={<SportList />} />
          <Route path="/sports/new" element={<SportForm />} />
          <Route path="/sports/:id/edit" element={<SportForm />} />
          
          <Route path="/tournaments" element={<TournamentList />} />
          <Route path="/tournaments/new" element={<TournamentForm />} />
          <Route path="/tournaments/:id" element={<TournamentDetail />} />
          <Route path="/tournaments/:id/edit" element={<TournamentForm />} />

          <Route path="/matches" element={<MatchList />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/gallery" element={<Gallery />} />
        </Route>
      </Route>

      {/* Auth Guarded Public Pathways (No Navbar layout) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Scorer specific routes (No layout standard page) */}
      <Route element={<ProtectedRoute allowedRoles={['scorer', 'superAdmin']} />}>
        <Route path="/scorer/match/:id" element={<ScorerPanel />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
