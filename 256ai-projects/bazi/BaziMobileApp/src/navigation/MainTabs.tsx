/**
 * Main Tab Navigator
 * Bottom tabs for authenticated users
 *
 * Tab Structure (Per Product Architecture):
 * 1. You (🧍) - Individual-centered: readings, chart, BaZi Intelligence, forecasts
 * 2. Relationships (❤️) - Interaction-centered: family members, compatibility
 * 3. World (☯) - Educational atlas: elements, animals, ecosystem
 * 4. Settings (⚙) - App configuration
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Import stack navigators
import YouStack from './YouStack';
import RelationshipsStack from './RelationshipsStack';
import WorldStack from './WorldStack';
import SettingsScreen from '../screens/main/SettingsScreen';

export type MainTabParamList = {
  You: undefined;
  Relationships: undefined;
  World: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab icons per approved architecture
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    You: '🧍',
    Relationships: '❤️',
    World: '☯',
    Settings: '⚙',
  };

  return (
    <Text style={{ fontSize: 24, color: focused ? '#8B4513' : '#A0A0A0' }}>
      {icons[name] || '?'}
    </Text>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
        tabBarActiveTintColor: '#8B4513',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: {
          backgroundColor: '#FDF5E6',
          borderTopColor: '#D4A574',
        },
        headerStyle: {
          backgroundColor: '#8B4513',
        },
        headerTintColor: '#FDF5E6',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="You"
        component={YouStack}
        options={{ title: 'You', headerShown: false }}
      />
      <Tab.Screen
        name="Relationships"
        component={RelationshipsStack}
        options={{ title: 'Relationships', headerShown: false }}
      />
      <Tab.Screen
        name="World"
        component={WorldStack}
        options={{ title: 'World', headerShown: false }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}
