import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthState } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

type AuthAction =
  | { type: 'LOGIN'; payload: { user: AuthState['user']; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<AuthState['user']> }
  | { type: 'SET_LOADING'; payload: boolean };

interface AuthContextType {
  state: AuthState & { isLoading: boolean };
  login: (user: AuthState['user'], token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<AuthState['user']>) => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState & { isLoading: boolean } = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
};

function authReducer(
  state: AuthState & { isLoading: boolean },
  action: AuthAction
): AuthState & { isLoading: boolean } {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    default:
      return state;
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        const userData = localStorage.getItem('fraud_dashboard_user_data');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          dispatch({ type: 'LOGIN', payload: { user, token } });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.warn('Failed to load auth state from localStorage:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadAuthState();
  }, []);

  // Save auth state to localStorage when it changes
  useEffect(() => {
    if (state.isAuthenticated && state.user && state.token) {
      try {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, state.token);
        localStorage.setItem('fraud_dashboard_user_data', JSON.stringify(state.user));
      } catch (error) {
        console.warn('Failed to save auth state to localStorage:', error);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem('fraud_dashboard_user_data');
      } catch (error) {
        console.warn('Failed to clear auth state from localStorage:', error);
      }
    }
  }, [state.isAuthenticated, state.user, state.token]);

  const login = (user: AuthState['user'], token: string) => {
    dispatch({ type: 'LOGIN', payload: { user, token } });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (updates: Partial<AuthState['user']>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission) || state.user.role === 'admin';
  };

  const hasRole = (role: string): boolean => {
    if (!state.user) return false;
    return state.user.role === role || state.user.role === 'admin';
  };

  const value: AuthContextType = {
    state,
    login,
    logout,
    updateUser,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
