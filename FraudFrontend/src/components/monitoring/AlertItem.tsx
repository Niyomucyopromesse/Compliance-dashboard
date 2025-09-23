import { useState, useRef, useEffect } from 'react';
import { Alert } from '@/types';
import { Badge } from '@/components/common/Badge';
import { formatRelativeTime } from '@/utils/formatters';
import { clsx } from 'clsx';
import { ExternalLink, User, CreditCard, MoreVertical, CheckCircle2, ArrowUp, X, Flag, Eye } from 'lucide-react';

interface AlertItemProps {
  alert: Alert;
  onAcknowledge?: () => void;
  onEscalate?: () => void;
  onResolve?: () => void;
  onMarkFalsePositive?: () => void;
  onSelect?: () => void;
  onCustomerClick?: (customerId: string) => void;
  onAccountClick?: (accountId: string) => void;
  onTransactionClick?: (transactionId: string) => void;
}

export function AlertItem({ 
  alert, 
  onAcknowledge, 
  onEscalate, 
  onResolve,
  onMarkFalsePositive,
  onSelect,
  onCustomerClick,
  onAccountClick,
  onTransactionClick
}: AlertItemProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
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


  return (
    <div 
      className={clsx(
        'group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:shadow-sm hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer transition-all duration-150',
        alert.status.toLowerCase() === 'open' && 'border-l-4 border-l-red-500 dark:border-l-red-400',
        alert.status.toLowerCase() === 'new' && 'border-l-4 border-l-red-500 dark:border-l-red-400',
        alert.severity.toLowerCase() === 'high' && 'border-l-4 border-l-orange-500 dark:border-l-orange-400',
        alert.severity.toLowerCase() === 'medium' && 'border-l-4 border-l-yellow-500 dark:border-l-yellow-400',
        alert.severity.toLowerCase() === 'critical' && 'border-l-4 border-l-red-500 dark:border-l-red-400'
      )}
      onClick={onSelect}
    >
      {/* Compact Header Row */}
      <div className="flex items-center justify-between p-3">
        {/* Left side - Title and severity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
              {formatAlertType(alert.alert_type)}
            </h3>
            <Badge variant={getSeverityColor(alert.severity) as any} size="sm">
              {alert.severity.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
            {alert.description}
          </p>
        </div>

        {/* Right side - Status, Key info and actions */}
        <div className="flex flex-col items-end space-y-1 ml-4">
          {/* Status in top right */}
          <span className={clsx('text-xs font-medium', getStatusColor(alert.status))}>
            {alert.status.toLowerCase()}
          </span>
          
          {/* Key metrics and actions */}
          <div className="flex items-center space-x-3">
            {/* Key metrics */}
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-mono">{alert.risk_score}%</span>
              {alert.amount && (
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatAmount(alert.amount)}</span>
              )}
              <span>{formatRelativeTime(alert.timestamp)}</span>
            </div>

            {/* 3-dots menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 right-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>
                  
                  {alert.status.toLowerCase() === 'open' && onAcknowledge && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAcknowledge();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                  
                  {alert.status.toLowerCase() === 'acknowledged' && onEscalate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEscalate();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 text-orange-700 hover:bg-orange-50 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span>Escalate</span>
                    </button>
                  )}
                  
                  {alert.status.toLowerCase() === 'investigating' && onResolve && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onResolve();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolve</span>
                    </button>
                  )}
                  
                  {onMarkFalsePositive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkFalsePositive();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Mark as False Positive</span>
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Implement flag for review functionality
                      console.log('Flag for review:', alert.alert_id);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm flex items-center space-x-2 text-orange-700 hover:bg-orange-50 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Flag for Review</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable details - only show on hover or when selected */}
      <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2">
          <div className="flex items-center space-x-4">
            {alert.customer_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCustomerClick?.(alert.customer_id!);
                }}
                className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center group"
              >
                <User className="w-3 h-3 mr-1" />
                {alert.customer_id}
                <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            
            {alert.account_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccountClick?.(alert.account_id!);
                }}
                className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center group"
              >
                <CreditCard className="w-3 h-3 mr-1" />
                {alert.account_id}
                <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            
            {alert.transaction_id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTransactionClick?.(alert.transaction_id!);
                }}
                className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline flex items-center group"
              >
                Transaction: {alert.transaction_id}
                <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          
          {alert.assigned_to && (
            <span>Assigned to: <span className="font-medium text-gray-700 dark:text-gray-300">{alert.assigned_to}</span></span>
          )}
        </div>
      </div>
    </div>
  );
}
