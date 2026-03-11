import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Assignment } from '../types';
import { colors, spacing } from '../theme';

interface Props {
  assignment: Assignment;
  showApproval?: boolean;
  showComplete?: boolean;
  onApprove?: () => void;
  onReject?: (reason?: string) => void;
  onComplete?: () => void;
}

const statusColors: Record<string, string> = {
  pending: colors.secondary,
  completed: colors.primary,
  approved: colors.success,
  rejected: colors.danger,
};

export default function AssignmentCard({
  assignment, showApproval, showComplete, onApprove, onReject, onComplete,
}: Props) {
  const statusColor = statusColors[assignment.status] ?? colors.textLight;
  const choreTitle = assignment.chore?.title ?? 'Chore';
  const childName = assignment.child?.displayName ?? '';
  const points = assignment.chore?.points ?? 0;

  const handleReject = () => {
    Alert.prompt?.(
      'Reject Assignment',
      'Provide a reason (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: (text) => onReject?.(text) },
      ]
    ) ?? onReject?.();
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{choreTitle}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {assignment.status.toUpperCase()}
            </Text>
          </View>
        </View>
        {childName ? <Text style={styles.childName}>{childName}</Text> : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.points}>{points} pts</Text>

        {showComplete && (
          <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
            <Text style={styles.completeText}>Mark Done</Text>
          </TouchableOpacity>
        )}

        {showApproval && (
          <View style={styles.approvalButtons}>
            <TouchableOpacity style={styles.approveButton} onPress={onApprove}>
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {assignment.note && <Text style={styles.note}>Note: {assignment.note}</Text>}
      {assignment.rejectionReason && (
        <Text style={styles.rejection}>Reason: {assignment.rejectionReason}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  header: { marginBottom: spacing.sm },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  childName: { fontSize: 14, color: colors.textMedium, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  points: { fontSize: 15, fontWeight: '700', color: colors.secondary },
  approvalButtons: { flexDirection: 'row', gap: 8 },
  approveButton: { backgroundColor: colors.success, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  approveText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  rejectButton: { backgroundColor: colors.danger + '15', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  rejectText: { color: colors.danger, fontWeight: '600', fontSize: 14 },
  completeButton: { backgroundColor: colors.success, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  completeText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  note: { fontSize: 13, color: colors.textMedium, marginTop: spacing.xs, fontStyle: 'italic' },
  rejection: { fontSize: 13, color: colors.danger, marginTop: spacing.xs },
});
