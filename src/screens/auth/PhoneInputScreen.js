import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import apiService, { ApiError } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';

const MIN_PHONE_LENGTH = 8;
const MAX_PHONE_LENGTH = 10;

const GABON_COUNTRY = { code: '+241', name: 'Gabon', flag: '🇬🇦' };

const PhoneInputScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePhoneNumber = () => {
    if (!phoneNumber || phoneNumber.length < MIN_PHONE_LENGTH) {
      setError(t('auth.phoneInput.enterDigits', { min: MIN_PHONE_LENGTH, max: MAX_PHONE_LENGTH }));
      return false;
    }
    setError('');
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber()) return;

    setLoading(true);
    try {
      const response = await apiService.post(API_ENDPOINTS.SEND_OTP, {
        phone: phoneNumber,
        countryCode: GABON_COUNTRY.code,
        expectedRole: 'pro', // This app expects 'pro' role
      });

      if (response.success) {
        navigation.navigate('OTPVerification', {
          phone: phoneNumber,
          countryCode: GABON_COUNTRY.code,
          fullPhone: `${GABON_COUNTRY.code} ${phoneNumber}`,
        });
      }
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          t('common.pleaseWait'),
          t('common.tooManyRequests', { seconds: error.retryAfter })
        );
      } else if (error.message === 'WRONG_APP') {
        // User exists with different role
        const userRole = error.data?.userRole;
        const appName = userRole === 'user' ? 'OneMarket' : 'OneMarket Business';
        const roleLabel = userRole === 'user' ? t('auth.phoneInput.customer') : t('auth.phoneInput.business');
        Alert.alert(
          t('auth.phoneInput.wrongApp'),
          t('auth.phoneInput.wrongAppMessage', { role: roleLabel, appName }),
          [{ text: t('common.ok') }]
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        // Show field-level validation errors
        const errorMsg = error.errors?.map(e => e.msg).join('\n') || error.message;
        Alert.alert(t('common.validationError'), errorMsg);
      } else {
        Alert.alert(t('common.error'), error.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, MAX_PHONE_LENGTH);
    setPhoneNumber(cleaned);
    setError('');
  };

  const isPhoneValid = phoneNumber.length >= MIN_PHONE_LENGTH;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mb-8"
        >
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>

        <Text
          className="text-gray-900 mb-2"
          style={{ fontFamily: 'Poppins-Bold', fontSize: 26 }}
        >
          {t('auth.phoneInput.title')}
        </Text>

        <Text
          className="text-gray-400"
          style={{ fontFamily: 'Poppins-Regular', fontSize: 15 }}
        >
          {t('auth.phoneInput.subtitle')}
        </Text>
      </View>

      {/* Form */}
      <View className="px-6 mt-8">
        {/* Phone Input Container */}
        <View className="flex-row items-center">
          {/* Country Code */}
          <View className="h-14 flex-row items-center bg-gray-50 rounded-2xl px-4 mr-3">
            <Text className="text-lg mr-2">{GABON_COUNTRY.flag}</Text>
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 15 }}
            >
              {GABON_COUNTRY.code}
            </Text>
          </View>

          {/* Phone Number Input */}
          <View className="flex-1">
            <View
              className={`h-14 flex-row items-center rounded-2xl px-4 ${
                error ? 'bg-red-50' : 'bg-gray-50'
              }`}
            >
              <TextInput
                className="flex-1 text-gray-900"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 15 }}
                placeholder={t('auth.phoneInput.placeholder')}
                placeholderTextColor="#9CA3AF"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={MAX_PHONE_LENGTH}
                autoFocus
              />
            </View>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View className="flex-row items-center mt-3 ml-1">
            <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
            <Text
              className="text-red-500 ml-1"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Send OTP Button */}
        <View className="mt-8">
          <Button
            title={t('common.continue')}
            onPress={handleSendOTP}
            disabled={!isPhoneValid}
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PhoneInputScreen;
