import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface CustomerDetailPanelProps {
  id?: string | null;
  open?: boolean;
  onClose?: () => void;
}

export function CustomerDetailPanel({ 
  id, 
  open = false, 
  onClose 
}: CustomerDetailPanelProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Customer Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Customer details will be loaded here
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
