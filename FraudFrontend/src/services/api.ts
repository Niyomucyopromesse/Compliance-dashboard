import { 
  GetOverviewResponse,
  GetTransactionsResponse,
  GetTransactionsChartResponse,
  GetRiskDistributionResponse,
  GetCustomersResponse,
  GetCustomerResponse,
  GetAccountsResponse,
  GetAccountResponse,
  GetAlertsResponse,
  GetAlertResponse,
  AcknowledgeAlertRequest,
  EscalateAlertRequest,
  UpdateAlertStatusRequest,
  FreezeAccountRequest,
  UnfreezeAccountRequest,
} from '@/types/api';
import { GetTransactionsParams as TransactionParams, GetCustomersParams as CustomerParams, GetAccountsParams as AccountParams, GetAlertsParams as AlertParams } from '@/types';
import { API_ENDPOINTS, ERROR_MESSAGES } from '@/utils/constants';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://127.0.0.1:8000') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('fraud_dashboard_auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('fraud_dashboard_auth_token', token);
    } else {
      localStorage.removeItem('fraud_dashboard_auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || ERROR_MESSAGES.SERVER_ERROR) as any;
        error.code = errorData.code || 'API_ERROR';
        error.details = errorData.details;
        error.timestamp = new Date().toISOString();
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      if (error.code) {
        throw error;
      }
      const networkError = new Error(ERROR_MESSAGES.NETWORK_ERROR) as any;
      networkError.code = 'NETWORK_ERROR';
      networkError.details = { originalError: error };
      networkError.timestamp = new Date().toISOString();
      throw networkError;
    }
  }

  // Overview endpoints
  async getOverview(): Promise<GetOverviewResponse> {
    return this.request<GetOverviewResponse>(API_ENDPOINTS.overview);
  }

  // Transaction endpoints
  async getTransactions(params: TransactionParams = {}): Promise<GetTransactionsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.transactions}?${queryString}` : API_ENDPOINTS.transactions;
    return this.request<GetTransactionsResponse>(endpoint);
  }

  async getTransactionsChart(params: { 
    period?: string; 
    granularity?: string; 
    filters?: Record<string, any> 
  } = {}): Promise<GetTransactionsChartResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.transactionsChart}?${queryString}` : API_ENDPOINTS.transactionsChart;
    return this.request<GetTransactionsChartResponse>(endpoint);
  }

  async getTransactionsChartDay30Min(): Promise<GetTransactionsChartResponse> {
    return this.request<GetTransactionsChartResponse>(API_ENDPOINTS.transactionsChartDay30Min);
  }

  async getTransactionsChartWeek8Hour(): Promise<GetTransactionsChartResponse> {
    return this.request<GetTransactionsChartResponse>(API_ENDPOINTS.transactionsChartWeek8Hour);
  }

  async getTransactionsChartMonthDay(): Promise<GetTransactionsChartResponse> {
    return this.request<GetTransactionsChartResponse>(API_ENDPOINTS.transactionsChartMonthDay);
  }

  async getTransactionsChart3Months2Day(): Promise<GetTransactionsChartResponse> {
    return this.request<GetTransactionsChartResponse>(API_ENDPOINTS.transactionsChart3Months2Day);
  }

  async getTransactionsChartYearDay(): Promise<GetTransactionsChartResponse> {
    return this.request<GetTransactionsChartResponse>(API_ENDPOINTS.transactionsChartYearDay);
  }

  async getRiskDistribution(): Promise<GetRiskDistributionResponse> {
    return this.request<GetRiskDistributionResponse>(API_ENDPOINTS.riskDistribution);
  }

  // Customer endpoints
  async getCustomers(params: CustomerParams = {}): Promise<GetCustomersResponse> {
    const searchParams = new URLSearchParams();
    
    // Map frontend parameter names to backend parameter names
    const paramMapping: Record<string, string> = {
      pageSize: 'page_size',
      sortBy: 'sort_by',
      sortOrder: 'sort_order',
      riskLevel: 'risk_level'
    };
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const backendKey = paramMapping[key] || key;
        searchParams.append(backendKey, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.customers}?${queryString}` : API_ENDPOINTS.customers;
    return this.request<GetCustomersResponse>(endpoint);
  }

  async getCustomer(id: string): Promise<GetCustomerResponse> {
    return this.request<GetCustomerResponse>(API_ENDPOINTS.customer(id));
  }

  // Account endpoints
  async getAccounts(params: AccountParams = {}): Promise<GetAccountsResponse> {
    const searchParams = new URLSearchParams();
    
    // Map frontend parameter names to backend parameter names
    const paramMapping: Record<string, string> = {
      pageSize: 'page_size',
      sortBy: 'sort_by',
      sortOrder: 'sort_order',
      customerId: 'customer_id',
      accountType: 'account_type',
      riskLevel: 'risk_level'
    };
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const backendKey = paramMapping[key] || key;
        searchParams.append(backendKey, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.accounts}?${queryString}` : API_ENDPOINTS.accounts;
    return this.request<GetAccountsResponse>(endpoint);
  }

  async getAccount(id: string): Promise<GetAccountResponse> {
    return this.request<GetAccountResponse>(API_ENDPOINTS.account(id));
  }

  async getAccountRecentTransactions(accountId: string): Promise<{ success: boolean; data: any[]; message: string }> {
    return this.request<{ success: boolean; data: any[]; message: string }>(`/api/v1/accounts/${accountId}/transactions/recent`);
  }

  // Alert endpoints
  async getAlerts(params: AlertParams = {}): Promise<GetAlertsResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `${API_ENDPOINTS.alerts}?${queryString}` : API_ENDPOINTS.alerts;
    return this.request<GetAlertsResponse>(endpoint);
  }

  async getAlert(id: string): Promise<GetAlertResponse> {
    return this.request<GetAlertResponse>(API_ENDPOINTS.alert(id));
  }

  async getAlertsOverview(params?: {
    severity?: string;
    status?: string;
    alert_type?: string;
    assigned_to?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<{ success: boolean; data: { total: number; severity_count: Record<string, number> }; message?: string }> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value);
        }
      });
    }
    
    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/v1/alerts/overview?${queryString}` : '/api/v1/alerts/overview';
    return this.request<{ success: boolean; data: { total: number; severity_count: Record<string, number> }; message?: string }>(endpoint);
  }

  async acknowledgeAlert(request: AcknowledgeAlertRequest): Promise<void> {
    await this.request<void>(API_ENDPOINTS.acknowledgeAlert(request.alertId), {
      method: 'POST',
      body: JSON.stringify({ notes: request.notes }),
    });
  }

  async escalateAlert(request: EscalateAlertRequest): Promise<void> {
    await this.request<void>(API_ENDPOINTS.escalateAlert(request.alertId), {
      method: 'POST',
      body: JSON.stringify({
        assignedTo: request.assignedTo,
        priority: request.priority,
        notes: request.notes,
      }),
    });
  }

  async updateAlertStatus(request: UpdateAlertStatusRequest): Promise<void> {
    await this.request<void>(API_ENDPOINTS.alert(request.alertId), {
      method: 'PATCH',
      body: JSON.stringify({
        status: request.status,
        notes: request.notes,
      }),
    });
  }

  // Account actions
  async freezeAccount(request: FreezeAccountRequest): Promise<void> {
    await this.request<void>(API_ENDPOINTS.freezeAccount(request.accountId), {
      method: 'POST',
      body: JSON.stringify({
        reason: request.reason,
        duration: request.duration,
      }),
    });
  }

  async unfreezeAccount(request: UnfreezeAccountRequest): Promise<void> {
    await this.request<void>(API_ENDPOINTS.unfreezeAccount(request.accountId), {
      method: 'POST',
      body: JSON.stringify({ reason: request.reason }),
    });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience
export const {
  getOverview,
  getTransactions,
  getTransactionsChart,
  getTransactionsChartDay30Min,
  getTransactionsChartWeek8Hour,
  getTransactionsChartMonthDay,
  getTransactionsChart3Months2Day,
  getTransactionsChartYearDay,
  getRiskDistribution,
  getCustomers,
  getCustomer,
  getAccounts,
  getAccount,
  getAlerts,
  getAlert,
  getAlertsOverview,
  acknowledgeAlert,
  escalateAlert,
  updateAlertStatus,
  freezeAccount,
  unfreezeAccount,
} = apiClient;
