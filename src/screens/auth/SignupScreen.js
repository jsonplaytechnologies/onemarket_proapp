import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import apiService, { ApiError } from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { validateReferralCode } from '../../services/incentiveService';

const SignupScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { phone } = route.params;
  const { login } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralCodeValid, setReferralCodeValid] = useState(null);
  const [referralCodeChecking, setReferralCodeChecking] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Debounced referral code validation
  const handleReferralCodeChange = async (code) => {
    const upperCode = code.toUpperCase().trim();
    setReferralCode(upperCode);
    setReferralCodeValid(null);

    if (errors.referralCode) {
      setErrors({ ...errors, referralCode: '' });
    }

    if (upperCode.length === 0) {
      return;
    }

    if (upperCode.length < 8) {
      return;
    }

    // Validate the referral code
    setReferralCodeChecking(true);
    try {
      const response = await validateReferralCode(upperCode);
      // Backend returns { isValid: true/false }
      if (response.success && response.data?.isValid) {
        setReferralCodeValid(true);
      } else {
        setReferralCodeValid(false);
        setErrors({ ...errors, referralCode: response.data?.reason || t('auth.signup.invalidCode') });
      }
    } catch (error) {
      setReferralCodeValid(false);
      setErrors({ ...errors, referralCode: t('auth.signup.invalidCode') });
    } finally {
      setReferralCodeChecking(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!firstName || firstName.length < 2) {
      newErrors.firstName = t('auth.signup.firstNameError');
    }

    if (!lastName || lastName.length < 2) {
      newErrors.lastName = t('auth.signup.lastNameError');
    }

    if (!bio || bio.length < 10) {
      newErrors.bio = t('auth.signup.bioError');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const signupData = {
        phone,
        role: 'pro', // Important: Sign up as Pro
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim(),
        },
      };

      // Include referral code if valid
      if (referralCode && referralCodeValid) {
        signupData.referral_code = referralCode;
      }

      const response = await apiService.post(API_ENDPOINTS.SIGNUP, signupData);

      if (response.success) {
        // Login and let AppNavigator handle navigation automatically
        await login(response.data.token, response.data.user, response.data.refreshToken);
        Alert.alert(
          t('auth.signup.accountCreated'),
          t('auth.signup.accountCreatedMessage'),
          [{ text: t('common.continue') }] // No navigation needed - AppNavigator auto-redirects
        );
      }
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          t('common.pleaseWait'),
          t('common.tooManyRequests', { seconds: error.retryAfter })
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        // Handle field-level validation errors from server
        if (error.errors && error.errors.length > 0) {
          const newErrors = {};
          error.errors.forEach(err => {
            // Map API field paths to local state field names
            if (err.path === 'profile.firstName') {
              newErrors.firstName = err.msg;
            } else if (err.path === 'profile.lastName') {
              newErrors.lastName = err.msg;
            } else if (err.path === 'profile.bio') {
              newErrors.bio = err.msg;
            }
          });
          setErrors(newErrors);
          // Also show a general alert with all errors
          const errorMsg = error.errors.map(e => e.msg).join('\n');
          Alert.alert(t('common.validationError'), errorMsg);
        } else {
          Alert.alert(t('common.validationError'), error.message);
        }
      } else {
        Alert.alert(t('common.error'), error.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-6"
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>

            <Text
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              {t('auth.signup.title')}
            </Text>

            <Text
              className="text-base text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {t('auth.signup.subtitle')}
            </Text>
          </View>

          {/* Form */}
          <View className="px-6">
            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.firstName')}
              </Text>
              <Input
                placeholder={t('auth.signup.firstNamePlaceholder')}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  if (errors.firstName) {
                    setErrors({ ...errors, firstName: '' });
                  }
                }}
                icon="person-outline"
                error={errors.firstName}
              />
            </View>

            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.lastName')}
              </Text>
              <Input
                placeholder={t('auth.signup.lastNamePlaceholder')}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  if (errors.lastName) {
                    setErrors({ ...errors, lastName: '' });
                  }
                }}
                icon="person-outline"
                error={errors.lastName}
              />
            </View>

            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.aboutServices')}
              </Text>
              <Input
                placeholder={t('auth.signup.aboutPlaceholder')}
                value={bio}
                onChangeText={(text) => {
                  setBio(text);
                  if (errors.bio) {
                    setErrors({ ...errors, bio: '' });
                  }
                }}
                multiline
                numberOfLines={4}
                error={errors.bio}
              />
            </View>

            {/* Referral Code */}
            <View className="mb-6">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.referralCode')}
              </Text>
              <Input
                placeholder={t('auth.signup.referralPlaceholder')}
                value={referralCode}
                onChangeText={handleReferralCodeChange}
                icon="gift-outline"
                autoCapitalize="characters"
                maxLength={8}
                error={errors.referralCode}
              />
              {referralCodeChecking && (
                <Text
                  className="text-gray-400 mt-1"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {t('auth.signup.checkingCode')}
                </Text>
              )}
              {referralCodeValid === true && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                  <Text
                    className="text-green-600 ml-1"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                  >
                    {t('auth.signup.validCode')}
                  </Text>
                </View>
              )}
            </View>

            {/* Info Card */}
            <View className="bg-blue-50 p-4 rounded-xl mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={24} color="#2563EB" />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-blue-900"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {t('auth.signup.whatHappensNext')}
                  </Text>
                  <Text
                    className="text-sm text-blue-700 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {t('auth.signup.nextSteps')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Create Account Button */}
            <Button
              title={t('auth.signup.createAccount')}
              onPress={handleCreateAccount}
              disabled={!firstName || !lastName || !bio}
              loading={loading}
              icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
            />

            <View className="h-8" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
