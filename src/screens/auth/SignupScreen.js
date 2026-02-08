import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [avatarUri, setAvatarUri] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sex, setSex] = useState('');
  const [heardAboutUs, setHeardAboutUs] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralCodeValid, setReferralCodeValid] = useState(null);
  const [referralCodeChecking, setReferralCodeChecking] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const heardAboutUsOptions = [
    { key: 'social_media', label: t('auth.signup.heardSocialMedia') },
    { key: 'friend_family', label: t('auth.signup.heardFriendFamily') },
    { key: 'google_search', label: t('auth.signup.heardGoogleSearch') },
    { key: 'advertisement', label: t('auth.signup.heardAdvertisement') },
    { key: 'other', label: t('auth.signup.heardOther') },
  ];

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

  const handlePickAvatar = () => {
    Alert.alert(
      t('auth.signup.profilePhoto'),
      '',
      [
        {
          text: t('auth.signup.takePhoto'),
          onPress: () => pickImage('camera'),
        },
        {
          text: t('auth.signup.chooseFromLibrary'),
          onPress: () => pickImage('gallery'),
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const pickImage = async (source) => {
    let permissionResult;
    if (source === 'camera') {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permissionResult.granted) {
      Alert.alert(
        t('permissions.permissionRequired'),
        source === 'camera' ? t('permissions.cameraPermission') : t('permissions.photoAccess')
      );
      return;
    }

    const options = {
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    };

    let result;
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        ...options,
        mediaTypes: 'images',
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setAvatarUri(result.assets[0].uri);
      if (errors.avatar) {
        setErrors({ ...errors, avatar: '' });
      }
    }
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!avatarUri) {
      newErrors.avatar = t('auth.signup.profilePhotoRequired');
    }

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

  const uploadAvatar = async (token) => {
    if (!avatarUri) return;

    try {
      const filename = avatarUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      const formData = new FormData();
      formData.append('avatar', {
        uri: avatarUri,
        name: filename,
        type,
      });

      await apiService.patch(API_ENDPOINTS.PRO_PROFILE, formData);
    } catch (error) {
      console.error('Avatar upload failed:', error);
      Alert.alert(t('common.success'), t('auth.signup.avatarUploadFailed'));
    }
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const signupData = {
        phone,
        role: 'pro',
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim(),
        },
      };

      // Include optional fields if provided
      if (dateOfBirth) {
        signupData.profile.dateOfBirth = dateOfBirth.toISOString().split('T')[0];
      }
      if (sex) {
        signupData.profile.sex = sex;
      }
      if (heardAboutUs) {
        signupData.profile.heardAboutUs = heardAboutUs;
      }

      // Include referral code if valid
      if (referralCode && referralCodeValid) {
        signupData.referral_code = referralCode;
      }

      const response = await apiService.post(API_ENDPOINTS.SIGNUP, signupData);

      if (response.success) {
        // Login first so we have an auth token for the avatar upload
        await login(response.data.token, response.data.user, response.data.refreshToken);

        // Upload avatar (non-blocking for navigation - account is created)
        await uploadAvatar(response.data.token);

        Alert.alert(
          t('auth.signup.accountCreated'),
          t('auth.signup.accountCreatedMessage'),
          [{ text: t('common.continue') }]
        );
      }
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        Alert.alert(
          t('common.pleaseWait'),
          t('common.tooManyRequests', { seconds: error.retryAfter })
        );
      } else if (error.code === 'VALIDATION_ERROR') {
        if (error.errors && error.errors.length > 0) {
          const newErrors = {};
          error.errors.forEach(err => {
            if (err.path === 'profile.firstName') {
              newErrors.firstName = err.msg;
            } else if (err.path === 'profile.lastName') {
              newErrors.lastName = err.msg;
            } else if (err.path === 'profile.bio') {
              newErrors.bio = err.msg;
            }
          });
          setErrors(newErrors);
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

  const isFormValid = firstName && lastName && bio && avatarUri;

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
            {/* Profile Photo */}
            <View className="mb-6 items-center">
              <Text
                className="text-sm font-medium text-gray-700 mb-3 self-start"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.profilePhoto')} *
              </Text>
              <TouchableOpacity
                onPress={handlePickAvatar}
                className="items-center"
              >
                {avatarUri ? (
                  <View className="relative">
                    <Image
                      source={{ uri: avatarUri }}
                      className="w-28 h-28 rounded-full"
                    />
                    <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center border-2 border-white">
                      <Ionicons name="camera" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                ) : (
                  <View className="w-28 h-28 rounded-full bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300">
                    <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                    <Text
                      className="text-xs text-gray-400 mt-1"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {t('auth.signup.takePhoto')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.avatar && (
                <Text
                  className="text-red-500 text-xs mt-2"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {errors.avatar}
                </Text>
              )}
            </View>

            {/* First Name */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.firstName')} *
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

            {/* Last Name */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.lastName')} *
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

            {/* Date of Birth */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.dateOfBirth')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-200"
              >
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text
                  className={`ml-3 flex-1 ${dateOfBirth ? 'text-gray-900' : 'text-gray-400'}`}
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
                >
                  {dateOfBirth ? formatDate(dateOfBirth) : t('auth.signup.dateOfBirthPlaceholder')}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateOfBirth || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="self-end mt-1"
                >
                  <Text
                    className="text-primary"
                    style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
                  >
                    {t('common.done')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sex Selector */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.sex')}
              </Text>
              <View className="flex-row" style={{ gap: 8 }}>
                {[
                  { key: 'male', label: t('auth.signup.male') },
                  { key: 'female', label: t('auth.signup.female') },
                  { key: 'other', label: t('auth.signup.other') },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setSex(sex === option.key ? '' : option.key)}
                    className={`flex-1 items-center py-3 rounded-xl border ${
                      sex === option.key
                        ? 'bg-primary border-primary'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={sex === option.key ? 'text-white' : 'text-gray-700'}
                      style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* About Your Services */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.aboutServices')} *
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

            {/* How did you hear about us */}
            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {t('auth.signup.heardAboutUs')}
              </Text>
              <View style={{ gap: 6 }}>
                {heardAboutUsOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => setHeardAboutUs(heardAboutUs === option.key ? '' : option.key)}
                    className={`flex-row items-center px-4 py-3 rounded-xl border ${
                      heardAboutUs === option.key
                        ? 'bg-blue-50 border-primary'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Ionicons
                      name={heardAboutUs === option.key ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={heardAboutUs === option.key ? '#2563EB' : '#9CA3AF'}
                    />
                    <Text
                      className={`ml-3 ${heardAboutUs === option.key ? 'text-primary' : 'text-gray-700'}`}
                      style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
              disabled={!isFormValid}
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
