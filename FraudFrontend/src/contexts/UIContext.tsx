import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { UIState } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';

type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_NOTIFICATIONS'; payload: boolean }
  | { type: 'SET_AUTO_REFRESH'; payload: boolean }
  | { type: 'SET_REFRESH_INTERVAL'; payload: number }
  | { type: 'RESET_UI_STATE' };

interface UIContextType {
  state: UIState;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setNotifications: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  resetUIState: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  notifications: true,
  autoRefresh: true,
  refreshInterval: 30000, // 30 seconds
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen };
    
    case 'SET_SIDEBAR_OPEN':
      return { ...state, sidebarOpen: action.payload };
    
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    
    case 'SET_AUTO_REFRESH':
      return { ...state, autoRefresh: action.payload };
    
    case 'SET_REFRESH_INTERVAL':
      return { ...state, refreshInterval: action.payload };
    
    case 'RESET_UI_STATE':
      return initialState;
    
    default:
      return state;
  }
}

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [state, dispatch] = useReducer(uiReducer, initialState, (initialState) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UI_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialState, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load UI state from localStorage:', error);
    }
    return initialState;
  });

  // Save to localStorage whenever state changes
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save UI state to localStorage:', error);
    }
  }, [state]);

  // Apply theme to document element for Tailwind dark mode
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
  const setSidebarOpen = (open: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open });
  const setTheme = (theme: 'light' | 'dark') => dispatch({ type: 'SET_THEME', payload: theme });
  const setNotifications = (enabled: boolean) => dispatch({ type: 'SET_NOTIFICATIONS', payload: enabled });
  const setAutoRefresh = (enabled: boolean) => dispatch({ type: 'SET_AUTO_REFRESH', payload: enabled });
  const setRefreshInterval = (interval: number) => dispatch({ type: 'SET_REFRESH_INTERVAL', payload: interval });
  const resetUIState = () => dispatch({ type: 'RESET_UI_STATE' });

  const value: UIContextType = {
    state,
    toggleSidebar,
    setSidebarOpen,
    setTheme,
    setNotifications,
    setAutoRefresh,
    setRefreshInterval,
    resetUIState,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
