import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';

// Auth Pages
import Login from './pages/auth/Login';

// Worker Pages
import WorkerHome from './pages/worker/WorkerHome';
import JobSearch from './pages/worker/JobSearch';
import Requests from './pages/worker/Requests';
import MyJobs from './pages/worker/MyJobs';
import WorkerProfile from './pages/worker/WorkerProfile';
import WithdrawPage from './pages/worker/WithdrawPage';
import JobDetailsPage from './pages/worker/JobDetailsPage';
import EventsList from './pages/worker/EventsList';
import EventDetails from './pages/worker/EventDetails';

// Company Pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import PostJob from './pages/company/PostJob';
import SearchWorkers from './pages/company/SearchWorkers';
import Hires from './pages/company/Hires';
import CompanyProfile from './pages/company/CompanyProfile';
import CompanyEvents from './pages/company/CompanyEvents';
import CreateEvent from './pages/company/CreateEvent';
import EventDashboard from './pages/company/EventDashboard';

// Shared Pages
import ChatRoom from './pages/chat/ChatRoom';
import SettingsPage from './pages/shared/SettingsPage';

/**
 * Protected Route wrapper
 * Redirects to login if not authenticated
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'company' ? '/company/dashboard' : '/worker/home'} replace />;
  }

  return children;
};

/**
 * Main App Component
 * Handles all routing for worker and company views
 */
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center animate-pulse-slow">
            <span className="text-white font-bold text-lg">KS</span>
          </div>
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element = {
          user ? (
            <Navigate to={user.role === 'company' ? '/company/dashboard' : '/worker/home'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Worker Routes */}
      <Route
        element = {
          <ProtectedRoute requiredRole="worker">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/worker/home" element={<WorkerHome />} />
        <Route path="/worker/search" element={<JobSearch />} />
        <Route path="/worker/requests" element={<Requests />} />
        <Route path="/worker/jobs" element={<MyJobs />} />
        <Route path="/worker/profile" element={<WorkerProfile />} />
        <Route path="/worker/chat" element={<ChatRoom />} />
        <Route path="/worker/withdraw" element={<WithdrawPage />} />
        <Route path="/worker/events" element={<EventsList />} />
        <Route path="/worker/events/:id" element={<EventDetails />} />
        <Route path="/job/:jobId" element={<JobDetailsPage />} />
      </Route>

      {/* Company Routes */}
      <Route
        element = {
          <ProtectedRoute requiredRole="company">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/company/dashboard" element={<CompanyDashboard />} />
        <Route path="/company/post-job" element={<PostJob />} />
        <Route path="/company/workers" element={<SearchWorkers />} />
        <Route path="/company/hires" element={<Hires />} />
        <Route path="/company/profile" element={<CompanyProfile />} />
        <Route path="/company/chat" element={<ChatRoom />} />
        <Route path="/company/events" element={<CompanyEvents />} />
        <Route path="/company/events/create" element={<CreateEvent />} />
        <Route path="/company/events/:id/dashboard" element={<EventDashboard />} />
      </Route>

      {/* Shared Protected Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

import { SocketProvider } from './context/SocketContext';
import CookieConsent from './components/CookieConsent';

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '16px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '500',
            },
          }}
        />
        <AppRoutes />
        <CookieConsent />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
