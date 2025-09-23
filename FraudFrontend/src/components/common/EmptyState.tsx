import React from 'react';
import { FileX, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultIcons = {
  noData: <FileX className="w-12 h-12 text-gray-400" />,
  noResults: <Search className="w-12 h-12 text-gray-400" />,
  error: <AlertCircle className="w-12 h-12 text-red-400" />,
  loading: <RefreshCw className="w-12 h-12 text-gray-400 animate-spin" />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={clsx(
      'flex flex-col items-center justify-center py-12 px-4',
      className
    )}>
      <div className="mb-4">
        {icon || defaultIcons.noData}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

interface EmptyStateWithIconProps extends Omit<EmptyStateProps, 'icon'> {
  iconType?: 'noData' | 'noResults' | 'error' | 'loading';
}

export function EmptyStateWithIcon({
  iconType = 'noData',
  ...props
}: EmptyStateWithIconProps) {
  return (
    <EmptyState
      {...props}
      icon={defaultIcons[iconType]}
    />
  );
}
