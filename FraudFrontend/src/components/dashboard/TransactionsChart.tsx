import { MultiLineChartCard } from '@/components/charts/MultiLineChartCard';
import { useTransactionsChart, TimeRange } from '@/hooks/useTransactions';
import { useState } from 'react';

export function TransactionsChart() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('1D');
  const [activeButton, setActiveButton] = useState<string>('1D');
  const [filteredChannels, setFilteredChannels] = useState<string[]>([]);
  
  const { chartData, isLoading: isChartLoading, isError: isChartError } = useTransactionsChart(selectedTimeRange);

  const handleTimeRangeChange = (range: string) => {
    const timeRangeMap: Record<string, TimeRange> = {
      'LIVE': '1D',
      '1D': '1D',
      '1W': '1W',
      '1M': '1M',
      '3M': '3M',
      '1Y': '1Y',
    };
    
    const mappedRange = timeRangeMap[range] || '1D';
    setSelectedTimeRange(mappedRange);
    setActiveButton(range);
    console.log('Time range changed to:', mappedRange);
  };

  const handleChannelFilterChange = (channels: string[]) => {
    setFilteredChannels(channels);
    console.log('Channel filter changed to:', channels);
    console.log('Currently filtered channels:', filteredChannels);
    // TODO: Implement actual data filtering based on selected channels
  };

  if (isChartError) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">Transaction Volume by Channel</h3>
        <div className="flex items-center justify-center h-64 text-red-400">
          Failed to load chart data
        </div>
      </div>
    );
  }

  const getTitle = () => {
    const timeRangeLabels: Record<TimeRange, string> = {
      '1D': 'Last 24 Hours (5min intervals)',
      '1W': 'Last Week (hourly)',
      '1M': 'Last Month (hourly)',
      '3M': 'Last 3 Months (daily)',
      '1Y': 'Last Year (daily)',
    };
    
    const baseTitle = `Transaction Volume by Channel - ${timeRangeLabels[selectedTimeRange]}`;
    if (filteredChannels.length > 0) {
      return `${baseTitle} - Filtered: ${filteredChannels.join(', ')}`;
    }
    return baseTitle;
  };

  return (
    <div className="w-full">
      <MultiLineChartCard
        title={getTitle()}
        data={chartData}
        loading={isChartLoading}
        height={400}
        showControls={true}
        activeTimeRange={activeButton}
        onTimeRangeChange={handleTimeRangeChange}
        onChannelFilterChange={handleChannelFilterChange}
        settings={{
          showLegend: false,
          showTooltip: true,
          animation: true,
        }}
        className="w-full"
      />
    </div>
  );
}
