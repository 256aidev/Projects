export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
  last_login: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string | null;
  auth_provider: string;
  email_verified: boolean;
  language: string;
  preferred_tone: string;
  created_at: string | null;
  last_login: string | null;
  birth_date?: string;
  birth_time?: string;
  birth_location?: string;
  year_pillar?: string;
  month_pillar?: string;
  day_pillar?: string;
  hour_pillar?: string;
  day_master?: string;
  day_master_element?: string;
  day_master_polarity?: string;
  year_ten_god?: string;
  month_ten_god?: string;
  hour_ten_god?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DailyReading {
  id: number;
  date: string;
  daily_pillar: string | null;
  generation_method: string | null;
}

export interface WeeklyReading {
  id: number;
  week_start: string;
  llm_provider: string | null;
}

export interface UserDetail {
  user: User;
  stats: {
    total_daily_readings: number;
    total_weekly_readings: number;
  };
  recent_daily_readings: DailyReading[];
  recent_weekly_readings: WeeklyReading[];
}

export interface OverviewStats {
  total_users: number;
  users_today: number;
  users_this_week: number;
  users_this_month: number;
  active_users_7d: number;
  total_daily_readings: number;
  total_weekly_readings: number;
  readings_today: number;
}

export interface RetentionStats {
  dau: number;
  wau: number;
  mau: number;
  dau_mau_ratio: number;
}

export interface UserGrowthData {
  date: string;
  signups: number;
}

export interface AuthProviderData {
  provider: string;
  count: number;
  percentage: number;
}

export interface DayMasterData {
  element: string;
  count: number;
  percentage: number;
}

export interface UserGrowthStats {
  user_growth: UserGrowthData[];
  auth_providers: AuthProviderData[];
  day_master_distribution: DayMasterData[];
}

export interface RecentSignup {
  id: number;
  name: string;
  email: string | null;
  auth_provider: string;
  created_at: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  admin: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface AuditLog {
  id: number;
  admin_id: number;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  timestamp: string | null;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Subscription types
export interface SubscriptionPlan {
  id: number;
  name: string;
  duration_days: number;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number | null;
  plan_name: string | null;
  starts_at: string | null;
  expires_at: string | null;
  status: string;
  source: string;
  amount_paid: number;
  currency: string;
  payment_provider: string | null;
  transaction_id: string | null;
  granted_by_admin_id: number | null;
  grant_reason: string | null;
  notes: string | null;
  is_active: boolean;
  days_remaining: number;
  created_at: string | null;
  entitlements: string[];
}

export interface Entitlement {
  id: string;
  name: string;
  description: string;
}

export interface UserSubscriptionStatus {
  is_premium: boolean;
  active_subscription: Subscription | null;
  days_remaining: number;
  expires_at: string | null;
  total_subscriptions: number;
  history: Subscription[];
  // Granular entitlements
  entitlements: string[];
  has_future_7_day: boolean;
  has_weekly_forecast: boolean;
  has_monthly_forecast: boolean;
  has_yearly_forecast: boolean;
  has_remove_ads: boolean;
  has_screenshot_mode: boolean;
  has_premium_annual: boolean;
}

export interface SubscriptionStats {
  active_subscriptions: number;
  total_revenue: number;
  by_source: Record<string, number>;
  by_plan: Record<string, number>;
  recent_admin_grants: number;
  expiring_in_7_days: number;
}

// Financial types
export interface FinancialOverview {
  total_revenue: number;
  revenue_today: number;
  revenue_week: number;
  revenue_month: number;
  revenue_year: number;
  total_transactions: number;
  transactions_today: number;
  total_refunds: number;
  net_revenue: number;
}

export interface RevenueBreakdown {
  source?: string;
  plan?: string;
  type?: string;
  total: number;
  count: number;
  percentage?: number;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

export interface MonthlyRevenue {
  month: string;
  month_name: string;
  revenue: number;
  transactions: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  amount: number;
  currency: string;
  transaction_type: string;
  source: string;
  product_id: string | null;
  plan_id: number | null;
  plan_name: string | null;
  subscription_id: number | null;
  external_transaction_id: string | null;
  status: string;
  admin_id: number | null;
  admin_name: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
