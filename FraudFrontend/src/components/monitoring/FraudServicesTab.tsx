import { useState } from 'react';

interface FraudService {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'paused';
  lastRun: string;
  alertsGenerated: number;
  accuracy: number;
  config: Record<string, any>;
}

interface ServiceConfigPanelProps {
  service: FraudService | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceId: string, config: Record<string, any>) => void;
}

function ServiceConfigPanel({ service, isOpen, onClose, onSave }: ServiceConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, any>>({});

  if (!service || !isOpen) return null;

  const handleSave = () => {
    onSave(service.id, config);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Configure {service.name}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Threshold
            </label>
            <input
              type="number"
              value={config.threshold || service.config.threshold || 0.8}
              onChange={(e) => setConfig({ ...config, threshold: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Window (minutes)
            </label>
            <input
              type="number"
              value={config.timeWindow || service.config.timeWindow || 60}
              onChange={(e) => setConfig({ ...config, timeWindow: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enable Notifications
            </label>
            <input
              type="checkbox"
              checked={config.notifications !== false}
              onChange={(e) => setConfig({ ...config, notifications: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            />
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export function FraudServicesTab() {
  const [selectedService, setSelectedService] = useState<FraudService | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Dummy data for fraud services
  const services: FraudService[] = [
    {
      id: 'high-amount-detector',
      name: 'High Amount Detector',
      description: 'Detects transactions above specified thresholds',
      status: 'running',
      lastRun: '2024-01-15T10:30:00Z',
      alertsGenerated: 23,
      accuracy: 94.5,
      config: { threshold: 0.8, timeWindow: 60, notifications: true }
    },
    {
      id: 'velocity-detector',
      name: 'Velocity Detector',
      description: 'Monitors transaction frequency and patterns',
      status: 'running',
      lastRun: '2024-01-15T10:25:00Z',
      alertsGenerated: 15,
      accuracy: 89.2,
      config: { threshold: 0.7, timeWindow: 30, notifications: true }
    },
    {
      id: 'frequent-transactions',
      name: 'Frequent Transactions',
      description: 'Identifies unusual transaction frequency patterns',
      status: 'paused',
      lastRun: '2024-01-15T09:45:00Z',
      alertsGenerated: 8,
      accuracy: 91.8,
      config: { threshold: 0.75, timeWindow: 45, notifications: false }
    },
    {
      id: 'geolocation-detector',
      name: 'Geolocation Detector',
      description: 'Detects suspicious location-based patterns',
      status: 'stopped',
      lastRun: '2024-01-15T08:15:00Z',
      alertsGenerated: 12,
      accuracy: 87.3,
      config: { threshold: 0.6, timeWindow: 120, notifications: true }
    },
    {
      id: 'time-pattern-detector',
      name: 'Time Pattern Detector',
      description: 'Analyzes unusual transaction timing patterns',
      status: 'running',
      lastRun: '2024-01-15T10:35:00Z',
      alertsGenerated: 19,
      accuracy: 92.1,
      config: { threshold: 0.85, timeWindow: 90, notifications: true }
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'paused': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'stopped': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const handleConfigure = (service: FraudService) => {
    setSelectedService(service);
    setIsConfigOpen(true);
  };

  const handleSaveConfig = (serviceId: string, config: Record<string, any>) => {
    // TODO: Implement save configuration
    console.log('Saving config for service:', serviceId, config);
  };

  const handleToggleService = (serviceId: string) => {
    // TODO: Implement toggle service
    console.log('Toggling service:', serviceId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Fraud Detection Services</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage and configure your fraud detection services
        </p>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <div key={service.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.name}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{service.description}</p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>Last run: {new Date(service.lastRun).toLocaleString()}</span>
                  <span>Alerts: {service.alertsGenerated}</span>
                  <span>Accuracy: {service.accuracy}%</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleConfigure(service)}
                  className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800"
                >
                  Configure
                </button>
                <button
                  onClick={() => handleToggleService(service.id)}
                  className={`px-3 py-1 text-xs font-medium rounded-md ${
                    service.status === 'running'
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800'
                      : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800'
                  }`}
                >
                  {service.status === 'running' ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ServiceConfigPanel
        service={selectedService}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveConfig}
      />
    </div>
  );
}