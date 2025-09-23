import { useParams } from 'react-router-dom';
import { TransactionDetail } from '@/components/transactions/TransactionDetail';
import { TransactionGraphPreview } from '@/components/transactions/TransactionGraphPreview';

export function TransactionPage() {
  const { txId } = useParams<{ txId: string }>();

  if (!txId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transaction Not Found</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">The requested transaction could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transaction Details</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Transaction ID: {txId}
        </p>
      </div>

      {/* Transaction details */}
      <TransactionDetail transactionId={txId} />

      {/* Transaction graph preview */}
      <TransactionGraphPreview transactionId={txId} />
    </div>
  );
}
