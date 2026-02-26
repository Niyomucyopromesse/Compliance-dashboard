import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';

const BOK = {
  primary: '#006B3C',
  secondary: '#C8102E',
  accent: '#1E3A8A',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: authState, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  if (authState.isAuthenticated && authState.token) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(username, password);
      login(
        {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: (res.user.role as 'admin' | 'analyst' | 'viewer') || 'viewer',
          permissions: res.user.permissions || ['view'],
        },
        res.access_token
      );
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-950 px-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl shadow-xl border border-slate-700/50 p-8"
          style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">RegMgmt</h1>
            <p className="text-slate-400 text-sm">Sign in with your AD account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="rounded-lg px-4 py-3 text-sm text-red-200 border border-red-500/30"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="Enter your AD username"
                style={{ ['--tw-ring-color' as string]: BOK.primary }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-800/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent"
                placeholder="Enter your password"
                style={{ ['--tw-ring-color' as string]: BOK.primary }}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={loading}
              loading={loading}
              className="py-3 font-semibold"
              style={!loading ? { backgroundColor: BOK.primary } : undefined}
            >
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-slate-500 text-xs">
            JWT session lasts 8 hours. Use your Active Directory credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
