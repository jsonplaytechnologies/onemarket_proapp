import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationToast from '../components/common/NotificationToast';
import { LogoIcon } from '../components/common/Logo';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneInputScreen from '../screens/auth/PhoneInputScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Onboarding Screens
import OnboardingHomeScreen from '../screens/onboarding/OnboardingHomeScreen';
import UploadDocumentsScreen from '../screens/onboarding/UploadDocumentsScreen';
import AddServicesScreen from '../screens/onboarding/AddServicesScreen';
import AddZonesScreen from '../screens/onboarding/AddZonesScreen';
import PendingApprovalScreen from '../screens/onboarding/PendingApprovalScreen';
import AccountRejectedScreen from '../screens/onboarding/AccountRejectedScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import BookingsScreen from '../screens/bookings/BookingsScreen';
import ChatsScreen from '../screens/chats/ChatsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Booking Detail Screens
import BookingDetailsScreen from '../screens/bookings/BookingDetailsScreen';
import ChatScreen from '../screens/bookings/ChatScreen';

// Earnings Screens
import EarningsScreen from '../screens/earnings/EarningsScreen';
import WithdrawalsScreen from '../screens/earnings/WithdrawalsScreen';
import TransactionsScreen from '../screens/earnings/TransactionsScreen';

// Service & Zone Screens
import MyServicesScreen from '../screens/services/MyServicesScreen';
import MyZonesScreen from '../screens/zones/MyZonesScreen';

// Profile Screens
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AvailabilityScreen from '../screens/profile/AvailabilityScreen';
import ReviewsScreen from '../screens/reviews/ReviewsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneInput" component={PhoneInputScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

// Onboarding Stack Navigator
const OnboardingStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingHome" component={OnboardingHomeScreen} />
      <Stack.Screen name="UploadDocuments" component={UploadDocumentsScreen} />
      <Stack.Screen name="AddServices" component={AddServicesScreen} />
      <Stack.Screen name="AddZones" component={AddZonesScreen} />
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen name="AccountRejected" component={AccountRejectedScreen} />
    </Stack.Navigator>
  );
};

// Badge component for notification count
const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

// Main Bottom Tab Navigator
const MainTabs = () => {
  const { unreadCount, unreadChatsCount } = useNotifications();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <NotificationBadge count={unreadChatsCount} />
              </View>
            );
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <NotificationBadge count={unreadCount} />
              </View>
            );
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontFamily: 'Poppins-Regular',
          fontSize: 11,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Main Stack Navigator (wraps tabs + detail screens)
const MainStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="Withdrawals" component={WithdrawalsScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="MyServices" component={MyServicesScreen} />
      <Stack.Screen name="MyZones" component={MyZonesScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated, loading, isApproved, isPending, isRejected } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading || showSplash) {
    return (
      <View style={styles.loadingContainer}>
        <LogoIcon size={80} />
        <Text style={styles.logoText}>one<Text style={{ color: '#2563EB' }}>market</Text></Text>
        <Text style={styles.proText}>PRO</Text>
        <Text style={styles.tagline}>Services at your fingertips</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : isApproved() ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        )}
      </Stack.Navigator>
      {/* Global notification toast */}
      {isAuthenticated && isApproved() && <NotificationToast />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 30,
    color: '#111827',
    letterSpacing: -0.5,
    marginTop: 24,
  },
  proText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tagline: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
  },
});

export default AppNavigator;
