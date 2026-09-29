// src/App.tsx
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Header from './layouts/Header';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import { useAuthStore } from './store/authStore';

// Layout con Header para páginas autenticadas
function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Header user={user ?? undefined} onLogout={handleLogout} />
      <main>{children}</main>
    </div>
  );
}

function App() {
  const checkTokenValidity = useAuthStore(state => state.checkTokenValidity);

  useEffect(() => {
    checkTokenValidity();

    // Verificar cada 5 minutos si el access token sigue vigente
    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkTokenValidity]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Solo ADMIN y HR_MANAGER gestionan empleados; EMPLOYEE no entra */}
        <Route path="/empleados" element={
          <ProtectedRoute>
            <AppLayout>
              <RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER']}>
                <EmployeesPage />
              </RoleGuard>
            </AppLayout>
          </ProtectedRoute>
        } />

        {/* Redirigir raíz según autenticación */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={
          <div style={{ minHeight: '100vh', background: '#f8fafc', textAlign: 'center', padding: '80px' }}>
            <h2 style={{ color: '#1e293b' }}>404 — Página no encontrada</h2>
            <Link to="/dashboard">Volver al inicio</Link>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
