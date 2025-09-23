import { Link } from 'react-router-dom';
import { Customer } from '@/types';
import { RiskBadge, StatusBadge } from '@/components/common/Badge';
import { clsx } from 'clsx';
import { getCustomerSegmentName } from '@/utils/customerUtils';

interface CustomerRowProps {
  customer: Customer;
  className?: string;
}

export function CustomerRow({ customer, className }: CustomerRowProps) {
  return (
    <tr className={clsx('hover:bg-gray-50 dark:hover:bg-gray-800', className)}>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
        <Link
          to={`/customers/${customer.customer_id}`}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
        >
          {customer.customer_id}
        </Link>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {customer.full_name || 'N/A'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {getCustomerSegmentName(customer.segment)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <RiskBadge riskLabel={customer.risk_class as any || 'Unknown'} size="sm" />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
        {customer.accounts?.length || 0}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
        {customer.accounts?.reduce((total, account) => total + (account.working_balance || 0), 0) || 0}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={customer.status || 'unknown'} size="sm" />
      </td>
    </tr>
  );
}
