import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const pathNames: Record<string, string> = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/accounts': 'Accounts',
  '/monitor': 'Fraud Monitor',
  '/transactions': 'Transactions',
};

// Function to get display name for dynamic routes
const getDisplayName = (pathname: string, name: string, index: number, pathnames: string[]) => {
  const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
  
  // Handle specific dynamic routes
  if (pathname.startsWith('/accounts/') && name !== 'accounts') {
    return `Account ${name}`;
  }
  if (pathname.startsWith('/customers/') && name !== 'customers') {
    return `Customer ${name}`;
  }
  if (pathname.startsWith('/transactions/') && name !== 'transactions') {
    return `Transaction ${name}`;
  }
  
  return pathNames[routeTo] || name.charAt(0).toUpperCase() + name.slice(1);
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const searchParams = new URLSearchParams(location.search);

  if (location.pathname === '/') {
    return null;
  }

  // Check if we have customer context from URL parameters
  const customerId = searchParams.get('customerId');
  const accountId = searchParams.get('accountId');
  const fromMonitor = searchParams.get('fromMonitor') === 'true';

  // Debug logging - remove after testing
  if (location.search) {
    console.log('Breadcrumb Debug:', {
      pathname: location.pathname,
      search: location.search,
      customerId,
      accountId,
      fromMonitor,
      allParams: Object.fromEntries(searchParams.entries())
    });
  }

  return (
    <nav className="flex px-4 sm:px-6 lg:px-8 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            to="/"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        
        {/* Show fraud monitor context if we came from there */}
        {fromMonitor && (
          <li className="flex items-center">
            <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" />
            <Link
              to="/monitor"
              className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Fraud Monitor
            </Link>
          </li>
        )}


        {/* Show customer context if we have it */}
        {customerId && (
          <>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" />
              <Link
                to="/customers"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Customers
              </Link>
            </li>
            <li className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" />
              <Link
                to={`/customers/${customerId}${fromMonitor ? '?fromMonitor=true' : ''}`}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Customer {customerId}
              </Link>
            </li>
            {/* Show account context if we have it */}
            {accountId && (
              <li className="flex items-center">
                <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" />
                <Link
                  to={`/accounts/${accountId}?customerId=${customerId}${fromMonitor ? '&fromMonitor=true' : ''}`}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Account {accountId}
                </Link>
              </li>
            )}
          </>
        )}
        
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = getDisplayName(location.pathname, name, index, pathnames);

          // Skip the "accounts" breadcrumb if we have customer context
          if (customerId && name === 'accounts') {
            return null;
          }
          
          // Skip the "transactions" breadcrumb if we have account context
          if (accountId && name === 'transactions') {
            return null;
          }

          return (
            <li key={name} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" />
              {isLast ? (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {displayName}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
