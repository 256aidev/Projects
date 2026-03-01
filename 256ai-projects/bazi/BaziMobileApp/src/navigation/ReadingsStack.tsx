/**
 * Readings Stack Navigator
 * Handles navigation for readings tab (main screen, forecasts)
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ReadingsScreen from '../screens/readings/ReadingsScreen';
import FutureReadingScreen from '../screens/readings/FutureReadingScreen';
import WeeklyForecastScreen from '../screens/readings/WeeklyForecastScreen';
import MonthlyForecastScreen from '../screens/readings/MonthlyForecastScreen';
import YearlyForecastScreen from '../screens/readings/YearlyForecastScreen';

export type ReadingsStackParamList = {
  ReadingsMain: undefined;
  FutureReading: { date: string };
  WeeklyForecast: undefined;
  MonthlyForecast: undefined;
  YearlyForecast: undefined;
};

const Stack = createNativeStackNavigator<ReadingsStackParamList>();

export default function ReadingsStack() {
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
        name="ReadingsMain"
        component={ReadingsScreen}
        options={{ title: 'Readings' }}
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
    </Stack.Navigator>
  );
}
