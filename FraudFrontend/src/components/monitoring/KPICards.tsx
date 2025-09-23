import { useAlertsOverview } from '@/hooks/useAlerts';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useMemo } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

function KPICard({ title, value, change, changeType = 'neutral', icon, color }: KPICardProps) {
  const changeColor = changeType === 'increase' ? 'text-red-600 dark:text-red-400' : 
                     changeType === 'decrease' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
          {change !== undefined && (
            <p className={`text-sm ${changeColor}`}>
              {change > 0 ? '+' : ''}{change}% from last hour
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function KPICards() {
  const { overview, loading, error } = useAlertsOverview();
  const { alerts, isConnected, lastUpdate, dbAlerts } = useWebSocket();

  // Calculate streaming alerts metrics (only truly new alerts not in DB)
  const streamingMetrics = useMemo(() => {
    if (!alerts || alerts.length === 0 || !overview) {
      return {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      };
    }

    // Create a set of database alert IDs for quick lookup
    const dbAlertIds = new Set((dbAlerts || []).map(alert => alert.alert_id));
    
    // Filter out alerts that are already in the database to avoid double counting
    const newStreamingAlerts = alerts.filter(alert => !dbAlertIds.has(alert.alert_id));

    const severityCounts = newStreamingAlerts.reduce((acc, alert) => {
      const severity = alert.severity?.toLowerCase() || 'low';
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      critical: severityCounts['critical'] || 0,
      high: severityCounts['high'] || 0,
      medium: severityCounts['medium'] || 0,
      low: severityCounts['low'] || 0,
      total: newStreamingAlerts.length
    };
  }, [alerts, overview, dbAlerts]);

  // Get database counts
  const dbSeverityCounts = overview?.severity_count || {};
  const dbCriticalCount = dbSeverityCounts['critical'] || 0;
  const dbHighCount = dbSeverityCounts['high'] || 0;
  const dbMediumCount = dbSeverityCounts['medium'] || 0;
  const dbLowCount = dbSeverityCounts['low'] || 0;

  // Merge database counts with streaming counts (addition)
  // Only add streaming counts if we have database data loaded to avoid double counting
  const criticalCount = dbCriticalCount + (overview ? streamingMetrics.critical : 0);
  const highCount = dbHighCount + (overview ? streamingMetrics.high : 0);
  const mediumCount = dbMediumCount + (overview ? streamingMetrics.medium : 0);
  const lowCount = dbLowCount + (overview ? streamingMetrics.low : 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 w-12 h-12"></div>
              <div className="ml-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-600 dark:text-red-400">Error loading KPI data: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Critical Alerts"
          value={criticalCount}
          color="bg-red-100 dark:bg-red-900"
          icon={
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
        />
      
      <KPICard
        title="High Alerts"
        value={highCount}
        color="bg-orange-100 dark:bg-orange-900"
        icon={
          <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        }
      />
      
      <KPICard
        title="Medium Alerts"
        value={mediumCount}
        color="bg-yellow-100 dark:bg-yellow-900"
        icon={
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      
      <KPICard
        title="Low Alerts"
        value={lowCount}
        color="bg-green-100 dark:bg-green-900"
        icon={
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    </div>
  );
}
