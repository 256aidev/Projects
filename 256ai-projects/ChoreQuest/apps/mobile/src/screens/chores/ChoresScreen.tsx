import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../api/client';
import { colors, spacing } from '../../theme';
import { Chore } from '../../types';

export default function ChoresScreen({ navigation }: any) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChores = useCallback(async () => {
    try {
      const result = await apiClient.get<Chore[]>('/api/households/me/chores?active=true');
      setChores(result);
    } catch (err) {
      console.error('Failed to fetch chores:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChores();
  }, [fetchChores]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchChores);
    return unsubscribe;
  }, [navigation, fetchChores]);

  const renderChore = ({ item }: { item: Chore }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ChoreDetail', { choreId: item.id, title: item.title })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.choreTitle}>{item.title}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{item.points} pts</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.cardFooter}>
        <Text style={styles.meta}>
          {item.recurrenceType === 'once' ? 'One-time' : item.recurrenceType}
        </Text>
        <Text style={styles.meta}>
          {item.assigneeMode === 'rotation' ? 'Rotation' : 'Assigned'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={chores}
        renderItem={renderChore}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchChores(); }} />}
        contentContainerStyle={chores.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No chores yet. Create your first one!</Text>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateChore')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.lg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  emptyText: { color: colors.textLight, fontSize: 16, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: 12, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  choreTitle: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  pointsBadge: { backgroundColor: colors.secondary + '20', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pointsText: { color: colors.secondary, fontWeight: '700', fontSize: 13 },
  description: { fontSize: 14, color: colors.textMedium, marginTop: spacing.xs },
  cardFooter: { flexDirection: 'row', gap: 12, marginTop: spacing.sm },
  meta: { fontSize: 12, color: colors.textLight, textTransform: 'capitalize' },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center',
    alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
});
