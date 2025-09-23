
interface MultiLineChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
  valueType?: 'count' | 'total_amount' | 'avg_amount';
}

export function MultiLineChartTooltip({ 
  active, 
  payload, 
  label, 
  formatter,
  valueType = 'count'
}: MultiLineChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formatValue = (val: any) => {
    if (typeof val === 'number') {
      if (valueType === 'total_amount' || valueType === 'avg_amount') {
        return `RF ${val.toLocaleString()}`;
      }
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

  // Calculate total value
  const totalValue = payload.reduce((sum, item) => {
    const value = item.value;
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl p-4 min-w-[200px]">
      {label && (
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3 border-b border-gray-200 dark:border-gray-600 pb-2">
          {formatLabel(label)}
        </p>
      )}
      
      <div className="space-y-2">
        {payload
          .map((item, index) => {
            const value = item.value;
            const name = item.name || item.dataKey;
            const color = item.color || '#3b82f6';
            const percentage = totalValue > 0 ? ((value / totalValue) * 100) : 0;

            return {
              index,
              value,
              name,
              color,
              percentage,
              formattedValue: formatter ? formatter(value, name)[0] : formatValue(value)
            };
          })
          .sort((a, b) => b.percentage - a.percentage)
          .map((item) => (
            <div key={item.index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {item.name}:
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.formattedValue}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          ))}
      </div>
      
      {payload.length > 1 && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {valueType === 'total_amount' ? 'Total Amount:' : 
               valueType === 'avg_amount' ? 'Average Amount:' : 'Total:'}
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatValue(totalValue)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
