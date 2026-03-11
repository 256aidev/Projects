import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import ParentDashboardScreen from '../screens/main/ParentDashboardScreen';
import ChoresScreen from '../screens/chores/ChoresScreen';
import SettingsScreen from '../screens/household/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ParentDashboardScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => tabIcon('🏠', color),
        }}
      />
      <Tab.Screen
        name="Chores"
        component={ChoresScreen}
        options={{
          title: 'Chores',
          tabBarLabel: 'Chores',
          tabBarIcon: ({ color }) => tabIcon('✅', color),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => tabIcon('⚙️', color),
        }}
      />
    </Tab.Navigator>
  );
}

function tabIcon(emoji: string, _color: string) {
  const React = require('react');
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}
