// Simple API client for the fraud detection system (uses .env: VITE_API_BASE_URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

function getAuthHeaders(): Record<string, string> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('fraud_dashboard_auth_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const headers = { ...getAuthHeaders(), ...(options.headers as Record<string, string>) };
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: { id: string; name: string; email: string; role: string; permissions: string[] };
}

// API endpoints
export const api = {
  getBaseURL: () => API_BASE_URL,

  // Auth (AD/LDAP + JWT 8h)
  login: (username: string, password: string): Promise<LoginResponse> =>
    fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail || 'Login failed');
      return data as LoginResponse;
    }),

  // Compliance Register
  getComplianceStats: () => fetchAPI('/api/v1/compliance/stats'),
  /** Single call: departments + statuses + first page. Use for initial load to reduce latency. */
  getComplianceInitial: (limit = 1000, offset = 0, department?: string, status?: string) => {
    let url = `/api/v1/compliance/initial?limit=${limit}&offset=${offset}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    return fetchAPI(url) as Promise<{
      success: boolean;
      departments: string[];
      statuses: string[];
      records: { data: any[]; total: number; limit: number; offset: number };
    }>;
  },
  getComplianceDepartments: (): Promise<{ success: boolean; data: string[] }> =>
    fetchAPI('/api/v1/compliance/departments'),
  getComplianceStatuses: (): Promise<{ success: boolean; data: string[] }> =>
    fetchAPI('/api/v1/compliance/statuses'),
  getComplianceRecords: (limit = 1000, offset = 0, department?: string, status?: string) => {
    let url = `/api/v1/compliance/records?limit=${limit}&offset=${offset}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    return fetchAPI(url);
  },
  updateComplianceRecord: (id: number, data: any) =>
    fetch(`${API_BASE_URL}/api/v1/compliance/records/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  createComplianceRecord: (data: any) =>
    fetch(`${API_BASE_URL}/api/v1/compliance/records`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getComplianceOwners: () => fetchAPI('/api/v1/compliance/owners'),
  sendComplianceEmail: (payload: {
    to_email: string;
    subject?: string;
    body?: string;
    automated: boolean;
  }) =>
    fetch(`${API_BASE_URL}/api/v1/compliance/send-email`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then((r) => r.json()),

  /** Notify all given owner emails with the same subject/body (e.g. filtered table owners). */
  notifyComplianceOwners: (payload: { to_emails: string[]; subject: string; body?: string }) =>
    fetch(`${API_BASE_URL}/api/v1/compliance/notify-owners`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    }).then((r) => r.json()) as Promise<{ success: boolean; message: string; sent: number; failed: number; errors?: string[] }>,

  defaults: {
    baseURL: API_BASE_URL,
  },
};

// Create a singleton instance for compatibility
export const apiClient = api;
