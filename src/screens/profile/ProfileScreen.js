import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageChangeModal } from '../../components/common/LanguageSelector';
import { COLORS } from '../../constants/colors';

const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user, logout, fetchUserProfile, isProfileStale, profileLastFetched } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Use user data from AuthContext as profile
  const profile = user?.profile || user;

  // Only fetch profile if stale when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (isProfileStale()) {
        setLoading(true);
        fetchUserProfile(true).finally(() => setLoading(false));
      }
    }, [isProfileStale, fetchUserProfile])
  );

  // Update loading state when profile is fetched
  useEffect(() => {
    if (profileLastFetched && loading) {
      setLoading(false);
    }
  }, [profileLastFetched]);

  const isOnline = user?.is_online || profile?.is_online || false;

  const firstName = profile?.first_name || user?.profile?.first_name || '';
  const lastName = profile?.last_name || user?.profile?.last_name || '';
  const avatarUrl = profile?.avatar_url || user?.profile?.avatar_url;
  const phone = user?.phone || '';
  const rating = parseFloat(profile?.average_rating) || 0;
  const totalReviews = profile?.total_reviews || 0;

  const menuItems = [
    {
      id: 'incentives',
      icon: 'gift-outline',
      label: t('profile.menuItems.incentives'),
      onPress: () => navigation.navigate('IncentiveDashboard'),
      highlight: true,
    },
    {
      id: 'referrals',
      icon: 'share-social-outline',
      label: t('profile.menuItems.referrals'),
      onPress: () => navigation.navigate('Referrals'),
    },
    {
      id: 'schedule',
      icon: 'calendar-outline',
      label: t('profile.menuItems.schedule'),
      onPress: () => navigation.navigate('MySchedule'),
    },
    {
      id: 'availability',
      icon: 'time-outline',
      label: t('profile.menuItems.availability'),
      onPress: () => navigation.navigate('Availability'),
    },
    {
      id: 'services',
      icon: 'construct-outline',
      label: t('profile.menuItems.services'),
      onPress: () => navigation.navigate('MyServices'),
    },
    {
      id: 'zones',
      icon: 'location-outline',
      label: t('profile.menuItems.zones'),
      onPress: () => navigation.navigate('MyZones'),
    },
    {
      id: 'earnings',
      icon: 'wallet-outline',
      label: t('profile.menuItems.earnings'),
      onPress: () => navigation.navigate('Earnings'),
    },
    {
      id: 'reviews',
      icon: 'star-outline',
      label: t('profile.menuItems.reviews'),
      onPress: () => navigation.navigate('Reviews'),
    },
    {
      id: 'bookings',
      icon: 'calendar-outline',
      label: t('profile.menuItems.bookings'),
      onPress: () => navigation.navigate('Bookings'),
    },
    {
      id: 'edit',
      icon: 'person-outline',
      label: t('profile.menuItems.edit'),
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      id: 'language',
      icon: 'globe-outline',
      label: t('profile.menuItems.language'),
      onPress: () => setShowLanguageModal(true),
      rightText: language === 'en' ? 'English' : 'Francais',
    },
    {
      id: 'help',
      icon: 'help-circle-outline',
      label: t('profile.menuItems.help'),
      onPress: () => {},
    },
  ];

  // Show loading only on initial load when no user data exists
  if (!user && loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text
            className="text-gray-900"
            style={{ fontFamily: 'Poppins-Bold', fontSize: 28 }}
          >
            {t('profile.title')}
          </Text>
        </View>

        {/* Profile Card */}
        <View className="px-6 mb-6">
          <View className="bg-gray-50 rounded-2xl p-5">
            <View className="flex-row items-center">
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 72, height: 72, borderRadius: 24 }}
                />
              ) : (
                <View className="w-18 h-18 bg-blue-100 rounded-3xl items-center justify-center" style={{ width: 72, height: 72 }}>
                  <Ionicons name="person" size={32} color={COLORS.primary} />
                </View>
              )}

              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text
                    className="text-gray-900"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 20 }}
                  >
                    {firstName} {lastName}
                  </Text>
                  <View
                    className={`w-2.5 h-2.5 rounded-full ml-2 ${
                      isOnline ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                </View>
                <Text
                  className="text-gray-500 mt-0.5"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
                >
                  {phone}
                </Text>

                <View className="flex-row items-center mt-2">
                  <Ionicons name="star" size={16} color="#FBBF24" />
                  <Text
                    className="text-gray-800 ml-1"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
                  >
                    {rating.toFixed(1)}
                  </Text>
                  <Text
                    className="text-gray-400 ml-1"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                  >
                    ({totalReviews})
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                className="w-10 h-10 bg-white rounded-xl items-center justify-center"
                activeOpacity={0.7}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="create-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View className="flex-row mt-5 pt-5 border-t border-gray-200">
              <View className="flex-1 items-center">
                <Text
                  className="text-gray-900"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 22 }}
                >
                  {profile?.completed_bookings || 0}
                </Text>
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {t('profile.jobs')}
                </Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center">
                <Text
                  className="text-gray-900"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 22 }}
                >
                  {profile?.services?.length || 0}
                </Text>
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {t('profile.services')}
                </Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center">
                <Text
                  className="text-gray-900"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 22 }}
                >
                  {profile?.zones?.length || 0}
                </Text>
                <Text
                  className="text-gray-500"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {t('profile.zones')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              className={`flex-row items-center py-4 border-b border-gray-100 ${
                item.highlight ? 'bg-blue-50 -mx-4 px-4 rounded-xl border-0 mb-2' : ''
              }`}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View className={`w-10 h-10 rounded-xl items-center justify-center mr-4 ${
                item.highlight ? 'bg-blue-100' : 'bg-gray-50'
              }`}>
                <Ionicons name={item.icon} size={20} color={COLORS.primary} />
              </View>
              <Text
                className={`flex-1 ${item.highlight ? 'text-primary' : 'text-gray-800'}`}
                style={{ fontFamily: item.highlight ? 'Poppins-SemiBold' : 'Poppins-Medium', fontSize: 15 }}
              >
                {item.label}
              </Text>
              {item.rightText && (
                <Text
                  className="text-gray-400 mr-2"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                >
                  {item.rightText}
                </Text>
              )}
              <Ionicons name="chevron-forward" size={20} color={item.highlight ? COLORS.primary : '#D1D5DB'} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View className="px-6 mt-6 mb-8">
          <TouchableOpacity
            className="flex-row items-center justify-center py-4 border border-red-200 rounded-2xl"
            activeOpacity={0.7}
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text
              className="text-red-500 ml-2"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 15 }}
            >
              {t('common.logout')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Change Modal */}
      <LanguageChangeModal
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
