/**
 * Banner Ad Component
 * Displays a banner ad at the bottom of screens
 * Hidden if user has purchased ad removal
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import { usePurchases } from '../../purchases/PurchaseContext';

// Use test IDs in development, replace with real IDs in production
const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      ios: 'ca-app-pub-XXXXX/YYYYY', // Replace with your iOS banner ad unit ID
      android: 'ca-app-pub-XXXXX/YYYYY', // Replace with your Android banner ad unit ID
    }) || TestIds.ADAPTIVE_BANNER;

interface AdBannerProps {
  style?: object;
}

export default function AdBanner({ style }: AdBannerProps) {
  const { hasRemoveAds } = usePurchases();

  console.log('🔄 [AdBanner] Rendering, hasRemoveAds:', hasRemoveAds);

  // Don't render if ads are removed
  if (hasRemoveAds) {
    console.log('✅ [AdBanner] Ads removed - not rendering banner');
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF5E6',
  },
});
