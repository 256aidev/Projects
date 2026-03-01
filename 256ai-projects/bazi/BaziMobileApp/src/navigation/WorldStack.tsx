/**
 * World Stack Navigator
 * Handles navigation for "The BaZi World" educational atlas
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WorldScreen from '../screens/world/WorldScreen';
import WhatIsBaZiScreen from '../screens/world/WhatIsBaZiScreen';
import ElementsScreen from '../screens/world/ElementsScreen';
import AnimalsScreen from '../screens/world/AnimalsScreen';
import FourPillarsScreen from '../screens/world/FourPillarsScreen';
import RelationshipPatternsScreen from '../screens/world/RelationshipPatternsScreen';
import SymbolicInfluencesScreen from '../screens/world/SymbolicInfluencesScreen';
import EcosystemScreen from '../screens/world/EcosystemScreen';

export type WorldStackParamList = {
  WorldMain: undefined;
  WhatIsBaZi: undefined;
  Elements: { element?: string };
  Animals: { animal?: string };
  FourPillars: undefined;
  Patterns: undefined;
  Influences: undefined;
  Ecosystem: undefined;
};

const Stack = createNativeStackNavigator<WorldStackParamList>();

export default function WorldStack() {
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
        name="WorldMain"
        component={WorldScreen}
        options={{ title: 'The BaZi World' }}
      />
      <Stack.Screen
        name="WhatIsBaZi"
        component={WhatIsBaZiScreen}
        options={{ title: 'What Is BaZi?' }}
      />
      <Stack.Screen
        name="Elements"
        component={ElementsScreen}
        options={{ title: 'The Five Elements' }}
      />
      <Stack.Screen
        name="Animals"
        component={AnimalsScreen}
        options={{ title: 'The Twelve Animals' }}
      />
      <Stack.Screen
        name="FourPillars"
        component={FourPillarsScreen}
        options={{ title: 'The Four Pillars' }}
      />
      <Stack.Screen
        name="Patterns"
        component={RelationshipPatternsScreen}
        options={{ title: 'Relationship Patterns' }}
      />
      <Stack.Screen
        name="Influences"
        component={SymbolicInfluencesScreen}
        options={{ title: 'Symbolic Influences' }}
      />
      <Stack.Screen
        name="Ecosystem"
        component={EcosystemScreen}
        options={{ title: '256ai Ecosystem' }}
      />
    </Stack.Navigator>
  );
}
