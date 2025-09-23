import React from 'react';
import { ColumnDef, QueryParams } from '@/types';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PaginationHeader } from './PaginationHeader';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface DataTableProps {
  columns: ColumnDef[];
  data: any[];
  total: number;
  page: number;
  pageSize: number;
  onQueryChange: (query: Partial<QueryParams>) => void;
  loading?: boolean;
  renderRow?: (row: any, index: number) => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  paginationPosition?: 'top' | 'bottom' | 'both';
  className?: string;
}

export function DataTable({
  columns,
  data,
  total: _total,
  page: _page,
  pageSize: _pageSize,
  onQueryChange,
  loading = false,
  renderRow,
  renderFooter,
  paginationPosition = 'bottom',
  className,
}: DataTableProps) {
  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;

    const newSortOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnKey);
    setSortOrder(newSortOrder);
    onQueryChange({ sortBy: columnKey, sortOrder: newSortOrder });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  if (loading) {
    return (
      <div className={clsx('overflow-hidden', className)}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    style={{ width: column.width }}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      <LoadingSkeleton height="h-4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={clsx('overflow-hidden', className)}>
        <EmptyState
          title="No data available"
          description="There are no records to display."
        />
      </div>
    );
  }

  return (
    <div className={clsx('overflow-hidden', className)}>
      {/* Top Pagination */}
      {(paginationPosition === 'top' || paginationPosition === 'both') && (
        <PaginationHeader
          total={_total}
          page={_page}
          pageSize={_pageSize}
          onPageChange={(page) => onQueryChange({ page })}
          onPageSizeChange={(pageSize) => onQueryChange({ pageSize, page: 1 })}
        />
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, index) => {
              if (renderRow) {
                return (
                  <React.Fragment key={row.customer_id || row.id || index}>
                    {renderRow(row, index)}
                  </React.Fragment>
                );
              }

              return (
                <tr key={row.customer_id || row.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={clsx(
                        'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Bottom Pagination */}
      {(paginationPosition === 'bottom' || paginationPosition === 'both') && renderFooter && renderFooter()}
    </div>
  );
}
