import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth';
import { colors } from '../theme';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';
import ChildDashboardScreen from '../screens/main/ChildDashboardScreen';
import CreateChoreScreen from '../screens/chores/CreateChoreScreen';
import AddChildScreen from '../screens/household/AddChildScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChildDashboard"
            component={ChildDashboardScreen}
            options={({ route }: any) => ({ title: route.params?.childName ?? 'Child' })}
          />
          <Stack.Screen
            name="CreateChore"
            component={CreateChoreScreen}
            options={{ title: 'New Chore' }}
          />
          <Stack.Screen
            name="AddChild"
            component={AddChildScreen}
            options={{ title: 'Add Child' }}
          />
        </Stack.Navigator>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
