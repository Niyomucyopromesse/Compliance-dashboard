import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { TransactionsChart } from '@/components/dashboard/TransactionsChart';
import { RiskDistributionPie } from '@/components/dashboard/RiskDistributionPie';
import { TransactionsTableCard } from '@/components/dashboard/TransactionsTableCard';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Overview of fraud detection and monitoring
        </p>
      </div>

      {/* Overview metrics */}
      <OverviewCards />

      {/* Transaction chart - full width */}
      <TransactionsChart />

      {/* Other charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskDistributionPie />
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 shadow-2xl">
          <h3 className="text-xl font-semibold text-white mb-4">Additional Metrics</h3>
          <div className="flex items-center justify-center h-64 text-gray-400">
            Coming Soon
          </div>
        </div>
      </div>

      {/* Recent transactions table */}
      <TransactionsTableCard />
    </div>
  );
}
