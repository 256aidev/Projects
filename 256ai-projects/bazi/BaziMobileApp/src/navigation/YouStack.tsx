/**
 * You Stack Navigator
 * Combined personal tab: readings, chart, BaZi Intelligence, forecasts, history
 * Merges former Readings + Profile + Calendar tabs
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import YouScreen from '../screens/main/YouScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import AchievementsScreen from '../screens/main/AchievementsScreen';
import ReadingHistoryScreen from '../screens/main/ReadingHistoryScreen';
import FutureReadingScreen from '../screens/readings/FutureReadingScreen';
import WeeklyForecastScreen from '../screens/readings/WeeklyForecastScreen';
import MonthlyForecastScreen from '../screens/readings/MonthlyForecastScreen';
import YearlyForecastScreen from '../screens/readings/YearlyForecastScreen';
import PersonalDailyIntelligenceScreen from '../screens/readings/PersonalDailyIntelligenceScreen';

export type YouStackParamList = {
  YouMain: undefined;
  EditProfile: undefined;
  Achievements: undefined;
  ReadingHistory: undefined;
  FutureReading: { date: string };
  WeeklyForecast: undefined;
  MonthlyForecast: undefined;
  YearlyForecast: undefined;
  PersonalDailyIntelligence: undefined;
};

const Stack = createNativeStackNavigator<YouStackParamList>();

export default function YouStack() {
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
        name="YouMain"
        component={YouScreen}
        options={{ title: 'You' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Birth Info' }}
      />
      <Stack.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ title: 'Achievements' }}
      />
      <Stack.Screen
        name="ReadingHistory"
        component={ReadingHistoryScreen}
        options={{ title: 'Reading History' }}
      />
      <Stack.Screen
        name="FutureReading"
        component={FutureReadingScreen}
        options={({ route }) => ({
          title: route.params.date,
        })}
      />
      <Stack.Screen
        name="WeeklyForecast"
        component={WeeklyForecastScreen}
        options={{ title: 'Weekly Forecast' }}
      />
      <Stack.Screen
        name="MonthlyForecast"
        component={MonthlyForecastScreen}
        options={{ title: 'Monthly Forecast' }}
      />
      <Stack.Screen
        name="YearlyForecast"
        component={YearlyForecastScreen}
        options={{ title: 'Yearly Forecast' }}
      />
      <Stack.Screen
        name="PersonalDailyIntelligence"
        component={PersonalDailyIntelligenceScreen}
        options={{ title: 'Personal Daily Intelligence' }}
      />
    </Stack.Navigator>
  );
}
