import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { apiClient } from '../../api/client';
import { colors, spacing } from '../../theme';

const AVATAR_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#F97316', '#06B6D4',
];

export default function AddChildScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/households/me/children', {
        displayName: name.trim(),
        avatarColor: selectedColor,
        age: age ? parseInt(age, 10) : undefined,
      });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add child.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Add a Child</Text>

      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Child's name"
        placeholderTextColor={colors.textLight}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Age (optional)</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="e.g. 8"
        placeholderTextColor={colors.textLight}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Avatar Color</Text>
      <View style={styles.colorRow}>
        {AVATAR_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorCircle,
              { backgroundColor: color },
              selectedColor === color && styles.colorSelected,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <View style={[styles.avatar, { backgroundColor: selectedColor }]}>
          <Text style={styles.avatarText}>
            {name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.previewName}>{name.trim() || 'Child Name'}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Child</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  heading: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  label: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14, fontSize: 16,
    color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: spacing.xs },
  colorCircle: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: colors.text },
  preview: { alignItems: 'center', marginTop: spacing.xl },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  previewName: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  button: {
    backgroundColor: colors.primary, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
