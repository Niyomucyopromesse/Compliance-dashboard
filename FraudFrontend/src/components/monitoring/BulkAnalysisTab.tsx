import { useState } from 'react';

interface AnalysisService {
  id: string;
  name: string;
  description: string;
  estimatedTime: string;
  status: 'available' | 'running' | 'completed' | 'failed';
}

interface AnalysisReport {
  id: string;
  name: string;
  services: string[];
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  results?: {
    totalTransactions: number;
    flaggedTransactions: number;
    falsePositives: number;
    accuracy: number;
  };
}

export function BulkAnalysisTab() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [reports, setReports] = useState<AnalysisReport[]>([]);

  // Dummy data for available services
  const availableServices: AnalysisService[] = [
    {
      id: 'high-amount-detector',
      name: 'High Amount Detector',
      description: 'Analyze transactions for high-value patterns',
      estimatedTime: '5-10 minutes',
      status: 'available'
    },
    {
      id: 'velocity-detector',
      name: 'Velocity Detector',
      description: 'Examine transaction frequency patterns',
      estimatedTime: '3-7 minutes',
      status: 'available'
    },
    {
      id: 'frequent-transactions',
      name: 'Frequent Transactions',
      description: 'Identify unusual transaction frequency',
      estimatedTime: '4-8 minutes',
      status: 'available'
    },
    {
      id: 'geolocation-detector',
      name: 'Geolocation Detector',
      description: 'Analyze location-based patterns',
      estimatedTime: '6-12 minutes',
      status: 'available'
    },
    {
      id: 'time-pattern-detector',
      name: 'Time Pattern Detector',
      description: 'Examine timing-based anomalies',
      estimatedTime: '3-6 minutes',
      status: 'available'
    },
    {
      id: 'network-analysis',
      name: 'Network Analysis',
      description: 'Analyze transaction network patterns',
      estimatedTime: '10-15 minutes',
      status: 'available'
    }
  ];

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleRunAnalysis = () => {
    if (selectedServices.length === 0) return;

    setIsRunning(true);
    const reportId = `report-${Date.now()}`;
    const newReport: AnalysisReport = {
      id: reportId,
      name: `Bulk Analysis - ${new Date().toLocaleString()}`,
      services: selectedServices,
      status: 'running',
      startTime: new Date().toISOString()
    };

    setReports(prev => [newReport, ...prev]);

    // Simulate analysis completion
    setTimeout(() => {
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? {
              ...report,
              status: 'completed',
              endTime: new Date().toISOString(),
              results: {
                totalTransactions: Math.floor(Math.random() * 10000) + 5000,
                flaggedTransactions: Math.floor(Math.random() * 500) + 100,
                falsePositives: Math.floor(Math.random() * 50) + 10,
                accuracy: Math.floor(Math.random() * 20) + 80
              }
            }
          : report
      ));
      setIsRunning(false);
    }, 5000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'completed': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'failed': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Bulk Analysis</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Run comprehensive fraud analysis across multiple detection services
        </p>
      </div>

      {/* Service Selection */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Select Services</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {availableServices.map((service) => (
            <label key={service.id} className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={selectedServices.includes(service.id)}
                onChange={() => handleServiceToggle(service.id)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{service.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{service.description}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">Est. time: {service.estimatedTime}</div>
              </div>
            </label>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleRunAnalysis}
            disabled={selectedServices.length === 0 || isRunning}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Analysis...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* Analysis Reports */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Analysis Reports</h4>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2">No analysis reports yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">{report.name}</h5>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Services: {report.services.join(', ')}
                    </div>
                    <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      Started: {new Date(report.startTime).toLocaleString()}
                      {report.endTime && ` • Completed: ${new Date(report.endTime).toLocaleString()}`}
                    </div>
                    {report.results && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Total Transactions:</span>
                          <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">{report.results.totalTransactions.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Flagged:</span>
                          <span className="ml-1 font-medium text-red-600 dark:text-red-400">{report.results.flaggedTransactions.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">False Positives:</span>
                          <span className="ml-1 font-medium text-yellow-600 dark:text-yellow-400">{report.results.falsePositives.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Accuracy:</span>
                          <span className="ml-1 font-medium text-green-600 dark:text-green-400">{report.results.accuracy}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.status === 'completed' && (
                      <button className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800">
                        Download Report
                      </button>
                    )}
                    <button className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
