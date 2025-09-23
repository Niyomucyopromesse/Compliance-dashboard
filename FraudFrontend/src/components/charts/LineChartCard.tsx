import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from './ChartTooltip';
import { ChartSettings, TimeSeriesPoint } from '@/types';
import { clsx } from 'clsx';

interface LineChartCardProps {
  title: string;
  data: TimeSeriesPoint[];
  settings?: ChartSettings;
  className?: string;
  loading?: boolean;
  height?: number;
  color?: string;
}

export function LineChartCard({
  title,
  data,
  settings = {},
  className,
  loading = false,
  height = 300,
  color = '#3b82f6',
}: LineChartCardProps) {
  const {
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

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
      className
    )}>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            <XAxis 
              dataKey="label"
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              tickFormatter={(value) => value.toLocaleString()}
              className="text-gray-600 dark:text-gray-400"
            />
            {showTooltip && (
              <Tooltip 
                content={<ChartTooltip />}
                cursor={{ stroke: color, strokeWidth: 1 }}
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              animationDuration={animation ? 1000 : 0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
