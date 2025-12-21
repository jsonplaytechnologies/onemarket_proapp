import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../context/AuthContext';

const EditProfileScreen = ({ navigation }) => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRO_PROFILE);
      if (response.success) {
        const data = response.data;
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setBio(data.bio || '');
        setExperienceYears(data.experience_years?.toString() || '');
        setBankName(data.bank_name || '');
        setAccountNumber(data.account_number || '');
        setMobileMoneyNumber(data.mobile_money_number || '');
        setAvatar(data.avatar_url);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('bio', bio);
      if (experienceYears) formData.append('experienceYears', experienceYears);
      if (bankName) formData.append('bankName', bankName);
      if (accountNumber) formData.append('accountNumber', accountNumber);
      if (mobileMoneyNumber) formData.append('mobileMoneyNumber', mobileMoneyNumber);

      if (avatarUri) {
        const filename = avatarUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('avatar', {
          uri: avatarUri,
          name: filename,
          type,
        });
      }

      const response = await apiService.patch(API_ENDPOINTS.PRO_PROFILE, formData);

      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Text
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Edit Profile
            </Text>
          </View>
        </View>

        {/* Avatar */}
        <View className="items-center mt-6 mb-6">
          <TouchableOpacity onPress={pickImage}>
            {avatarUri || avatar ? (
              <Image
                source={{ uri: avatarUri || avatar }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center">
                <Ionicons name="person" size={40} color={COLORS.primary} />
              </View>
            )}
            <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center">
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text
            className="text-sm text-primary mt-2"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            Change Photo
          </Text>
        </View>

        {/* Form */}
        <View className="px-6">
          {/* Personal Info */}
          <Text
            className="text-sm font-medium text-gray-500 mb-3"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            PERSONAL INFORMATION
          </Text>

          <View className="mb-4">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              First Name *
            </Text>
            <Input
              placeholder="Enter first name"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View className="mb-4">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Last Name *
            </Text>
            <Input
              placeholder="Enter last name"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View className="mb-4">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Bio
            </Text>
            <Input
              placeholder="Describe your services..."
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
            />
          </View>

          <View className="mb-6">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Years of Experience
            </Text>
            <Input
              placeholder="e.g. 5"
              value={experienceYears}
              onChangeText={setExperienceYears}
              keyboardType="number-pad"
            />
          </View>

          {/* Payment Info */}
          <Text
            className="text-sm font-medium text-gray-500 mb-3"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            PAYMENT INFORMATION
          </Text>

          <View className="mb-4">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Mobile Money Number
            </Text>
            <Input
              placeholder="+241 XX XXX XXXX"
              value={mobileMoneyNumber}
              onChangeText={setMobileMoneyNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View className="mb-4">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Bank Name
            </Text>
            <Input
              placeholder="Enter bank name"
              value={bankName}
              onChangeText={setBankName}
            />
          </View>

          <View className="mb-6">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Bank Account Number
            </Text>
            <Input
              placeholder="Enter account number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />
          </View>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
          />

          <View className="h-8" />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;
