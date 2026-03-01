import axios from 'axios';
import type {
  LoginResponse,
  AdminUser,
  UserListResponse,
  UserDetail,
  OverviewStats,
  RetentionStats,
  UserGrowthStats,
  RecentSignup,
  AuditLogsResponse,
  SubscriptionPlan,
  Subscription,
  UserSubscriptionStatus,
  SubscriptionStats,
  FinancialOverview,
  RevenueBreakdown,
  DailyRevenue,
  MonthlyRevenue,
  TransactionsResponse,
  Transaction,
} from '../types';

const API_BASE_URL = 'http://256ai.xyz';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const adminApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/admin/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async (): Promise<AdminUser> => {
    const response = await api.get<AdminUser>('/admin/auth/me');
    return response.data;
  },
};

// User management endpoints
export const usersApi = {
  list: async (params: {
    query?: string;
    auth_provider?: string;
    page?: number;
    per_page?: number;
  }): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>('/admin/users', { params });
    return response.data;
  },

  getDetail: async (userId: number): Promise<UserDetail> => {
    const response = await api.get<UserDetail>(`/admin/users/${userId}`);
    return response.data;
  },

  update: async (
    userId: number,
    data: { name?: string; email?: string; language?: string; preferred_tone?: string }
  ): Promise<{ message: string; changes: Record<string, unknown> }> => {
    const response = await api.patch(`/admin/users/${userId}`, data);
    return response.data;
  },

  delete: async (userId: number): Promise<{ message: string }> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  grantPremium: async (
    userId: number,
    data: { duration_days: number; reason?: string }
  ): Promise<{ message: string; user_id: number }> => {
    const response = await api.post(`/admin/users/${userId}/grant-premium`, data);
    return response.data;
  },
};

// Stats endpoints
export const statsApi = {
  getOverview: async (): Promise<OverviewStats> => {
    const response = await api.get<OverviewStats>('/admin/stats/overview');
    return response.data;
  },

  getUserGrowth: async (days: number = 30): Promise<UserGrowthStats> => {
    const response = await api.get<UserGrowthStats>('/admin/stats/users', {
      params: { days },
    });
    return response.data;
  },

  getRetention: async (): Promise<RetentionStats> => {
    const response = await api.get<RetentionStats>('/admin/stats/retention');
    return response.data;
  },

  getRecentSignups: async (limit: number = 10): Promise<{ recent_signups: RecentSignup[] }> => {
    const response = await api.get<{ recent_signups: RecentSignup[] }>(
      '/admin/stats/recent-signups',
      { params: { limit } }
    );
    return response.data;
  },
};

// Audit logs endpoint
export const auditApi = {
  getLogs: async (params: {
    page?: number;
    per_page?: number;
    admin_id?: number;
    action?: string;
  }): Promise<AuditLogsResponse> => {
    const response = await api.get<AuditLogsResponse>('/admin/audit-logs', { params });
    return response.data;
  },
};

// Subscription management endpoints
export const subscriptionApi = {
  // Plans
  getPlans: async (includeInactive: boolean = false): Promise<{ plans: SubscriptionPlan[] }> => {
    const response = await api.get<{ plans: SubscriptionPlan[] }>('/admin/subscriptions/plans', {
      params: { include_inactive: includeInactive },
    });
    return response.data;
  },

  createPlan: async (data: {
    name: string;
    duration_days: number;
    price?: number;
    description?: string;
  }): Promise<{ message: string; plan: SubscriptionPlan }> => {
    const response = await api.post('/admin/subscriptions/plans', data);
    return response.data;
  },

  updatePlan: async (
    planId: number,
    data: {
      name?: string;
      duration_days?: number;
      price?: number;
      description?: string;
      is_active?: boolean;
    }
  ): Promise<{ message: string; plan: SubscriptionPlan }> => {
    const response = await api.patch(`/admin/subscriptions/plans/${planId}`, data);
    return response.data;
  },

  seedDefaultPlans: async (): Promise<{ message: string; plans: SubscriptionPlan[] }> => {
    const response = await api.post('/admin/subscriptions/seed-plans');
    return response.data;
  },

  // User subscriptions
  getUserSubscription: async (userId: number): Promise<UserSubscriptionStatus> => {
    const response = await api.get<UserSubscriptionStatus>(`/admin/users/${userId}/subscription`);
    return response.data;
  },

  grantSubscription: async (
    userId: number,
    data: {
      plan_id?: number;
      duration_days?: number;
      reason?: string;
      notes?: string;
      entitlements?: string[];
    }
  ): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.post(`/admin/users/${userId}/subscription`, data);
    return response.data;
  },

  getEntitlements: async (): Promise<{ entitlements: Array<{ id: string; name: string; description: string }> }> => {
    const response = await api.get('/admin/subscriptions/entitlements');
    return response.data;
  },

  cancelSubscription: async (
    subscriptionId: number,
    reason?: string
  ): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.delete(`/admin/subscriptions/${subscriptionId}`, {
      data: { reason },
    });
    return response.data;
  },

  refundSubscription: async (
    subscriptionId: number,
    reason?: string
  ): Promise<{ message: string; subscription: Subscription }> => {
    const response = await api.post(`/admin/subscriptions/${subscriptionId}/refund`, {
      reason,
    });
    return response.data;
  },

  // Stats
  getStats: async (): Promise<SubscriptionStats> => {
    const response = await api.get<SubscriptionStats>('/admin/stats/subscriptions');
    return response.data;
  },
};

