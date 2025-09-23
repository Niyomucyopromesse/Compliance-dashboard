/**
 * Utility functions for customer-related operations
 */

/**
 * Maps customer segment codes to their display names
 * @param segment - The segment code (string or number)
 * @returns The display name for the segment
 */
export function getCustomerSegmentName(segment?: string | number): string {
  if (!segment) return 'N/A';
  const segmentStr = String(segment);
  switch (segmentStr) {
    case '1': return 'Retail';
    case '2': return 'SME';
    case '3': return 'Agriculture';
    case '4': return 'Corporate';
    case '5': return 'Institutional Banking';
    default: return segmentStr;
  }
}

/**
 * Maps account category codes to their display names
 * @param category - The category code (string or number)
 * @returns The display name for the account type
 */
export function getAccountTypeName(category?: string | number): string {
  if (!category) return 'Unknown';
  const categoryStr = String(category);
  if (categoryStr.startsWith('1')) return 'Current Account';
  if (categoryStr.startsWith('3')) return 'Loan';
  if (categoryStr.startsWith('6')) return 'Savings Account';
  return 'Other';
}
