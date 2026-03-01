/**
 * Relationships Screen
 * Main landing page for the Relationships tab
 * Goal: "This tab explains how energies meet."
 *
 * Shows family members with effort labels and Ease×Durability chips
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../auth';
import { getFamilyMembers, getRelationshipLimits, RelationshipLimits } from '../../api/family';
import { FamilyMember } from '../../types';
import { ApiError } from '../../api';
import { AdBanner } from '../../components/ads';
import { RelationshipsStackParamList } from '../../navigation/RelationshipsStack';

type NavigationProp = NativeStackNavigationProp<RelationshipsStackParamList>;

// Effort label colors (muted, non-alarming)
const EFFORT_COLORS: Record<string, string> = {
  'Low-Friction Dynamic': '#4A7C59',
  'Stable with Awareness': '#6B8E6B',
  'Workable with Intention': '#8B8B6B',
  'Growth-Focused': '#9B8B7B',
  'High-Effort Relationship': '#8B7B7B',
};

interface FamilyMemberCardProps {
  member: FamilyMember;
  onPress: () => void;
}

function FamilyMemberCard({ member, onPress }: FamilyMemberCardProps) {
  const effortLabel = 'Workable with Intention'; // Default - will be fetched from compatibility
  const effortColor = EFFORT_COLORS[effortLabel] || '#8B8B6B';

  const getRelationshipLabel = (relationship: string) => {
    switch (relationship) {
      case 'spouse': return 'Spouse';
      case 'partner': return 'Partner';
      case 'child': return 'Child';
      case 'parent': return 'Parent';
      case 'sibling': return 'Sibling';
      case 'friend': return 'Friend';
      case 'grandparent': return 'Grandparent';
      default: return 'Family';
    }
  };

  return (
    <TouchableOpacity style={styles.memberCard} onPress={onPress}>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{member.name}</Text>
        <Text style={styles.memberRelationship}>{getRelationshipLabel(member.relationship)}</Text>
      </View>
      <View style={[styles.effortBadge, { backgroundColor: effortColor }]}>
        <Text style={styles.effortBadgeText}>View Details</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function RelationshipsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [limits, setLimits] = useState<RelationshipLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    if (!user) return;
    try {
      setError(null);
      const [data, limitsData] = await Promise.all([
        getFamilyMembers(user.id),
        getRelationshipLimits(user.id),
      ]);
      setMembers(data);
      setLimits(limitsData);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load family members.';
      setError(message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const canAddType = (type: string): boolean => {
    if (!limits) return true;
    return limits.can_add[type] ?? true;
  };

  const getLimitMessage = (type: string): string | null => {
    if (!limits || canAddType(type)) return null;
    if (type === 'spouse' || type === 'partner') {
      return 'You can add either one spouse or one partner.';
    }
    const limit = limits.limits[type];
    const typeLabel = type === 'child' ? 'children' : `${type}s`;
    return `Limit reached (${limit} ${typeLabel})`;
  };

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadMembers();
  };

  const handleAddMember = (relationship: 'spouse' | 'partner' | 'child' | 'parent' | 'sibling' | 'grandparent') => {
    // Check limit before navigating
    if (!canAddType(relationship)) {
      const message = getLimitMessage(relationship);
      Alert.alert('Limit Reached', message || 'Cannot add more of this relationship type.');
      return;
    }
    navigation.navigate('AddFamilyMember', { relationship });
  };

  const handleMemberPress = (member: FamilyMember) => {
    navigation.navigate('FamilyMemberDetail', { member });
  };

  const handleFamilyReading = () => {
    navigation.navigate('FamilyReading');
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading relationships...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Intro Text */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Your Relationships</Text>
          <Text style={styles.introText}>
            Explore how your energy patterns interact with the people in your life.
            Every relationship can thrive with awareness and intention.
          </Text>
        </View>

        {/* Add Relationship Buttons */}
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>Add Relationship</Text>
          <View style={styles.addButtonsRow}>
            <TouchableOpacity
              style={[styles.addButton, !canAddType('spouse') && styles.addButtonDisabled]}
              onPress={() => handleAddMember('spouse')}
              disabled={!canAddType('spouse')}
            >
              <Text style={styles.addButtonIcon}>💍</Text>
              <Text style={[styles.addButtonText, !canAddType('spouse') && styles.addButtonTextDisabled]}>Spouse</Text>
              {!canAddType('spouse') && <Text style={styles.limitLabel}>Added</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, !canAddType('child') && styles.addButtonDisabled]}
              onPress={() => handleAddMember('child')}
              disabled={!canAddType('child')}
            >
              <Text style={styles.addButtonIcon}>👶</Text>
              <Text style={[styles.addButtonText, !canAddType('child') && styles.addButtonTextDisabled]}>Child</Text>
              {!canAddType('child') && <Text style={styles.limitLabel}>Limit</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, !canAddType('parent') && styles.addButtonDisabled]}
              onPress={() => handleAddMember('parent')}
              disabled={!canAddType('parent')}
            >
              <Text style={styles.addButtonIcon}>👨‍👩‍👧</Text>
              <Text style={[styles.addButtonText, !canAddType('parent') && styles.addButtonTextDisabled]}>Parent</Text>
              {!canAddType('parent') && <Text style={styles.limitLabel}>Limit</Text>}
            </TouchableOpacity>
          </View>
          <View style={[styles.addButtonsRow, { marginTop: 8 }]}>
            <TouchableOpacity
              style={[styles.addButton, !canAddType('partner') && styles.addButtonDisabled]}
              onPress={() => handleAddMember('partner')}
              disabled={!canAddType('partner')}
            >
              <Text style={styles.addButtonIcon}>❤️</Text>
              <Text style={[styles.addButtonText, !canAddType('partner') && styles.addButtonTextDisabled]}>Partner</Text>
              {!canAddType('partner') && <Text style={styles.limitLabel}>Added</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, !canAddType('sibling') && styles.addButtonDisabled]}
              onPress={() => handleAddMember('sibling')}
              disabled={!canAddType('sibling')}
            >
              <Text style={styles.addButtonIcon}>👫</Text>
              <Text style={[styles.addButtonText, !canAddType('sibling') && styles.addButtonTextDisabled]}>Sibling</Text>
              {!canAddType('sibling') && <Text style={styles.limitLabel}>Limit</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, !canAddType('grandparent') && styles.addButtonDisabled]}
              onPress={() => handleAddMember('grandparent')}
              disabled={!canAddType('grandparent')}
            >
              <Text style={styles.addButtonIcon}>👴</Text>
              <Text style={[styles.addButtonText, !canAddType('grandparent') && styles.addButtonTextDisabled]}>Grandparent</Text>
              {!canAddType('grandparent') && <Text style={styles.limitLabel}>Limit</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Members List */}
        {members.length > 0 ? (
          <View style={styles.membersSection}>
            <Text style={styles.sectionTitle}>Family Members</Text>
            {members.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onPress={() => handleMemberPress(member)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>
              Add a family member above to see your relationship dynamics.
            </Text>
          </View>
        )}

        {/* Family Dynamic Reading */}
        {(() => {
          // Family Dynamic includes only: user + spouse/partner + children
          const coreFamily = members.filter(m =>
            m.relationship === 'spouse' ||
            m.relationship === 'partner' ||
            m.relationship === 'child'
          );
          const hasSpouseOrPartner = members.some(m =>
            m.relationship === 'spouse' || m.relationship === 'partner'
          );
          const hasChildren = members.some(m => m.relationship === 'child');

          // Show only if there's at least a spouse/partner or a child
          if (!hasSpouseOrPartner && !hasChildren) return null;

          return (
            <View style={styles.familyDynamicSection}>
              <TouchableOpacity
                style={styles.familyReadingButton}
                onPress={handleFamilyReading}
              >
                <Text style={styles.familyReadingButtonText}>Family Dynamic Reading</Text>
                <Text style={styles.familyReadingButtonSub}>
                  You + {hasSpouseOrPartner ? 'Spouse/Partner' : ''}{hasSpouseOrPartner && hasChildren ? ' + ' : ''}{hasChildren ? 'Children' : ''}
                </Text>
              </TouchableOpacity>
              <Text style={styles.familyDynamicNote}>
                This reading includes you, your spouse/partner, and your children.
                Parents, grandparents, and siblings are viewed individually.
              </Text>
            </View>
          );
        })()}

        {/* Error display */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF5E6',
  },
  loadingText: {
    marginTop: 12,
    color: '#8B7355',
    fontSize: 16,
  },
  introSection: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  addSection: {
    marginBottom: 24,
  },
  addButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  addButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  addButtonText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
  addButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  addButtonTextDisabled: {
    color: '#999999',
  },
  limitLabel: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  membersSection: {
    marginBottom: 24,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  memberRelationship: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 2,
  },
  effortBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  effortBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptySection: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  familyReadingButton: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  familyReadingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FDF5E6',
  },
  familyReadingButtonSub: {
    fontSize: 12,
    color: '#D4A574',
    marginTop: 4,
  },
  familyDynamicSection: {
    marginTop: 8,
  },
  familyDynamicNote: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    paddingHorizontal: 16,
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFCCCC',
    marginTop: 16,
  },
  errorText: {
    color: '#B22222',
    textAlign: 'center',
  },
});
