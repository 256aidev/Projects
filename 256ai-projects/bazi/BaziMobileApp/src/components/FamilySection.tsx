/**
 * Family Section Component
 * Displays family members list and add buttons for ProfileScreen
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../auth';
import { getFamilyMembers, deleteFamilyMember, ApiError } from '../api';
import { FamilyMember, FamilyRelationship } from '../types';

interface FamilySectionProps {
  navigation: any;
}

export default function FamilySection({ navigation }: FamilySectionProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFamilyMembers = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getFamilyMembers(user.id);
      setMembers(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // No family members yet - not an error
        setMembers([]);
      } else {
        setError('Failed to load family members');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFamilyMembers();
    }, [loadFamilyMembers])
  );

  const hasSpouse = members.some(m => m.relationship === 'spouse');
  const spouses = members.filter(m => m.relationship === 'spouse');
  const parents = members.filter(m => m.relationship === 'parent');
  const children = members.filter(m => m.relationship === 'child');

  const handleAddMember = (relationship: FamilyRelationship) => {
    navigation.navigate('AddFamilyMember', { relationship });
  };

  const handleMemberPress = (member: FamilyMember) => {
    navigation.navigate('FamilyMemberDetail', { member });
  };

  const handleFamilyReading = () => {
    navigation.navigate('FamilyReading');
  };

  const handleRemoveMember = (member: FamilyMember) => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            try {
              await deleteFamilyMember(user.id, member.id);
              // Reload the list
              loadFamilyMembers();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove family member');
            }
          },
        },
      ]
    );
  };

  const getRelationshipIcon = (relationship: string) => {
    switch (relationship) {
      case 'spouse':
        return '💑';
      case 'child':
        return '👶';
      case 'parent':
        return '👨‍👩';
      default:
        return '👤';
    }
  };

  const renderMemberCard = (member: FamilyMember) => (
    <View key={member.id} style={styles.memberCard}>
      <TouchableOpacity
        style={styles.memberTouchable}
        onPress={() => handleMemberPress(member)}
      >
        <Text style={styles.memberIcon}>{getRelationshipIcon(member.relationship)}</Text>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRelation}>{member.relationship}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveMember(member)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMemberGroup = (title: string, groupMembers: FamilyMember[]) => {
    if (groupMembers.length === 0) return null;
    return (
      <View style={styles.memberGroup}>
        <Text style={styles.groupTitle}>{title}</Text>
        {groupMembers.map(renderMemberCard)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>My Family</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#8B4513" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>My Family</Text>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Add buttons */}
      <View style={styles.addButtonsRow}>
        {!hasSpouse && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleAddMember('spouse')}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add Spouse</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddMember('parent')}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add Parent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddMember('child')}
        >
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add Child</Text>
        </TouchableOpacity>
      </View>

      {/* Family members list */}
      {members.length > 0 ? (
        <View style={styles.membersList}>
          {renderMemberGroup('Spouse', spouses)}
          {renderMemberGroup('Parents', parents)}
          {renderMemberGroup('Children', children)}

          {/* Family Reading button - show when 2+ members */}
          {members.length >= 2 && (
            <TouchableOpacity
              style={styles.familyReadingButton}
              onPress={handleFamilyReading}
            >
              <Text style={styles.familyReadingIcon}>👪</Text>
              <Text style={styles.familyReadingText}>View Family Reading</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          Add family members to see compatibility readings
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC143C',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  addButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF5E6',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonIcon: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: 'bold',
    marginRight: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  membersList: {
    marginTop: 8,
  },
  memberGroup: {
    marginBottom: 12,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B7355',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF5E6',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  memberTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  memberIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  memberRelation: {
    fontSize: 12,
    color: '#8B7355',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#D4A574',
  },
  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 22,
    color: '#DC143C',
    fontWeight: '300',
  },
  familyReadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  familyReadingIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  familyReadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
});
