import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { DataTable } from '@/components/tables/DataTable';
import { CustomerRow } from './CustomerRow';
import { useCustomers } from '@/hooks/useCustomers';
import { ColumnDef } from '@/types';

export function CustomersList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  
  const { 
    customers, 
    pagination, 
    isLoading, 
    updateParams 
  } = useCustomers({ pageSize: 20, search: activeSearch });

  const columns: ColumnDef[] = [
    {
      key: 'customer_id',
      title: 'Customer ID',
      sortable: true,
      width: 150,
    },
    {
      key: 'full_name',
      title: 'Name',
      sortable: true,
      width: 200,
    },
    {
      key: 'segment',
      title: 'Segment',
      sortable: true,
      width: 120,
    },
    {
      key: 'risk_class',
      title: 'Risk Level',
      sortable: true,
      width: 120,
    },
    {
      key: 'accounts_count',
      title: 'Accounts',
      sortable: false,
      width: 100,
      align: 'right',
      render: (value) => value?.length || 0,
    },
    {
      key: 'total_balance',
      title: 'Total Balance',
      sortable: false,
      width: 150,
      align: 'right',
      render: (value) => {
        if (!value || !Array.isArray(value)) return 'N/A';
        const total = value.reduce((sum, account) => sum + (account.working_balance || 0), 0);
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(total);
      },
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      width: 100,
    },
  ];

  const handleQueryChange = (query: any) => {
    updateParams(query);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = () => {
    setActiveSearch(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Customer ID..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyPress={handleKeyPress}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
              {(searchTerm || activeSearch) && (
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          {activeSearch && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {pagination?.total || 0} result{(pagination?.total || 0) !== 1 ? 's' : ''} found for "{activeSearch}"
            </div>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        total={pagination?.total || 0}
        page={pagination?.page || 1}
        pageSize={pagination?.pageSize || 20}
        onQueryChange={handleQueryChange}
        loading={isLoading}
        paginationPosition="top"
        renderRow={(row) => (
          <CustomerRow key={row.customer_id} customer={row} />
        )}
      />
    </div>
  );
}
