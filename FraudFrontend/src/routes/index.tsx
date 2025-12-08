import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { OverviewPage } from '@/pages/OverviewPage';
import { DetailsPage } from '@/pages/DetailsPage';
import { CompliancePage } from '@/pages/CompliancePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/overview" element={<OverviewPage />} />
      <Route path="/details" element={<DetailsPage />} />
      <Route path="/compliance" element={<CompliancePage />} />
    </Routes>
  );
}
