import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { Home } from './pages/Home';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { LoadingScreen } from './components/common/LoadingScreen';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy-loaded Admin and Protected Shell Modules
const AdminLogin = lazy(() =>
  import('./pages/admin/AdminLogin').then((module) => ({ default: module.AdminLogin }))
);
const AdminLayout = lazy(() =>
  import('./layouts/AdminLayout').then((module) => ({ default: module.AdminLayout }))
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((module) => ({ default: module.AdminDashboard }))
);
const AdminDoctors = lazy(() =>
  import('./pages/admin/AdminDoctors').then((module) => ({ default: module.AdminDoctors }))
);
const AdminGallery = lazy(() =>
  import('./pages/admin/AdminGallery').then((module) => ({ default: module.AdminGallery }))
);
const AdminAppointments = lazy(() =>
  import('./pages/admin/AdminAppointments').then((module) => ({ default: module.AdminAppointments }))
);
const AdminAvailability = lazy(() =>
  import('./pages/admin/AdminAvailability').then((module) => ({ default: module.AdminAvailability }))
);
const AdminManagement = lazy(() =>
  import('./pages/admin/AdminManagement').then((module) => ({ default: module.AdminManagement }))
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen message="Loading page..." />}>
            <Routes>
              {/* Public Home Route (Instant Load) */}
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <Home />
                  </PublicLayout>
                }
              />

              {/* Admin Authentication Route */}
              <Route path="/login/admin" element={<AdminLogin />} />

              {/* Protected Admin Shell Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="availability" element={<AdminAvailability />} />
                <Route path="doctors" element={<AdminDoctors />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route
                  path="admins"
                  element={
                    <ProtectedRoute requireSuperAdmin={true}>
                      <AdminManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="management"
                  element={<Navigate to="/admin/admins" replace />}
                />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
