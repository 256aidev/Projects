import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../auth';
import { colors, spacing } from '../../theme';

export default function SettingsScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.role}>{user?.role === 'parent' ? 'Parent' : 'Child'}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menu}>
        <MenuItem
          label="Manage Children"
          onPress={() => navigation.navigate('ManageChildren')}
        />
        <MenuItem
          label="Leaderboard"
          onPress={() => navigation.navigate('Leaderboard')}
        />
        <MenuItem
          label="Notifications"
          onPress={() => navigation.navigate('Notifications')}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>ChoreQuest v1.0.0</Text>
    </View>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 16, padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, color: colors.textMedium, marginTop: 2 },
  role: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2, textTransform: 'capitalize' },
  menu: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuLabel: { fontSize: 16, color: colors.text },
  menuArrow: { fontSize: 22, color: colors.textLight },
  logoutButton: {
    backgroundColor: colors.danger + '10', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: spacing.md,
  },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', color: colors.textLight, fontSize: 13, marginTop: spacing.xl },
});
