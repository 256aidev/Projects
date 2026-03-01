/**
 * BaZi Astrology Mobile App
 * Main entry point
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/auth';
import { PurchaseProvider } from './src/purchases';
import { RewardProvider, useRewards } from './src/rewards';
import { AchievementProvider, useAchievements } from './src/achievements';
import { RootNavigator } from './src/navigation';
import AchievementPopup from './src/components/AchievementPopup';
import RewardPopup from './src/components/RewardPopup';

function AppContent() {
  const { pendingPopup, dismissPopup } = useAchievements();
  const { pendingRewardPopup, dismissRewardPopup } = useRewards();

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
      <AchievementPopup achievement={pendingPopup} onDismiss={dismissPopup} />
      <RewardPopup reward={pendingRewardPopup} onDismiss={dismissRewardPopup} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PurchaseProvider>
        <RewardProvider>
          <AchievementProvider>
            <AppContent />
          </AchievementProvider>
        </RewardProvider>
      </PurchaseProvider>
    </AuthProvider>
  );
}
