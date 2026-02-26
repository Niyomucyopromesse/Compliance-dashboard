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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content area */}
      <div className={clsx(
        'transition-all duration-300',
        state.sidebarOpen ? 'lg:pl-52' : 'lg:pl-16'
      )}>
        {/* Top navigation with integrated breadcrumbs */}
        <Topbar />
        
        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
