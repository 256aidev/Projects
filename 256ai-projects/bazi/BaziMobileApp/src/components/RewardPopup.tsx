/**
 * Reward Popup Component
 * Small popup for daily streak rewards (not achievement unlocks)
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { PendingRewardPopup, REWARD_TYPE_LABELS } from '../types/rewards';

interface RewardPopupProps {
  reward: PendingRewardPopup | null;
  onDismiss: () => void;
}

export default function RewardPopup({ reward, onDismiss }: RewardPopupProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reward) {
      // Reset animations
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [reward]);

  const handleDismiss = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!reward) return null;

  const rewardLabel = REWARD_TYPE_LABELS[reward.rewardType];

  return (
    <Modal
      visible={!!reward}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Gift Header */}
          <View style={styles.header}>
            <Text style={styles.giftEmoji}>🎁</Text>
            <Text style={styles.headerText}>Streak Reward!</Text>
          </View>

          {/* Streak Day */}
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>Day {reward.streakDay} Streak! 🔥</Text>
          </View>

          {/* Reward Info */}
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardAmount}>+{reward.amount} Free {rewardLabel}</Text>
            <Text style={styles.totalCredits}>
              You now have {reward.totalCredits} {rewardLabel.toLowerCase()} available
            </Text>
          </View>

          {/* Dismiss Button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  giftEmoji: {
    fontSize: 28,
    marginRight: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  streakBadge: {
    backgroundColor: '#FDF5E6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D4A574',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  rewardInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 8,
  },
  totalCredits: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
