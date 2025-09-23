import { useParams } from 'react-router-dom';
import CustomerDetail from '../components/customers/CustomerDetail';

export function CustomerPage() {
  const { customerId } = useParams<{ customerId: string }>();

  if (!customerId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Not Found</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">The requested customer could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Details</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Customer ID: {customerId}
        </p>
      </div>

      {/* Customer details */}
      <CustomerDetail customerId={customerId} />
    </div>
  );
}
