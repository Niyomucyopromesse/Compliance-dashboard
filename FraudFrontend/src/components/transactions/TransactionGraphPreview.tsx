import React from 'react';
import { EmptyState } from '@/components/common/EmptyState';

interface TransactionGraphPreviewProps {
  transactionId: string;
}

export function TransactionGraphPreview({ transactionId }: TransactionGraphPreviewProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Transaction Graph</h2>
      
      <EmptyState
        title="Graph Preview"
        description="Transaction relationship graph will be displayed here."
      />
    </div>
  );
}
