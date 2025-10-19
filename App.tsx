/**
 * RealYAI - Real Estate CRM App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import './src/utils/firebase'; // Initialize Firebase

// Screens
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
import TelegramLeadsScreen from './src/screens/TelegramLeadsScreen';
import WhatsAppLeadsScreen from './src/screens/WhatsAppLeadsScreen';
import BotConfigurationScreen from './src/screens/BotConfigurationScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Simple icon component
const TabBarIcon = ({
  name,
  color,
  size,
}: {
  name: string;
  color: string;
  size: number;
}) => {
  const iconMap: Record<string, any> = {
    dashboard: require('./src/assets/bottomIconImages/dashboard.png'),
    home: require('./src/assets/bottomIconImages/properties.png'),
    people: require('./src/assets/bottomIconImages/leads.png'),
    chat: require('./src/assets/bottomIconImages/leads.png'), // Assuming chat uses leads icon or add chat.png if available
    person: require('./src/assets/bottomIconImages/profile.png'),
    reels: require('./src/assets/bottomIconImages/video.png'),
    schedule: require('./src/assets/bottomIconImages/schedule.png'),
  };
  return <Image source={iconMap[name]} style={{ width: size, height: size, tintColor: color }} />;
};

// Icon components
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
  <TabBarIcon name="schedule" color={color} size={size} />
);

const MainTabNavigator = () => {
  const { isDarkMode } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // 👈 Hide header for all tab screens
        tabBarActiveTintColor: isDarkMode ? '#186bf1ff' : '#1A1F71', // Active = blue in dark, dark blue in light
        tabBarInactiveTintColor: isDarkMode ? '#7c7c7cff' : '#666666', // Inactive = gray in dark, darker gray in light
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#2f3377ff' : '#E0F7FA', // Deep navy in dark, light blue in light
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 2,
          fontFamily: 'System',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
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

const AppNavigator = () => {
  const { isLoggedIn, onboardingCompleted, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
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
      screenOptions={{ headerShown: false }} // 👈 Hide header for ALL screens
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
      <Stack.Screen
        name="SubscriptionDetails"
        component={SubscriptionDetailsScreen}
      />
      <Stack.Screen name="SubscriptionPlans" component={SchedulesScreen} />
      <Stack.Screen name="TelegramLeads" component={TelegramLeadsScreen} />
      <Stack.Screen name="WhatsAppLeads" component={WhatsAppLeadsScreen} />
      <Stack.Screen name="BotConfiguration" component={BotConfigurationScreen} />
    </Stack.Navigator>
  );
};

function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          {/* Fixed status bar style for light-on-dark */}
          <StatusBar barStyle="light-content" backgroundColor="#1A1F71" />
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
    backgroundColor: '#2029c5ff',
  },
});

export default App;
