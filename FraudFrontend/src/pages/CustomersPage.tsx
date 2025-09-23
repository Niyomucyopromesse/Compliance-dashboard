import { CustomersList } from '@/components/customers/CustomersList';
import { CustomerDetailPanel } from '@/components/customers/CustomerDetailPanel';

export function CustomersPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage and monitor customer accounts
        </p>
      </div>

      {/* Customers list */}
      <CustomersList />

      {/* Customer detail panel */}
      <CustomerDetailPanel />
    </div>
  );
}
