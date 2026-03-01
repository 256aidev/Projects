/**
 * Register Screen
 * Collects email, password, and birth data for BaZi calculation
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
} from 'react-native';
import { useAuth } from '../../auth';
import { ApiError } from '../../api';
import { RegisterRequest } from '../../types';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState<Partial<RegisterRequest>>({
    email: '',
    password: '',
    name: '',
    birth_date: '',
    birth_time: '12:00:00', // Default to noon
    birth_longitude: 0,
    birth_latitude: 0,
    birth_location: '',
    preferred_tone: 'balanced',
    language: 'en',
  });

  const updateField = (field: keyof RegisterRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    // Validate current step
    if (step === 1) {
      if (!formData.email || !formData.password) {
        Alert.alert('Error', 'Please enter email and password');
        return;
      }
      if (formData.password && formData.password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters');
        return;
      }
    } else if (step === 2) {
      if (!formData.name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
    } else if (step === 3) {
      if (!formData.birth_date) {
        Alert.alert('Error', 'Please enter your birth date');
        return;
      }
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.birth_date)) {
        Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
        return;
      }
    }

    if (step < 4) {
      setStep(step + 1);
    } else {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    try {
      await register(formData as RegisterRequest);
      // Navigation happens automatically via RootNavigator
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.stepTitle}>Create Your Account</Text>
            <Text style={styles.stepDescription}>
              Enter your email and create a password
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A0A0A0"
              value={formData.email}
              onChangeText={v => updateField('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 8 characters)"
              placeholderTextColor="#A0A0A0"
              value={formData.password}
              onChangeText={v => updateField('password', v)}
              secureTextEntry
              autoComplete="password-new"
            />
          </>
        );

      case 2:
        return (
          <>
            <Text style={styles.stepTitle}>What's Your Name?</Text>
            <Text style={styles.stepDescription}>
              How should we address you in your readings?
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#A0A0A0"
              value={formData.name}
              onChangeText={v => updateField('name', v)}
              autoCapitalize="words"
            />
          </>
        );

      case 3:
        return (
          <>
            <Text style={styles.stepTitle}>Your Birth Date</Text>
            <Text style={styles.stepDescription}>
              This is essential for calculating your Four Pillars
            </Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g., 1990-05-15)"
              placeholderTextColor="#A0A0A0"
              value={formData.birth_date}
              onChangeText={v => updateField('birth_date', v)}
              keyboardType="numeric"
            />
          </>
        );

      case 4:
        return (
          <>
            <Text style={styles.stepTitle}>Birth Time & Location</Text>
            <Text style={styles.stepDescription}>
              For the most accurate reading (optional)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Birth time HH:MM (e.g., 14:30)"
              placeholderTextColor="#A0A0A0"
              value={formData.birth_time?.slice(0, 5)}
              onChangeText={v => updateField('birth_time', v + ':00')}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Birth city (e.g., New York, NY)"
              placeholderTextColor="#A0A0A0"
              value={formData.birth_location}
              onChangeText={v => updateField('birth_location', v)}
            />
            <Text style={styles.hint}>
              Don't know your exact birth time? We'll use noon as default.
            </Text>
          </>
        );
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
        {/* Progress indicator */}
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(s => (
            <View
              key={s}
              style={[styles.progressDot, s <= step && styles.progressDotActive]}
            />
          ))}
        </View>

        <View style={styles.form}>{renderStep()}</View>

        <View style={styles.buttons}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              step === 1 && styles.nextButtonFull,
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.nextButtonText}>
              {isLoading
                ? 'Creating...'
                : step === 4
                ? 'Create Account'
                : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4A574',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: '#8B4513',
  },
  form: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5D3A1A',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#333333',
  },
  hint: {
    fontSize: 14,
    color: '#8B7355',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    color: '#8B4513',
    fontSize: 18,
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#8B4513',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#C4A574',
  },
});
