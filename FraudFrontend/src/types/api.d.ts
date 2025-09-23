import { 
  Transaction, 
  Customer, 
  Account, 
  Alert, 
  OverviewMetrics, 
  TimeSeriesPoint, 
  RiskBucket,
  QueryParams,
  ApiResponse 
} from './index';

// API Endpoint Types
export interface GetOverviewResponse extends ApiResponse<OverviewMetrics> {}

export interface GetTransactionsResponse extends ApiResponse<Transaction[]> {}

export interface GetTransactionsChartResponse extends ApiResponse<TimeSeriesPoint[]> {}

export interface GetRiskDistributionResponse extends ApiResponse<RiskBucket[]> {}

export interface GetCustomersResponse extends ApiResponse<Customer[]> {}

export interface GetCustomerResponse extends ApiResponse<Customer> {}

export interface GetAccountsResponse extends ApiResponse<Account[]> {}

export interface GetAccountResponse extends ApiResponse<Account> {}

export interface GetAlertsResponse extends ApiResponse<Alert[]> {}

export interface GetAlertResponse extends ApiResponse<Alert> {}

// Request Types
export interface GetTransactionsParams extends QueryParams {
  customerId?: string;
  accountId?: string;
  riskLevel?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface GetCustomersParams extends QueryParams {
  riskLevel?: string;
  status?: string;
  search?: string;
}

export interface GetAccountsParams extends QueryParams {
  customerId?: string;
  accountType?: string;
  riskLevel?: string;
  status?: string;
}

export interface GetAlertsParams extends QueryParams {
  severity?: string;
  status?: string;
  alertType?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Action Request Types
export interface AcknowledgeAlertRequest {
  alertId: string;
  notes?: string;
}

export interface EscalateAlertRequest {
  alertId: string;
  assignedTo: string;
  priority: 'high' | 'critical';
  notes?: string;
}

export interface UpdateAlertStatusRequest {
  alertId: string;
  status: 'acknowledged' | 'investigating' | 'resolved' | 'false_positive';
  notes?: string;
}

export interface FreezeAccountRequest {
  accountId: string;
  reason: string;
  duration?: number; // hours
}

export interface UnfreezeAccountRequest {
  accountId: string;
  reason: string;
}

// WebSocket Event Types
export interface WebSocketEvents {
  'alert:new': (alert: Alert) => void;
  'alert:updated': (alert: Alert) => void;
  'transaction:flagged': (transaction: Transaction) => void;
  'customer:risk_updated': (customer: Customer) => void;
  'system:status': (status: { online: boolean; message?: string }) => void;
}

// WebSocket Message Type
export interface WebSocketMessage {
  type: 'alert' | 'transaction' | 'status' | 'connection' | 'pong' | 'subscribed' | 'unsubscribed';
  data: any;
  timestamp: string;
  channel?: string; // For subscription acknowledgment messages
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError extends ApiError {
  field: string;
  value: any;
}

// Real-time Data Types
export interface LiveTransaction {
  id: string;
  timestamp: string;
  amount: number;
  currency: string;
  from: string;
  to: string;
  risk_score: number;
  risk_label: string;
  status: string;
}

export interface LiveAlert {
  id: string;
  type: string;
  severity: string;
  description: string;
  timestamp: string;
  transaction_id?: string;
  customer_id?: string;
  account_id?: string;
}
