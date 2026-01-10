import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';

const WelcomeScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const features = [
    { icon: 'briefcase-outline', text: t('auth.welcome.offerServices') },
    { icon: 'cash-outline', text: t('auth.welcome.setRates') },
    { icon: 'calendar-outline', text: t('auth.welcome.manageBookings') },
    { icon: 'wallet-outline', text: t('auth.welcome.trackEarnings') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-8 pt-12">
        {/* Logo */}
        <View className="items-center mb-12">
          <Logo size={100} showText={true} textSize="medium" />
        </View>

        {/* Features */}
        <View className="flex-1">
          <Text
            className="text-gray-900 mb-8"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 22 }}
          >
            {t('auth.welcome.growBusiness')}
          </Text>

          {features.map((feature, index) => (
            <View key={index} className="flex-row items-center mb-5">
              <View className="w-11 h-11 bg-blue-50 rounded-xl items-center justify-center mr-4">
                <Ionicons name={feature.icon} size={22} color="#2563EB" />
              </View>
              <Text
                className="text-gray-700 flex-1"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 15 }}
              >
                {feature.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View className="bg-gray-50 p-4 rounded-2xl mb-6">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
              <Ionicons name="location" size={20} color="#2563EB" />
            </View>
            <View className="flex-1">
              <Text
                className="text-gray-800"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                {t('auth.welcome.gabonOnly')}
              </Text>
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
              >
                {t('auth.welcome.availableNumbers')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Buttons */}
      <View className="px-8 pb-8">
        <Button
          title={t('auth.welcome.signIn')}
          onPress={() => navigation.navigate('PhoneInput', { mode: 'signin' })}
          icon={<Ionicons name="log-in-outline" size={20} color="#FFFFFF" />}
        />
        <View className="h-3" />
        <Button
          title={t('auth.welcome.signUp')}
          onPress={() => navigation.navigate('PhoneInput', { mode: 'signup' })}
          variant="outline"
          icon={<Ionicons name="person-add-outline" size={20} color="#2563EB" />}
        />
      </View>
    </SafeAreaView>
  );
};

export default WelcomeScreen;
