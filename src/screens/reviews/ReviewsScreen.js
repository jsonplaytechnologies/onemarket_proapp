import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const ReviewsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.MY_REVIEWS);
      if (response.success) {
        setReviews(response.data || []);
        setSummary(response.pagination?.summary || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderStars = (rating) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? COLORS.warning : COLORS.textSecondary}
          />
        ))}
      </View>
    );
  };

  // Get user name from various possible field formats
  const getUserName = (item) => {
    if (item.user_first_name) {
      return `${item.user_first_name} ${item.user_last_name || ''}`.trim();
    }
    if (item.userName) return item.userName;
    if (item.user?.firstName) {
      return `${item.user.firstName} ${item.user.lastName || ''}`.trim();
    }
    return 'Customer';
  };

  // Get user avatar from various possible field formats
  const getUserAvatar = (item) => {
    return item.user_avatar || item.userAvatar || item.user?.avatar || item.user?.avatar_url;
  };

  const renderReview = ({ item }) => {
    const userName = getUserName(item);
    const userAvatar = getUserAvatar(item);
    const createdAt = item.created_at || item.createdAt;
    const serviceName = item.service_name || item.serviceName;

    return (
      <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
              />
            ) : (
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="person" size={20} color={COLORS.textSecondary} />
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text
                className="text-base font-medium text-gray-900"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                {userName}
              </Text>
              <Text
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                {formatDate(createdAt)}
              </Text>
            </View>
          </View>
          {renderStars(item.rating)}
        </View>

        {/* Service */}
        {serviceName && (
          <View className="flex-row items-center mb-2">
            <Ionicons name="construct-outline" size={14} color={COLORS.textSecondary} />
            <Text
              className="text-sm text-gray-500 ml-1"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {serviceName}
            </Text>
          </View>
        )}

        {/* Comment */}
        {item.comment && (
          <Text
            className="text-gray-700 mt-2"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {item.comment}
          </Text>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <Ionicons name="star-outline" size={64} color="#9CA3AF" />
      <Text
        className="text-xl font-semibold text-gray-900 mt-4 text-center"
        style={{ fontFamily: 'Poppins-SemiBold' }}
      >
        No Reviews Yet
      </Text>
      <Text
        className="text-base text-gray-500 text-center mt-2"
        style={{ fontFamily: 'Poppins-Regular' }}
      >
        Complete jobs to receive reviews from customers
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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
            Reviews
          </Text>
        </View>
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          summary ? (
            <View className="px-4 mt-4 mb-4">
              <View className="bg-white rounded-xl p-4 border border-gray-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text
                      className="text-3xl font-bold text-gray-900"
                      style={{ fontFamily: 'Poppins-Bold' }}
                    >
                      {summary.averageRating?.toFixed(1) || '0.0'}
                    </Text>
                    {renderStars(Math.round(summary.averageRating || 0))}
                    <Text
                      className="text-sm text-gray-500 mt-1"
                      style={{ fontFamily: 'Poppins-Regular' }}
                    >
                      {summary.totalReviews || 0} reviews
                    </Text>
                  </View>

                  {/* Rating Distribution */}
                  <View className="flex-1 ml-6">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = summary.ratingDistribution?.[rating] || 0;
                      const percentage =
                        summary.totalReviews > 0
                          ? (count / summary.totalReviews) * 100
                          : 0;

                      return (
                        <View key={rating} className="flex-row items-center mb-1">
                          <Text
                            className="text-xs text-gray-500 w-3"
                            style={{ fontFamily: 'Poppins-Regular' }}
                          >
                            {rating}
                          </Text>
                          <Ionicons name="star" size={10} color={COLORS.warning} />
                          <View className="flex-1 h-2 bg-gray-200 rounded-full ml-2 overflow-hidden">
                            <View
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          flexGrow: reviews.length === 0 ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default ReviewsScreen;
