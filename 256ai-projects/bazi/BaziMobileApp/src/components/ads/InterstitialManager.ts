/**
 * Interstitial Ad Manager
 * Handles loading and showing interstitial ads
 * Respects ad removal purchase state
 */

import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// Use test IDs in development, replace with real IDs in production
const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ios: 'ca-app-pub-XXXXX/YYYYY', // Replace with your iOS interstitial ad unit ID
      android: 'ca-app-pub-XXXXX/YYYYY', // Replace with your Android interstitial ad unit ID
    }) || TestIds.INTERSTITIAL;

class InterstitialManager {
  private interstitial: InterstitialAd | null = null;
  private isLoaded: boolean = false;
  private lastShownTime: number = 0;
  private minIntervalMs: number = 30000; // Minimum 30 seconds between interstitials (reduced for ad-gated model)
  private showCount: number = 0;
  private maxPerSession: number = 20; // Increased limit for ad-gated content model
  private adsRemoved: boolean = false; // Track if user has purchased ad removal

  constructor() {
    this.loadAd();
  }

  /**
   * Set ad removal status (call from PurchaseContext when state changes)
   */
  setAdsRemoved(removed: boolean) {
    console.log('🔄 [InterstitialManager] setAdsRemoved called with:', removed);
    this.adsRemoved = removed;
    if (removed) {
      console.log('✅ [InterstitialManager] Ads are REMOVED - cleaning up');
      // Clean up if ads are removed
      this.interstitial = null;
      this.isLoaded = false;
    }
  }

  private loadAd() {
    // Don't load ads if user has purchased removal
    if (this.adsRemoved) {
      return;
    }

    this.interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial ad loaded');
      this.isLoaded = true;
    });

    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial ad closed');
      this.isLoaded = false;
      // Preload next ad
      this.loadAd();
    });

    this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial ad error:', error);
      this.isLoaded = false;
    });

    this.interstitial.load();
  }

  /**
   * Show an interstitial ad if one is loaded and rate limits allow
   * @returns Promise that resolves when ad is closed or if no ad shown
   */
  async show(): Promise<boolean> {
    // Don't show ads if user has purchased removal
    if (this.adsRemoved) {
      console.log('Interstitial: Ads removed by purchase');
      return false;
    }

    const now = Date.now();

    // Check rate limits
    if (this.showCount >= this.maxPerSession) {
      console.log('Interstitial: Max per session reached');
      return false;
    }

    if (now - this.lastShownTime < this.minIntervalMs) {
      console.log('Interstitial: Too soon since last ad');
      return false;
    }

    if (!this.isLoaded || !this.interstitial) {
      console.log('Interstitial: Not loaded');
      return false;
    }

    return new Promise((resolve) => {
      const closeListener = this.interstitial!.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          closeListener();
          resolve(true);
        }
      );

      this.interstitial!.show();
      this.lastShownTime = now;
      this.showCount++;
    });
  }

  /**
   * Check if an interstitial is ready to show
   */
  isReady(): boolean {
    // Ads not ready if user has purchased removal
    if (this.adsRemoved) {
      return false;
    }

    const now = Date.now();
    return (
      this.isLoaded &&
      this.showCount < this.maxPerSession &&
      now - this.lastShownTime >= this.minIntervalMs
    );
  }

  /**
   * Reset session counters (call when app comes to foreground after long time)
   */
  resetSession() {
    this.showCount = 0;
  }
}

// Singleton instance
export const interstitialManager = new InterstitialManager();
export default interstitialManager;
