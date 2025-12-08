// Simple API client for the fraud detection system
const API_BASE_URL = 'http://127.0.0.1:8000';

// Helper function to make API calls
async function fetchAPI(endpoint: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// API endpoints
export const api = {
  // Health check
  health: () => fetchAPI('/health'),
  
  // Metrics
  getMetrics: () => fetchAPI('/api/v1/metrics'),
  
  // Transactions
  getTransactions: (limit = 10) => fetchAPI(`/api/v1/transactions?limit=${limit}`),
  getTransaction: (id: string) => fetchAPI(`/api/v1/transactions/${id}`),
  
  // Customers
  getCustomers: (limit = 10) => fetchAPI(`/api/v1/customers?limit=${limit}`),
  getCustomer: (id: string) => fetchAPI(`/api/v1/customers/${id}`),
  
  // Alerts
  getAlerts: (limit = 10) => fetchAPI(`/api/v1/alerts?limit=${limit}`),
  getAlert: (id: string) => fetchAPI(`/api/v1/alerts/${id}`),
  
  // Accounts
  getAccounts: () => fetchAPI('/api/v1/accounts'),
  
  // Test data generation
  generateTransaction: () => fetch(`${API_BASE_URL}/api/v1/test/generate-transaction`, { method: 'POST' }).then(r => r.json()),
  generateAlert: () => fetch(`${API_BASE_URL}/api/v1/test/generate-alert`, { method: 'POST' }).then(r => r.json()),
  resetData: () => fetch(`${API_BASE_URL}/api/v1/test/reset-data`, { method: 'POST' }).then(r => r.json()),
  
  // Compliance Register
  getComplianceStats: () => fetchAPI('/api/v1/compliance/stats'),
  getComplianceRecords: (limit = 1000, offset = 0, department?: string, status?: string) => {
    let url = `/api/v1/compliance/records?limit=${limit}&offset=${offset}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    return fetchAPI(url);
  },
  updateComplianceRecord: (id: number, data: any) => 
    fetch(`${API_BASE_URL}/api/v1/compliance/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  createComplianceRecord: (data: any) =>
    fetch(`${API_BASE_URL}/api/v1/compliance/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),
  
  defaults: {
    baseURL: API_BASE_URL
  }
};

// Create a singleton instance for compatibility
export const apiClient = api;
