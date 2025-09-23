import { useState } from 'react';
import { useAccount, useAccountRecentTransactions } from '@/hooks/useAccounts';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/Badge';
import { Link } from 'react-router-dom';
import { getCustomerSegmentName } from '@/utils/customerUtils';

interface AccountDetailProps {
  accountId: string;
}

export default function AccountDetail({ accountId }: AccountDetailProps) {
  const [activeTab, setActiveTab] = useState('details');
  const { account, isLoading: accountLoading, isError: accountError, error: accountErrorMsg } = useAccount(accountId);
  const { transactions, isLoading: transactionsLoading, isError: transactionsError } = useAccountRecentTransactions(accountId);

  // Dummy data for features not yet available from backend
  const alerts = [
    { id: 1, text: 'Overdraft limit approaching', type: 'warning' },
    { id: 2, text: 'KYC due for review', type: 'info' },
    { id: 3, text: 'Large transaction detected', type: 'warning' },
  ];

  const linkedProducts = [
    { name: 'Debit Card • ****4321', status: 'Active' },
    { name: 'Mobile Banking (Enabled)', status: 'Active' },
    { name: 'Standing Order - Payroll', status: 'Active' },
  ];

  // Balance history for analytics (dummy data)
  const balanceHistory = [
    { month: 'Jan', balance: 35000 },
    { month: 'Feb', balance: 42000 },
    { month: 'Mar', balance: 38000 },
    { month: 'Apr', balance: 45000 },
    { month: 'May', balance: 52000 },
    { month: 'Jun', balance: 60784 },
  ];

  const tabs = [
    { id: 'details', label: 'Account Details' },
    { id: 'analytics', label: 'Analytics' },
  ] as const;


  if (accountLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 font-sans text-gray-800 dark:text-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
            <LoadingSkeleton height="h-8" />
            <div className="mt-4 space-y-2">
              <LoadingSkeleton height="h-4" />
              <LoadingSkeleton height="h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accountError || !account) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 font-sans text-gray-800 dark:text-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Account Details</h2>
            <div className="text-center py-12 text-red-500 dark:text-red-400">
              {accountErrorMsg?.message || 'Failed to load account details'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 font-sans text-gray-800 dark:text-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header with Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <nav className="flex items-center space-x-6">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`pb-2 text-sm font-medium ${activeTab === t.id ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">Working Balance</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {new Intl.NumberFormat('en-RW', { 
                    style: 'currency',
                    currency: 'RWF',
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  }).format(account.working_balance || 0)}
                </div>
              </div>
              <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Actions</button>
              <button className="px-3 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md text-sm hover:bg-green-700 dark:hover:bg-green-600">Export</button>
            </div>
          </div>
        </div>

        {/* Main content - conditional rendering based on active tab */}
        {activeTab === 'details' && (
            <div className="grid grid-cols-3 gap-6">
              {/* Left: Account + Customer Info stacked (two rows) */}
              <div className="col-span-2 space-y-6">
                {/* Account Information (tabular) */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Account Information</h2>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">Account ID</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.account_id}</div>
                    <div className="text-gray-500 dark:text-gray-400">Account Officer</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.account_officer || 'N/A'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Account Title</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.account_title_1 || 'N/A'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Short Title</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.short_title || 'N/A'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Category</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.category || 'N/A'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Currency</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.currency || 'N/A'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Working Balance</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(account.working_balance || 0)}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Customer ID</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.customer_id || 'N/A'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Position Type</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.position_type || 'N/A'}</div>
                    <div className="text-gray-500 dark:text-gray-400">Opening Date</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {account.opening_date ? new Date(account.opening_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Last Updated</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {account.last_updated_date ? new Date(account.last_updated_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Limit Reference</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{account.limit_ref || 'N/A'}</div>
                  </div>
                </div>

                {/* Customer Information (tabular) */}
                {account.customer && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Customer Information</h2>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="text-gray-500 dark:text-gray-400">Customer ID</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{account.customer.customer_id}</div>
                      <div className="text-gray-500 dark:text-gray-400">Full Name</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{account.customer.full_name || 'N/A'}</div>
                      <div className="text-gray-500 dark:text-gray-400">Email</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{account.customer.email || 'N/A'}</div>
                      <div className="text-gray-500 dark:text-gray-400">Phone</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{account.customer.phone || 'N/A'}</div>
                      <div className="text-gray-500 dark:text-gray-400">Residence</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{account.customer.residence || 'N/A'}</div>
                      <div className="text-gray-500 dark:text-gray-400">Segment</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{getCustomerSegmentName(account.customer.segment)}</div>
                      <div className="text-gray-500 dark:text-gray-400">Risk Class</div>
                      <div className="font-medium">
                        <StatusBadge status={account.customer.risk_class || 'unknown'} size="sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Alerts + Linked Products */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Alerts</h3>
                  <ul className="text-sm space-y-2">
                    {alerts.map(a => (
                      <li key={a.id} className="flex items-start gap-2">
                        <span className={`w-2 h-2 rounded-full mt-2 ${
                          a.type === 'warning' ? 'bg-yellow-400' : 
                          a.type === 'info' ? 'bg-blue-400' : 'bg-green-400'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{a.text}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Action recommended</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Linked Products</h3>
                  <ul className="text-sm space-y-2">
                    {linkedProducts.map((p, i) => (
                      <li key={i} className="flex justify-between items-center">
                        <div className="text-gray-900 dark:text-gray-100">{p.name}</div>
                        <button className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Manage</button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h3>
                  <div className="flex flex-col gap-2">
                    <button className="px-3 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600">Make Transfer</button>
                    <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Set Standing Order</button>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Analytics Tab Content */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Balance History (last 6 months)</h2>
                {/* Balance history chart */}
                <div className="flex items-end h-24 space-x-2 mb-4">
                  {balanceHistory.map((point) => (
                    <div key={point.month} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full rounded-sm bg-blue-500"
                        style={{ 
                          height: `${Math.max((point.balance / Math.max(...balanceHistory.map(p => p.balance))) * 100, 8)}px` 
                        }}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{point.month}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100">
                    Avg Monthly Balance
                    <div className="font-medium mt-1 text-gray-900 dark:text-gray-100">RWF 45,320</div>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100">
                    Deposits (6m)
                    <div className="font-medium mt-1 text-gray-900 dark:text-gray-100">RWF 120,000</div>
                  </div>
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100">
                    Withdrawals (6m)
                    <div className="font-medium mt-1 text-gray-900 dark:text-gray-100">RWF 68,400</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Account Health</h3>
                <div className="text-sm text-gray-900 dark:text-gray-100">Score</div>
                <div className="text-3xl font-bold mt-2 text-gray-900 dark:text-gray-100">78</div>
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">Based on activity, risk and balance trends</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent transactions: full width under tabs (always visible) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {transactionsLoading 
                ? 'Loading Recent Transactions...'
                : transactions && transactions.length > 0 
                  ? `Recent Transactions (${transactions.length})` 
                  : 'Recent Transactions'
              }
            </h3>
            <Link
              to={`/transactions?accountId=${account.account_id}${account.customer_id ? `&customerId=${account.customer_id}` : ''}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              View All Transactions
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Transaction Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Payment Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {transactionsLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <LoadingSkeleton height="h-4" />
                    </td>
                  </tr>
                ) : transactionsError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-red-500 dark:text-red-400">
                      Failed to load transactions
                    </td>
                  </tr>
                ) : transactions && transactions.length > 0 ? (
                  transactions.slice(0, 5).map(t => (
                    <tr key={t.transaction_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        <Link
                          to={`/transactions/${t.transaction_id}?customerId=${account.customer_id}&accountId=${account.account_id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        >
                          {t.transaction_id?.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {t.transaction_time ? (() => {
                          try {
                            let date;
                            
                            // Handle the Python datetime object format
                            if (t.transaction_time._DateTime__date && t.transaction_time._DateTime__time) {
                              const dateObj = t.transaction_time._DateTime__date;
                              const timeObj = t.transaction_time._DateTime__time;
                              
                              // Construct ISO string from the datetime components
                              const year = dateObj._Date__year;
                              const month = String(dateObj._Date__month).padStart(2, '0');
                              const day = String(dateObj._Date__day).padStart(2, '0');
                              const hour = String(timeObj._Time__hour).padStart(2, '0');
                              const minute = String(timeObj._Time__minute).padStart(2, '0');
                              const second = String(timeObj._Time__second).padStart(2, '0');
                              
                              const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
                              date = new Date(isoString);
                            } else if (typeof t.transaction_time === 'string') {
                              // Handle string format (like in dashboard)
                              if (t.transaction_time.includes(' ')) {
                                const isoString = t.transaction_time.replace(' ', 'T') + 'Z';
                                date = new Date(isoString);
                              } else {
                                date = new Date(t.transaction_time);
                              }
                            } else {
                              date = new Date(t.transaction_time);
                            }
                            
                            if (isNaN(date.getTime())) {
                              return 'Invalid Date';
                            }
                            
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
                            return 'Invalid Date';
                          }
                        })() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {t.transaction_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {(() => {
                          // Determine if this is a credit or debit relative to the current account
                          const isCreditToAccount = t.credit_account === account.account_id;
                          const isDebitFromAccount = t.debit_account === account.account_id;
                          
                          let amount = 0;
                          let isCredit = false;
                          
                          if (isCreditToAccount && t.credit_amount) {
                            // Money coming into this account (credit)
                            amount = t.credit_amount;
                            isCredit = true;
                          } else if (isDebitFromAccount && t.debit_amount) {
                            // Money going out of this account (debit)
                            amount = t.debit_amount;
                            isCredit = false;
                          } else {
                            // Fallback to original logic if account doesn't match
                            amount = t.credit_amount || t.debit_amount || 0;
                            isCredit = !!t.credit_amount;
                          }
                          
                          const colorClass = isCredit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
                          const prefix = isCredit ? '+' : '-';
                          
                          return (
                            <span className={`font-medium ${colorClass}`}>
                              {prefix}{new Intl.NumberFormat('en-RW', {
                                style: 'currency',
                                currency: 'RWF',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                              }).format(amount)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                        <div className="truncate" title={t.payment_details || 'N/A'}>
                          {t.payment_details ? 
                            (t.payment_details.length > 30 ? 
                              `${t.payment_details.slice(0, 30)}...` : 
                              t.payment_details
                            ) : 'N/A'
                          }
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}