/**
 * Relationship Grid Chart Component
 * 2D visualization of relationship compatibility (Ease vs Durability)
 * Uses neutral colors - only the marker dot is colored based on effort label
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

// Effort label colors (muted, non-alarming)
const EFFORT_COLORS: Record<string, string> = {
  'Low-Friction Dynamic': '#4A7C59',
  'Stable with Awareness': '#6B8E6B',
  'Workable with Intention': '#8B8B6B',
  'Growth-Focused': '#9B8B7B',
  'High-Effort Relationship': '#8B7B7B',
};

// Quadrant labels for 2D grid
const QUADRANT_LABELS = {
  topRight: 'Easy + Stable',
  topLeft: 'Stable but Effortful',
  bottomRight: 'Easy but Fragile',
  bottomLeft: 'Growth Opportunity',
};

interface RelationshipGridChartProps {
  easeScore: number;
  durabilityScore: number;
  displayEase?: number;
  displayDurability?: number;
  effortLabel: string;
  quadrantInterpretation?: string;
  effortFraming?: string;
}

export default function RelationshipGridChart({
  easeScore,
  durabilityScore,
  displayEase,
  displayDurability,
  effortLabel,
  quadrantInterpretation,
  effortFraming,
}: RelationshipGridChartProps) {
  // Use display scores for positioning if available, else raw scores
  const easeForVisual = displayEase ?? easeScore;
  const durForVisual = displayDurability ?? durabilityScore;

  // Get marker color based on effort label
  const markerColor = EFFORT_COLORS[effortLabel] || '#8B8B6B';

  // Calculate marker position (0-100 to percentage)
  const markerLeftPercent = Math.min(100, Math.max(0, easeForVisual));
  const markerBottomPercent = Math.min(100, Math.max(0, durForVisual));

  // Accessibility summary
  const accessibilitySummary = `${effortLabel}. Ease ${easeScore}, Durability ${durabilityScore}.`;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={accessibilitySummary}
      accessibilityRole="image"
    >
      {/* Effort Label Badge - Primary visual anchor */}
      <View style={[styles.labelBadge, { backgroundColor: markerColor }]}>
        <Text style={styles.labelText}>{effortLabel}</Text>
      </View>

      {/* Effort Framing - Actionable guidance */}
      {effortFraming && (
        <View style={styles.framingContainer}>
          <Text style={styles.framingText}>{effortFraming}</Text>
        </View>
      )}

      {/* 2D Grid - Visual representation */}
      <View style={styles.gridContainer}>
        {/* Y-axis label */}
        <View style={styles.yAxisLabel}>
          <Text style={styles.axisLabelText}>Durability</Text>
        </View>

        {/* Grid with quadrants */}
        <View style={styles.grid}>
          {/* Top row */}
          <View style={styles.gridRow}>
            <View style={[styles.quadrant, styles.quadrantTopLeft]}>
              <Text style={styles.quadrantLabel}>{QUADRANT_LABELS.topLeft}</Text>
            </View>
            <View style={[styles.quadrant, styles.quadrantTopRight]}>
              <Text style={styles.quadrantLabel}>{QUADRANT_LABELS.topRight}</Text>
            </View>
          </View>
          {/* Bottom row */}
          <View style={styles.gridRow}>
            <View style={[styles.quadrant, styles.quadrantBottomLeft]}>
              <Text style={styles.quadrantLabel}>{QUADRANT_LABELS.bottomLeft}</Text>
            </View>
            <View style={[styles.quadrant, styles.quadrantBottomRight]}>
              <Text style={styles.quadrantLabel}>{QUADRANT_LABELS.bottomRight}</Text>
            </View>
          </View>

          {/* Marker dot */}
          <View
            style={[
              styles.markerContainer,
              {
                left: `${markerLeftPercent}%`,
                bottom: `${markerBottomPercent}%`,
              },
            ]}
          >
            <View style={[styles.markerDot, { backgroundColor: markerColor }]} />
          </View>

          {/* Center lines */}
          <View style={styles.centerLineHorizontal} />
          <View style={styles.centerLineVertical} />
        </View>

        {/* X-axis label */}
        <Text style={styles.xAxisLabel}>Ease</Text>
      </View>

      {/* Quadrant Interpretation */}
      {quadrantInterpretation && (
        <View style={styles.interpretationContainer}>
          <Text style={styles.interpretationText}>{quadrantInterpretation}</Text>
        </View>
      )}

      {/* Scores - Secondary, de-emphasized */}
      <View style={styles.scoreDisplay}>
        <View style={styles.scoreItem}>
          <Text style={styles.scoreNumber}>{easeScore}</Text>
          <Text style={styles.scoreType}>Ease</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreItem}>
          <Text style={styles.scoreNumber}>{durabilityScore}</Text>
          <Text style={styles.scoreType}>Durability</Text>
        </View>
      </View>

      {/* Guide */}
      <View style={styles.guideContainer}>
        <Text style={styles.guideText}>
          <Text style={styles.guideBold}>Ease</Text> = day-to-day harmony  •
          <Text style={styles.guideBold}>Durability</Text> = long-term stability
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  labelBadge: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 12,
  },
  labelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 17,
  },
  framingContainer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  framingText: {
    fontSize: 14,
    color: '#5D3A1A',
    textAlign: 'center',
    lineHeight: 20,
  },
  gridContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  yAxisLabel: {
    position: 'absolute',
    left: -8,
    top: '50%',
    transform: [{ rotate: '-90deg' }, { translateX: -30 }],
    zIndex: 1,
  },
  axisLabelText: {
    fontSize: 11,
    color: '#8B7355',
    fontWeight: '500',
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#8B7355',
    fontWeight: '500',
    marginTop: 8,
  },
  grid: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  gridRow: {
    flexDirection: 'row',
    flex: 1,
  },
  quadrant: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  quadrantTopLeft: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  quadrantTopRight: {
    backgroundColor: '#F0F5F0',
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  quadrantBottomLeft: {
    backgroundColor: '#F8F8F5',
    borderBottomLeftRadius: 8,
    borderRightWidth: 1,
    borderColor: '#E0E0E0',
  },
  quadrantBottomRight: {
    backgroundColor: '#F5F5F5',
    borderBottomRightRadius: 8,
  },
  quadrantLabel: {
    fontSize: 10,
    color: '#999999',
    textAlign: 'center',
  },
  centerLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: '#CCCCCC',
  },
  centerLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: '#CCCCCC',
  },
  markerContainer: {
    position: 'absolute',
    marginLeft: -10,
    marginBottom: -10,
    zIndex: 10,
  },
  markerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  interpretationContainer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  interpretationText: {
    fontSize: 14,
    color: '#5D3A1A',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scoreDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    opacity: 0.7,
  },
  scoreItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#8B7355',
  },
  scoreType: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 2,
  },
  scoreDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#D4A574',
  },
  guideContainer: {
    backgroundColor: '#FDF5E6',
    borderRadius: 8,
    padding: 10,
  },
  guideText: {
    fontSize: 11,
    color: '#8B7355',
    textAlign: 'center',
  },
  guideBold: {
    fontWeight: '600',
    color: '#5D3A1A',
  },
});
