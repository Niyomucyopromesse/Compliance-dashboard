import { useParams } from 'react-router-dom';
import AccountDetail from '../components/accounts/AccountDetail';

export function AccountPage() {
  const { accountId } = useParams<{ accountId: string }>();

  if (!accountId) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Not Found</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">The requested account could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Account Details</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Account ID: {accountId}
        </p>
      </div>

      {/* Account details */}
      <AccountDetail accountId={accountId} />
    </div>
  );
}
