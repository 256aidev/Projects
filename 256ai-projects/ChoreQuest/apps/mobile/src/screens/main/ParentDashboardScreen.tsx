import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../api/client';
import { useAuth } from '../../auth';
import { colors, spacing } from '../../theme';
import { ParentDashboard, Assignment } from '../../types';
import AssignmentCard from '../../components/AssignmentCard';
import ChildChip from '../../components/ChildChip';
import StatsRow from '../../components/StatsRow';

export default function ParentDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [data, setData] = useState<ParentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await apiClient.get<ParentDashboard>('/api/households/me/dashboard/parent');
      setData(result);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleApprove = async (assignmentId: string) => {
    try {
      await apiClient.post(`/api/assignments/${assignmentId}/approve`);
      fetchDashboard();
    } catch (err: any) {
      console.error('Approve failed:', err);
    }
  };

  const handleReject = async (assignmentId: string, reason?: string) => {
    try {
      await apiClient.post(`/api/assignments/${assignmentId}/reject`, { reason });
      fetchDashboard();
    } catch (err: any) {
      console.error('Reject failed:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const pendingCount = data?.pendingApprovals?.length ?? 0;
  const childCount = data?.children?.length ?? 0;
  const todayCount = data?.todayAssignments?.length ?? 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.greeting}>Hi, {user?.displayName}!</Text>

      <StatsRow
        stats={[
          { label: 'Children', value: childCount, color: colors.primary },
          { label: 'Today', value: todayCount, color: colors.secondary },
          { label: 'Pending', value: pendingCount, color: pendingCount > 0 ? colors.danger : colors.success },
        ]}
      />

      {/* Children */}
      {data?.children && data.children.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Children</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {data.children.map((child) => (
              <ChildChip
                key={child.id}
                child={child}
                onPress={() => navigation.navigate('ChildDashboard', { childId: child.id, childName: child.displayName })}
              />
            ))}
            <TouchableOpacity
              style={styles.addChip}
              onPress={() => navigation.navigate('AddChild')}
            >
              <Text style={styles.addChipText}>+ Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Pending Approvals */}
      {pendingCount > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          {data!.pendingApprovals.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              showApproval
              onApprove={() => handleApprove(assignment.id)}
              onReject={(reason) => handleReject(assignment.id, reason)}
            />
          ))}
        </View>
      )}

      {/* Today's Assignments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Chores</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Chores')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {data?.todayAssignments && data.todayAssignments.length > 0 ? (
          data.todayAssignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))
        ) : (
          <Text style={styles.emptyText}>No chores assigned for today. Create some!</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  seeAll: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  chipRow: { flexDirection: 'row', marginBottom: spacing.sm },
  addChip: {
    backgroundColor: colors.border, borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, marginRight: 8, justifyContent: 'center',
  },
  addChipText: { color: colors.textMedium, fontWeight: '600' },
  emptyText: { color: colors.textLight, fontSize: 15, textAlign: 'center', paddingVertical: 24 },
});
