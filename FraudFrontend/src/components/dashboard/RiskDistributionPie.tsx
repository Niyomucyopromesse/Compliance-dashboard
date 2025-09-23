import { PieChartCard } from '@/components/charts/PieChartCard';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { CHART_COLORS } from '@/utils/constants';

export function RiskDistributionPie() {
  const { data: riskData, isLoading, isError } = useQuery({
    queryKey: ['risk-distribution'],
    queryFn: async () => {
      const response = await apiClient.getRiskDistribution();
      return response.data;
    },
    staleTime: 60000,
  });

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Distribution</h3>
        <div className="flex items-center justify-center h-64 text-red-500">
          Failed to load chart data
        </div>
      </div>
    );
  }

  const chartData = riskData?.map((item, index) => ({
    name: item.label,
    value: item.count,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  return (
    <PieChartCard
      title="Risk Distribution"
      data={chartData}
      loading={isLoading}
      height={300}
    />
  );
}
