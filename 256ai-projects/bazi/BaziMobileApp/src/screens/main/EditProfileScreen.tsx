/**
 * Edit Profile Screen
 * Allows users to edit their name, birth date, time, and location
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../auth';
import { ApiError } from '../../api';

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user, updateProfile } = useAuth();

  // Parse existing user data
  const parseDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const [birthDate, setBirthDate] = useState(
    user?.birth_date ? parseDate(user.birth_date) : new Date(1990, 0, 1)
  );
  const [birthTime, setBirthTime] = useState(
    user?.birth_time ? parseTime(user.birth_time) : new Date(1990, 0, 1, 12, 0)
  );
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [birthLocation, setBirthLocation] = useState(user?.birth_location || '');
  const [isLoading, setIsLoading] = useState(false);

  // For iOS date/time picker modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(birthDate);
  const [tempTime, setTempTime] = useState(birthTime);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (selectedDate) {
        setBirthDate(selectedDate);
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
      if (selectedTime) {
        setBirthTime(selectedTime);
      }
    } else if (selectedTime) {
      setTempTime(selectedTime);
    }
  };

  const confirmDateSelection = () => {
    setBirthDate(tempDate);
    setShowDatePicker(false);
  };

  const confirmTimeSelection = () => {
    setBirthTime(tempTime);
    setShowTimePicker(false);
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setIsLoading(true);

    try {
      // Format date as YYYY-MM-DD
      const dateStr = birthDate.toISOString().split('T')[0];
      // Format time as HH:MM:SS
      const timeStr = birthTime.toTimeString().split(' ')[0];

      await updateProfile({
        name: displayName.trim() || undefined,
        birth_date: dateStr,
        birth_time: timeStr,
        birth_location: birthLocation.trim() || undefined,
      });

      Alert.alert(
        'Profile Updated',
        'Your birth information has been updated. Your readings and Four Pillars chart will be recalculated within 24 hours.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to update profile. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Edit My Info</Text>
          <Text style={styles.subtitle}>
            Update your profile and birth details for accurate readings
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>i</Text>
            <Text style={styles.infoText}>
              After updating, your Four Pillars chart and daily readings will be recalculated. This may take up to 24 hours.
            </Text>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your display name"
            placeholderTextColor="#A0A0A0"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!isLoading}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Birth Date</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              setTempDate(birthDate);
              setShowDatePicker(true);
            }}
            disabled={isLoading}
          >
            <Text style={styles.pickerButtonText}>{formatDate(birthDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Birth Time</Text>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              setTempTime(birthTime);
              setShowTimePicker(true);
            }}
            disabled={isLoading}
          >
            <Text style={styles.pickerButtonText}>{formatTime(birthTime)}</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>
            Don't know your exact birth time? Ask a parent or check your birth certificate. The Hour Pillar depends on accurate birth time.
          </Text>

          <Text style={styles.label}>Birth Location (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="City, Country"
            placeholderTextColor="#A0A0A0"
            value={birthLocation}
            onChangeText={setBirthLocation}
            editable={!isLoading}
          />
          <Text style={styles.hint}>
            Location helps determine solar time adjustments for your chart.
          </Text>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* iOS Date Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Birth Date</Text>
                <TouchableOpacity onPress={confirmDateSelection}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 216 }}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* iOS Time Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Birth Time</Text>
                <TouchableOpacity onPress={confirmTimeSelection}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 216 }}>
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date/Time Pickers */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={birthTime}
          mode="time"
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF5E6',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5D3A1A',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333333',
  },
  pickerButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 12,
    padding: 16,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  hint: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A90D9',
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4A6A8A',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    backgroundColor: '#C4A574',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#8B7355',
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalCancel: {
    fontSize: 16,
    color: '#8B7355',
  },
  modalDone: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: '600',
  },
});
