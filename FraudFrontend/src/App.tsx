import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { UIProvider } from '@/contexts/UIContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { AppRoutes } from '@/routes';
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
          <WebSocketProvider>
            <AppLayout>
              <AppRoutes />
            </AppLayout>
          </WebSocketProvider>
        </UIProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;