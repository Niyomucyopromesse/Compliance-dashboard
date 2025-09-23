import { useState } from 'react';
import { useCustomer } from '@/hooks/useCustomers';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { StatusBadge } from '@/components/common/Badge';
import { Link } from 'react-router-dom';
import { getAccountTypeName } from '@/utils/customerUtils';

interface CustomerDetailProps {
  customerId: string;
}

export default function CustomerDetail({ customerId }: CustomerDetailProps) {
  const { customer, isLoading, isError, error } = useCustomer(customerId);
  const [activeTab, setActiveTab] = useState('profile');

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 min-h-[300px] rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Customer Details</h2>
        <div className="space-y-4">
          <LoadingSkeleton height="h-6" />
          <LoadingSkeleton height="h-6" />
          <LoadingSkeleton height="h-6" />
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Customer Details</h2>
        <div className="text-center py-12 text-red-500 dark:text-red-400">
          {error instanceof Error ? error.message : 'Failed to load customer details'}
        </div>
      </div>
    );
  }


  // Hardcoded placeholders to match the design in the provided image
  const valueScore = 78;
  const valueLabel = 'Low';
  const nextBestOffer = {
    title: 'Personal Loan',
    subtitle: 'Predicted revenue: $1.2k',
  };
  const recentAlerts = [
    { id: 1, title: 'Unusual Transaction', date: 'May 14, 2024 • 3:45 PM' },
    { id: 2, title: 'Large Cash Withdrawal', date: 'Apr 26, 2024 • 11:02 AM' },
  ];

  const recentTransactions = [
    { month: 'Jan', value: 45, amount: 125000 },
    { month: 'Feb', value: 52, amount: 180000 },
    { month: 'Mar', value: 38, amount: 95000 },
    { month: 'Apr', value: 67, amount: 220000 },
    { month: 'May', value: 73, amount: 285000 },
    { month: 'Jun', value: 58, amount: 165000 },
  ];

  // Products derived from accounts per rules - top 3 with absolute balance
  const products = (customer.accounts || [])
    .map((acc: any) => ({
      id: acc.account_id,
      type: getAccountTypeName(acc.category),
      short: acc.short_title || acc.account_title_1 || acc.account_id,
      balance: acc.working_balance,
      absoluteBalance: Math.abs(acc.working_balance || 0),
      masked: acc.account_id ? `**** ${String(acc.account_id).slice(-4)}` : acc.account_id,
    }))
    .sort((a, b) => b.absoluteBalance - a.absoluteBalance)
    .slice(0, 3);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'products', label: 'Products' },
    { id: 'risk', label: 'Risk' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top nav with tabs to match the image */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer 360</div>

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

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm">Search</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-900 dark:text-gray-100">U</div>
          </div>
        </div>
      </div>

      {/* Main content - conditional rendering based on active tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main customer card (left two columns on large screens) */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              {/* Card header with Edit Profile button */}
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer Profile</h3>
                <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-md transition-colors">
                  Edit Profile
                </button>
              </div>
              
              {/* Split panes within the customer card */}
              <div className="grid grid-cols-1 lg:grid-cols-2 -mx-2">
                {/* Left Pane - Customer Details */}
                <div className="space-y-4 px-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{customer.full_name || '—'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Primary national ID: {customer.customer_id || 'N/A'}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{(customer as any).dob || (customer as any).date_of_birth || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Gender</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{(customer as any).gender || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Contact</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{customer.phone || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{customer.email || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Nationality</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{(customer as any).nationality || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Customer Since</div>
                      <div className="text-sm text-gray-900 dark:text-gray-100">{customer.customer_since ? new Date(customer.customer_since).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">KYC Status</div>
                      <div className="mt-1">
                        <StatusBadge status={customer.status || 'unknown'} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Pane - Value Score, Next Best Offer, Recent Transactions */}
                <div className="space-y-6 px-2">
                  {/* First Row: Circular Score (left) and Value Score Bar (right) */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Circular Score */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-green-300 flex items-center justify-center mx-auto">
                        <span className="text-xl font-bold">{valueScore}</span>
                      </div>
                    </div>
                    
                    {/* Value Score Bar */}
                    <div className="flex flex-col justify-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Value Score</div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-green-500 dark:bg-green-400 h-2 rounded-full" style={{ width: `${valueScore}%` }}></div>
                      </div>
                      <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">{valueLabel}</div>
                    </div>
                  </div>

                  {/* Second Row: Next Best Offer */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Next Best Offer</div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">$</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{nextBestOffer.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Predicted revenue: $1.2k</div>
                      </div>
                    </div>
                  </div>

                  {/* Third Row: Recent Transactions Chart */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Transactions</h3>
                    <div className="flex items-end h-32 space-x-2">
                      {recentTransactions.map((r) => (
                        <div key={r.month} className="flex flex-col items-center flex-1">
                          <div
                            title={`${r.month}: ${new Intl.NumberFormat('en-RW', { 
                              style: 'currency',
                              currency: 'RWF',
                              minimumFractionDigits: 0, 
                              maximumFractionDigits: 0 
                            }).format(r.amount)}`}
                            className="w-full rounded-sm bg-blue-500 dark:bg-blue-400"
                            style={{ height: `${Math.max(r.value * 0.8, 8)}px` }}
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{r.month}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <aside className="space-y-6">
              {/* Recent Alerts Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Alerts</h3>
                  <Link to="#" className="text-xs text-blue-600 dark:text-blue-400">View all</Link>
                </div>

                <div className="space-y-3">
                  {recentAlerts.map((a) => (
                    <div key={a.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{a.date}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Products</h4>
                <div className="space-y-3">
                  {products.length === 0 && <div className="text-sm text-gray-500 dark:text-gray-400">No products available</div>}

                  {products.map((p) => (
                    <div key={p.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.type}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{p.masked}</div>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {p.absoluteBalance !== null && p.absoluteBalance !== undefined 
                            ? new Intl.NumberFormat('en-RW', { 
                                style: 'currency',
                                currency: 'RWF',
                                minimumFractionDigits: 0, 
                                maximumFractionDigits: 0 
                              }).format(p.absoluteBalance) 
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>

          {/* Accounts table (kept below to show full list) */}
          {customer.accounts && customer.accounts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Accounts ({customer.accounts.length})</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Account Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Currency</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Opening Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {customer.accounts.map((account: any) => (
                      <tr key={account.account_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          <Link
                            to={`/accounts/${account.account_id}?customerId=${customer.customer_id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            {account.account_id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{account.short_title || account.account_title_1 || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getAccountTypeName(account.category)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{account.currency || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">{account.working_balance !== null && account.working_balance !== undefined ? new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(account.working_balance) : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{account.opening_date ? new Date(account.opening_date).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab Content */}
      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Analytics content coming soon...</p>
        </div>
      )}

      {/* Products Tab Content */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm min-h-[300px]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Products</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usage</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Spend</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Current Accounts (category starting with 1) */}
                {customer.accounts?.filter((acc: any) => String(acc.category).startsWith('1')).map((account: any) => (
                  <tr key={account.account_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">Current Account</td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(Math.abs(account.working_balance || 0) * 0.1)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(Math.abs(account.working_balance || 0))}
                    </td>
                  </tr>
                ))}
                
                {/* Savings Accounts (category starting with 6) */}
                {customer.accounts?.filter((acc: any) => String(acc.category).startsWith('6')).map((account: any) => (
                  <tr key={account.account_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">Savings Account</td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(Math.abs(account.working_balance || 0) * 0.15)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(Math.abs(account.working_balance || 0))}
                    </td>
                  </tr>
                ))}
                
                {/* Loans (category starting with 3) */}
                {customer.accounts?.filter((acc: any) => String(acc.category).startsWith('3')).map((account: any) => (
                  <tr key={account.account_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">Loan</td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(Math.abs(account.working_balance || 0) * 0.2)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(Math.abs(account.working_balance || 0))}
                    </td>
                  </tr>
                ))}
                
                {/* Other categories */}
                {customer.accounts?.filter((acc: any) => !String(acc.category).startsWith('1') && !String(acc.category).startsWith('3') && !String(acc.category).startsWith('6')).map((account: any) => (
                  <tr key={account.account_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-gray-100">Other</td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(Math.abs(account.working_balance || 0) * 0.1)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-900 dark:text-gray-100 text-right">
                      {new Intl.NumberFormat('en-RW', { 
                        style: 'currency',
                        currency: 'RWF',
                        minimumFractionDigits: 0, 
                        maximumFractionDigits: 0 
                      }).format(Math.abs(account.working_balance || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risk Tab Content */}
      {activeTab === 'risk' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">Risk assessment content coming soon...</p>
        </div>
      )}
    </div>
  );
}