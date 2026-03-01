/**
 * Purchase Service
 * Stub service - RevenueCat removed for now
 * Purchases are handled via backend admin grants only
 */

import { ProductId, ProductInfo, PurchaseState } from '../types/purchases';

class PurchaseService {
  private isConfigured: boolean = false;

  /**
   * Configure (no-op)
   */
  async configure(_userId?: string): Promise<void> {
    this.isConfigured = true;
    console.log('[PurchaseService] Stub service - no RevenueCat configured');
  }

  /**
   * Get product info (returns null - no products)
   */
  getProduct(_productId: ProductId): ProductInfo | null {
    return null;
  }

  /**
   * Get all products (empty)
   */
  getAllProducts(): Map<ProductId, ProductInfo> {
    return new Map();
  }

  /**
   * Purchase a product (no-op)
   */
  async purchaseProduct(_productId: ProductId): Promise<{ success: boolean }> {
    console.log('[PurchaseService] Purchases disabled');
    return { success: false };
  }

  /**
   * Restore purchases (no-op)
   */
  async restorePurchases(): Promise<void> {
    console.log('[PurchaseService] Restore disabled');
  }

  /**
   * Parse purchase state (returns empty state)
   */
  parsePurchaseState(): Omit<PurchaseState, 'isLoading' | 'isInitialized'> {
    return {
      hasFuture7Day: false,
      hasWeeklyForecast: false,
      hasMonthlyForecast: false,
      hasYearlyForecast: false,
      hasRemoveAds: false,
      hasPremiumAnnual: false,
    };
  }

  /**
   * Identify user (no-op)
   */
  async identifyUser(_userId: string): Promise<void> {
    console.log('[PurchaseService] Identity disabled');
  }

  /**
   * Log out (no-op)
   */
  async logOut(): Promise<void> {
    console.log('[PurchaseService] Logout disabled');
  }

  /**
   * Add listener (no-op, returns cleanup function)
   */
  addCustomerInfoListener(_callback: (info: any) => void): () => void {
    return () => {};
  }
}

// Export singleton instance
export const purchaseService = new PurchaseService();
export default purchaseService;
