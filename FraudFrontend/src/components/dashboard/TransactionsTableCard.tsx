import { DataTable } from '@/components/tables/DataTable';
import { TransactionRow } from '@/components/tables/TransactionRow';
import { PaginatedFooter } from '@/components/tables/PaginatedFooter';
import { useTransactions } from '@/hooks/useTransactions';
import { ColumnDef } from '@/types';

export function TransactionsTableCard() {
  const { 
    transactions, 
    pagination, 
    isLoading, 
    isError, 
    updateParams 
  } = useTransactions({ pageSize: 10 });

  console.log("transactions", transactions)

  const columns: ColumnDef[] = [
    {
      key: 'transaction_id',
      title: 'Transaction ID',
      sortable: true,
      width: 200,
    },
    {
      key: 'transaction_time',
      title: 'Transaction Time',
      sortable: true,
      width: 150,
      render: (value) => {
        if (!value) return 'N/A';
        // Parse the transaction_time format "2025-09-15 20:16:06"
        try {
          const date = new Date(value);
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
          return value;
        }
      },
    },
    {
      key: 'debit_account',
      title: 'From Account',
      sortable: true,
      width: 150,
    },
    {
      key: 'credit_account',
      title: 'To Account',
      sortable: true,
      width: 150,
    },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      width: 120,
      align: 'right',
      render: (_, row) => {
        const amount = row.credit_amount || row.debit_amount || 0;
        const isCredit = row.credit_amount;
        const displayAmount = isCredit ? amount : -amount;
        return new Intl.NumberFormat('en-RW', {
          style: 'currency',
          currency: 'RWF',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(displayAmount);
      },
    },
    {
      key: 'payment_details',
      title: 'Payment Details',
      sortable: false,
      width: 200,
      render: (value) => {
        if (!value) return 'N/A';
        // Truncate long payment details to prevent overflow
        return value.length > 30 ? `${value.slice(0, 30)}...` : value;
      },
    },
  ];

  const handleQueryChange = (query: any) => {
    updateParams(query);
  };

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
        <div className="text-center py-12 text-red-500">
          Failed to load transactions
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Transactions</h3>
      </div>
      
      <DataTable
        columns={columns}
        data={transactions}
        total={pagination?.total || 0}
        page={pagination?.page || 1}
        pageSize={pagination?.pageSize || 10}
        onQueryChange={handleQueryChange}
        loading={isLoading}
        renderRow={(row) => (
          <TransactionRow key={row.transaction_id} transaction={row} />
        )}
        renderFooter={() => (
          <PaginatedFooter
            total={pagination?.total || 0}
            page={pagination?.page || 1}
            pageSize={pagination?.pageSize || 10}
            onPageChange={(page) => handleQueryChange({ page })}
            onPageSizeChange={(pageSize) => handleQueryChange({ pageSize, page: 1 })}
          />
        )}
      />
    </div>
  );
}
