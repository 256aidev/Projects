/**
 * Root Navigator
 * Handles auth flow - shows auth screens or main app based on login state
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

import { useAuth } from '../auth';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';
import SocialOnboardingScreen from '../screens/onboarding/SocialOnboardingScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  SocialOnboarding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, pendingSocialLogin } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : pendingSocialLogin ? (
          <Stack.Screen
            name="SocialOnboarding"
            component={SocialOnboardingScreen}
            options={{
              headerShown: true,
              title: 'Complete Profile',
              headerStyle: { backgroundColor: '#8B4513' },
              headerTintColor: '#FDF5E6',
              headerBackVisible: false,
            }}
          />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDF5E6', // Warm beige background
  },
});
