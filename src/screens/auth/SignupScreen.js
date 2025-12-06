import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

const SignupScreen = ({ navigation, route }) => {
  const { phone } = route.params;
  const { login } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!firstName || firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    if (!lastName || lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    if (!bio || bio.length < 10) {
      newErrors.bio = 'Please describe your services (at least 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiService.post(API_ENDPOINTS.SIGNUP, {
        phone,
        role: 'pro', // Important: Sign up as Pro
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim(),
        },
      });

      if (response.success) {
        // Login and let AppNavigator handle navigation automatically
        await login(response.data.token, response.data.user);
        Alert.alert(
          'Account Created!',
          'Your account has been created. Complete your profile to get approved.',
          [{ text: 'Continue' }] // No navigation needed - AppNavigator auto-redirects
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
              Create your Pro account
            </Text>

            <Text
              className="text-base text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Tell us about yourself and your services
            </Text>
          </View>

          {/* Form */}
          <View className="px-6">
            <View className="mb-4">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                First Name
              </Text>
              <Input
                placeholder="Enter your first name"
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
                Last Name
              </Text>
              <Input
                placeholder="Enter your last name"
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

            <View className="mb-6">
              <Text
                className="text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                About Your Services
              </Text>
              <Input
                placeholder="Describe your professional experience and the services you offer..."
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

            {/* Info Card */}
            <View className="bg-blue-50 p-4 rounded-xl mb-6">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={24} color="#2563EB" />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-blue-900"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    What happens next?
                  </Text>
                  <Text
                    className="text-sm text-blue-700 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    After creating your account, you'll need to:{'\n'}
                    1. Upload your ID documents{'\n'}
                    2. Add your services{'\n'}
                    3. Select your coverage zones{'\n'}
                    4. Wait for admin approval
                  </Text>
                </View>
              </View>
            </View>

            {/* Create Account Button */}
            <Button
              title="Create Account"
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
