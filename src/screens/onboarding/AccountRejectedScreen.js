import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';

const AccountRejectedScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  const rejectionReason = user?.rejectionReason || 'Your account did not meet our requirements.';

  const handleReapply = () => {
    // Go back to onboarding home to update profile
    navigation.navigate('OnboardingHome');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-12 items-center justify-center">
          {/* Icon */}
          <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="close-circle" size={48} color={COLORS.error} />
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
          <View className="w-full bg-red-50 p-4 rounded-xl mb-8">
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
          <View className="w-full bg-blue-50 p-4 rounded-xl mb-8">
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
                  You can update your profile information and documents, then reapply for approval. Make sure all your information is accurate and complete.
                </Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          <View className="w-full mb-8">
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
        </View>

        {/* Bottom Buttons */}
        <View className="px-6 pb-6">
          <Button
            title="Update & Reapply"
            onPress={handleReapply}
            icon={<Ionicons name="refresh-outline" size={20} color="#FFFFFF" />}
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
