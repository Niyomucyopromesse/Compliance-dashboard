import { 
  Bell, 
  Menu, 
  Sun, 
  Moon, 
  RefreshCw,
  Wifi,
  WifiOff,
  Home,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '@/contexts/UIContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { clsx } from 'clsx';

export function Topbar() {
  const { state, toggleSidebar, setTheme, setNotifications } = useUI();
  const { isConnected, isPaused, pause, resume } = useWebSocket();
  const location = useLocation();

  // Breadcrumb logic
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

  const pathnames = location.pathname.split('/').filter((x) => x);
  const searchParams = new URLSearchParams(location.search);
  const customerId = searchParams.get('customerId');
  const accountId = searchParams.get('accountId');
  const fromMonitor = searchParams.get('fromMonitor') === 'true';

  const handleThemeToggle = () => {
    setTheme(state.theme === 'light' ? 'dark' : 'light');
  };

  const handleNotificationsToggle = () => {
    setNotifications(!state.notifications);
  };

  const handleLiveFeedToggle = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Menu button and Breadcrumbs */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Breadcrumbs */}
            {location.pathname !== '/' && (
              <nav className="hidden sm:flex items-center space-x-2">
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
                      {/* Only show "Customers" link if not coming from Fraud Monitor */}
                      {!fromMonitor && (
                        <li className="flex items-center">
                          <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-500 mx-2" />
                          <Link
                            to="/customers"
                            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                          >
                            Customers
                          </Link>
                        </li>
                      )}
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

                    // Skip the "customers" breadcrumb if we have customer context and came from Fraud Monitor
                    if (customerId && fromMonitor && name === 'customers') {
                      return null;
                    }
                    
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
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Live feed status */}
            <div className="flex items-center space-x-2">
              <div className={clsx(
                'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
                isConnected 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              )}>
                {isConnected ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span>{isConnected ? 'Live' : 'Offline'}</span>
              </div>
              
              {isConnected && (
                <button
                  onClick={handleLiveFeedToggle}
                  className={clsx(
                    'p-2 rounded-md text-sm font-medium transition-colors',
                    isPaused
                      ? 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      : 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                  )}
                >
                  <RefreshCw className={clsx('h-4 w-4', !isPaused && 'animate-spin')} />
                </button>
              )}
            </div>

            {/* Notifications */}
            <button
              onClick={handleNotificationsToggle}
              className={clsx(
                'p-2 rounded-md transition-colors',
                state.notifications
                  ? 'text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <Bell className="h-5 w-5" />
            </button>

            {/* Theme toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {state.theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
