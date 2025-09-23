import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartData, ChartSettings } from '@/types';
import { CHART_COLORS } from '@/utils/constants';
import { clsx } from 'clsx';

interface PieChartCardProps {
  title: string;
  data: ChartData[];
  onSliceClick?: (label: string, data: ChartData) => void;
  settings?: ChartSettings;
  className?: string;
  loading?: boolean;
  height?: number;
}

export function PieChartCard({
  title,
  data,
  onSliceClick,
  settings = {},
  className,
  loading = false,
  height = 300,
}: PieChartCardProps) {
  const {
    showLegend = true,
    showTooltip = true,
    animation = true,
  } = settings;

  if (loading) {
    return (
      <div className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
        className
      )}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
        className
      )}>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  const handleSliceClick = (data: ChartData) => {
    if (onSliceClick) {
      onSliceClick(data.name, data);
    }
  };

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
      className
    )}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onClick={handleSliceClick}
              animationDuration={animation ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip content={<ChartTooltip />} />
            )}
            {showLegend && (
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry) => (
                  <span style={{ color: entry.color }}>
                    {value}
                  </span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
