import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';

const PendingApprovalScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, logout, fetchUserProfile } = useAuth();
  const [checking, setChecking] = useState(false);

  // Check if user is rejected and redirect automatically
  useEffect(() => {
    if (user?.approval_status === 'rejected') {
      navigation.replace('AccountRejected');
    }
  }, [user?.approval_status]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const updatedUser = await fetchUserProfile(true);

      if (updatedUser?.approval_status === 'approved') {
        // If approved, navigation happens automatically via AppNavigator
        return;
      } else if (updatedUser?.approval_status === 'rejected') {
        // Navigate to rejection screen
        navigation.replace('AccountRejected');
      } else {
        // Still pending
        Alert.alert(
          t('pendingApproval.statusUpdate'),
          t('pendingApproval.stillUnderReview'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('pendingApproval.failedToCheck'));
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
            {t('pendingApproval.title')}
          </Text>

          {/* Description */}
          <Text
            className="text-base text-gray-500 text-center mb-8"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {t('pendingApproval.description')}
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
                  {t('pendingApproval.whatHappensNext')}
                </Text>
                <Text
                  className="text-sm text-blue-700 mt-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {t('pendingApproval.nextDescription')}
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
              {t('pendingApproval.submissionChecklist')}
            </Text>

            {[
              { label: t('pendingApproval.idDocuments'), status: 'submitted' },
              { label: t('pendingApproval.servicesAdded'), status: 'submitted' },
              { label: t('pendingApproval.coverageZones'), status: 'submitted' },
              { label: t('pendingApproval.adminReview'), status: 'pending' },
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
                    {t('pendingApproval.inProgress')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Buttons */}
        <View className="px-6 pb-6">
          <Button
            title={checking ? t('pendingApproval.checking') : t('pendingApproval.checkStatus')}
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
              {t('pendingApproval.editProfile')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="mt-2 py-3 items-center" onPress={logout}>
            <Text
              className="text-gray-500 font-medium"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              {t('common.logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PendingApprovalScreen;
