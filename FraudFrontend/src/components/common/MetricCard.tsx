import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Sparkline } from './Sparkline';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: number | string;
  delta?: number;
  deltaLabel?: string;
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  delta,
  deltaLabel,
  sparklineData,
  onClick,
  className,
  loading = false,
}: MetricCardProps) {
  const getDeltaIcon = () => {
    if (delta === undefined || delta === 0) return <Minus className="w-4 h-4" />;
    return delta > 0 ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getDeltaColor = () => {
    if (delta === undefined || delta === 0) return 'text-slate-400';
    return delta > 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  const getDeltaBgColor = () => {
    if (delta === undefined || delta === 0) return 'bg-slate-700/60';
    return delta > 0 ? 'bg-emerald-500/15' : 'bg-rose-500/15';
  };

  if (loading) {
    return (
      <div className={clsx(
        'bg-slate-900/70 rounded-xl border border-slate-800 p-6 shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-slate-800 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-slate-800 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'bg-slate-900/70 rounded-xl border border-slate-800 p-6 shadow-sm',
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-16 h-8">
            <Sparkline data={sparklineData} />
          </div>
        )}
      </div>
      
      <div className="mt-2">
        <p className="text-2xl font-semibold text-slate-100">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        
        {delta !== undefined && (
          <div className="mt-2 flex items-center">
            <div className={clsx(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              getDeltaBgColor(),
              getDeltaColor()
            )}>
              {getDeltaIcon()}
              <span className="ml-1">
                {Math.abs(delta).toFixed(1)}%
              </span>
            </div>
            {deltaLabel && (
              <span className="ml-2 text-sm text-slate-400">
                {deltaLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
