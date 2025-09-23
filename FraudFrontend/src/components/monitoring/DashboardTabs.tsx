import { useState } from 'react';
import { LiveFeed } from './LiveFeed';
import { FraudServicesTab } from './FraudServicesTab';
import { BulkAnalysisTab } from './BulkAnalysisTab';
import { Alert } from '@/types';

interface DashboardTabsProps {
  onAlertSelect: (alert: Alert) => void;
  onCustomerClick?: (customerId: string) => void;
  onAccountClick?: (accountId: string) => void;
  onTransactionClick?: (transactionId: string) => void;
}

export function DashboardTabs({ 
  onAlertSelect, 
  onCustomerClick, 
  onAccountClick, 
  onTransactionClick 
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<'live-feed' | 'services' | 'bulk-analysis'>('live-feed');

  const tabs = [
    { id: 'live-feed', name: 'Live Feed', icon: '📊' },
    { id: 'services', name: 'Fraud Services', icon: '⚙️' },
    { id: 'bulk-analysis', name: 'Bulk Analysis', icon: '📈' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-5 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - More spacious */}
      <div className="p-0">
        {activeTab === 'live-feed' && (
          <LiveFeed 
            onAlertSelect={onAlertSelect}
            onCustomerClick={onCustomerClick}
            onAccountClick={onAccountClick}
            onTransactionClick={onTransactionClick}
          />
        )}
        
        {activeTab === 'services' && (
          <div className="p-8">
            <FraudServicesTab />
          </div>
        )}
        
        {activeTab === 'bulk-analysis' && (
          <div className="p-8">
            <BulkAnalysisTab />
          </div>
        )}
      </div>
    </div>
  );
}
