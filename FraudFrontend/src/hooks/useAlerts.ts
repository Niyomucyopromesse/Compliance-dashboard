import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { Alert, GetAlertsParams } from '@/types';

interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseAlertsOverviewReturn {
  overview: {
    total: number;
    severity_count: Record<string, number>;
  } | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAlerts(params: GetAlertsParams = {}): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getAlerts({
        ...params,
        pageSize: 100, // Get more alerts for better coverage
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        setAlerts(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch alerts');
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts
  };
}

export function useAlertsOverview(params?: {
  severity?: string;
  status?: string;
  alert_type?: string;
  assigned_to?: string;
  date_from?: string;
  date_to?: string;
}): UseAlertsOverviewReturn {
  const [overview, setOverview] = useState<{
    total: number;
    severity_count: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getAlertsOverview(params);
      
      if (response.success) {
        setOverview(response.data);
      } else {
        setError(response.message || 'Failed to fetch alerts overview');
      }
    } catch (err) {
      console.error('Error fetching alerts overview:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts overview');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    overview,
    loading,
    error,
    refetch: fetchOverview
  };
}
