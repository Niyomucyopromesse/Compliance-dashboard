import { Routes, Route } from 'react-router-dom';
import { DashboardPage } from '@/pages/DashboardPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { CustomerPage } from '@/pages/CustomerPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { AccountPage } from '@/pages/AccountPage';
import { FraudMonitoringPage } from '@/pages/FraudMonitoringPage';
import { TransactionPage } from '@/pages/TransactionPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/customers/:customerId" element={<CustomerPage />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/accounts/:accountId" element={<AccountPage />} />
      <Route path="/monitor" element={<FraudMonitoringPage />} />
      <Route path="/transactions/:txId" element={<TransactionPage />} />
    </Routes>
  );
}
