import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '@/services/sockets';
import { apiClient } from '@/services/api';
import { Alert, Transaction } from '@/types';

interface WebSocketState {
  alerts: Alert[];
  transactions: Transaction[];
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
  totalAlertsCount: number; // Total count including live alerts
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

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [state, setState] = useState<WebSocketState>({
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
  });

  const bufferRef = useRef<{
    alerts: Alert[];
    transactions: Transaction[];
  }>({
    alerts: [],
    transactions: [],
  });

  const maxBufferSize = 1000;
  const isInitializedRef = useRef(false);
  const liveAlertsRef = useRef<Alert[]>([]);

  // Function to fetch alerts from database with pagination
  const fetchDbAlertsWithPagination = useCallback(async (page: number = 1, pageSize: number = 20) => {
    try {
      setState(prev => ({ ...prev, isLoadingDbAlerts: true }));
      
      // Send only basic pagination parameters to avoid backend errors
      // The backend has a bug where it tries to pass 'search' to repository but repository doesn't support it
      const response = await apiClient.getAlerts({
        page,
        pageSize,
        sortBy: 'timestamp',
        sortOrder: 'desc'
        // Not sending: search, dateFrom, dateTo, riskLevel, severity, status, alertType, assignedTo
        // These cause backend errors due to repository parameter mismatch
      });
      
      if (response.success) {
        const dbAlerts = response.data || [];
        const pagination = response.pagination;
        
        setState(prev => ({ 
          ...prev, 
          dbAlerts,
          dbPagination: pagination ? {
            page: pagination.page || page,
            pageSize: pagination.pageSize || pageSize,
            total: pagination.total || 0
          } : null,
          totalAlertsCount: pagination?.total || 0,
          isLoadingDbAlerts: false 
        }));
        
        // Merge with live alerts
        mergeAlerts(dbAlerts, liveAlertsRef.current);
      } else {
        console.error('Failed to fetch database alerts:', response.message);
        setState(prev => ({ ...prev, isLoadingDbAlerts: false }));
      }
    } catch (error) {
      console.error('Error fetching database alerts:', error);
      setState(prev => ({ ...prev, isLoadingDbAlerts: false }));
    }
  }, []);

  // Function to fetch alerts from database (backward compatibility)
  const fetchDbAlerts = useCallback(async () => {
    await fetchDbAlertsWithPagination(1, 100);
  }, [fetchDbAlertsWithPagination]);

