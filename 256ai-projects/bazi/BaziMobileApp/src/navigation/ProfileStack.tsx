/**
 * Profile Stack Navigator
 * Handles navigation between Profile and Family screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen from '../screens/main/ProfileScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import AchievementsScreen from '../screens/main/AchievementsScreen';
import {
  AddFamilyMemberScreen,
  FamilyMemberDetailScreen,
  FamilyReadingScreen,
  CompatibilityForecastScreen,
} from '../screens/family';
import { FamilyMember, FamilyRelationship } from '../types';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  AddFamilyMember: { relationship: FamilyRelationship };
  FamilyMemberDetail: { member: FamilyMember };
  FamilyReading: undefined;
  CompatibilityForecast: { member: FamilyMember; period: 'weekly' | 'monthly' | 'yearly' };
  Achievements: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#8B4513',
        },
        headerTintColor: '#FDF5E6',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'My Chart' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Birth Info' }}
      />
      <Stack.Screen
        name="AddFamilyMember"
        component={AddFamilyMemberScreen}
        options={({ route }) => ({
          title: `Add ${route.params.relationship.charAt(0).toUpperCase() + route.params.relationship.slice(1)}`,
        })}
      />
      <Stack.Screen
        name="FamilyMemberDetail"
        component={FamilyMemberDetailScreen}
        options={({ route }) => ({
          title: route.params.member.name,
        })}
      />
      <Stack.Screen
        name="FamilyReading"
        component={FamilyReadingScreen}
        options={{ title: 'Family Reading' }}
      />
      <Stack.Screen
        name="CompatibilityForecast"
        component={CompatibilityForecastScreen}
        options={{ title: 'Compatibility Forecast' }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
    </Stack.Navigator>
  );
}
