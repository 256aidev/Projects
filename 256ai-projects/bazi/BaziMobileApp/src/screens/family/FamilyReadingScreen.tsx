/**
 * Family Reading Screen
 * Shows full family analysis reading
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../auth';
import { getFamilyReading, getFamilyMembers, ApiError } from '../../api';
import { FamilyReading, FamilyMember } from '../../types';

interface FamilyReadingScreenProps {
  navigation: any;
}

export default function FamilyReadingScreen({ navigation }: FamilyReadingScreenProps) {
  const { user } = useAuth();
  const [familyReading, setFamilyReading] = useState<FamilyReading | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load family members and reading in parallel
      const [membersData, readingData] = await Promise.all([
        getFamilyMembers(user.id).catch(() => []),
        getFamilyReading(user.id).catch((err) => {
          if (err instanceof ApiError) {
            throw err;
          }
          return null;
        }),
      ]);

      setMembers(membersData);
      setFamilyReading(readingData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load family reading');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
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

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Generating family reading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#8B4513"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>👪</Text>
        <Text style={styles.title}>Family Reading</Text>
        <Text style={styles.subtitle}>
          Comprehensive analysis of your family dynamics
        </Text>
      </View>

      {/* Family Members Summary */}
      <View style={styles.membersCard}>
        <Text style={styles.sectionTitle}>Family Members</Text>
        <View style={styles.membersList}>
          <View style={styles.memberItem}>
            <Text style={styles.memberIcon}>🧑</Text>
            <Text style={styles.memberName}>{user?.name} (You)</Text>
          </View>
          {members.map((member) => (
            <View key={member.id} style={styles.memberItem}>
              <Text style={styles.memberIcon}>
                {getRelationshipIcon(member.relationship)}
              </Text>
              <Text style={styles.memberName}>
                {member.name} ({member.relationship})
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reading Content */}
      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : familyReading ? (
        <View style={styles.readingCard}>
          <Text style={styles.sectionTitle}>Family Analysis</Text>
          <Text style={styles.readingText}>{familyReading.content}</Text>
          <Text style={styles.generatedAt}>
            Generated: {new Date(familyReading.generated_at).toLocaleDateString()}
          </Text>
        </View>
      ) : (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderIcon}>📖</Text>
          <Text style={styles.placeholderTitle}>Family Reading Coming Soon</Text>
          <Text style={styles.placeholderText}>
            Once the backend is configured, you'll see a comprehensive analysis of your family's
            elemental balance, relationship dynamics, and collective energy patterns.
          </Text>
          <View style={styles.placeholderFeatures}>
            <Text style={styles.featureItem}>• Family element balance</Text>
            <Text style={styles.featureItem}>• Relationship dynamics</Text>
            <Text style={styles.featureItem}>• Strengths & challenges</Text>
            <Text style={styles.featureItem}>• Growth opportunities</Text>
          </View>
        </View>
      )}

      {/* Back to Profile */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5D3A1A',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  membersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 16,
  },
  membersList: {
    gap: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF5E6',
    padding: 12,
    borderRadius: 8,
  },
  memberIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    color: '#5D3A1A',
  },
  readingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 16,
  },
  readingText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 24,
  },
  generatedAt: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 16,
    fontStyle: 'italic',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#DC143C',
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC143C',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 15,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  placeholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 16,
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  placeholderFeatures: {
    alignSelf: 'flex-start',
    paddingLeft: 16,
  },
  featureItem: {
    fontSize: 14,
    color: '#5D3A1A',
    marginBottom: 4,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#8B4513',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontWeight: '500',
  },
});
