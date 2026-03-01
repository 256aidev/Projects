/**
 * Purchase Context
 * React context for managing subscription state (backend-only, no RevenueCat)
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  PurchaseContextType,
  PurchaseState,
  ProductId,
  ProductInfo,
  initialPurchaseState,
} from '../types/purchases';
import { useAuth } from '../auth';
import { interstitialManager } from '../components/ads/InterstitialManager';
import { getSubscriptionStatus } from '../api/subscriptions';

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<PurchaseState>(initialPurchaseState);
  const [products] = useState<Map<ProductId, ProductInfo>>(new Map());

  // Check backend subscription when user authenticates
  useEffect(() => {
    const initializePurchases = async () => {
      console.log('🔄 [PurchaseContext] initializePurchases called');
      console.log('🔄 [PurchaseContext] isAuthenticated:', isAuthenticated, 'user:', user?.id);

      if (!isAuthenticated || !user) {
        console.log('🔄 [PurchaseContext] Not authenticated, resetting state');
        setState(initialPurchaseState);
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      // Check backend for admin-granted entitlements
      let backendEntitlements = {
        hasFuture7Day: false,
        hasWeeklyForecast: false,
        hasMonthlyForecast: false,
        hasYearlyForecast: false,
        hasRemoveAds: false,
        hasPremiumAnnual: false,
      };

      try {
        console.log('🔄 [PurchaseContext] Calling backend /subscription/status...');
        const backendStatus = await getSubscriptionStatus();
        console.log('🔄 [PurchaseContext] Backend response:', JSON.stringify(backendStatus, null, 2));

        if (backendStatus.is_premium) {
          console.log('✅ [PurchaseContext] User has admin-granted access!');
          console.log('✅ [PurchaseContext] Entitlements:', backendStatus.entitlements);
          backendEntitlements = {
            hasFuture7Day: backendStatus.has_future_7_day,
            hasWeeklyForecast: backendStatus.has_weekly_forecast,
            hasMonthlyForecast: backendStatus.has_monthly_forecast,
            hasYearlyForecast: backendStatus.has_yearly_forecast,
            hasRemoveAds: backendStatus.has_remove_ads,
            hasPremiumAnnual: backendStatus.has_premium_annual,
          };
          console.log('✅ [PurchaseContext] Backend entitlements mapped:', JSON.stringify(backendEntitlements, null, 2));
        } else {
          console.log('ℹ️ [PurchaseContext] No admin-granted premium (is_premium: false)');
        }
      } catch (backendError) {
        console.log('❌ [PurchaseContext] Backend subscription check FAILED:', backendError);
      }

      setState({
        ...backendEntitlements,
        isLoading: false,
        isInitialized: true,
      });
      console.log('✅ [PurchaseContext] Initialization complete!');
    };

    initializePurchases();
  }, [isAuthenticated, user?.id]);

  // Sync ad removal state with interstitial manager
  useEffect(() => {
    interstitialManager.setAdsRemoved(state.hasRemoveAds);
  }, [state.hasRemoveAds]);

  // Purchase a product (no-op - purchases disabled)
  const purchaseProduct = useCallback(async (_productId: ProductId): Promise<boolean> => {
    console.log('Purchases are currently disabled');
    return false;
  }, []);

  // Restore purchases (no-op - purchases disabled)
  const restorePurchases = useCallback(async (): Promise<void> => {
    console.log('Purchases are currently disabled');
  }, []);

  // Get product info (returns null - no products available)
  const getProduct = useCallback(
    (_productId: ProductId): ProductInfo | null => {
      return null;
    },
    []
  );

  const value: PurchaseContextType = {
    ...state,
    purchaseProduct,
    restorePurchases,
    getProduct,
    products,
  };

  return <PurchaseContext.Provider value={value}>{children}</PurchaseContext.Provider>;
}

export function usePurchases(): PurchaseContextType {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchases must be used within a PurchaseProvider');
  }
  return context;
}
