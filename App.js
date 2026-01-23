import './global.css';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { BookingProvider } from './src/context/BookingContext';
import { IncentiveProvider } from './src/context/IncentiveContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import LanguageSelector from './src/components/common/LanguageSelector';
import { COLORS } from './src/constants/colors';
import { usePushNotifications } from './src/hooks/usePushNotifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Component to handle push notifications (must be inside AuthProvider)
const PushNotificationHandler = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Initialize push notifications when user is authenticated
  usePushNotifications(isAuthenticated);

  return children;
};

// Inner app component that uses language context
const AppContent = () => {
  const { isFirstLaunch, isLoading, isI18nReady, completeFirstLaunch } = useLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  useEffect(() => {
    if (!isLoading && isFirstLaunch) {
      setShowLanguageSelector(true);
    }
  }, [isLoading, isFirstLaunch]);

  const handleLanguageSelected = (language) => {
    setShowLanguageSelector(false);
  };

  if (isLoading || !isI18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <AuthProvider>
        <PushNotificationHandler>
          <SocketProvider>
            <NotificationProvider>
              <BookingProvider>
                <IncentiveProvider>
                  <AppNavigator />
                  <StatusBar style="auto" />
                </IncentiveProvider>
              </BookingProvider>
            </NotificationProvider>
          </SocketProvider>
        </PushNotificationHandler>
      </AuthProvider>
      <LanguageSelector
        visible={showLanguageSelector}
        onComplete={handleLanguageSelected}
      />
    </>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
