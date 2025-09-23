import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUI } from '@/contexts/UIContext';
import { clsx } from 'clsx';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { state } = useUI();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className={clsx(
        'transition-all duration-300',
        state.sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
      )}>
        {/* Top navigation with integrated breadcrumbs */}
        <Topbar />
        
        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
