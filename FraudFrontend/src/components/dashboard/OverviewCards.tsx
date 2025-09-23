import { MetricCard } from '@/components/common/MetricCard';
import { useMetrics } from '@/hooks/useMetrics';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export function OverviewCards() {
  const { metrics, isLoading, isError } = useMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Failed to load metrics</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Please try refreshing the page.</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Customers',
      value: metrics.total_customers.toLocaleString(),
      delta: 12.5,
      deltaLabel: 'vs last month',
    },
    {
      title: 'Total Accounts',
      value: metrics.total_accounts.toLocaleString(),
      delta: 8.2,
      deltaLabel: 'vs last month',
    },
    {
      title: 'Transactions (24h)',
      value: metrics.transactions_last_24h.toLocaleString(),
      delta: 5.1,
      deltaLabel: 'vs yesterday',
    },
    {
      title: 'Flagged Transactions',
      value: metrics.flagged_transactions.toLocaleString(),
      delta: -8.2,
      deltaLabel: 'vs last month',
    },
    {
      title: 'Unresolved Alerts',
      value: metrics.unresolved_alerts.toLocaleString(),
      delta: -15.3,
      deltaLabel: 'vs last month',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <MetricCard
          key={index}
          title={card.title}
          value={card.value}
          delta={card.delta}
          deltaLabel={card.deltaLabel}
        />
      ))}
    </div>
  );
}
