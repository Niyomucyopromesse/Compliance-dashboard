import { RiskLabel } from '@/types';

export const RISK_COLORS: Record<RiskLabel, string> = {
  Critical: '#dc2626', // red-600
  High: '#ea580c',     // orange-600
  Medium: '#d97706',   // amber-600
  Low: '#16a34a',      // green-600
  Unknown: '#6b7280',  // gray-500
};

export const RISK_BG_COLORS: Record<RiskLabel, string> = {
  Critical: '#fef2f2', // red-50
  High: '#fff7ed',     // orange-50
  Medium: '#fffbeb',   // amber-50
  Low: '#f0fdf4',      // green-50
  Unknown: '#f9fafb',  // gray-50
};

export const STATUS_COLORS = {
  active: '#16a34a',     // green-600
  suspended: '#d97706',  // amber-600
  closed: '#6b7280',     // gray-500
  pending: '#3b82f6',    // blue-600
  completed: '#16a34a',  // green-600
  failed: '#dc2626',     // red-600
  flagged: '#ea580c',    // orange-600
  new: '#3b82f6',        // blue-600
  acknowledged: '#16a34a', // green-600
  investigating: '#d97706', // amber-600
  resolved: '#16a34a',   // green-600
  false_positive: '#6b7280', // gray-500
};

export const ALERT_TYPES = {
  suspicious_transaction: 'Suspicious Transaction',
  unusual_pattern: 'Unusual Pattern',
  high_risk_customer: 'High Risk Customer',
  account_anomaly: 'Account Anomaly',
  STAFF_FRAUD: 'Staff Fraud',
  STAFF_EXTERNAL_CREDIT: 'Staff External Credit',
  STAFF_INTERNAL_CREDIT: 'Staff Internal Credit',
} as const;

export const ACCOUNT_TYPES = {
  current: 'Current Account',
  savings: 'Savings Account',
  loan: 'Loan Account',
  credit: 'Credit Account',
} as const;

export const TRANSACTION_TYPES = {
  transfer: 'Transfer',
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  payment: 'Payment',
  refund: 'Refund',
  fee: 'Fee',
} as const;

export const CURRENCIES = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
} as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100,
} as const;

export const REFRESH_INTERVALS = {
  realtime: 1000,    // 1 second
  fast: 5000,        // 5 seconds
  normal: 30000,     // 30 seconds
  slow: 60000,       // 1 minute
  manual: 0,         // manual only
} as const;

export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
];

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const API_ENDPOINTS = {
  // Overview
  overview: '/api/v1/metrics/overview',
  
  // Transactions
  transactions: '/api/v1/transactions',
  transactionsChart: '/api/v1/metrics/transactions-chart',
  transactionsChartDay30Min: '/api/v1/metrics/transactions-chart/day-30min',
  transactionsChartWeek8Hour: '/api/v1/metrics/transactions-chart/week-8hour',
  transactionsChartMonthDay: '/api/v1/metrics/transactions-chart/month-day',
  transactionsChart3Months2Day: '/api/v1/metrics/transactions-chart/3months-2day',
  transactionsChartYearDay: '/api/v1/metrics/transactions-chart/year-day',
  
  // Metrics
  riskDistribution: '/api/v1/metrics/risk-distribution',
  
  // Customers
  customers: '/api/v1/customers',
  customer: (id: string) => `/api/v1/customers/${id}`,
  
  // Accounts
  accounts: '/api/v1/accounts',
  account: (id: string) => `/api/v1/accounts/${id}`,
  
  // Alerts
  alerts: '/api/v1/alerts',
  alert: (id: string) => `/api/v1/alerts/${id}`,
  acknowledgeAlert: (id: string) => `/api/v1/alerts/${id}/acknowledge`,
  escalateAlert: (id: string) => `/api/v1/alerts/${id}/escalate`,
  
  // Actions
  freezeAccount: (id: string) => `/api/v1/accounts/${id}/freeze`,
  unfreezeAccount: (id: string) => `/api/v1/accounts/${id}/unfreeze`,
} as const;

export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ALERT_NEW: 'alert:new',
  ALERT_UPDATED: 'alert:updated',
  TRANSACTION_FLAGGED: 'transaction:flagged',
  CUSTOMER_RISK_UPDATED: 'customer:risk_updated',
  SYSTEM_STATUS: 'system:status',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'fraud_dashboard_auth_token',
  USER_PREFERENCES: 'fraud_dashboard_user_preferences',
  FILTER_STATE: 'fraud_dashboard_filter_state',
  UI_STATE: 'fraud_dashboard_ui_state',
} as const;

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  ACCOUNT_NUMBER_REGEX: /^[A-Z0-9]{8,20}$/,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
  TIMEOUT: 'Request timed out. Please try again.',
} as const;
