import { Account } from '@/types';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

interface AccountRowProps {
  account: Account;
  className?: string;
}

export function AccountRow({ account, className }: AccountRowProps) {
  return (
    <tr className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800', className)}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
        <Link
          to={`/accounts/${account.account_id}${account.customer_id ? `?customerId=${account.customer_id}` : ''}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
        >
          {account.account_id}
        </Link>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {account.short_title || account.account_title_1 || 'N/A'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {account.category || 'N/A'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {account.currency || 'N/A'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
        {account.working_balance !== null && account.working_balance !== undefined 
          ? new Intl.NumberFormat('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(account.working_balance)
          : 'N/A'
        }
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {account.opening_date ? new Date(account.opening_date).toLocaleDateString() : 'N/A'}
      </td>
    </tr>
  );
}
