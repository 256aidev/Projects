/**
 * Pillar Reading Screen
 * Displays a detailed reading for one of the user's four pillars (year/month/day/hour).
 * Template-based backend endpoint — instant response.
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
import { RouteProp, useRoute } from '@react-navigation/native';
import { YouStackParamList } from '../../navigation/YouStack';

// Types for the API response
interface PillarSection {
  title: string;
  content: string;
}

interface PillarReadingResponse {
  userId: number;
  userName: string;
  pillarType: string;
  pillar: string;
  stem: string;
  branch: string;
  stemElement: string;
  stemPolarity: string;
  stemNature: string;
  branchAnimal: string;
  branchElement: string;
  lifeArea: string;
  lifeAreaAgeRange: string;
  sections: PillarSection[];
}

// Element colors
const ELEMENT_COLORS: Record<string, string> = {
  Wood: '#228B22',
  Fire: '#DC143C',
  Earth: '#DAA520',
  Metal: '#C0C0C0',
  Water: '#4169E1',
};

// Pillar type labels
const PILLAR_LABELS: Record<string, string> = {
  year: 'Year Pillar',
  month: 'Month Pillar',
  day: 'Day Pillar',
  hour: 'Hour Pillar',
};

type PillarReadingRouteProp = RouteProp<YouStackParamList, 'PillarReading'>;

export default function PillarReadingScreen() {
  const { user } = useAuth();
  const route = useRoute<PillarReadingRouteProp>();
  const { pillarType } = route.params;

  const [data, setData] = useState<PillarReadingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const fetchReading = async () => {
    if (!user) return;

    try {
      setError(null);
      const response = await apiClient.get<PillarReadingResponse>(
        `/api/pillar-reading/${user.id}/${pillarType}`
      );
      setData(response);
      // Auto-expand first section
      if (response.sections?.length > 0) {
        setExpandedSections(new Set([0]));
      }
    } catch (err) {
      console.error('Failed to load pillar reading:', err);
      setError('Failed to load pillar reading. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReading();
  }, [user, pillarType]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReading();
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#8B4513" />
        <Text style={styles.loadingText}>Loading pillar reading...</Text>
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

  const stemColor = ELEMENT_COLORS[data.stemElement] || '#8B4513';
  const branchColor = ELEMENT_COLORS[data.branchElement] || '#8B4513';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Pillar Characters */}
        <View style={styles.header}>
          <Text style={styles.pillarTypeLabel}>
            {PILLAR_LABELS[data.pillarType] || data.pillarType}
          </Text>
          <View style={[styles.pillarDisplay, { borderColor: stemColor }]}>
            <Text style={[styles.stemChar, { color: stemColor }]}>{data.stem}</Text>
            <Text style={styles.stemLabel}>
              {data.stemPolarity} {data.stemElement}
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.branchChar, { color: branchColor }]}>{data.branch}</Text>
            <Text style={styles.branchLabel}>{data.branchAnimal}</Text>
          </View>
        </View>

        {/* Life Area Badge */}
        <View style={styles.lifeAreaBadge}>
          <Text style={styles.lifeAreaTitle}>{data.lifeArea}</Text>
          <Text style={styles.lifeAreaAge}>Ages: {data.lifeAreaAgeRange}</Text>
        </View>

        {/* Element Info Row */}
        <View style={styles.elementRow}>
          <View style={styles.elementChip}>
            <View style={[styles.elementDot, { backgroundColor: stemColor }]} />
            <Text style={styles.elementChipText}>
              Stem: {data.stemPolarity} {data.stemElement}
            </Text>
          </View>
          <View style={styles.elementChip}>
            <View style={[styles.elementDot, { backgroundColor: branchColor }]} />
            <Text style={styles.elementChipText}>
              Branch: {data.branchElement} ({data.branchAnimal})
            </Text>
          </View>
        </View>

        {/* Expandable Sections */}
        <View style={styles.sectionsContainer}>
          {data.sections.map((section, index) => {
            const isExpanded = expandedSections.has(index);
            return (
              <View key={index} style={styles.sectionWrapper}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection(index)}
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
  pillarTypeLabel: {
    fontSize: 14,
    color: '#8B7355',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  pillarDisplay: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
  },
  stemChar: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  stemLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  divider: {
    height: 1,
    width: 60,
    backgroundColor: '#D4A574',
    marginVertical: 8,
  },
  branchChar: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  branchLabel: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
  },
  lifeAreaBadge: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  lifeAreaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FDF5E6',
  },
  lifeAreaAge: {
    fontSize: 13,
    color: '#D4A574',
    marginTop: 4,
  },
  elementRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
  },
  elementChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  elementDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  elementChipText: {
    fontSize: 13,
    color: '#5D3A1A',
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
    fontSize: 15,
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
