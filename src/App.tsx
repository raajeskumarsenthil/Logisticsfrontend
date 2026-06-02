import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store, type RootState } from './store/store';
import { ToastProvider } from './components/Toast';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClientOrders } from './pages/ClientOrders';
import { RiderDeliveries } from './pages/RiderDeliveries';

// Route Guards
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Array<'admin' | 'client' | 'rider'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect based on actual role
    if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
    if (user.role === 'client') return <Navigate to="/orders" replace />;
    if (user.role === 'rider') return <Navigate to="/my-deliveries" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientOrders />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/my-deliveries"
          element={
            <ProtectedRoute allowedRoles={['rider']}>
              <RiderDeliveries />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </Provider>
  );
};

export default App;
