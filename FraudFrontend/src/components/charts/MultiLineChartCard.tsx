import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MultiLineChartTooltip } from './MultiLineChartTooltip';
import { ChartSettings, TimeSeriesPoint } from '@/types';
import { clsx } from 'clsx';
import { useMemo, useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiLineChartCardProps {
  title: string;
  data: TimeSeriesPoint[];
  settings?: ChartSettings;
  className?: string;
  loading?: boolean;
  height?: number;
  colors?: string[];
  showControls?: boolean;
  activeTimeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onChannelFilterChange?: (channels: string[]) => void;
}

// Modern, vibrant colors for better visibility
const DEFAULT_CHANNEL_COLORS = [
  '#00d4aa', // Bright teal
  '#ff6b6b', // Coral red
  '#4ecdc4', // Turquoise
  '#45b7d1', // Sky blue
  '#96ceb4', // Mint green
  '#feca57', // Golden yellow
  '#ff9ff3', // Pink
  '#54a0ff', // Electric blue
];

// Value type options for the dropdown
const VALUE_TYPE_OPTIONS = [
  { value: 'count', label: 'Transaction Count', suffix: '' },
  { value: 'total_amount', label: 'Total Amount', suffix: ' (RF)' },
  { value: 'avg_amount', label: 'Average Amount', suffix: ' (RF)' },
] as const;

type ValueType = typeof VALUE_TYPE_OPTIONS[number]['value'];

export function MultiLineChartCard({
  title,
  data,
  settings = {},
  className,
  loading = false,
  height = 300,
  colors = DEFAULT_CHANNEL_COLORS,
  showControls = true,
  activeTimeRange = '1D',
  onTimeRangeChange,
  onChannelFilterChange,
}: MultiLineChartCardProps) {
  const {
    showTooltip = true,
    animation = true,
  } = settings;

  const [filteredChannels, setFilteredChannels] = useState<string[]>([]);
  const [selectedValueType, setSelectedValueType] = useState<ValueType>('count');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Process data to group by channels and create time series for each channel
  const processedData = useMemo((): { data: Array<Record<string, any>>; channels: string[] } => {
    if (!data || data.length === 0) return { data: [], channels: [] };

    // Group data by timestamp and channel
    const groupedData = new Map<string, Map<string, number>>();
    
    data.forEach(point => {
      const timeKey = point.label || point.timestamp;
      const channel = point.channel || 'Unknown';
      
      if (!groupedData.has(timeKey)) {
        groupedData.set(timeKey, new Map());
      }
      
      const timeData = groupedData.get(timeKey)!;
      
      // Get the appropriate value based on selected type
      let valueToAdd: number;
      switch (selectedValueType) {
        case 'total_amount':
          valueToAdd = point.total_amount || 0;
          break;
        case 'avg_amount':
          valueToAdd = point.avg_amount || 0;
          break;
        case 'count':
        default:
          valueToAdd = point.value;
          break;
      }
      
      timeData.set(channel, (timeData.get(channel) || 0) + valueToAdd);
    });

    // Convert to array format for recharts
    const result: Array<Record<string, any>> = [];
    const allChannels = new Set<string>();
    
    groupedData.forEach((channelData, timeKey) => {
      const dataPoint: Record<string, any> = { time: timeKey };
      
      channelData.forEach((value, channel) => {
        dataPoint[channel] = value;
        allChannels.add(channel);
      });
      
      result.push(dataPoint);
    });

    // Sort by time
    result.sort((a, b) => {
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      return timeA - timeB;
    });

    const availableChannels = Array.from(allChannels);
    const channelsToShow = filteredChannels.length > 0 
      ? filteredChannels 
      : availableChannels;

    return { data: result, channels: channelsToShow };
  }, [data, filteredChannels, selectedValueType]);

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

  const { data: chartData, channels } = processedData;

  return (
    <div className={clsx(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="flex items-center space-x-4">
          {/* Value Type Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <span>{VALUE_TYPE_OPTIONS.find(opt => opt.value === selectedValueType)?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                {VALUE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedValueType(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
                      selectedValueType === option.value
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                        : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-1">
              {['LIVE', '1D', '1W', '1M', '3M', '1Y'].map((range) => (
                <button
                  key={range}
                  onClick={() => onTimeRangeChange?.(range)}
                  className={clsx(
                    'px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center space-x-1',
                    range === activeTimeRange
                      ? 'bg-green-500 text-white'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {range === 'LIVE' && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                  <span>{range}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Channel Filter Controls */}
      {processedData.channels.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Channels {filteredChannels.length > 0 && `(${filteredChannels.length} selected)`}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const allChannels = Array.from(new Set(data.map(d => d.channel).filter((channel): channel is string => Boolean(channel))));
                  setFilteredChannels(allChannels);
                  onChannelFilterChange?.(allChannels);
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                All
              </button>
              <button
                onClick={() => {
                  setFilteredChannels([]);
                  onChannelFilterChange?.([]);
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                None
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            {Array.from(new Set(data.map(d => d.channel).filter((channel): channel is string => Boolean(channel)))).map((channel, index) => {
              const isSelected = filteredChannels.includes(channel);
              return (
                <button
                  key={channel}
                  onClick={() => {
                    const newFiltered = isSelected
                      ? filteredChannels.filter(c => c !== channel)
                      : [...filteredChannels, channel];
                    setFilteredChannels(newFiltered);
                    onChannelFilterChange?.(newFiltered);
                  }}
                  className={clsx(
                    'px-2 py-1 text-xs font-medium rounded transition-all duration-200 flex items-center space-x-1 truncate',
                    isSelected
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="truncate">{channel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            <XAxis 
              dataKey="time"
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => {
                if (!value) return '';
                
                // Try different date parsing approaches
                let date;
                if (typeof value === 'string') {
                  // Handle ISO strings, timestamps, or other formats
                  if (value.includes('T') || value.includes('-')) {
                    date = new Date(value);
                  } else if (!isNaN(Number(value))) {
                    // Handle timestamp
                    date = new Date(Number(value));
                  } else {
                    // Try direct parsing
                    date = new Date(value);
                  }
                } else if (typeof value === 'number') {
                  date = new Date(value);
                } else {
                  date = new Date(value);
                }
                
                // Check if date is valid
                if (isNaN(date.getTime())) {
                  return value.toString(); // Return original value if parsing fails
                }
                
                // Format based on time range
                const now = new Date();
                const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
                
                if (diffHours <= 24) {
                  // For 1D or less, show time
                  return date.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  });
                } else if (diffHours <= 168) { // 1 week
                  // For 1W, show day and time
                  return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                } else {
                  // For longer periods, show date
                  return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  });
                }
              }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => {
                if (selectedValueType === 'total_amount' || selectedValueType === 'avg_amount') {
                  return `RF ${value.toLocaleString()}`;
                }
                return value.toLocaleString();
              }}
            />
            {showTooltip && (
              <Tooltip 
                content={<MultiLineChartTooltip valueType={selectedValueType} />}
                cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
            )}
            {channels.map((channel: string, index: number) => {
              const isSelected = filteredChannels.includes(channel);
              return (
                <Line
                  key={channel}
                  type="monotone"
                  dataKey={channel}
                  stroke={colors[index % colors.length]}
                  strokeWidth={isSelected ? 3 : 2}
                  strokeOpacity={isSelected ? 1 : 0.7}
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    stroke: colors[index % colors.length], 
                    strokeWidth: 2,
                    fill: colors[index % colors.length]
                  }}
                  animationDuration={animation ? 1200 : 0}
                  name={channel}
                  connectNulls={false}
                  onClick={() => {
                    const newFiltered = isSelected
                      ? filteredChannels.filter(c => c !== channel)
                      : [...filteredChannels, channel];
                    setFilteredChannels(newFiltered);
                    onChannelFilterChange?.(newFiltered);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
