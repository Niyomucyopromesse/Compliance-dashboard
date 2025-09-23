import React from 'react';
import { clsx } from 'clsx';
import { RiskLabel } from '@/types';
import { RISK_COLORS, RISK_BG_COLORS, STATUS_COLORS } from '@/utils/constants';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

  const variantStyles = {
    default: 'bg-blue-100 dark:bg-transparent text-blue-800 dark:text-blue-400 border dark:border-blue-400',
    success: 'bg-green-100 dark:bg-transparent text-green-800 dark:text-green-400 border dark:border-green-400',
    warning: 'bg-yellow-100 dark:bg-transparent text-yellow-800 dark:text-yellow-400 border dark:border-yellow-400',
    danger: 'bg-red-100 dark:bg-transparent text-red-800 dark:text-red-400 border dark:border-red-400',
    info: 'bg-blue-100 dark:bg-transparent text-blue-800 dark:text-blue-400 border dark:border-blue-400',
    gray: 'bg-gray-100 dark:bg-transparent text-gray-800 dark:text-gray-400 border dark:border-gray-400',
  };

const sizeStyles = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-2.5 py-1.5 text-sm',
  lg: 'px-3 py-2 text-base',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

interface RiskBadgeProps {
  riskLabel: RiskLabel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RiskBadge({ riskLabel, size = 'md', className }: RiskBadgeProps) {
  const color = RISK_COLORS[riskLabel];
  const bgColor = RISK_BG_COLORS[riskLabel];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium border',
        size === 'sm' && 'px-2 py-1 text-xs',
        size === 'md' && 'px-2.5 py-1.5 text-sm',
        size === 'lg' && 'px-3 py-2 text-base',
        className
      )}
      style={{
        backgroundColor: bgColor,
        color: color,
        borderColor: `${color}40`
      }}
    >
      {riskLabel}
    </span>
  );
}

interface StatusBadgeProps {
  status: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  // Handle null/undefined status
  if (!status) {
    return (
      <span
        className={clsx(
          'inline-flex items-center rounded-full font-medium bg-gray-100 dark:bg-transparent text-gray-600 dark:text-gray-400 border dark:border-gray-400',
          size === 'sm' && 'px-2 py-1 text-xs',
          size === 'md' && 'px-2.5 py-1.5 text-sm',
          size === 'lg' && 'px-3 py-2 text-base',
          className
        )}
      >
        Unknown
      </span>
    );
  }

  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280';
  
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium border',
        size === 'sm' && 'px-2 py-1 text-xs',
        size === 'md' && 'px-2.5 py-1.5 text-sm',
        size === 'lg' && 'px-3 py-2 text-base',
        className
      )}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`
      }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  );
}
