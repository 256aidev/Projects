/**
 * Add Family Member Screen
 * Form to add spouse, child, or parent with birth data
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
import { useAchievements } from '../../achievements';
import { addFamilyMember, ApiError } from '../../api';
import { FamilyRelationship } from '../../types';

interface AddFamilyMemberScreenProps {
  navigation: any;
  route: {
    params: {
      relationship: FamilyRelationship;
    };
  };
}

export default function AddFamilyMemberScreen({ navigation, route }: AddFamilyMemberScreenProps) {
  const { user } = useAuth();
  const { trackFamilyMemberAdded } = useAchievements();
  const relationship = route.params?.relationship || 'spouse';

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date(1990, 0, 1));
  const [birthTime, setBirthTime] = useState(new Date(1990, 0, 1, 12, 0));
  const [birthLocation, setBirthLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // For iOS date/time picker modal
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(birthDate);
  const [tempTime, setTempTime] = useState(birthTime);

  const getTitle = () => {
    switch (relationship) {
      case 'spouse':
        return 'Add Spouse';
      case 'partner':
        return 'Add Partner';
      case 'child':
        return 'Add Child';
      case 'parent':
        return 'Add Parent';
      case 'sibling':
        return 'Add Sibling';
      case 'grandparent':
        return 'Add Grandparent';
      default:
        return 'Add Family Member';
    }
  };

  const getSubtitle = () => {
    switch (relationship) {
      case 'spouse':
        return "Enter your spouse's birth details to see compatibility";
      case 'partner':
        return "Enter your partner's birth details to see compatibility";
      case 'child':
        return "Enter your child's birth details for family insights";
      case 'parent':
        return "Enter your parent's birth details for family insights";
      case 'sibling':
        return "Enter your sibling's birth details for family insights";
      case 'grandparent':
        return "Enter your grandparent's birth details for family insights";
      default:
        return 'Enter birth details to calculate their Four Pillars';
    }
  };

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
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

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

      await addFamilyMember(user.id, {
        relationship,
        name: name.trim(),
        birth_date: dateStr,
        birth_time: timeStr,
        birth_location: birthLocation.trim() || undefined,
      });

      // Track achievement for adding family member
      trackFamilyMemberAdded();

      Alert.alert('Success', `${name} has been added to your family`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to add family member. Please try again.';
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
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            placeholderTextColor="#A0A0A0"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!isLoading}
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
            Exact time is important for accurate readings.
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

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Add {relationship}</Text>
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
    textTransform: 'capitalize',
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
