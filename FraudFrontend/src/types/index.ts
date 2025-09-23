export type RiskLabel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Unknown';

export type Transaction = {
  transaction_id: string;
  processing_date: string;
  value_date?: string;
  transaction_time?: string;
  credit_account?: string;
  debit_account?: string;
  credit_amount?: number;
  debit_amount?: number;
  transaction_type: string;
  payment_details?: string;
  local_charge_amt?: number;
  risk_score?: number;
  risk_label?: RiskLabel;
  alert_id?: string;
  meta?: Record<string, any>;
  status?: 'pending' | 'completed' | 'failed' | 'flagged';
};

export type Customer = {
  customer_id: string;
  full_name: string;
  email: string;
  phone?: string;
  residence?: string;
  risk_class?: string;
  status?: string;
  customer_since?: string;
  kyc_complete?: string;
  aml_result?: string;
  account_officer?: string;
  dob?: string;
  gender?: string;
  industry?: string;
  language?: string;
  last_updated_date?: string;
  marital_status?: string;
  nationality?: string;
  next_of_kin_name?: string;
  segment?: string;
  spouse_name?: string;
  target?: string;
  title?: string;
  accounts?: Account[];
};

export type Account = {
  account_id: string;
  account_officer?: string;
  account_title_1?: string;
  category?: string;
  currency?: string;
  customer_id?: string;
  last_updated_date?: string;
  limit_ref?: string;
  opening_date?: string;
  position_type?: string;
  short_title?: string;
  working_balance?: number;
  customer?: Customer;
  transactions?: Transaction[];
};

export type Alert = {
  alert_id: string;
  alert_type: string;
  severity: string;
  status: string;
  description: string;
  risk_score: number;
  transaction_id?: string;
  account_id?: string;
  customer_id?: string;
  amount?: number;
  timestamp: string;
  // Additional fields for UI
  assigned_to?: string;
  notes?: string;
};

export type OverviewMetrics = {
  total_transactions: number;
  flagged_transactions: number;
  total_customers: number;
  total_accounts: number;
  transactions_last_24h: number;
  high_risk_customers: number;
  total_alerts: number;
  unresolved_alerts: number;
  total_amount: number;
  flagged_amount: number;
  fraud_rate: number;
  detection_rate: number;
};

export type TimeSeriesPoint = {
  timestamp: string; // ISO string from backend
  value: number;
  label?: string;
  channel?: string;
  total_amount?: number;
  avg_amount?: number;
};

export type RiskBucket = {
  label: RiskLabel;
  count: number;
  percentage: number;
  color: string;
};

export type ChartData = {
  name: string;
  value: number;
  color?: string;
};

export type ChartSettings = {
  width?: number;
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  animation?: boolean;
};

export type ColumnDef = {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
};

export type QueryParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
};

export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type WebSocketMessage = {
  type: 'alert' | 'transaction' | 'status';
  data: any;
  timestamp: string;
};

export type FilterState = {
  riskLevels: RiskLabel[];
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: number;
    max: number;
  };
  status: string[];
  alertTypes: string[];
};

export type UIState = {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
};

export type AuthState = {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'analyst' | 'viewer';
    permissions: string[];
  } | null;
  token: string | null;
};

// API parameter types
export type GetTransactionsParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
  customerId?: string;
  accountId?: string;
  riskLevel?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
};

export type GetCustomersParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
  riskLevel?: string;
  status?: string;
};

export type GetAccountsParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
  customerId?: string;
  accountType?: string;
  riskLevel?: string;
  status?: string;
};

export type GetAlertsParams = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
  severity?: string;
  status?: string;
  alertType?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
};
