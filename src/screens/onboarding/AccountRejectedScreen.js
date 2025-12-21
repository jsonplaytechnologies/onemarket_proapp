import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';

const AccountRejectedScreen = ({ navigation }) => {
  const { user, logout, fetchUserProfile } = useAuth();
  const [reapplying, setReapplying] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [checking, setChecking] = useState(true);

  const rejectionReason = user?.rejection_reason || user?.rejectionReason || 'Your account did not meet our requirements.';

  useEffect(() => {
    checkForChanges();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkForChanges();
    });
    return unsubscribe;
  }, [navigation]);

  const checkForChanges = async () => {
    setChecking(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.PRO_PROFILE);
      if (response.success && response.data) {
        // After rejection, ID documents are cleared
        // User must re-upload ID to resubmit
        const idNumber = response.data.id_number || response.data.idNumber;
        const hasIdUploaded = !!idNumber;

        setHasChanges(hasIdUploaded);
      }
    } catch (error) {
      console.log('Error checking for changes:', error);
      setHasChanges(false);
    } finally {
      setChecking(false);
    }
  };

  const handleUpdateProfile = () => {
    navigation.navigate('OnboardingHome');
  };

  const handleReapply = async () => {
    if (!hasChanges) {
      Alert.alert(
        'No Changes Made',
        'Please update your profile information before resubmitting for review.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Reapply for Approval',
      'Are you sure you want to submit your account for review again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit for Review',
          onPress: async () => {
            setReapplying(true);
            try {
              const response = await apiService.post(API_ENDPOINTS.PRO_REAPPLY);

              if (response.success) {
                if (fetchUserProfile) {
                  await fetchUserProfile();
                }

                Alert.alert(
                  'Submitted!',
                  'Your account has been submitted for review again. We will notify you once a decision is made.',
                  [{ text: 'OK', onPress: () => navigation.replace('PendingApproval') }]
                );
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to submit for review. Please try again.');
            } finally {
              setReapplying(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-8">
          {/* Icon */}
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center">
              <Ionicons name="close-circle" size={48} color={COLORS.error} />
            </View>
          </View>

          {/* Title */}
          <Text
            className="text-2xl font-bold text-gray-900 text-center mb-2"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Account Not Approved
          </Text>

          {/* Description */}
          <Text
            className="text-base text-gray-500 text-center mb-6"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Unfortunately, your account was not approved at this time.
          </Text>

          {/* Rejection Reason Card */}
          <View className="w-full bg-red-50 p-4 rounded-xl mb-6">
            <View className="flex-row items-start">
              <Ionicons name="alert-circle" size={24} color={COLORS.error} />
              <View className="flex-1 ml-3">
                <Text
                  className="text-sm font-medium text-red-900"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Reason for Rejection
                </Text>
                <Text
                  className="text-sm text-red-700 mt-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {rejectionReason}
                </Text>
              </View>
            </View>
          </View>

          {/* What to do */}
          <View className="w-full bg-blue-50 p-4 rounded-xl mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color={COLORS.primary} />
              <View className="flex-1 ml-3">
                <Text
                  className="text-sm font-medium text-blue-900"
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  What can I do?
                </Text>
                <Text
                  className="text-sm text-blue-700 mt-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  Update your profile information and documents, then reapply for approval. You must make at least one change before resubmitting.
                </Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          <View className="w-full mb-6">
            <Text
              className="text-sm font-medium text-gray-700 mb-3"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Tips for Reapplication
            </Text>

            {[
              'Ensure your ID photos are clear and readable',
              'Double-check all personal information',
              'Add relevant services with competitive pricing',
              'Select appropriate coverage zones',
            ].map((tip, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <Ionicons name="checkmark" size={18} color={COLORS.success} />
                <Text
                  className="text-sm text-gray-600 ml-2 flex-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {tip}
                </Text>
              </View>
            ))}
          </View>

          {/* Changes Status */}
          {!checking && (
            <View className={`flex-row items-center justify-center mb-4 p-3 rounded-xl ${hasChanges ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <Ionicons
                name={hasChanges ? "checkmark-circle" : "warning"}
                size={18}
                color={hasChanges ? COLORS.success : COLORS.warning}
              />
              <Text
                className={`ml-2 ${hasChanges ? 'text-green-700' : 'text-yellow-700'}`}
                style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
              >
                {hasChanges ? 'Changes detected - ready to resubmit' : 'Please make changes before resubmitting'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Buttons */}
        <View className="px-6 pb-6">
          <Button
            title="Update Profile"
            onPress={handleUpdateProfile}
            variant="secondary"
            icon={<Ionicons name="create-outline" size={20} color={COLORS.primary} />}
          />

          <View className="h-3" />

          <Button
            title="Submit for Review Again"
            onPress={handleReapply}
            loading={reapplying}
            disabled={!hasChanges || checking}
            icon={<Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />}
          />

          <TouchableOpacity className="mt-4 py-3 items-center" onPress={logout}>
            <Text
              className="text-gray-500 font-medium"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountRejectedScreen;
