import { 
  Bell, 
  Menu, 
  Home,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useUI } from '@/contexts/UIContext';
import { clsx } from 'clsx';

export function Topbar() {
  const { state, toggleSidebar, setNotifications } = useUI();
  const location = useLocation();

  // Breadcrumb logic: app keeps only Home + RegMgmt routes.
  const pathNames: Record<string, string> = {
    '/': 'Home',
    '/home': 'Home',
    '/details': 'RegMgmt',
  };

  const pathnames = location.pathname.split('/').filter((x) => x);

  const handleNotificationsToggle = () => {
    setNotifications(!state.notifications);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-white/10 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - Logo, Menu button and Breadcrumbs */}
          <div className="flex items-center space-x-4">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center mr-4">
              <img 
                src="/bk_logo.png" 
                alt="Bank Logo" 
                className="h-8 w-auto object-contain"
                onError={(event) => {
                  const target = event.currentTarget;
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = '1';
                    target.src = '/brand-logo.png';
                  }
                }}
              />
            </Link>
            
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-white/10 lg:hidden"
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
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <Home className="h-4 w-4" />
                    </Link>
                  </li>
                  
                  {pathnames.map((name, index) => {
                    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    const displayName =
                      pathNames[routeTo] || name.charAt(0).toUpperCase() + name.slice(1);

                    return (
                      <li key={name} className="flex items-center">
                        <ChevronRight className="h-4 w-4 text-slate-500 mx-2" />
                        {isLast ? (
                          <span className="text-sm font-medium text-slate-100">
                            {displayName}
                          </span>
                        ) : (
                          <Link
                            to={routeTo}
                            className="text-sm font-medium text-slate-400 hover:text-slate-200"
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
            {/* Notifications */}
            <button
              onClick={handleNotificationsToggle}
              className={clsx(
                'p-2 rounded-md transition-colors',
                state.notifications
                  ? 'text-bk-yellow hover:text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
