import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';

const PendingApprovalScreen = ({ navigation }) => {
  const { user, logout, fetchUserProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const updatedUser = await fetchUserProfile();
      // If user is now approved, AppNavigator will automatically redirect to Main
      // Only show "still pending" message if not approved
      if (updatedUser?.approval_status !== 'approved') {
        Alert.alert(
          'Status Update',
          'Your application is still under review. Please check back later.',
          [{ text: 'OK' }]
        );
      }
      // If approved, no alert needed - navigation happens automatically
    } catch (error) {
      Alert.alert('Error', 'Failed to check status. Please try again.');
    } finally {
      setChecking(false);
    }
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
          <View className="w-24 h-24 bg-yellow-100 rounded-full items-center justify-center mb-6">
            <Ionicons name="time" size={48} color={COLORS.warning} />
          </View>

          {/* Title */}
          <Text
            className="text-2xl font-bold text-gray-900 text-center mb-2"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Pending Approval
          </Text>

          {/* Description */}
          <Text
            className="text-base text-gray-500 text-center mb-8"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Your account is currently under review. We'll notify you once your account is approved.
          </Text>

          {/* Info Card */}
          <View className="w-full bg-blue-50 p-4 rounded-xl mb-8">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color={COLORS.primary} />
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
                  Our team will review your profile, documents, and services. This usually takes 1-2 business days. You'll receive a notification once approved.
                </Text>
              </View>
            </View>
          </View>

          {/* Checklist */}
          <View className="w-full mb-8">
            <Text
              className="text-sm font-medium text-gray-700 mb-3"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Submission Checklist
            </Text>

            {[
              { label: 'ID Documents', status: 'submitted' },
              { label: 'Services Added', status: 'submitted' },
              { label: 'Coverage Zones', status: 'submitted' },
              { label: 'Admin Review', status: 'pending' },
            ].map((item, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <Ionicons
                  name={item.status === 'submitted' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={item.status === 'submitted' ? COLORS.success : COLORS.warning}
                />
                <Text
                  className={`text-sm ml-2 ${
                    item.status === 'submitted' ? 'text-gray-700' : 'text-gray-500'
                  }`}
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {item.label}
                </Text>
                {item.status === 'pending' && (
                  <Text
                    className="text-xs text-yellow-600 ml-2"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    In Progress
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Buttons */}
        <View className="px-6 pb-6">
          <Button
            title={checking ? "Checking..." : "Check Status"}
            onPress={handleCheckStatus}
            loading={checking}
            icon={!checking && <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />}
          />

          <TouchableOpacity
            className="mt-4 py-3 items-center"
            onPress={() => navigation.goBack()}
          >
            <Text
              className="text-primary font-medium"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mt-2 py-3 items-center" onPress={logout}>
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

export default PendingApprovalScreen;