// System Monitoring endpoints
export const systemApi = {
  getHealth: async (): Promise<{
    services: Array<{
      service: string;
      status: 'healthy' | 'down' | 'recovered' | 'critical' | 'unknown';
      message: string;
      last_check: string;
      response_time_ms?: number;
    }>;
    history?: Array<{
      id: number;
      service: string;
      status: string;
      message: string;
      last_check: string;
    }>;
  }> => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  getLaunchHealth: async (): Promise<{
    latency: {
      p50_ms: number;
      p95_ms: number;
      p99_ms: number;
      status: 'green' | 'yellow' | 'red';
    };
    errors: {
      rate_percent: number;
      count_24h: number;
      total_requests_24h: number;
      status: 'green' | 'yellow' | 'red';
    };
    rate_limits: {
      count_1h: number;
      status: 'green' | 'yellow' | 'red';
    };
    scheduler: {
      jobs: Array<{
        job: string;
        status: string;
        last_run: string | null;
      }>;
      readings: {
        daily: { generated: number; total: number };
        weekly: { generated: number; total: number };
      };
      failures: number;
      status: 'green' | 'yellow' | 'red';
    };
    timestamp: string;
  }> => {
    const response = await api.get('/admin/launch-health');
    return response.data;
  },

  getRequestLogs: async (params: {
    filter?: 'all' | 'success' | 'error';
    limit?: number;
  }): Promise<{
    logs: Array<{
      id: number;
      timestamp: string;
      endpoint: string;
      method: string;
      status_code: number;
      response_time_ms: number;
      user_id?: number;
      error_message?: string;
    }>;
  }> => {
    const response = await api.get('/admin/system/request-logs', { params });
    return response.data;
  },

  getMetrics: async (): Promise<{
    total_requests_24h: number;
    successful_requests_24h: number;
    failed_requests_24h: number;
    avg_response_time_ms: number;
    response_times?: Array<{
      timestamp: string;
      avg_ms: number;
    }>;
  }> => {
    const response = await api.get('/admin/system/metrics');
    return response.data;
  },
};

// Financial/Revenue endpoints (kept for backwards compatibility)
export const financialApi = {
  getOverview: async (): Promise<FinancialOverview> => {
    const response = await api.get<FinancialOverview>('/admin/financials/overview');
    return response.data;
  },

  getRevenueBySource: async (): Promise<{ breakdown: RevenueBreakdown[] }> => {
    const response = await api.get('/admin/financials/revenue-by-source');
    return response.data;
  },

  getRevenueByPlan: async (): Promise<{ breakdown: RevenueBreakdown[] }> => {
    const response = await api.get('/admin/financials/revenue-by-plan');
    return response.data;
  },

  getRevenueByType: async (): Promise<{ breakdown: RevenueBreakdown[] }> => {
    const response = await api.get('/admin/financials/revenue-by-type');
    return response.data;
  },

  getRevenueOverTime: async (days: number = 30): Promise<{ data: DailyRevenue[] }> => {
    const response = await api.get('/admin/financials/revenue-over-time', {
      params: { days },
    });
    return response.data;
  },

  getMonthlyRevenue: async (months: number = 12): Promise<{ data: MonthlyRevenue[] }> => {
    const response = await api.get('/admin/financials/monthly-revenue', {
      params: { months },
    });
    return response.data;
  },

  getTransactions: async (params: {
    page?: number;
    per_page?: number;
    user_id?: number;
    transaction_type?: string;
    source?: string;
    status?: string;
  }): Promise<TransactionsResponse> => {
    const response = await api.get<TransactionsResponse>('/admin/financials/transactions', { params });
    return response.data;
  },

  getRecentTransactions: async (limit: number = 10): Promise<{ transactions: Transaction[] }> => {
    const response = await api.get('/admin/financials/recent-transactions', {
      params: { limit },
    });
    return response.data;
  },
};

export default api;
