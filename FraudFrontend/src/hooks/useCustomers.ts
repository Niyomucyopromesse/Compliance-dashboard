import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { GetCustomersParams } from '@/types';
import { REFRESH_INTERVALS } from '@/utils/constants';

export const useCustomers = (
  initialParams: GetCustomersParams = {},
  refreshInterval: number = REFRESH_INTERVALS.normal
) => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<GetCustomersParams>({
    page: 1,
    pageSize: 20,
    ...initialParams,
  });

  // Update params when initialParams change (like search)
  React.useEffect(() => {
    setParams(prev => ({ ...prev, ...initialParams }));
  }, [initialParams.search, initialParams.page, initialParams.pageSize]);

  const {
    data: customersData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const response = await apiClient.getCustomers(params);
      return response;
    },
    refetchInterval: refreshInterval,
    staleTime: 30000,
    retry: 3,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  }, [queryClient]);

  const refreshNow = useCallback(() => {
    refetch();
  }, [refetch]);

  const updateParams = useCallback((newParams: Partial<GetCustomersParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    customers: customersData?.data || [],
    pagination: customersData?.pagination,
    isLoading,
    isError,
    error,
    isRefetching,
    refresh,
    refreshNow,
    updateParams,
  };
};

export const useCustomer = (id: string | null) => {
  const {
    data: customerData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.getCustomer(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60000,
    retry: 3,
  });

  return {
    customer: customerData,
    isLoading,
    isError,
    error,
    refetch,
  };
};
