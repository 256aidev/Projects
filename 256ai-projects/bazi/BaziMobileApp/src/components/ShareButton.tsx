/**
 * Share Button Component
 * Reusable share button with consistent styling
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ShareButtonProps {
  onPress: () => void;
  variant?: 'icon' | 'text' | 'full';
  label?: string;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function ShareButton({
  onPress,
  variant = 'icon',
  label = 'Share',
  style,
  disabled = false,
}: ShareButtonProps) {
  if (variant === 'icon') {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.iconButton, style]}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={styles.iconText}>📤</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'text') {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.textButton, style]}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={styles.textButtonText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // Full button with icon and text
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.fullButton, style]}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={styles.fullButtonIcon}>📤</Text>
      <Text style={styles.fullButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  textButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '500',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  fullButtonIcon: {
    fontSize: 16,
  },
  fullButtonText: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: '500',
  },
});
