import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../api/client';
import { colors, spacing } from '../../theme';
import { ChildDashboard, Assignment } from '../../types';
import AssignmentCard from '../../components/AssignmentCard';
import StatsRow from '../../components/StatsRow';

export default function ChildDashboardScreen({ route }: any) {
  const { childId, childName } = route.params;
  const [data, setData] = useState<ChildDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const result = await apiClient.get<ChildDashboard>(
        `/api/households/me/dashboard/child/${childId}`
      );
      setData(result);
    } catch (err) {
      console.error('Failed to fetch child dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleComplete = async (assignmentId: string) => {
    try {
      await apiClient.post(`/api/assignments/${assignmentId}/complete`);
      fetchDashboard();
    } catch (err: any) {
      console.error('Complete failed:', err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
    >
      <Text style={styles.name}>{childName}'s Chores</Text>

      <StatsRow
        stats={[
          { label: 'Points', value: data?.points ?? 0, color: colors.secondary },
          { label: 'Streak', value: data?.streak ?? 0, color: colors.primary },
          { label: 'Done Today', value: `${data?.completedToday ?? 0}/${data?.totalToday ?? 0}`, color: colors.success },
        ]}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Assignments</Text>
        {data?.todayAssignments && data.todayAssignments.length > 0 ? (
          data.todayAssignments.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              showComplete={a.status === 'pending'}
              onComplete={() => handleComplete(a.id)}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No assignments for today!</Text>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyText: { color: colors.textLight, fontSize: 15, textAlign: 'center', paddingVertical: 24 },
});
