import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { TimeSeriesPoint, GetTransactionsParams } from '@/types';
import { REFRESH_INTERVALS } from '@/utils/constants';

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y';

export const useTransactions = (
  initialParams: GetTransactionsParams = {},
  refreshInterval: number = REFRESH_INTERVALS.normal
) => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<GetTransactionsParams>({
    page: 1,
    pageSize: 10,
    ...initialParams,
  });

  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const response = await apiClient.getTransactions(params);
      return response;
    },
    refetchInterval: refreshInterval,
    staleTime: 30000,
    retry: 3,
  });

  const {
    data: chartData,
    isLoading: isChartLoading,
    isError: isChartError,
    error: chartError,
  } = useQuery<TimeSeriesPoint[]>({
    queryKey: ['transactions', 'chart', params],
    queryFn: async () => {
      const response = await apiClient.getTransactionsChart({
        period: params.dateFrom && params.dateTo ? 'custom' : '7d',
        granularity: '1h',
        filters: {
          riskLevel: params.riskLevel,
          customerId: params.customerId,
          accountId: params.accountId,
        },
      });
      return response.data;
    },
    enabled: true,
    staleTime: 60000,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  }, [queryClient]);

  const refreshNow = useCallback(() => {
    refetch();
  }, [refetch]);

  const updateParams = useCallback((newParams: Partial<GetTransactionsParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    transactions: transactionsData?.data || [],
    pagination: transactionsData?.pagination,
    chartData: chartData || [],
    isLoading,
    isError,
    error,
    isRefetching,
    isChartLoading,
    isChartError,
    chartError,
    refresh,
    refreshNow,
    updateParams,
  };
};

export const useTransactionsChart = (timeRange: TimeRange) => {
  const {
    data: chartData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TimeSeriesPoint[]>({
    queryKey: ['transactions', 'chart', timeRange],
    queryFn: async () => {
      let response;
      switch (timeRange) {
        case '1D':
          response = await apiClient.getTransactionsChartDay30Min();
          break;
        case '1W':
          response = await apiClient.getTransactionsChartWeek8Hour();
          break;
        case '1M':
          response = await apiClient.getTransactionsChartMonthDay();
          break;
        case '3M':
          response = await apiClient.getTransactionsChart3Months2Day();
          break;
        case '1Y':
          response = await apiClient.getTransactionsChartYearDay();
          break;
        default:
          response = await apiClient.getTransactionsChartDay30Min();
      }
      return response.data;
    },
    enabled: true,
    staleTime: 60000,
    refetchInterval: timeRange === '1D' ? 30000 : 60000, // More frequent updates for 1D
  });

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    chartData: chartData || [],
    isLoading,
    isError,
    error,
    refresh,
  };
};
