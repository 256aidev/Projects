/**
 * Relationships Stack Navigator
 * Handles navigation for family/relationship screens
 * Elevated from nested Profile screens to dedicated tab
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RelationshipsScreen from '../screens/relationships/RelationshipsScreen';
import {
  AddFamilyMemberScreen,
  FamilyMemberDetailScreen,
  FamilyReadingScreen,
  CompatibilityForecastScreen,
} from '../screens/family';
import { FamilyMember, FamilyRelationship } from '../types';

export type RelationshipsStackParamList = {
  RelationshipsMain: undefined;
  AddFamilyMember: { relationship: FamilyRelationship };
  FamilyMemberDetail: { member: FamilyMember };
  FamilyReading: undefined;
  CompatibilityForecast: { member: FamilyMember; period: 'weekly' | 'monthly' | 'yearly' };
};

const Stack = createNativeStackNavigator<RelationshipsStackParamList>();

export default function RelationshipsStack() {
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
        name="RelationshipsMain"
        component={RelationshipsScreen}
        options={{ title: 'Relationships' }}
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
    </Stack.Navigator>
  );
}
