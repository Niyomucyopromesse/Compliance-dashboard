import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { OverviewMetrics } from '@/types';
import { REFRESH_INTERVALS } from '@/utils/constants';

export const useMetrics = (refreshInterval: number = REFRESH_INTERVALS.normal) => {
  const queryClient = useQueryClient();

  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<OverviewMetrics>({
    queryKey: ['overview', 'metrics'],
    queryFn: async () => {
      const response = await apiClient.getOverview();
      return response.data;
    },
    refetchInterval: refreshInterval,
    staleTime: 180000, // 3 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['overview', 'metrics'] });
  };

  const refreshNow = () => {
    refetch();
  };

  return {
    metrics,
    isLoading,
    isError,
    error,
    isRefetching,
    refresh,
    refreshNow,
  };
};
