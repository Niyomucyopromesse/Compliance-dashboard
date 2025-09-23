import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KPICards } from '@/components/monitoring/KPICards';
import { DashboardTabs } from '@/components/monitoring/DashboardTabs';
import { AlertDetailPanel } from '@/components/monitoring/AlertDetailPanel';
import { Alert } from '@/types';
import { useWebSocket } from '@/contexts/WebSocketContext';

export function FraudMonitoringPage() {
  const navigate = useNavigate();
  const { acknowledgeAlert, escalateAlert } = useWebSocket();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Dummy data for demonstration
  useEffect(() => {
    const dummyAlerts: Alert[] = [
      {
        alert_id: '1',
        alert_type: 'High Amount',
        severity: 'Critical',
        status: 'Open',
        description: 'Transaction amount exceeds threshold',
        risk_score: 95,
        transaction_id: 'TXN001',
        account_id: 'ACC001',
        customer_id: 'CUST001',
        amount: 50000,
        timestamp: new Date().toISOString(),
        assigned_to: 'Analyst 1'
      },
      {
        alert_id: '2',
        alert_type: 'Velocity',
        severity: 'High',
        status: 'Pending',
        description: 'Unusual transaction frequency detected',
        risk_score: 87,
        transaction_id: 'TXN002',
        account_id: 'ACC002',
        customer_id: 'CUST002',
        amount: 15000,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        assigned_to: 'Analyst 2'
      },
      {
        alert_id: '3',
        alert_type: 'Geolocation',
        severity: 'Medium',
        status: 'Resolved',
        description: 'Suspicious location pattern detected',
        risk_score: 72,
        transaction_id: 'TXN003',
        account_id: 'ACC003',
        customer_id: 'CUST003',
        amount: 8000,
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        assigned_to: 'Analyst 1'
      }
    ];
    setAlerts(dummyAlerts);
  }, []);

  const handleAlertSelect = (alert: Alert) => {
    setSelectedAlert(alert);
  };

  const handleCustomerClick = (customerId: string) => {
    navigate(`/customers/${customerId}?fromMonitor=true`);
  };

  const handleAccountClick = (accountId: string) => {
    // Find the customer ID from the selected alert or use a default approach
    const alert = alerts.find(a => a.account_id === accountId);
    const customerId = alert?.customer_id;
    
    if (customerId) {
      navigate(`/accounts/${accountId}?customerId=${customerId}&fromMonitor=true`);
    } else {
      navigate(`/accounts/${accountId}?fromMonitor=true`);
    }
  };

  const handleTransactionClick = (transactionId: string) => {
    // Find the customer and account IDs from the selected alert
    const alert = alerts.find(a => a.transaction_id === transactionId);
    const customerId = alert?.customer_id;
    const accountId = alert?.account_id;
    
    if (customerId && accountId) {
      navigate(`/transactions/${transactionId}?customerId=${customerId}&accountId=${accountId}&fromMonitor=true`);
    } else if (customerId) {
      navigate(`/transactions/${transactionId}?customerId=${customerId}&fromMonitor=true`);
    } else {
      navigate(`/transactions/${transactionId}?fromMonitor=true`);
    }
  };

  const handleAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
    setSelectedAlert(null);
  };

  const handleEscalate = (alertId: string) => {
    escalateAlert(alertId, 'current_user');
    setSelectedAlert(null);
  };

  const handleResolve = (alertId: string) => {
    // TODO: Implement resolve functionality
    console.log('Resolve alert:', alertId);
    setSelectedAlert(null);
  };

  const handleMarkFalsePositive = (alertId: string) => {
    // TODO: Implement false positive functionality
    console.log('Mark as false positive:', alertId);
    setSelectedAlert(null);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fraud Monitoring Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Real-time fraud detection and alert management
        </p>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Dashboard Tabs */}
      <DashboardTabs 
        onAlertSelect={handleAlertSelect}
        onCustomerClick={handleCustomerClick}
        onAccountClick={handleAccountClick}
        onTransactionClick={handleTransactionClick}
      />

      {/* Alert detail panel */}
      <AlertDetailPanel 
        selectedAlert={selectedAlert} 
        open={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        onAcknowledge={handleAcknowledge}
        onEscalate={handleEscalate}
        onResolve={handleResolve}
        onMarkFalsePositive={handleMarkFalsePositive}
        onCustomerClick={handleCustomerClick}
        onAccountClick={handleAccountClick}
        onTransactionClick={handleTransactionClick}
      />
    </div>
  );
}
