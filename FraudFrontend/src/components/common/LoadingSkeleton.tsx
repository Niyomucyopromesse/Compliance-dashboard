import { clsx } from 'clsx';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
}

export function LoadingSkeleton({
  className,
  lines = 1,
  height = 'h-4',
  width = 'w-full',
}: LoadingSkeletonProps) {
  if (lines === 1) {
    return (
      <div
        className={clsx(
          'animate-pulse bg-gray-200 rounded',
          height,
          width,
          className
        )}
      />
    );
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'animate-pulse bg-gray-200 rounded',
            height,
            width
          )}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton
              key={colIndex}
              className="flex-1"
              height="h-4"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="space-y-4">
        <LoadingSkeleton height="h-4" width="w-1/2" />
        <LoadingSkeleton height="h-8" width="w-3/4" />
        <LoadingSkeleton height="h-3" width="w-1/3" />
      </div>
    </div>
  );
}
