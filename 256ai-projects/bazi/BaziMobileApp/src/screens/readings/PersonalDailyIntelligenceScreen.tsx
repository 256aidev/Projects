/**
 * Personal Daily Intelligence Screen
 * 8-section daily reading based on today's day pillar × user's chart
 * Replaces static BaZi Intelligence with daily personalized content
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
import { apiClient } from '../../api/client';
import { AdBanner } from '../../components/ads';
import { translatePillar } from '../../utils/translateChinese';

// Types for the API response
interface IntelligenceSection {
  key: string;
  title: string;
  content: string;
  keyInsight?: string;
}

interface PersonalDailyIntelligenceResponse {
  userId: number;
  userName: string;
  date: string;
  dayPillar: string;
  dayElement: string;
  interactionType: string;
  sections: IntelligenceSection[];
  microAction: string;
  generatedAt: string;
}

// Interaction type display info
const INTERACTION_INFO: Record<string, { label: string; color: string; icon: string }> = {
  amplified: { label: 'Energy Amplified', color: '#228B22', icon: '🌊' },
  supportive: { label: 'Supportive Flow', color: '#4169E1', icon: '🤝' },
  challenging: { label: 'Extra Effort Day', color: '#DC143C', icon: '💪' },
  empowered: { label: 'Take Initiative', color: '#DAA520', icon: '⚡' },
  neutral: { label: 'Balanced Day', color: '#8B7355', icon: '☯️' },
};

// Element colors
const ELEMENT_COLORS: Record<string, string> = {
  Wood: '#228B22',
  Fire: '#DC143C',
  Earth: '#DAA520',
  Metal: '#C0C0C0',
  Water: '#4169E1',
};

export default function PersonalDailyIntelligenceScreen() {
  const { user } = useAuth();
  const [data, setData] = useState<PersonalDailyIntelligenceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const fetchIntelligence = async () => {
    if (!user) return;

    try {
      setError(null);
      const response = await apiClient.get<PersonalDailyIntelligenceResponse>(
        `/api/personal-daily-intelligence/${user.id}`
      );
      setData(response);
      // Auto-expand first section
      if (response.sections?.length > 0) {
        setExpandedSections(new Set([response.sections[0].key]));
      }
    } catch (err) {
      console.error('Failed to load personal intelligence:', err);
      setError('Failed to load your daily intelligence. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIntelligence();
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading your daily intelligence...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.errorContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <AdBanner />
      </View>
    );
  }

  if (!data) {
    return null;
  }

  const interactionInfo = INTERACTION_INFO[data.interactionType] || INTERACTION_INFO.neutral;
  const elementColor = ELEMENT_COLORS[data.dayElement] || '#8B4513';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Day Pillar */}
        <View style={styles.header}>
          <Text style={styles.dateText}>
            {new Date(data.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <View style={[styles.pillarCard, { borderColor: elementColor }]}>
            <Text style={[styles.pillarText, { color: elementColor }]}>
              {data.dayPillar}
            </Text>
            <Text style={styles.pillarTranslation}>
              {translatePillar(data.dayPillar)}
            </Text>
          </View>
        </View>

        {/* Interaction Type Badge */}
        <View style={[styles.interactionBadge, { backgroundColor: interactionInfo.color + '15' }]}>
          <Text style={styles.interactionIcon}>{interactionInfo.icon}</Text>
          <View>
            <Text style={[styles.interactionLabel, { color: interactionInfo.color }]}>
              {interactionInfo.label}
            </Text>
            <Text style={styles.interactionDesc}>
              Today's {data.dayElement} energy meets your chart
            </Text>
          </View>
        </View>

        {/* Micro Action Callout */}
        {data.microAction && (
          <View style={styles.microActionCard}>
            <Text style={styles.microActionTitle}>Today's Micro-Action</Text>
            <Text style={styles.microActionText}>{data.microAction}</Text>
          </View>
        )}

        {/* 8 Expandable Sections */}
        <View style={styles.sectionsContainer}>
          {data.sections.map((section, index) => {
            const isExpanded = expandedSections.has(section.key);
            return (
              <View key={section.key} style={styles.sectionWrapper}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(section.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sectionNumberBadge}>
                    <Text style={styles.sectionNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.expandIcon}>{isExpanded ? '−' : '+'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.sectionContent}>
                    <Text style={styles.sectionText}>{section.content}</Text>
                    {section.keyInsight && (
                      <View style={styles.keyInsightBox}>
                        <Text style={styles.keyInsightLabel}>Key Insight</Text>
                        <Text style={styles.keyInsightText}>{section.keyInsight}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            BaZi describes patterns and effort. Outcomes depend on personal choices.
          </Text>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorText: {
    color: '#B22222',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FDF5E6',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 12,
  },
  pillarCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  pillarText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  pillarTranslation: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  interactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  interactionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  interactionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  interactionDesc: {
    fontSize: 13,
    color: '#8B7355',
    marginTop: 2,
  },
  microActionCard: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  microActionTitle: {
    fontSize: 12,
    color: '#D4A574',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  microActionText: {
    fontSize: 16,
    color: '#FDF5E6',
    lineHeight: 24,
  },
  sectionsContainer: {
    marginBottom: 16,
  },
  sectionWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D4A574',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionNumber: {
    color: '#FDF5E6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
  },
  expandIcon: {
    fontSize: 24,
    color: '#8B7355',
    marginLeft: 8,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0E0C8',
    paddingTop: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 24,
  },
  keyInsightBox: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  keyInsightLabel: {
    fontSize: 11,
    color: '#8B4513',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  keyInsightText: {
    fontSize: 14,
    color: '#5D3A1A',
    fontStyle: 'italic',
  },
  disclaimer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
