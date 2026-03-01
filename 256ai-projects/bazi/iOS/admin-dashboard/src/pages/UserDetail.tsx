import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, subscriptionApi } from '../api/client';
import type { SubscriptionPlan } from '../types';

// Entitlement options for the UI
const ENTITLEMENT_OPTIONS = [
  { id: 'future_7_day', name: 'Future 7-Day Readings', description: 'Access to 7-day future predictions' },
  { id: 'weekly_forecast', name: 'Weekly Forecast', description: 'Weekly horoscope forecasts' },
  { id: 'monthly_forecast', name: 'Monthly Forecast', description: 'Monthly horoscope forecasts' },
  { id: 'yearly_forecast', name: 'Yearly Forecast', description: 'Yearly horoscope forecasts' },
  { id: 'remove_ads', name: 'Remove Ads', description: 'Ad-free experience' },
  { id: 'screenshot_mode', name: 'Screenshot Mode', description: 'Dev mode - hides ads, enables dev features for testing' },
  { id: 'premium_annual', name: 'Premium (All Features)', description: 'Full access to all premium features' },
];

export function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [customDays, setCustomDays] = useState<string>('');
  const [grantReason, setGrantReason] = useState('');
  const [selectedEntitlements, setSelectedEntitlements] = useState<string[]>(['premium_annual']);

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getDetail(Number(userId)),
    enabled: !!userId,
  });

  const { data: subscriptionData, isLoading: subLoading } = useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: () => subscriptionApi.getUserSubscription(Number(userId)),
    enabled: !!userId,
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionApi.getPlans(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.delete(Number(userId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
  });

  const grantMutation = useMutation({
    mutationFn: (data: { plan_id?: number; duration_days?: number; reason?: string; entitlements?: string[] }) =>
      subscriptionApi.grantSubscription(Number(userId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', userId] });
      setShowGrantModal(false);
      setSelectedPlanId(null);
      setCustomDays('');
      setGrantReason('');
      setSelectedEntitlements(['premium_annual']);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (subscriptionId: number) =>
      subscriptionApi.cancelSubscription(subscriptionId, 'Admin cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription', userId] });
    },
  });

  const seedPlansMutation = useMutation({
    mutationFn: () => subscriptionApi.seedDefaultPlans(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    },
  });

  const handleEntitlementToggle = (entitlementId: string) => {
    setSelectedEntitlements(prev => {
      if (entitlementId === 'premium_annual') {
        // If selecting premium_annual, clear others and just use that
        return prev.includes('premium_annual') ? [] : ['premium_annual'];
      }
      // If any individual entitlement is selected, remove premium_annual
      const filtered = prev.filter(e => e !== 'premium_annual' && e !== entitlementId);
      if (!prev.includes(entitlementId)) {
        filtered.push(entitlementId);
      }
      return filtered;
    });
  };

  const handleGrantSubscription = () => {
    const entitlements = selectedEntitlements.length > 0 ? selectedEntitlements : ['premium_annual'];

    if (selectedPlanId) {
      grantMutation.mutate({
        plan_id: selectedPlanId,
        reason: grantReason || undefined,
        entitlements
      });
    } else if (customDays) {
      grantMutation.mutate({
        duration_days: parseInt(customDays),
        reason: grantReason || undefined,
        entitlements
      });
    }
  };

  const getEntitlementName = (id: string): string => {
    const ent = ENTITLEMENT_OPTIONS.find(e => e.id === id);
    return ent?.name || id;
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-gray-500">Loading user details...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">Failed to load user details</div>
      </div>
    );
  }

  const { user, stats, recent_daily_readings } = data;
  const plans = plansData?.plans || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/users"
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            &larr; Back
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          {subscriptionData?.is_premium && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
              Premium
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGrantModal(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Edit Subscription
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Delete User
          </button>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Subscription Status</h3>
          {plans.length === 0 && (
            <button
              onClick={() => seedPlansMutation.mutate()}
              disabled={seedPlansMutation.isPending}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {seedPlansMutation.isPending ? 'Creating...' : 'Create Default Plans'}
            </button>
          )}
        </div>

        {subLoading ? (
          <div className="text-gray-500">Loading subscription...</div>
        ) : subscriptionData?.is_premium && subscriptionData.active_subscription ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                  <span className="font-medium text-green-700">Active Premium</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {subscriptionData.active_subscription.plan_name || 'Custom'} -
                  {subscriptionData.days_remaining} days remaining
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Expires</p>
                <p className="font-medium">
                  {subscriptionData.expires_at
                    ? new Date(subscriptionData.expires_at).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <button
                onClick={() => cancelMutation.mutate(subscriptionData.active_subscription!.id)}
                disabled={cancelMutation.isPending}
                className="rounded-md bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-200"
              >
                Cancel
              </button>
            </div>

            {/* Active Entitlements */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Active Features:</p>
              <div className="flex flex-wrap gap-2">
                {subscriptionData.has_premium_annual ? (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
                    All Features (Premium)
                  </span>
                ) : (
                  <>
                    {subscriptionData.has_future_7_day && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Future 7-Day
                      </span>
                    )}
                    {subscriptionData.has_weekly_forecast && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Weekly Forecast
                      </span>
                    )}
                    {subscriptionData.has_monthly_forecast && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Monthly Forecast
                      </span>
                    )}
                    {subscriptionData.has_yearly_forecast && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        Yearly Forecast
                      </span>
                    )}
                    {subscriptionData.has_remove_ads && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        No Ads
                      </span>
                    )}
                    {subscriptionData.has_screenshot_mode && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
                        Screenshot Mode
                      </span>
                    )}
                    {!subscriptionData.has_future_7_day &&
                     !subscriptionData.has_weekly_forecast &&
                     !subscriptionData.has_monthly_forecast &&
                     !subscriptionData.has_yearly_forecast &&
                     !subscriptionData.has_remove_ads &&
                     !subscriptionData.has_screenshot_mode && (
                      <span className="text-sm text-gray-500">No specific features</span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                Source: <span className="font-medium">{subscriptionData.active_subscription.source}</span>
                {subscriptionData.active_subscription.grant_reason && (
                  <> | Reason: {subscriptionData.active_subscription.grant_reason}</>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-3 w-3 rounded-full bg-gray-300"></span>
              <span className="font-medium text-gray-500">No Active Subscription</span>
            </div>
          </div>
        )}

        {/* Subscription History */}
        {subscriptionData && subscriptionData.history.length > 0 && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Subscription History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {subscriptionData.history.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{sub.plan_name || 'Custom'}</span>
                    <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                      sub.status === 'active' ? 'bg-green-100 text-green-700' :
                      sub.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      sub.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sub.status}
                    </span>
                    {sub.entitlements && sub.entitlements.length > 0 && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({sub.entitlements.includes('premium_annual')
                          ? 'All Features'
                          : sub.entitlements.map(e => getEntitlementName(e)).join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="text-gray-500">
                    {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() : '-'} -
                    {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Basic Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">ID</dt>
              <dd className="text-sm text-gray-900">{user.id}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{user.email || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Auth Provider</dt>
              <dd className="text-sm text-gray-900">{user.auth_provider}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Language</dt>
              <dd className="text-sm text-gray-900">{user.language}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Tone</dt>
              <dd className="text-sm text-gray-900">{user.preferred_tone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Joined</dt>
              <dd className="text-sm text-gray-900">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Last Login</dt>
              <dd className="text-sm text-gray-900">
                {user.last_login ? new Date(user.last_login).toLocaleString() : '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Bazi Info */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">BaZi Information</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Birth Date</dt>
              <dd className="text-sm text-gray-900">{user.birth_date || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Birth Time</dt>
              <dd className="text-sm text-gray-900">{user.birth_time || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="text-sm text-gray-900">{user.birth_location || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-gray-500">Day Master</dt>
              <dd className="text-sm text-gray-900">
                {user.day_master} ({user.day_master_element} {user.day_master_polarity})
              </dd>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <dt className="mb-2 text-sm font-medium text-gray-500">Four Pillars</dt>
              <dd className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded bg-gray-50 p-2">
                  <p className="text-xs text-gray-500">Year</p>
                  <p className="font-medium text-gray-900">{user.year_pillar || '-'}</p>
                </div>
                <div className="rounded bg-gray-50 p-2">
                  <p className="text-xs text-gray-500">Month</p>
                  <p className="font-medium text-gray-900">{user.month_pillar || '-'}</p>
                </div>
                <div className="rounded bg-gray-50 p-2">
                  <p className="text-xs text-gray-500">Day</p>
                  <p className="font-medium text-gray-900">{user.day_pillar || '-'}</p>
                </div>
                <div className="rounded bg-gray-50 p-2">
                  <p className="text-xs text-gray-500">Hour</p>
                  <p className="font-medium text-gray-900">{user.hour_pillar || '-'}</p>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Readings Stats & History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stats */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Reading Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-600">Daily Readings</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total_daily_readings}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm font-medium text-green-600">Weekly Readings</p>
              <p className="text-2xl font-bold text-green-900">{stats.total_weekly_readings}</p>
            </div>
          </div>
        </div>

        {/* Recent Readings */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Recent Readings</h3>
          <div className="space-y-2">
            {recent_daily_readings.map((reading) => (
              <div
                key={reading.id}
                className="flex items-center justify-between rounded bg-gray-50 px-3 py-2"
              >
                <span className="text-sm text-gray-900">{reading.date}</span>
                <span className="text-xs text-gray-500">
                  {reading.daily_pillar} - {reading.generation_method}
                </span>
              </div>
            ))}
            {recent_daily_readings.length === 0 && (
              <p className="text-sm text-gray-500">No readings yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Subscription Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Subscription</h3>

            {/* Current Status */}
            {subscriptionData?.is_premium && subscriptionData.active_subscription && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-yellow-800">Active Subscription</p>
                    <p className="text-sm text-yellow-600">
                      {subscriptionData.active_subscription.plan_name || 'Custom'} - {subscriptionData.days_remaining} days remaining
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      cancelMutation.mutate(subscriptionData.active_subscription!.id);
                      setShowGrantModal(false);
                    }}
                    disabled={cancelMutation.isPending}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    {cancelMutation.isPending ? 'Removing...' : 'Remove Subscription'}
                  </button>
                </div>
              </div>
            )}

            {plans.length > 0 ? (
              <div className="space-y-4">
                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Duration
                  </label>
                  <div className="space-y-2">
                    {plans.map((plan: SubscriptionPlan) => (
                      <label
                        key={plan.id}
                        className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer ${
                          selectedPlanId === plan.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="plan"
                            checked={selectedPlanId === plan.id}
                            onChange={() => {
                              setSelectedPlanId(plan.id);
                              setCustomDays('');
                            }}
                            className="mr-3"
                          />
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-sm text-gray-500">{plan.duration_days} days</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Custom Duration (days)
                  </label>
                  <input
                    type="number"
                    value={customDays}
                    onChange={(e) => {
                      setCustomDays(e.target.value);
                      setSelectedPlanId(null);
                    }}
                    placeholder="e.g., 14"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                {/* Entitlement Selection */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features to Grant
                  </label>
                  <div className="space-y-2">
                    {ENTITLEMENT_OPTIONS.map((ent) => (
                      <label
                        key={ent.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer ${
                          selectedEntitlements.includes(ent.id)
                            ? ent.id === 'premium_annual'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEntitlements.includes(ent.id)}
                          onChange={() => handleEntitlementToggle(ent.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${ent.id === 'premium_annual' ? 'text-purple-700' : ''}`}>
                            {ent.name}
                          </p>
                          <p className="text-sm text-gray-500">{ent.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedEntitlements.length === 0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      No features selected. At least one feature is required.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    placeholder="e.g., Beta tester reward"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No subscription plans found.</p>
                <button
                  onClick={() => seedPlansMutation.mutate()}
                  disabled={seedPlansMutation.isPending}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {seedPlansMutation.isPending ? 'Creating...' : 'Create Default Plans'}
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedPlanId(null);
                  setCustomDays('');
                  setGrantReason('');
                  setSelectedEntitlements(['premium_annual']);
                }}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleGrantSubscription}
                disabled={grantMutation.isPending || (!selectedPlanId && !customDays) || selectedEntitlements.length === 0}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {grantMutation.isPending ? 'Saving...' : subscriptionData?.is_premium ? 'Update Subscription' : 'Grant Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this user? This action cannot be undone.
              All user data including readings will be permanently deleted.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
