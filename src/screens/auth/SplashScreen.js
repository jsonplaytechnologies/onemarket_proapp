import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/common/Logo';

const SplashScreen = ({ navigation }) => {
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('Main');
        } else {
          navigation.replace('Welcome');
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, navigation]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Logo size={120} showText={true} textSize="large" />

      <Text
        className="text-gray-400 mt-2"
        style={{ fontFamily: 'Poppins-Regular', fontSize: 14, letterSpacing: 3 }}
      >
        PRO
      </Text>

      <View className="absolute bottom-20">
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    </View>
  );
};

export default SplashScreen;
