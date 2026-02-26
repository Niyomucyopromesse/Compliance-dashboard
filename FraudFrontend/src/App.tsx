import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/UIContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppRoutes } from '@/routes';
import { LoginPage } from '@/pages/LoginPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import './styles/tailwind.css';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <UIProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <AppRoutes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </UIProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;