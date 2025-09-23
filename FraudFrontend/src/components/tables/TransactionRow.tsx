import { Link } from 'react-router-dom';
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { clsx } from 'clsx';

interface TransactionRowProps {
  transaction: Transaction;
  className?: string;
}

export function TransactionRow({ transaction, className }: TransactionRowProps) {
  return (
    <tr className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800', className)}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
        <Link
          to={`/transactions/${transaction.transaction_id}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
        >
          {transaction.transaction_id?.slice(0, 8)}...
        </Link>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {transaction.transaction_time ? (() => {
          try {
            const date = new Date(transaction.transaction_time);
            return date.toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });
          } catch {
            return transaction.transaction_time;
          }
        })() : 'N/A'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {transaction.debit_account ? (
          <Link
            to={`/accounts/${transaction.debit_account}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline"
          >
            {transaction.debit_account}
          </Link>
        ) : 'N/A'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {transaction.credit_account ? (
          <Link
            to={`/accounts/${transaction.credit_account}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline"
          >
            {transaction.credit_account}
          </Link>
        ) : 'N/A'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
        {formatCurrency(transaction.credit_amount || transaction.debit_amount || 0, 'RWF')}
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
        <div className="truncate" title={transaction.payment_details || 'N/A'}>
          {transaction.payment_details ? 
            (transaction.payment_details.length > 30 ? 
              `${transaction.payment_details.slice(0, 30)}...` : 
              transaction.payment_details
            ) : 'N/A'
          }
        </div>
      </td>
      
    </tr>
  );
}
