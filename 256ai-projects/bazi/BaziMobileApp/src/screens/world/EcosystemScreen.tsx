/**
 * Ecosystem Screen
 * 256ai app ecosystem links
 * "This app focuses on internal patterns (BaZi).
 *  Other apps in the ecosystem explore complementary systems."
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { AdBanner } from '../../components/ads';

interface AppCardProps {
  emoji: string;
  name: string;
  description: string;
  status: 'available' | 'coming_soon' | 'planned';
  appStoreUrl?: string;
}

function AppCard({ emoji, name, description, status, appStoreUrl }: AppCardProps) {
  const handlePress = () => {
    if (status === 'available' && appStoreUrl) {
      Linking.openURL(appStoreUrl);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'available':
        return { text: 'Available', color: '#4A7C59' };
      case 'coming_soon':
        return { text: 'Coming Soon', color: '#8B8B6B' };
      case 'planned':
        return { text: 'Planned', color: '#999999' };
    }
  };

  const badge = getStatusBadge();

  return (
    <TouchableOpacity
      style={[styles.appCard, status !== 'available' && styles.appCardDisabled]}
      onPress={handlePress}
      disabled={status !== 'available'}
    >
      <Text style={styles.appEmoji}>{emoji}</Text>
      <View style={styles.appContent}>
        <View style={styles.appHeader}>
          <Text style={styles.appName}>{name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.statusText}>{badge.text}</Text>
          </View>
        </View>
        <Text style={styles.appDescription}>{description}</Text>
      </View>
      {status === 'available' && (
        <Text style={styles.appArrow}>&gt;</Text>
      )}
    </TouchableOpacity>
  );
}

export default function EcosystemScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>256ai Ecosystem</Text>
          <Text style={styles.headerSubtitle}>
            This app focuses on internal patterns (BaZi).{'\n'}
            Other apps in the ecosystem explore complementary systems.
          </Text>
        </View>

        {/* Current App */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>You Are Here</Text>
          <View style={styles.currentApp}>
            <Text style={styles.currentEmoji}>☯️</Text>
            <View>
              <Text style={styles.currentName}>BaZi Astrology</Text>
              <Text style={styles.currentDescription}>
                Personal patterns based on birth time
              </Text>
            </View>
          </View>
        </View>

        {/* Other Apps */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Complementary Systems</Text>

          <AppCard
            emoji="🏠"
            name="Feng Shui"
            description="Environmental alignment and space harmony. How your surroundings support your energy."
            status="coming_soon"
          />

          <AppCard
            emoji="🏛️"
            name="Eight Mansions"
            description="Personal directions and space optimization based on your birth year."
            status="planned"
          />

          <AppCard
            emoji="📅"
            name="Date Selection"
            description="Choose auspicious dates for important events based on BaZi principles."
            status="planned"
          />
        </View>

        {/* Philosophy */}
        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyTitle}>Why Multiple Apps?</Text>
          <Text style={styles.philosophyText}>
            Each system in Chinese metaphysics serves a distinct purpose. Rather than
            cramming everything into one app, we build focused tools that do one thing well.
          </Text>
          <Text style={styles.philosophyText}>
            BaZi focuses on the internal: who you are, how you think, and how you
            relate to others. Feng Shui focuses on the external: your environment
            and how it affects your energy. Together, they provide a complete picture.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            All 256ai apps are built on the same philosophy: describe patterns,
            preserve agency, never predict destiny. Your choices always matter most.
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
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  currentApp: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  currentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FDF5E6',
  },
  currentDescription: {
    fontSize: 13,
    color: '#D4A574',
    marginTop: 2,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    flexDirection: 'row',
    alignItems: 'center',
  },
  appCardDisabled: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E0E0E0',
  },
  appEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  appContent: {
    flex: 1,
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  appDescription: {
    fontSize: 13,
    color: '#8B7355',
    lineHeight: 18,
  },
  appArrow: {
    fontSize: 18,
    color: '#8B7355',
    marginLeft: 8,
  },
  philosophyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    marginBottom: 16,
  },
  philosophyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 10,
  },
  philosophyText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 10,
  },
  disclaimer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
