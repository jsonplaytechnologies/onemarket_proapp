import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import Button from '../../components/common/Button';
import { COLORS } from '../../constants/colors';

const OnboardingHomeScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, fetchUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState(null);
  const [availability, setAvailability] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadProfileAndAvailability();
    }, [])
  );

  const loadProfileAndAvailability = async () => {
    try {
      // Fetch profile and availability in parallel
      const [profileResponse, availabilityResponse] = await Promise.all([
        apiService.get(API_ENDPOINTS.PRO_PROFILE).catch(() => null),
        apiService.get(API_ENDPOINTS.PRO_AVAILABILITY_GET).catch(() => null),
      ]);

      if (profileResponse?.success) {
        setProfile(profileResponse.data);
      }

      if (availabilityResponse?.success && availabilityResponse.data) {
        // Filter for active slots only
        const activeSlots = availabilityResponse.data.filter(slot => slot.is_active);
        setAvailability(activeSlots);
      }
    } catch (error) {
      // Handle pending approval - show empty profile state
      if (error.message?.includes('pending approval')) {
        setProfile(null);
      } else {
        console.error('Error loading profile:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step) => {
    if (!profile && step !== 'schedule') return 'pending';

    // Handle snake_case from API
    const idNumber = profile?.id_number || profile?.idNumber;
    const isIdVerified = profile?.is_id_verified || profile?.isIdVerified;

    switch (step) {
      case 'documents':
        // Submitted documents count as completed (green), verified is also completed
        return idNumber ? 'completed' : 'pending';
      case 'services':
        return profile?.services && profile.services.length > 0 ? 'completed' : 'pending';
      case 'zones':
        return profile?.zones && profile.zones.length > 0 ? 'completed' : 'pending';
      case 'schedule':
        // At least one active availability slot required
        return availability.length > 0 ? 'completed' : 'pending';
      default:
        return 'pending';
    }
  };

  const isAllCompleted = () => {
    return (
      getStepStatus('documents') === 'completed' &&
      getStepStatus('services') === 'completed' &&
      getStepStatus('zones') === 'completed' &&
      getStepStatus('schedule') === 'completed'
    );
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    try {
      const response = await apiService.post(API_ENDPOINTS.PRO_SUBMIT);
      if (response.success) {
        Alert.alert(
          t('onboarding.home.applicationSubmitted'),
          t('onboarding.home.applicationSubmittedMessage'),
          [{ text: t('common.ok') }]
        );
        // Refresh user profile to get updated approval_status
        await fetchUserProfile();
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      id: 'documents',
      title: t('onboarding.home.uploadDocuments'),
      description: t('onboarding.home.uploadDocumentsDesc'),
      icon: 'id-card-outline',
      screen: 'UploadDocuments',
    },
    {
      id: 'services',
      title: t('onboarding.home.addServices'),
      description: t('onboarding.home.addServicesDesc'),
      icon: 'construct-outline',
      screen: 'AddServices',
    },
    {
      id: 'zones',
      title: t('onboarding.home.setZones'),
      description: t('onboarding.home.setZonesDesc'),
      icon: 'location-outline',
      screen: 'AddZones',
    },
    {
      id: 'schedule',
      title: t('onboarding.home.setSchedule'),
      description: t('onboarding.home.setScheduleDesc'),
      icon: 'calendar-outline',
      screen: 'Availability',
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />;
      case 'pending_review':
        return <Ionicons name="time" size={24} color={COLORS.warning} />;
      default:
        return <Ionicons name="ellipse-outline" size={24} color={COLORS.textSecondary} />;
    }
  };

  const getStatusText = (status, stepId) => {
    switch (status) {
      case 'completed':
        // Show "Submitted" for documents, "Completed" for others
        return stepId === 'documents' ? t('onboarding.home.submitted') : t('onboarding.home.completed');
      case 'pending_review':
        return t('onboarding.home.underReview');
      default:
        return t('onboarding.home.pending');
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary px-6 pt-6 pb-6">
          <Text
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            {t('onboarding.home.title')}
          </Text>
          <Text
            className="text-base text-blue-100"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {t('onboarding.home.subtitle')}
          </Text>
        </View>

        {/* Steps */}
        <View className="px-4 mt-4">
          <Text
            className="text-lg font-semibold text-gray-900 mb-4"
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            {t('onboarding.home.setupSteps')}
          </Text>

          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isCompleted = status === 'completed';

            return (
              <TouchableOpacity
                key={step.id}
                className={`flex-row items-center bg-white rounded-xl p-4 mb-3 border ${
                  isCompleted ? 'border-green-200' : 'border-gray-200'
                }`}
                onPress={() => navigation.navigate(step.screen)}
                activeOpacity={0.7}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
                    isCompleted ? 'bg-green-50' : 'bg-gray-100'
                  }`}
                >
                  <Ionicons
                    name={step.icon}
                    size={24}
                    color={isCompleted ? COLORS.success : COLORS.textSecondary}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-medium text-gray-900"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {step.title}
                  </Text>
                  <Text
                    className="text-sm text-gray-500"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {step.description}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      status === 'completed'
                        ? 'text-green-600'
                        : status === 'pending_review'
                        ? 'text-yellow-600'
                        : 'text-gray-400'
                    }`}
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {getStatusText(status, step.id)}
                  </Text>
                </View>
                {getStatusIcon(status)}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit Application Button - Show when all steps are completed and status is incomplete */}
        {isAllCompleted() && user?.approval_status === 'incomplete' && (
          <View className="px-4 mt-4 mb-6">
            <View className="bg-green-50 p-4 rounded-xl border border-green-200 mb-4">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-green-900"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {t('onboarding.home.allCompleted')}
                  </Text>
                  <Text
                    className="text-sm text-green-700 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {t('onboarding.home.readyToSubmit')}
                  </Text>
                </View>
              </View>
            </View>

            <Button
              title={t('onboarding.home.submitApplication')}
              onPress={handleSubmitApplication}
              loading={submitting}
              icon={<Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />}
            />
          </View>
        )}

        {/* Waiting for Admin Approval */}
        {isAllCompleted() && user?.approval_status === 'pending' && (
          <View className="px-4 mt-4 mb-6">
            <View className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <View className="items-center">
                <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                  <Ionicons name="hourglass-outline" size={32} color={COLORS.primary} />
                </View>
                <Text
                  className="text-lg font-bold text-blue-900 text-center mb-2"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  {t('onboarding.home.waitingApproval')}
                </Text>
                <Text
                  className="text-sm text-blue-700 text-center mb-4"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {t('onboarding.home.profileComplete')}
                </Text>
                <View className="flex-row items-center bg-green-100 px-4 py-2 rounded-full">
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  <Text
                    className="text-sm text-green-700 ml-2"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {t('onboarding.home.allStepsCompleted')}
                  </Text>
                </View>
              </View>
            </View>

            <Button
              title={t('onboarding.home.viewStatus')}
              onPress={() => navigation.navigate('PendingApproval')}
              variant="secondary"
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {/* Rejected - Show resubmit option */}
        {isAllCompleted() && user?.approval_status === 'rejected' && (
          <View className="px-4 mt-4 mb-6">
            <View className="bg-red-50 p-4 rounded-xl border border-red-200 mb-4">
              <View className="flex-row items-start">
                <Ionicons name="alert-circle" size={24} color={COLORS.error} />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-red-900"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {t('onboarding.home.previouslyRejected')}
                  </Text>
                  <Text
                    className="text-sm text-red-700 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {user?.rejection_reason || t('onboarding.home.rejectedDefaultMessage')}
                  </Text>
                </View>
              </View>
            </View>

            <Button
              title={t('onboarding.home.submitAgain')}
              onPress={() => navigation.navigate('AccountRejected')}
              icon={<Ionicons name="paper-plane-outline" size={20} color="#FFFFFF" />}
            />
          </View>
        )}

        {/* Incomplete Profile Notice - Show when not all steps are done */}
        {(user?.approval_status === 'incomplete' || user?.approval_status === 'rejected') && !isAllCompleted() && (
          <View className="px-4 mt-4 mb-6">
            <View className="bg-yellow-50 p-4 rounded-xl">
              <View className="flex-row items-start">
                <Ionicons name="time" size={24} color={COLORS.warning} />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-yellow-900"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    {t('onboarding.home.profileIncomplete')}
                  </Text>
                  <Text
                    className="text-sm text-yellow-700 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {t('onboarding.home.completeAllSteps')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default OnboardingHomeScreen;
