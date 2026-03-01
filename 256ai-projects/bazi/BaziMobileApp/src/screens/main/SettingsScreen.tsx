/**
 * Settings Screen
 * User preferences, language, and logout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../auth';
import { updatePreferences, updateUserProfile } from '../../api/users';
import { usePurchases, PRODUCT_IDS, SUBSCRIPTION_PRODUCTS } from '../../purchases';
import { useAchievements } from '../../achievements';

type ReadingTone = 'mystical' | 'balanced' | 'practical';
type Language = 'en' | 'zh';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, refreshUser } = useAuth();
  const {
    hasRemoveAds,
    hasPremiumAnnual,
    hasWeeklyForecast,
    hasMonthlyForecast,
    hasYearlyForecast,
    purchaseProduct,
    restorePurchases,
    getProduct,
    isLoading: isPurchaseLoading
  } = usePurchases();
  const { streak } = useAchievements();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Get product info
  const removeAdsProduct = getProduct(PRODUCT_IDS.REMOVE_ADS);
  const premiumProduct = getProduct(PRODUCT_IDS.PREMIUM_ANNUAL);

  const handlePremiumAnnual = async () => {
    if (hasPremiumAnnual) return;

    Alert.alert(
      'Premium Annual',
      `Unlock ALL features for ${premiumProduct?.priceString || '$9.99'}/year:\n\n• Weekly Forecast with Four Pillars\n• Monthly & Yearly Forecasts\n• 7-Day Future Readings\n• Family Compatibility Forecasts\n• Remove All Ads`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            await purchaseProduct(PRODUCT_IDS.PREMIUM_ANNUAL);
          },
        },
      ]
    );
  };

  const handleRemoveAds = async () => {
    if (hasRemoveAds) return;
    await purchaseProduct(PRODUCT_IDS.REMOVE_ADS);
  };

  const handleRestorePurchases = async () => {
    await restorePurchases();
  };

  const handleManageSubscriptions = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  // Check if user has any active subscriptions
  const hasActiveSubscriptions = hasPremiumAnnual || hasWeeklyForecast ||
    hasMonthlyForecast || hasYearlyForecast;

  // Modal states
  const [showTonePicker, setShowTonePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Temp values for pickers
  const [tempDate, setTempDate] = useState<Date>(
    user?.birth_date ? new Date(user.birth_date) : new Date()
  );
  const [tempTime, setTempTime] = useState<Date>(() => {
    if (user?.birth_time) {
      const [hours, minutes] = user.birth_time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return date;
    }
    return new Date();
  });

  const toneLabels: Record<ReadingTone, string> = {
    mystical: 'Mystical & Poetic',
    balanced: 'Balanced',
    practical: 'Practical & Direct',
  };

  const languageLabels: Record<Language, string> = {
    en: 'English',
    zh: 'Chinese',
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleNavigateToAchievements = () => {
    navigation.navigate('Profile', { screen: 'Achievements' });
  };

  const handleToneChange = async (tone: ReadingTone) => {
    if (!user) return;
    setShowTonePicker(false);
    setIsSaving(true);

    try {
      await updatePreferences(user.id, { preferred_tone: tone });
      await refreshUser();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reading tone. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (language: Language) => {
    if (!user) return;
    setShowLanguagePicker(false);
    setIsSaving(true);

    try {
      await updatePreferences(user.id, { language });
      await refreshUser();
    } catch (error) {
      Alert.alert('Error', 'Failed to update language. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleTimeChange = (_event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTempTime(selectedTime);
    }
  };

  const saveBirthDate = async () => {
    if (!user) return;
    setShowDatePicker(false);
    setIsSaving(true);

    try {
      const dateStr = tempDate.toISOString().split('T')[0];
      await updateUserProfile(user.id, { birth_date: dateStr });
      await refreshUser();
      Alert.alert(
        'Birth Date Updated',
        'Your chart will be recalculated overnight. Changes take effect within 24 hours.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update birth date. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveBirthTime = async () => {
    if (!user) return;
    setShowTimePicker(false);
    setIsSaving(true);

    try {
      const hours = tempTime.getHours().toString().padStart(2, '0');
      const minutes = tempTime.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hours}:${minutes}:00`;
      await updateUserProfile(user.id, { birth_time: timeStr });
      await refreshUser();
      Alert.alert(
        'Birth Time Updated',
        'Your chart will be recalculated overnight. Changes take effect within 24 hours.'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update birth time. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { value: string; label: string }[],
    selectedValue: string,
    onSelect: (value: any) => void
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                selectedValue === option.value && styles.optionRowSelected,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedValue === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
              {selectedValue === option.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderDateTimePickerModal = (
    visible: boolean,
    onClose: () => void,
    onSave: () => void,
    mode: 'date' | 'time',
    value: Date,
    onChange: (event: any, date?: Date) => void
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {mode === 'date' ? 'Select Birth Date' : 'Select Birth Time'}
          </Text>
          <DateTimePicker
            value={value}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChange}
            maximumDate={mode === 'date' ? new Date() : undefined}
            style={styles.datePicker}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Auth Method</Text>
            <Text style={styles.value}>
              {user?.auth_provider === 'email'
                ? 'Email & Password'
                : user?.auth_provider || '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Achievements Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Engagement</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleNavigateToAchievements}
          >
            <View style={styles.achievementContent}>
              <Text style={styles.label}>Achievements</Text>
              <Text style={styles.sublabel}>
                {streak.currentStreak > 0
                  ? `${streak.currentStreak} day streak`
                  : 'Track your progress'}
              </Text>
            </View>
            <View style={styles.achievementRight}>
              <Text style={styles.achievementIcon}>🏆</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowTonePicker(true)}
            disabled={isSaving}
          >
            <Text style={styles.label}>Reading Tone</Text>
            <View style={styles.editableValue}>
              <Text style={styles.value}>
                {toneLabels[(user?.preferred_tone as ReadingTone) || 'balanced']}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowLanguagePicker(true)}
            disabled={isSaving}
          >
            <Text style={styles.label}>Language</Text>
            <View style={styles.editableValue}>
              <Text style={styles.value}>
                {languageLabels[(user?.language as Language) || 'en']}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Daily Reading Reminder</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D4A574', true: '#8B4513' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* Premium Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Premium</Text>
        <View style={styles.card}>
          {/* Premium Annual - Best Value */}
          <TouchableOpacity
            style={[styles.row, styles.premiumRow]}
            onPress={handlePremiumAnnual}
            disabled={hasPremiumAnnual || isPurchaseLoading}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumHeader}>
                <Text style={styles.premiumLabel}>Premium Annual</Text>
                {!hasPremiumAnnual && (
                  <View style={styles.bestValueBadge}>
                    <Text style={styles.bestValueText}>Best Value</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sublabel}>
                {hasPremiumAnnual ? 'Active - All features unlocked' : 'Unlock all features'}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              {isPurchaseLoading ? (
                <ActivityIndicator size="small" color="#8B4513" />
              ) : hasPremiumAnnual ? (
                <Text style={styles.purchasedText}>Active</Text>
              ) : (
                <Text style={styles.priceText}>
                  {premiumProduct?.priceString || '$9.99'}/yr
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          {/* Remove Ads Only */}
          <TouchableOpacity
            style={styles.row}
            onPress={handleRemoveAds}
            disabled={hasRemoveAds || isPurchaseLoading}
          >
            <View>
              <Text style={styles.label}>Remove Ads</Text>
              <Text style={styles.sublabel}>
                {hasRemoveAds ? 'Purchased' : 'Enjoy an ad-free experience'}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              {isPurchaseLoading ? (
                <ActivityIndicator size="small" color="#8B4513" />
              ) : hasRemoveAds ? (
                <Text style={styles.purchasedText}>Purchased</Text>
              ) : (
                <Text style={styles.priceText}>
                  {removeAdsProduct?.priceString || '$1.99'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          {/* Restore Purchases and Manage Subscriptions hidden - RevenueCat disabled */}
        </View>
      </View>

      {/* Birth Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Birth Data</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowDatePicker(true)}
            disabled={isSaving}
          >
            <Text style={styles.label}>Date</Text>
            <View style={styles.editableValue}>
              <Text style={styles.value}>{user?.birth_date || '—'}</Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => setShowTimePicker(true)}
            disabled={isSaving}
          >
            <Text style={styles.label}>Time</Text>
            <View style={styles.editableValue}>
              <Text style={styles.value}>
                {user?.birth_time?.slice(0, 5) || '12:00'}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{user?.birth_location || '—'}</Text>
          </View>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>BaZi Astrology</Text>
        <Text style={styles.footerSubtext}>Your Personal Four Pillars</Text>
      </View>

      {/* Tone Picker Modal */}
      {renderPickerModal(
        showTonePicker,
        () => setShowTonePicker(false),
        'Reading Tone',
        [
          { value: 'mystical', label: 'Mystical & Poetic' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'practical', label: 'Practical & Direct' },
        ],
        user?.preferred_tone || 'balanced',
        handleToneChange
      )}

      {/* Language Picker Modal */}
      {renderPickerModal(
        showLanguagePicker,
        () => setShowLanguagePicker(false),
        'Language',
        [
          { value: 'en', label: 'English' },
          { value: 'zh', label: 'Chinese' },
        ],
        user?.language || 'en',
        handleLanguageChange
      )}

      {/* Date Picker Modal */}
      {renderDateTimePickerModal(
        showDatePicker,
        () => setShowDatePicker(false),
        saveBirthDate,
        'date',
        tempDate,
        handleDateChange
      )}

      {/* Time Picker Modal */}
      {renderDateTimePickerModal(
        showTimePicker,
        () => setShowTimePicker(false),
        saveBirthTime,
        'time',
        tempTime,
        handleTimeChange
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4A574',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E6D3',
    marginLeft: 16,
  },
  label: {
    fontSize: 16,
    color: '#5D3A1A',
  },
  value: {
    fontSize: 16,
    color: '#8B7355',
  },
  editableValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 20,
    color: '#D4A574',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B22222',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#B22222',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4A574',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#A0A0A0',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionRowSelected: {
    backgroundColor: '#FDF5E6',
  },
  optionText: {
    fontSize: 16,
    color: '#5D3A1A',
  },
  optionTextSelected: {
    color: '#8B4513',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F0E6D3',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '600',
  },
  datePicker: {
    width: '100%',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sublabel: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  achievementContent: {
    flex: 1,
  },
  achievementRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementIcon: {
    fontSize: 24,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
  },
  purchasedText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  // Premium Annual styles
  premiumRow: {
    backgroundColor: '#FDF5E6',
  },
  premiumContent: {
    flex: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumLabel: {
    fontSize: 16,
    color: '#5D3A1A',
    fontWeight: '600',
  },
  bestValueBadge: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  bestValueText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
