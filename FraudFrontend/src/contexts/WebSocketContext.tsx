// Stub WebSocket context - WebSocket functionality removed
// This file exists to prevent import errors in components that still reference it
// but WebSocket functionality is disabled

import React, { createContext, useContext } from 'react';
import { Alert } from '@/types';

interface WebSocketState {
  alerts: Alert[];
  transactions: any[];
  isConnected: boolean;
  isPaused: boolean;
  error: string | null;
  lastUpdate: string | null;
  dbAlerts: Alert[];
  isLoadingDbAlerts: boolean;
  dbPagination: {
    page: number;
    pageSize: number;
    total: number;
  } | null;
  totalAlertsCount: number;
}

interface WebSocketContextType extends WebSocketState {
  pause: () => void;
  resume: () => void;
  clear: () => void;
  acknowledgeAlert: (alertId: string) => void;
  escalateAlert: (alertId: string, assignedTo: string) => void;
  refreshDbAlerts: () => Promise<void>;
  fetchDbAlertsWithPagination: (page: number, pageSize: number) => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: React.ReactNode;
}

// Stub implementation - all methods are no-ops
const stubValue: WebSocketContextType = {
  alerts: [],
  transactions: [],
  isConnected: false,
  isPaused: false,
  error: null,
  lastUpdate: null,
  dbAlerts: [],
  isLoadingDbAlerts: false,
  dbPagination: null,
  totalAlertsCount: 0,
  pause: () => {},
  resume: () => {},
  clear: () => {},
  acknowledgeAlert: () => {},
  escalateAlert: () => {},
  refreshDbAlerts: async () => {},
  fetchDbAlertsWithPagination: async () => {},
};

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  return (
    <WebSocketContext.Provider value={stubValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    // Return stub value if context is not available
    return stubValue;
  }
  return context;
}

export function useLiveFeed() {
  return useWebSocket();
}
