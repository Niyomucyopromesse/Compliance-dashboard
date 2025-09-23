import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { GetAccountsParams } from '@/types';
import { REFRESH_INTERVALS } from '@/utils/constants';

export const useAccounts = (
  initialParams: GetAccountsParams = {},
  refreshInterval: number = REFRESH_INTERVALS.normal
) => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<GetAccountsParams>({
    page: 1,
    pageSize: 20,
    ...initialParams,
  });

  const {
    data: accountsData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['accounts', params],
    queryFn: async () => {
      const response = await apiClient.getAccounts(params);
      return response;
    },
    refetchInterval: refreshInterval,
    staleTime: 30000,
    retry: 3,
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
  }, [queryClient]);

  const refreshNow = useCallback(() => {
    refetch();
  }, [refetch]);

  const updateParams = useCallback((newParams: Partial<GetAccountsParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  return {
    accounts: accountsData?.data || [],
    pagination: accountsData?.pagination,
    isLoading,
    isError,
    error,
    isRefetching,
    refresh,
    refreshNow,
    updateParams,
  };
};

export const useAccount = (id: string | null) => {
  const {
    data: accountData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiClient.getAccount(id);
      return response;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    account: accountData?.data || null,
    isLoading,
    isError,
    error: error as Error | null,
  };
};

export const useAccountRecentTransactions = (accountId: string | null) => {
  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['account-recent-transactions', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const response = await apiClient.getAccountRecentTransactions(accountId);
      return response.data || [];
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    transactions: transactionsData || [],
    isLoading,
    isError,
    error: error as Error | null,
  };
};
