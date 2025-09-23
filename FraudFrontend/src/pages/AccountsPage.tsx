import { AccountsList } from '@/components/accounts/AccountsList';
import { AccountDetailPanel } from '@/components/accounts/AccountDetailPanel';

export function AccountsPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Monitor and manage account activities
        </p>
      </div>

      {/* Accounts list */}
      <AccountsList />

      {/* Account detail panel */}
      <AccountDetailPanel />
    </div>
  );
}