  // Function to merge database alerts with current alerts (deduplicate by alert_id)
  const mergeAlerts = useCallback((dbAlerts: Alert[], liveAlerts: Alert[]) => {
    // Get current alerts from state to preserve any that might not be in liveAlerts
    setState(prev => {
      // Create a map of live alerts by ID for quick lookup
      const liveAlertsMap = new Map(liveAlerts.map(alert => [alert.alert_id, alert]));
      
      // Filter out database alerts that are already in live alerts (live alerts take priority)
      const uniqueDbAlerts = dbAlerts.filter(alert => !liveAlertsMap.has(alert.alert_id));
      
      // Combine live alerts (newest) with unique database alerts
      const mergedAlerts = [...liveAlerts, ...uniqueDbAlerts]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 200); // Limit to 200 most recent alerts
      
      // Calculate new total count: DB total + new live alerts not in DB
      const newLiveAlertsCount = liveAlerts.filter(alert => 
        !dbAlerts.some(dbAlert => dbAlert.alert_id === alert.alert_id)
      ).length;
      
      const newTotalCount = (prev.dbPagination?.total || 0) + newLiveAlertsCount;
      
      return {
        ...prev,
        alerts: mergedAlerts,
        totalAlertsCount: newTotalCount
      };
    });
  }, []);

  const addToBuffer = useCallback((type: 'alert' | 'transaction', item: any) => {
    if (type === 'alert') {
      bufferRef.current.alerts.unshift(item);
      if (bufferRef.current.alerts.length > maxBufferSize) {
        bufferRef.current.alerts = bufferRef.current.alerts.slice(0, maxBufferSize);
      }
    } else {
      bufferRef.current.transactions.unshift(item);
      if (bufferRef.current.transactions.length > maxBufferSize) {
        bufferRef.current.transactions = bufferRef.current.transactions.slice(0, maxBufferSize);
      }
    }
  }, []);

  // helper: keep first occurrence (we prepend buffer so first = newest)
  const dedupeKeepFirst = useCallback((alerts: Alert[]) => {
    const seen = new Set<string>();
    const out: Alert[] = [];
    for (const a of alerts) {
      if (!seen.has(a.alert_id)) {
        seen.add(a.alert_id);
        out.push(a);
      }
    }
    return out;
  }, []);

  const processBuffer = useCallback(() => {
    if (state.isPaused) return;

    // If nothing new to process, still update transactions/lastUpdate
    const bufferedAlerts = bufferRef.current.alerts;
    const bufferedTransactions = bufferRef.current.transactions;

    // Prepend new buffered alerts to existing liveAlertsRef (so newest are first)
    if (bufferedAlerts.length > 0) {
      const combined = [...bufferedAlerts, ...liveAlertsRef.current];

      // Deduplicate keeping the first occurrence (first = newest because we prepended)
      let uniqueCombined = dedupeKeepFirst(combined);

      // Sort newest -> oldest by timestamp just in case
      uniqueCombined = uniqueCombined
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 200); // keep cap

      // Update live reference
      liveAlertsRef.current = uniqueCombined;

      // Clear the buffer so same alerts aren't re-processed repeatedly
      bufferRef.current.alerts = [];
    }

    // For transactions we simply replace with buffer content (adjust similarly if you want accumulation)
    if (bufferedTransactions.length > 0) {
      // Prepend transactions (or adapt to your desired strategy)
      bufferRef.current.transactions = [...bufferedTransactions, ...([] as Transaction[])].slice(0, maxBufferSize);
      // Clear transactions buffer if you want them consumed
      bufferRef.current.transactions = [];
    }

    // Merge with DB alerts (this will keep db alerts that are not in liveAlertsRef)
    // Use the current state's dbAlerts to ensure we have the latest DB data
    setState(prev => {
      const currentDbAlerts = prev.dbAlerts;
      const liveAlertsMap = new Map(liveAlertsRef.current.map(alert => [alert.alert_id, alert]));
      
      // Filter out database alerts that are already in live alerts (live alerts take priority)
      const uniqueDbAlerts = currentDbAlerts.filter(alert => !liveAlertsMap.has(alert.alert_id));
      
      // Combine live alerts (newest) with unique database alerts
      const mergedAlerts = [...liveAlertsRef.current, ...uniqueDbAlerts]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 200); // Limit to 200 most recent alerts
      
      // Calculate new total count: DB total + new live alerts not in DB
      const newLiveAlertsCount = liveAlertsRef.current.filter(alert => 
        !currentDbAlerts.some(dbAlert => dbAlert.alert_id === alert.alert_id)
      ).length;
      
      const newTotalCount = (prev.dbPagination?.total || 0) + newLiveAlertsCount;
      
      return {
        ...prev,
        alerts: mergedAlerts,
        totalAlertsCount: newTotalCount,
        lastUpdate: new Date().toISOString()
      };
    });

    // Update transactions in the final state
    setState(prev => ({
      ...prev,
      transactions: [...bufferRef.current.transactions], // likely [] if we cleared
    }));
  }, [state.isPaused, state.dbAlerts, mergeAlerts, dedupeKeepFirst]);

  const handleAlert = useCallback((alertData: any) => {
    console.log('WebSocketContext: Received alert data:', alertData);
    console.log('WebSocketContext: Current state - isPaused:', state.isPaused, 'isConnected:', state.isConnected);
    
    // Use the alert data directly as it now matches the frontend Alert type
    const alert: Alert = {
      alert_id: alertData.alert_id || `alert_${Date.now()}`,
      alert_type: alertData.alert_type || 'suspicious_transaction',
      severity: alertData.severity || 'medium',
      status: alertData.status || 'new',
      description: alertData.description || 'Unknown alert',
      risk_score: alertData.risk_score || 50,
      transaction_id: alertData.transaction_id,
      account_id: alertData.account_id,
      customer_id: alertData.customer_id,
      amount: alertData.amount,
      timestamp: alertData.timestamp || new Date().toISOString(),
      assigned_to: alertData.assigned_to,
      notes: alertData.notes
    };
    
    console.log('WebSocketContext: Processed alert:', alert);
    addToBuffer('alert', alert);
    if (!state.isPaused) {
      console.log('WebSocketContext: Processing buffer immediately (not paused)');
      processBuffer();
    } else {
      console.log('WebSocketContext: Buffer paused, alert queued');
    }
  }, [addToBuffer, processBuffer, state.isPaused, state.isConnected]);

  const handleTransaction = useCallback((transaction: Transaction) => {
    console.log('WebSocketContext: Received transaction data:', transaction);
    addToBuffer('transaction', transaction);
    if (!state.isPaused) {
      console.log('WebSocketContext: Processing transaction buffer immediately (not paused)');
      processBuffer();
    } else {
      console.log('WebSocketContext: Buffer paused, transaction queued');
    }
  }, [addToBuffer, processBuffer, state.isPaused]);

  const handleStatus = useCallback((status: { online: boolean; message?: string }) => {
    console.log('WebSocketContext: Received status update:', status);
    setState(prev => ({
      ...prev,
      isConnected: status.online,
      error: status.online ? null : (status.message || 'Connection lost'),
    }));
  }, []);

  const connect = useCallback(async () => {
    try {
      console.log('WebSocketContext: Attempting to connect...');
      setState(prev => ({ ...prev, error: null }));
      
      // Connect to WebSocket (handles reconnection automatically)
      await socketService.connect();
      console.log('WebSocketContext: Connected successfully');
      
      // Set up event listeners (these are safe to call multiple times)
      socketService.on('alert:new', handleAlert);
      socketService.on('transaction:flagged', handleTransaction);
      socketService.on('system:status', handleStatus);
      console.log('WebSocketContext: Event listeners set up');
      
      // Subscribe to channels (will be re-subscribed automatically on reconnect)
      socketService.subscribeAlerts();
      socketService.subscribeTransactions();
      console.log('WebSocketContext: Subscribed to channels');
      
      setState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.warn('WebSocket connection failed, continuing without real-time updates:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      }));
    }
  }, [handleAlert, handleTransaction, handleStatus]);


  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState(prev => ({ ...prev, isPaused: false }));
    processBuffer();
  }, [processBuffer]);

  const clear = useCallback(() => {
    bufferRef.current = { alerts: [], transactions: [] };
    setState(prev => ({
      ...prev,
      alerts: [],
      transactions: [],
    }));
  }, []);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.alert_id === alertId
          ? { ...alert, status: 'acknowledged' as const }
          : alert
      ),
    }));
  }, []);

  const escalateAlert = useCallback((alertId: string, assignedTo: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.alert_id === alertId
          ? { ...alert, status: 'investigating' as const, assigned_to: assignedTo }
          : alert
      ),
    }));
  }, []);

  const refreshDbAlerts = useCallback(async () => {
    await fetchDbAlerts();
  }, [fetchDbAlerts]);

  // Initialize connection and fetch database alerts
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      connect();
      fetchDbAlerts(); // Fetch database alerts on initialization
    }

    return () => {
      // Only disconnect when the entire app unmounts
      // Don't disconnect on component unmounts
    };
  }, [connect, fetchDbAlerts]);

  // Process buffer when unpaused
  useEffect(() => {
    if (!state.isPaused) {
      processBuffer();
    }
  }, [state.isPaused, processBuffer]);

  const contextValue: WebSocketContextType = {
    ...state,
    pause,
    resume,
    clear,
    acknowledgeAlert,
    escalateAlert,
    refreshDbAlerts,
    fetchDbAlertsWithPagination,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

// Backward compatibility hook
export const useLiveFeed = useWebSocket;
