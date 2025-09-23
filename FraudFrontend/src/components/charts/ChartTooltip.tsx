import React from 'react';
import { clsx } from 'clsx';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
}

export function ChartTooltip({ 
  active, 
  payload, 
  label, 
  formatter 
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload[0];
  const value = data.value;
  const name = data.name || data.dataKey;
  const color = data.color || '#3b82f6';

  const formatValue = (val: any) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const formatLabel = (label: string) => {
    if (!label) return '';
    
    // Try to parse as date
    const date = new Date(label);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return label;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      {label && (
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {formatLabel(label)}
        </p>
      )}
      
      <div className="flex items-center space-x-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {name}:
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatter ? formatter(value, name)[0] : formatValue(value)}
        </span>
      </div>
    </div>
  );
}
