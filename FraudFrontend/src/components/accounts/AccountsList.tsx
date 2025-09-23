import { DataTable } from '@/components/tables/DataTable';
import { AccountRow } from './AccountRow';
import { useAccounts } from '@/hooks/useAccounts';
import { ColumnDef } from '@/types';

export function AccountsList() {
  const { 
    accounts, 
    pagination, 
    isLoading, 
    updateParams 
  } = useAccounts({ pageSize: 20 });

  const columns: ColumnDef[] = [
    {
      key: 'account_id',
      title: 'Account ID',
      sortable: true,
      width: 150,
    },
    {
      key: 'short_title',
      title: 'Account Name',
      sortable: true,
      width: 200,
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      width: 120,
    },
    {
      key: 'currency',
      title: 'Currency',
      sortable: true,
      width: 100,
    },
    {
      key: 'working_balance',
      title: 'Balance',
      sortable: true,
      width: 150,
      align: 'right',
      render: (value) => {
        if (value === null || value === undefined) return 'N/A';
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      },
    },
    {
      key: 'opening_date',
      title: 'Opening Date',
      sortable: true,
      width: 120,
    },
  ];

  const handleQueryChange = (query: any) => {
    updateParams(query);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <DataTable
        columns={columns}
        data={accounts}
        total={pagination?.total || 0}
        page={pagination?.page || 1}
        pageSize={pagination?.pageSize || 20}
        onQueryChange={handleQueryChange}
        loading={isLoading}
        paginationPosition="top"
        renderRow={(row) => (
          <AccountRow key={row.account_id} account={row} />
        )}
      />
    </div>
  );
}
