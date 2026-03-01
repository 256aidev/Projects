/**
 * World Screen
 * Main hub for "The BaZi World" educational atlas
 * Goal: "I understand the system now."
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AdBanner } from '../../components/ads';
import { WorldStackParamList } from '../../navigation/WorldStack';

type NavigationProp = NativeStackNavigationProp<WorldStackParamList>;

interface SectionCardProps {
  icon: string;
  title: string;
  description: string;
  status: 'ready' | 'coming_soon';
  onPress?: () => void;
}

function SectionCard({ icon, title, description, status, onPress }: SectionCardProps) {
  const isReady = status === 'ready';

  return (
    <TouchableOpacity
      style={[styles.sectionCard, !isReady && styles.sectionCardDisabled]}
      onPress={isReady ? onPress : undefined}
      disabled={!isReady}
    >
      <Text style={styles.sectionIcon}>{icon}</Text>
      <View style={styles.sectionContent}>
        <Text style={[styles.sectionTitle, !isReady && styles.sectionTitleDisabled]}>
          {title}
        </Text>
        <Text style={[styles.sectionDescription, !isReady && styles.sectionDescriptionDisabled]}>
          {description}
        </Text>
      </View>
      {isReady ? (
        <Text style={styles.sectionArrow}>&gt;</Text>
      ) : (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Soon</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function WorldScreen() {
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>The BaZi World</Text>
          <Text style={styles.headerSubtitle}>
            Explore the ancient wisdom of Chinese metaphysics.
            Tap any topic to learn more.
          </Text>
        </View>

        {/* Start Here */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Start Here</Text>

          <SectionCard
            icon="❓"
            title="What Is BaZi?"
            description="Understanding the Four Pillars system and how this app uses it"
            status="ready"
            onPress={() => navigation.navigate('WhatIsBaZi')}
          />
        </View>

        {/* Core Concepts */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Core Concepts</Text>

          <SectionCard
            icon="🌊"
            title="The Five Elements"
            description="Wood, Fire, Earth, Metal, Water — the building blocks of BaZi"
            status="ready"
            onPress={() => navigation.navigate('Elements', {})}
          />

          <SectionCard
            icon="🐲"
            title="The Twelve Animals"
            description="The Earthly Branches and their zodiac correspondences"
            status="ready"
            onPress={() => navigation.navigate('Animals', {})}
          />

          <SectionCard
            icon="🏛️"
            title="The Four Pillars"
            description="Year, Month, Day, Hour — what each pillar represents"
            status="ready"
            onPress={() => navigation.navigate('FourPillars')}
          />
        </View>

        {/* Relationships */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Relationships & Patterns</Text>

          <SectionCard
            icon="🔗"
            title="Relationship Patterns"
            description="Combinations, clashes, harms, and punishments explained"
            status="ready"
            onPress={() => navigation.navigate('Patterns')}
          />

          <SectionCard
            icon="✨"
            title="Symbolic Influences"
            description="Special stars and their meanings in BaZi charts"
            status="ready"
            onPress={() => navigation.navigate('Influences')}
          />
        </View>

        {/* Ecosystem */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Explore More</Text>

          <SectionCard
            icon="🌐"
            title="256ai Ecosystem"
            description="Other apps that explore complementary systems"
            status="ready"
            onPress={() => navigation.navigate('Ecosystem')}
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            BaZi is a descriptive system, not predictive. It describes patterns and
            tendencies, not destiny. Your choices always matter most.
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
    fontSize: 28,
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionCardDisabled: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E0E0E0',
  },
  sectionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  sectionContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 2,
  },
  sectionTitleDisabled: {
    color: '#999999',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#8B7355',
  },
  sectionDescriptionDisabled: {
    color: '#AAAAAA',
  },
  sectionArrow: {
    fontSize: 18,
    color: '#8B7355',
    marginLeft: 8,
  },
  comingSoonBadge: {
    backgroundColor: '#F0E6D3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  comingSoonText: {
    fontSize: 10,
    color: '#8B7355',
    fontWeight: '600',
  },
  disclaimer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
