import { Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { DetailsPage } from '@/pages/DetailsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/details" element={<DetailsPage />} />
    </Routes>
  );
}
