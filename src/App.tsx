import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeDocumentsPage from './pages/EmployeeDocumentsPage';
import DocumentTypesPage from './pages/DocumentTypesPage';
import AlertsPage from './pages/AlertsPage';

function App() {
  const { isAuthenticated, refreshSession, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?.refreshToken) {
      const interval = setInterval(() => {
        refreshSession();
      }, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, refreshSession]);

  return (
    <BrowserRouter>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-primary-700 focus:rounded-lg focus:shadow-lg focus:font-medium"
      >
        Ir al contenido principal
      </a>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empleados"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER']}>
                  <EmployeesPage />
                </RoleGuard>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/empleados/:id/documentos"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER']}>
                  <EmployeeDocumentsPage />
                </RoleGuard>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tipos-documento"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER']}>
                  <DocumentTypesPage />
                </RoleGuard>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alertas"
          element={
            <ProtectedRoute>
              <MainLayout>
                <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER']}>
                  <AlertsPage />
                </RoleGuard>
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;