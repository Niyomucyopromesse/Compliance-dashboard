import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut
} from 'lucide-react';
import { useUI } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';
import { clsx } from 'clsx';
import { api } from '@/services/api';

const navigation = [
  { name: 'Home', href: '/home', icon: LayoutDashboard },
  { name: 'RegMgmt', href: '/details', icon: FileText },
];

function prefetchHomeData() {
  api.getComplianceInitial(100, 0).catch(() => {});
}

function prefetchDetailsData() {
  api.getComplianceInitial(50, 0).catch(() => {});
  api.getComplianceOwners().catch(() => {});
}

export function Sidebar() {
  const { state, toggleSidebar } = useUI();
  const { state: authState, logout } = useAuth();
  const location = useLocation();

  const isCurrentPath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {state.sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={toggleSidebar}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={clsx(
        'fixed top-0 bottom-0 left-0 z-50 w-52 bg-bk-navy text-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        state.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-16'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo and toggle button */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {state.sidebarOpen && (
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">Register</p>
                </div>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-slate-200 hover:text-white hover:bg-white/10"
            >
              {state.sidebarOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isCurrent = isCurrentPath(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onMouseEnter={() => { if (item.href === '/home') prefetchHomeData(); if (item.href === '/details') prefetchDetailsData(); }}
                  className={clsx(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isCurrent
                      ? 'bg-bk-blue text-white shadow-lg translate-x-1'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon
                    className={clsx(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isCurrent ? 'text-bk-yellow' : 'text-slate-300 group-hover:text-white'
                    )}
                  />
                  {state.sidebarOpen && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-white/10 p-4">
            {state.sidebarOpen ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-bk-blue">
                      <span className="text-sm font-medium text-white">
                        {authState.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-100">
                      {authState.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {authState.user?.role || 'Viewer'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <button className="flex w-full items-center px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-md">
                    <Settings className="mr-3 h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={logout}
                    className="flex w-full items-center px-3 py-2 text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 rounded-md"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-bk-blue">
                  <span className="text-sm font-medium text-white">
                    {authState.user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-md"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
