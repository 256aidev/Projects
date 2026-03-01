/**
 * Purchase Types
 * Type definitions for in-app purchases
 */

// Product IDs for App Store / Google Play
export const PRODUCT_IDS = {
  FUTURE_7_DAY: 'com.baziastrology.future7day',      // $0.99 one-time (Non-Consumable)
  WEEKLY_FORECAST: 'com.baziastrology.weekly',       // $0.99/week subscription (Auto-Renewable)
  MONTHLY_FORECAST: 'com.baziastrology.monthly',     // $0.99/month subscription (Auto-Renewable)
  YEARLY_FORECAST: 'com.baziastrology.yearly',       // $0.99/year subscription (Auto-Renewable)
  REMOVE_ADS: 'com.baziastrology.removeads',         // $1.99 one-time (Non-Consumable)
  PREMIUM_ANNUAL: 'com.baziastrology.premium',       // $9.99/year subscription (Auto-Renewable) - unlocks everything
} as const;

// Track which products are subscriptions vs one-time purchases
export const SUBSCRIPTION_PRODUCTS = [
  PRODUCT_IDS.WEEKLY_FORECAST,
  PRODUCT_IDS.MONTHLY_FORECAST,
  PRODUCT_IDS.YEARLY_FORECAST,
  PRODUCT_IDS.PREMIUM_ANNUAL,
] as const;

// Subscription billing periods for display
export const SUBSCRIPTION_PERIODS: Record<string, string> = {
  [PRODUCT_IDS.WEEKLY_FORECAST]: '/wk',
  [PRODUCT_IDS.MONTHLY_FORECAST]: '/mo',
  [PRODUCT_IDS.YEARLY_FORECAST]: '/yr',
  [PRODUCT_IDS.PREMIUM_ANNUAL]: '/yr',
};

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// Purchase state for the app
export interface PurchaseState {
  hasFuture7Day: boolean;
  hasWeeklyForecast: boolean;
  hasMonthlyForecast: boolean;
  hasYearlyForecast: boolean;
  hasRemoveAds: boolean;
  hasPremiumAnnual: boolean;  // Unlocks everything
  isLoading: boolean;
  isInitialized: boolean;
}

// Product info returned from RevenueCat
export interface ProductInfo {
  identifier: string;
  description: string;
  title: string;
  price: number;
  priceString: string;
  currencyCode: string;
}

// Purchase context type
export interface PurchaseContextType extends PurchaseState {
  purchaseProduct: (productId: ProductId) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  getProduct: (productId: ProductId) => ProductInfo | null;
  products: Map<ProductId, ProductInfo>;
}

// Initial state
export const initialPurchaseState: PurchaseState = {
  hasFuture7Day: false,
  hasWeeklyForecast: false,
  hasMonthlyForecast: false,
  hasYearlyForecast: false,
  hasRemoveAds: false,
  hasPremiumAnnual: false,
  isLoading: true,
  isInitialized: false,
};
