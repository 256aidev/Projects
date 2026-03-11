export const colors = {
  primary: '#6366F1',     // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  secondary: '#F59E0B',   // Amber (points/rewards)
  success: '#10B981',     // Green (completed)
  warning: '#F59E0B',     // Amber
  danger: '#EF4444',      // Red (rejected/overdue)
  background: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textLight: '#94A3B8',
  textMedium: '#64748B',
};

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const, color: colors.text },
  subtitle: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  caption: { fontSize: 13, color: colors.textLight },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
