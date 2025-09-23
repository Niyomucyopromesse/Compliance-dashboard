import { AlertItem } from './AlertItem';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Wifi, WifiOff, Pause, Play, Trash2, RefreshCw } from 'lucide-react';
import { PaginationHeader } from '@/components/tables/PaginationHeader';
import React, { useState } from 'react';

interface LiveFeedProps {
  paused?: boolean;
  filters?: any;
  onAlertSelect?: (alert: any) => void;
  onCustomerClick?: (customerId: string) => void;
  onAccountClick?: (accountId: string) => void;
  onTransactionClick?: (transactionId: string) => void;
}

export function LiveFeed({ 
  onAlertSelect, 
  onCustomerClick, 
  onAccountClick, 
  onTransactionClick 
}: LiveFeedProps) {
  const navigate = useNavigate();
  const { 
    alerts, 
    isConnected, 
    isPaused, 
    error, 
    isLoadingDbAlerts,
    dbPagination,
    totalAlertsCount,
    pause, 
    resume, 
    clear,
    acknowledgeAlert,
    escalateAlert,
    refreshDbAlerts,
    fetchDbAlertsWithPagination
  } = useWebSocket();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Use server-side pagination - fetch alerts when page or pageSize changes
  React.useEffect(() => {
    fetchDbAlertsWithPagination(page, pageSize);
  }, [page, pageSize, fetchDbAlertsWithPagination]);

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };

  // Get pagination info from server or use current state
  const totalAlerts = totalAlertsCount || alerts.length;
  const currentPage = dbPagination?.page || page;
  const currentPageSize = dbPagination?.pageSize || pageSize;

  // Use passed handlers or fallback to default navigation
  const handleCustomerClick = onCustomerClick || ((customerId: string) => {
    navigate(`/customers/${customerId}`);
  });

  const handleAccountClick = onAccountClick || ((accountId: string) => {
    navigate(`/accounts/${accountId}`);
  });

  const handleTransactionClick = onTransactionClick || ((transactionId: string) => {
    navigate(`/transactions/${transactionId}`);
  });

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 shadow-sm">
        <div className="text-center">
          <WifiOff className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Connection Error</h3>
          <p className="text-red-600 dark:text-red-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Live Fraud Feed</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {/* {alerts.length} alert{alerts.length !== 1 ? 's' : ''} detected */}
                {isLoadingDbAlerts && ' (Loading historical alerts...)'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshDbAlerts}
                disabled={isLoadingDbAlerts}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingDbAlerts ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              {isConnected && (
                <button
                  onClick={isPaused ? resume : pause}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
              )}
              
              <button
                onClick={clear}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Header */}
      {totalAlerts > 0 && (
        <PaginationHeader
          total={totalAlerts}
          page={currentPage}
          pageSize={currentPageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
      
      {/* Alerts List - No max height, let it flow naturally */}
      <div className="min-h-[400px]">
        {alerts.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Alerts</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">No fraud alerts have been detected recently.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {alerts.map((alert) => (
              <AlertItem 
                key={alert.alert_id} 
                alert={alert}
                onAcknowledge={() => acknowledgeAlert(alert.alert_id)}
                onEscalate={() => escalateAlert(alert.alert_id, 'current_user')}
                onResolve={() => {
                  // TODO: Implement resolve functionality
                  console.log('Resolve alert:', alert.alert_id);
                }}
                onMarkFalsePositive={() => {
                  // TODO: Implement false positive functionality
                  console.log('Mark as false positive:', alert.alert_id);
                }}
                onSelect={() => onAlertSelect?.(alert)}
                onCustomerClick={handleCustomerClick}
                onAccountClick={handleAccountClick}
                onTransactionClick={handleTransactionClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Pagination */}
      {totalAlerts > 0 && (
        <PaginationHeader
          total={totalAlerts}
          page={currentPage}
          pageSize={currentPageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
