import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { apiClient } from '../../api/client';
import { colors, spacing } from '../../theme';
import { Child, CreateChoreRequest, RecurrenceType } from '../../types';

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
  { label: 'One-time', value: 'once' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Weekdays', value: 'weekdays' },
];

export default function CreateChoreScreen({ navigation }: any) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('10');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const members = await apiClient.get<any[]>('/api/households/me/members');
      const childMembers = members.filter((m: any) => m.role === 'child');
      setChildren(childMembers);
    } catch {
      // If members endpoint fails, try children endpoint
      try {
        const result = await apiClient.get<Child[]>('/api/households/me/children');
        setChildren(result);
      } catch (err) {
        console.error('Failed to fetch children:', err);
      }
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a chore title.');
      return;
    }

    const pointsNum = parseInt(points, 10);
    if (isNaN(pointsNum) || pointsNum < 0) {
      Alert.alert('Error', 'Please enter valid points.');
      return;
    }

    setLoading(true);
    try {
      const body: CreateChoreRequest = {
        title: title.trim(),
        description: description.trim() || undefined,
        points: pointsNum,
        recurrenceType: recurrence,
        assigneeMode: selectedChildId ? 'single' : 'rotation',
        assignedChildId: selectedChildId || undefined,
        approvalRequired,
      };

      await apiClient.post('/api/households/me/chores', body);
      navigation.goBack();
    } catch (err: any) {
      const msg = Array.isArray(err.data?.message)
        ? err.data.message.join('\n')
        : err.message || 'Failed to create chore.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Take out the trash"
        placeholderTextColor={colors.textLight}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional details..."
        placeholderTextColor={colors.textLight}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Points</Text>
      <TextInput
        style={styles.input}
        value={points}
        onChangeText={setPoints}
        keyboardType="number-pad"
        placeholder="10"
        placeholderTextColor={colors.textLight}
      />

      <Text style={styles.label}>Recurrence</Text>
      <View style={styles.optionRow}>
        {RECURRENCE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionChip, recurrence === opt.value && styles.optionChipActive]}
            onPress={() => setRecurrence(opt.value)}
          >
            <Text style={[styles.optionText, recurrence === opt.value && styles.optionTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Assign To</Text>
      <View style={styles.optionRow}>
        <TouchableOpacity
          style={[styles.optionChip, !selectedChildId && styles.optionChipActive]}
          onPress={() => setSelectedChildId(null)}
        >
          <Text style={[styles.optionText, !selectedChildId && styles.optionTextActive]}>
            Rotation
          </Text>
        </TouchableOpacity>
        {children.map((child) => (
          <TouchableOpacity
            key={child.id}
            style={[styles.optionChip, selectedChildId === child.id && styles.optionChipActive]}
            onPress={() => setSelectedChildId(child.id)}
          >
            <Text style={[styles.optionText, selectedChildId === child.id && styles.optionTextActive]}>
              {child.displayName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Requires Approval</Text>
        <Switch
          value={approvalRequired}
          onValueChange={setApprovalRequired}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={approvalRequired ? colors.primary : '#f4f3f4'}
        />
      </View>

      <TouchableOpacity
        style={[styles.createButton, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create Chore</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 16,
    color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  optionChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.text, fontWeight: '500', fontSize: 14 },
  optionTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  createButton: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
