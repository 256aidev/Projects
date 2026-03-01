/**
 * Subscription API
 * Endpoints for checking backend subscription status (admin-granted premium)
 */

import { apiClient } from './client';

// Backend subscription status response
export interface BackendSubscriptionStatus {
  is_premium: boolean;
  active_subscription: {
    id: number;
    plan_name: string | null;
    starts_at: string | null;
    expires_at: string | null;
    status: string;
    source: string;
    days_remaining: number;
    entitlements: string[];
  } | null;
  days_remaining: number;
  expires_at: string | null;
  total_subscriptions: number;
  // Granular entitlements
  entitlements: string[];
  has_future_7_day: boolean;
  has_weekly_forecast: boolean;
  has_monthly_forecast: boolean;
  has_yearly_forecast: boolean;
  has_remove_ads: boolean;
  has_premium_annual: boolean;
}

/**
 * Get the current user's subscription status from the backend
 * This checks for admin-granted premium access
 */
export async function getSubscriptionStatus(): Promise<BackendSubscriptionStatus> {
  console.log('🔄 [SubscriptionAPI] Calling /subscription/status...');
  const result = await apiClient.get<BackendSubscriptionStatus>('/subscription/status');
  console.log('🔄 [SubscriptionAPI] Response received:', JSON.stringify(result, null, 2));
  return result;
}

/**
 * Get available subscription plans (public endpoint)
 */
export async function getSubscriptionPlans(): Promise<{ plans: Array<{
  id: number;
  name: string;
  duration_days: number;
  price: number;
  description: string | null;
}> }> {
  return apiClient.get('/subscription/plans', false);
}
