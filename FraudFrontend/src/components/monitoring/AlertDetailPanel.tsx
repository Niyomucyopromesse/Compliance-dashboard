import { X, AlertTriangle, User, CreditCard, CheckCircle, FileText, Flag, Shield } from 'lucide-react';
import { Alert } from '@/types';
import { Badge } from '@/components/common/Badge';
import { formatRelativeTime } from '@/utils/formatters';
import { clsx } from 'clsx';

interface AlertDetailPanelProps {
  selectedAlert?: Alert | null;
  open?: boolean;
  onClose?: () => void;
  onAcknowledge?: (alertId: string) => void;
  onEscalate?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onMarkFalsePositive?: (alertId: string) => void;
  onCustomerClick?: (customerId: string) => void;
  onAccountClick?: (accountId: string) => void;
  onTransactionClick?: (transactionId: string) => void;
}

export function AlertDetailPanel({ 
  selectedAlert, 
  open = false, 
  onClose,
  onAcknowledge,
  onEscalate,
  onResolve,
  onMarkFalsePositive,
  onCustomerClick,
  onAccountClick,
  onTransactionClick
}: AlertDetailPanelProps) {
  if (!open || !selectedAlert) return null;

  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) {
      return `RWF ${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount >= 1000000) {
      return `RWF ${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `RWF ${(amount / 1000).toFixed(2)}K`;
    }
    return `RWF ${amount.toLocaleString()}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'success';
      default:
        return 'gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'new':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'acknowledged':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'investigating':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'resolved':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'false_positive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const formatAlertType = (alertType: string) => {
    return alertType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-[400px] bg-white dark:bg-gray-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Alert Details</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Fraud detection alert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Alert Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant={getSeverityColor(selectedAlert.severity) as any} size="sm">
                {selectedAlert.severity.toUpperCase()}
              </Badge>
              <Badge variant="gray" size="sm">
                {formatAlertType(selectedAlert.alert_type)}
              </Badge>
            </div>
            <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', getStatusColor(selectedAlert.status))}>
              {selectedAlert.status.toUpperCase()}
            </span>
          </div>

          {/* Alert ID and Timestamp */}
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Alert Information</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Alert ID:</span>
                <span className="text-xs font-mono text-gray-900 dark:text-gray-100">{selectedAlert.alert_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Detected:</span>
                <span className="text-xs text-gray-900 dark:text-gray-100">{formatRelativeTime(selectedAlert.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Risk Score:</span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">{selectedAlert.risk_score}%</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center space-x-1 mb-2">
              <FileText className="w-3 h-3 text-gray-500 dark:text-gray-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Description</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600 leading-relaxed">
              {selectedAlert.description}
            </p>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-1 gap-3">
            {selectedAlert.amount && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-1 mb-1">
                  <CreditCard className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Transaction Amount</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatAmount(selectedAlert.amount)}</div>
              </div>
            )}

            {selectedAlert.customer_id && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Customer</span>
                  </div>
                  <button
                    onClick={() => onCustomerClick?.(selectedAlert.customer_id!)}
                    className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {selectedAlert.customer_id}
                  </button>
                </div>
              </div>
            )}

            {selectedAlert.account_id && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <CreditCard className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Account</span>
                  </div>
                  <button
                    onClick={() => onAccountClick?.(selectedAlert.account_id!)}
                    className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {selectedAlert.account_id}
                  </button>
                </div>
              </div>
            )}

            {selectedAlert.transaction_id && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Transaction</span>
                  </div>
                  <button
                    onClick={() => onTransactionClick?.(selectedAlert.transaction_id!)}
                    className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                  >
                    {selectedAlert.transaction_id}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Assigned To */}
          {selectedAlert.assigned_to && (
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Assigned to:</span>
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{selectedAlert.assigned_to}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Actions</div>
            
            <div className="grid grid-cols-2 gap-2">
              {selectedAlert.status.toLowerCase() === 'open' && onAcknowledge && (
                <button
                  onClick={() => onAcknowledge(selectedAlert.alert_id)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium text-xs"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>Acknowledge</span>
                </button>
              )}
              
              {selectedAlert.status.toLowerCase() === 'acknowledged' && onEscalate && (
                <button
                  onClick={() => onEscalate(selectedAlert.alert_id)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-medium text-xs"
                >
                  <Flag className="w-3 h-3" />
                  <span>Escalate</span>
                </button>
              )}
              
              {selectedAlert.status.toLowerCase() === 'investigating' && onResolve && (
                <button
                  onClick={() => onResolve(selectedAlert.alert_id)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-xs"
                >
                  <Shield className="w-3 h-3" />
                  <span>Resolve</span>
                </button>
              )}
              
              {onMarkFalsePositive && (
                <button
                  onClick={() => onMarkFalsePositive(selectedAlert.alert_id)}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium text-xs"
                >
                  <X className="w-3 h-3" />
                  <span>False Positive</span>
                </button>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-xs border border-gray-200 dark:border-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}