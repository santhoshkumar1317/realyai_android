/**
 * RealYAI - Real Estate CRM App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  StatusBar,
  useColorScheme,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import './src/utils/firebase'; // Initialize Firebase
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import PropertiesScreen from './src/screens/PropertiesScreen';
import PropertyDetailsScreen from './src/screens/PropertyDetailsScreen';
import AddEditPropertyScreen from './src/screens/AddEditPropertyScreen';
import LeadsScreen from './src/screens/LeadsScreen';
import LeadDetailsScreen from './src/screens/LeadDetailsScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ReelsScreen from './src/screens/ReelsScreen';
import SchedulesScreen from './src/screens/SchedulesScreen';
import SubscriptionDetailsScreen from './src/screens/SubscriptionDetailsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Simple icon component - you can replace with actual icon library
const TabBarIcon = ({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) => {
  const iconMap: Record<string, string> = {
    dashboard: '📊',
    home: '🏠',
    people: '👥',
    chat: '💬',
    person: '👤',
    reels: '🎬',
    notification: '🔔',
  };
  return <Text style={{ fontSize: size, color }}>{iconMap[name] || '●'}</Text>;
};

// Notification icon component for header
const NotificationIcon = ({ onPress }: { onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={{ marginRight: 15 }}>
    <TabBarIcon name="notification" color="#fff" size={24} />
  </TouchableOpacity>
);

// Dark mode toggle component for header
const DarkModeToggle = ({ onPress, isDark }: { onPress: () => void; isDark: boolean }) => (
  <TouchableOpacity onPress={onPress} style={{ marginRight: 15 }}>
    <Text style={{ fontSize: 20, color: '#fff' }}>{isDark ? '☀️' : '🌙'}</Text>
  </TouchableOpacity>
);

// Icon components to avoid unstable nested components
const DashboardIcon = ({ color, size }: { color: string; size: number }) => (
  <TabBarIcon name="dashboard" color={color} size={size} />
);
const PropertiesIcon = ({ color, size }: { color: string; size: number }) => (
  <TabBarIcon name="home" color={color} size={size} />
);
const LeadsIcon = ({ color, size }: { color: string; size: number }) => (
  <TabBarIcon name="people" color={color} size={size} />
);
const ReelsIcon = ({ color, size }: { color: string; size: number }) => (
  <TabBarIcon name="reels" color={color} size={size} />
);
const ProfileIcon = ({ color, size }: { color: string; size: number }) => (
  <TabBarIcon name="person" color={color} size={size} />
);
const ScheduleIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ fontSize: size, color }}>📅</Text>
);

const MainTabNavigator = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  const handleNotificationPress = () => {
    // TODO: Implement notification functionality
    console.log('Notification icon pressed');
  };

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#6a0dad',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1a1a1a' : '#fff',
          borderTopColor: '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: '#1a0033',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <View style={{ flexDirection: 'row' }}>
            <DarkModeToggle onPress={toggleTheme} isDark={isDarkMode} />
            <NotificationIcon onPress={handleNotificationPress} />
          </View>
        ),
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: DashboardIcon,
        }}
      />
      <Tab.Screen
        name="Properties"
        component={PropertiesScreen}
        options={{
          tabBarLabel: 'Properties',
          tabBarIcon: PropertiesIcon,
        }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadsScreen}
        options={{
          tabBarLabel: 'Leads',
          tabBarIcon: LeadsIcon,
        }}
      />
      <Tab.Screen
        name="Reels"
        component={ReelsScreen}
        options={{
          tabBarLabel: 'Reels',
          tabBarIcon: ReelsIcon,
        }}
      />
      <Tab.Screen
        name="Schedules"
        component={SchedulesScreen}
        options={{
          tabBarLabel: 'Schedules',
          tabBarIcon: ScheduleIcon,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

// Component to handle authentication state and navigation
const AppNavigator = () => {
  const { isLoggedIn, onboardingCompleted, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a0dad" />
      </View>
    );
  }

  const initialRouteName =
    isLoggedIn && onboardingCompleted
      ? 'MainTabs'
      : onboardingCompleted
      ? 'Login'
      : 'Onboarding';

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRouteName}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetailsScreen} />
      <Stack.Screen name="AddEditProperty" component={AddEditPropertyScreen} />
      <Stack.Screen name="LeadDetails" component={LeadDetailsScreen} />
      <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Schedules" component={SchedulesScreen} />
      <Stack.Screen name="SubscriptionDetails" component={SubscriptionDetailsScreen} />
      <Stack.Screen name="SubscriptionPlans" component={SchedulesScreen} />
    </Stack.Navigator>
  );
};

function App() {
  const systemColorScheme = useColorScheme() === 'dark';

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar barStyle={systemColorScheme ? 'light-content' : 'dark-content'} />
          <NavigationContainer>
            <AuthProvider>
              <AppNavigator />
            </AuthProvider>
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
