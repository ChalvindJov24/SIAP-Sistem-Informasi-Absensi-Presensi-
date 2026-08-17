import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPlaceholderPage from './pages/DashboardPlaceholderPage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';
import ManageStudentsPage from './pages/ManageStudentsPage.jsx';

function ProtectedRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-mono text-sm uppercase tracking-[0.06em] text-ink/60">
          Memuat...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminOnlyRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-mono text-sm uppercase tracking-[0.06em] text-ink/60">
          Memuat...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicOnlyRoute({ user, loading, children }) {
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="font-mono text-sm uppercase tracking-[0.06em] text-ink/60">
          Memuat...
        </p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute user={user} loading={loading}>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <DashboardPlaceholderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ubah-password"
        element={
          <ProtectedRoute user={user} loading={loading}>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kelola-siswa"
        element={
          <AdminOnlyRoute user={user} loading={loading}>
            <ManageStudentsPage />
          </AdminOnlyRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}