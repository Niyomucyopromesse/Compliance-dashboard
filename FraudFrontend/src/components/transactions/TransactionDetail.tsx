import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';

interface TransactionDetailProps {
  transactionId: string;
}

export function TransactionDetail({ transactionId }: TransactionDetailProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      const response = await apiClient.getTransactions({ 
        search: transactionId,
        pageSize: 1 
      });
      return response.data[0];
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <LoadingSkeleton lines={8} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <EmptyState
          title="Transaction not found"
          description="The requested transaction could not be found."
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Transaction Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Transaction ID</h3>
          <p className="text-sm text-gray-900 dark:text-gray-100">{data.transaction_id}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Amount</h3>
          <p className="text-sm text-gray-900 dark:text-gray-100">
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: data.currency,
            }).format(data.amount)}
          </p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">From Account</h3>
          <p className="text-sm text-gray-900 dark:text-gray-100">{data.from_account}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">To Account</h3>
          <p className="text-sm text-gray-900 dark:text-gray-100">{data.to_account}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Risk Level</h3>
          <p className="text-sm text-gray-900 dark:text-gray-100">{data.risk_label}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h3>
          <p className="text-sm text-gray-900 dark:text-gray-100">{data.status}</p>
        </div>
      </div>
    </div>
  );
}
