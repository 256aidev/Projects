/**
 * What Is BaZi Screen
 * Foundational educational content explaining what BaZi is and how this app uses it
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { AdBanner } from '../../components/ads';

export default function WhatIsBaZiScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>What Is BaZi?</Text>
          <Text style={styles.headerSubtitle}>
            Understanding the Four Pillars system
          </Text>
        </View>

        {/* Definition Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Definition</Text>
          <Text style={styles.cardText}>
            BaZi (Four Pillars) is a descriptive system that explains personal and
            relational patterns based on time of birth.
          </Text>
          <Text style={styles.cardText}>
            It highlights where life feels natural and where effort is required.
          </Text>
          <Text style={styles.cardTextEmphasis}>
            It does not predict outcomes or make decisions for you.
          </Text>
        </View>

        {/* What BaZi Looks At */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>What BaZi Looks At</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Time patterns and natural cycles
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Internal tendencies and natural inclinations
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Where effort flows naturally vs. where adaptation is needed
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                Element interactions and relationship dynamics
              </Text>
            </View>
          </View>
        </View>

        {/* What BaZi Does NOT Do */}
        <View style={styles.cardWarning}>
          <Text style={styles.cardTitle}>What BaZi Does NOT Do</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletCross}>✕</Text>
              <Text style={styles.bulletText}>
                Predict the future or determine outcomes
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletCross}>✕</Text>
              <Text style={styles.bulletText}>
                Judge people as "good" or "bad"
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletCross}>✕</Text>
              <Text style={styles.bulletText}>
                Replace personal choice or responsibility
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bulletCross}>✕</Text>
              <Text style={styles.bulletText}>
                Tell you what you must or cannot do
              </Text>
            </View>
          </View>
        </View>

        {/* How This App Uses BaZi */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How This App Uses BaZi</Text>

          <View style={styles.usageItem}>
            <Text style={styles.usageIcon}>📅</Text>
            <View style={styles.usageContent}>
              <Text style={styles.usageTitle}>Daily Awareness</Text>
              <Text style={styles.usageText}>
                Readings that help you understand the energy of each day and how it
                interacts with your chart.
              </Text>
            </View>
          </View>

          <View style={styles.usageItem}>
            <Text style={styles.usageIcon}>❤️</Text>
            <View style={styles.usageContent}>
              <Text style={styles.usageTitle}>Relationship Dynamics</Text>
              <Text style={styles.usageText}>
                Insights into how your energy patterns interact with family members and
                partners, showing where connection flows easily and where awareness helps.
              </Text>
            </View>
          </View>

          <View style={styles.usageItem}>
            <Text style={styles.usageIcon}>🧠</Text>
            <View style={styles.usageContent}>
              <Text style={styles.usageTitle}>BaZi Intelligence</Text>
              <Text style={styles.usageText}>
                Understanding how you naturally think, process information, and make
                decisions based on your Day Master.
              </Text>
            </View>
          </View>
        </View>

        {/* Agency Statement */}
        <View style={styles.agencyCard}>
          <Text style={styles.agencyTitle}>A Note on Personal Agency</Text>
          <Text style={styles.agencyText}>
            Your chart describes patterns and tendencies — it does not determine outcomes.
          </Text>
          <Text style={styles.agencyText}>
            Every relationship can thrive with awareness and intention. Every challenge
            can be navigated with understanding.
          </Text>
          <Text style={styles.agencyEmphasis}>
            You always have the power to choose how you respond.
          </Text>
        </View>

        {/* Flow Diagram */}
        <View style={styles.flowCard}>
          <Text style={styles.flowTitle}>The BaZi Approach</Text>
          <View style={styles.flowDiagram}>
            <View style={styles.flowStep}>
              <Text style={styles.flowIcon}>🔍</Text>
              <Text style={styles.flowLabel}>Pattern</Text>
            </View>
            <Text style={styles.flowArrow}>→</Text>
            <View style={styles.flowStep}>
              <Text style={styles.flowIcon}>💡</Text>
              <Text style={styles.flowLabel}>Awareness</Text>
            </View>
            <Text style={styles.flowArrow}>→</Text>
            <View style={styles.flowStep}>
              <Text style={styles.flowIcon}>🎯</Text>
              <Text style={styles.flowLabel}>Choice</Text>
            </View>
            <Text style={styles.flowArrow}>→</Text>
            <View style={styles.flowStep}>
              <Text style={styles.flowIcon}>✨</Text>
              <Text style={styles.flowLabel}>Outcome</Text>
            </View>
          </View>
          <Text style={styles.flowCaption}>
            BaZi illuminates patterns. You create outcomes.
          </Text>
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
  header: {
    marginBottom: 20,
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  cardWarning: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5C9A8',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
    marginBottom: 8,
  },
  cardTextEmphasis: {
    fontSize: 14,
    color: '#5D3A1A',
    lineHeight: 22,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  bulletList: {
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    color: '#8B4513',
    marginRight: 10,
    marginTop: 2,
  },
  bulletCross: {
    fontSize: 12,
    color: '#B8860B',
    marginRight: 10,
    marginTop: 3,
    fontWeight: 'bold',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  usageItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  usageIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  usageContent: {
    flex: 1,
  },
  usageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 4,
  },
  usageText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },
  agencyCard: {
    backgroundColor: '#F0EDE8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4C9B8',
  },
  agencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 10,
  },
  agencyText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 21,
    marginBottom: 8,
  },
  agencyEmphasis: {
    fontSize: 14,
    color: '#5D3A1A',
    lineHeight: 21,
    fontWeight: '600',
    marginTop: 4,
  },
  flowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
    alignItems: 'center',
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 16,
  },
  flowDiagram: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  flowStep: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  flowIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  flowLabel: {
    fontSize: 11,
    color: '#8B7355',
    fontWeight: '500',
  },
  flowArrow: {
    fontSize: 16,
    color: '#C4A574',
    paddingHorizontal: 2,
  },
  flowCaption: {
    fontSize: 12,
    color: '#8B7355',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
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
