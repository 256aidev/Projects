/**
 * Future Day Button Component
 * Button for selecting future days (locked/unlocked state)
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

interface FutureDayButtonProps {
  date: Date;
  isUnlocked: boolean;
  onPress: () => void;
  isSelected?: boolean;
}

export default function FutureDayButton({
  date,
  isUnlocked,
  onPress,
  isSelected = false,
}: FutureDayButtonProps) {
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        !isUnlocked && styles.containerLocked,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.dayOfWeek, isSelected && styles.textSelected]}>
        {dayOfWeek}
      </Text>
      <Text style={[styles.dayNumber, isSelected && styles.textSelected]}>
        {dayNumber}
      </Text>
      <Text style={[styles.month, isSelected && styles.textSelected]}>
        {monthName}
      </Text>
      {!isUnlocked && (
        <View style={styles.lockBadge}>
          <Text style={styles.lockIcon}>locked</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  containerSelected: {
    backgroundColor: '#8B4513',
    borderColor: '#8B4513',
  },
  containerLocked: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D4D4D4',
  },
  dayOfWeek: {
    fontSize: 11,
    color: '#8B7355',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5D3A1A',
  },
  month: {
    fontSize: 11,
    color: '#8B7355',
    marginTop: 2,
  },
  textSelected: {
    color: '#FDF5E6',
  },
  lockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  lockIcon: {
    fontSize: 10,
    color: '#A0A0A0',
  },
});
