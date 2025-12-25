import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const RankingStatsCard = ({ stats, onPress }) => {
  if (!stats) {
    return null;
  }

  const {
    trust_score = 4.0,
    job_confidence = 0.1,
    best_provider_score = 0.4,
    completed_bookings = 0,
    average_rating = 0,
    rank_percentile = 0,
  } = stats;

  // Calculate stars display
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={16} color="#F59E0B" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={16} color="#F59E0B" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={16} color="#D1D5DB" />
        );
      }
    }
    return stars;
  };

  // Calculate confidence percentage
  const confidencePercent = Math.round(job_confidence * 100);

  // Determine rank badge
  const getRankBadge = () => {
    if (rank_percentile >= 90) {
      return { label: 'Top 10%', color: '#059669', bg: '#D1FAE5' };
    } else if (rank_percentile >= 75) {
      return { label: 'Top 25%', color: '#2563EB', bg: '#DBEAFE' };
    } else if (rank_percentile >= 50) {
      return { label: 'Top 50%', color: '#7C3AED', bg: '#EDE9FE' };
    } else {
      return { label: 'Building Rank', color: '#F59E0B', bg: '#FEF3C7' };
    }
  };

  const rankBadge = getRankBadge();

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-5 border border-gray-200 mb-4"
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center mr-3">
            <Ionicons name="trophy" size={22} color="#7C3AED" />
          </View>
          <View>
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
            >
              Your Performance
            </Text>
            <View
              className="px-2 py-0.5 rounded mt-1"
              style={{ backgroundColor: rankBadge.bg }}
            >
              <Text
                style={{
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: 10,
                  color: rankBadge.color,
                }}
              >
                {rankBadge.label}
              </Text>
            </View>
          </View>
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </View>

      {/* Stats Grid */}
      <View className="space-y-3">
        {/* Trust Score */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              Trust Score
            </Text>
            <View className="flex-row items-center mt-1">
              {renderStars(trust_score)}
              <Text
                className="text-gray-900 ml-2"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
              >
                {trust_score.toFixed(1)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 20 }}
            >
              {trust_score.toFixed(1)}
            </Text>
            <Text
              className="text-gray-400"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              /5.0
            </Text>
          </View>
        </View>

        {/* Job Confidence */}
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              Job Confidence
            </Text>
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
            >
              {confidencePercent}%
            </Text>
          </View>
          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <View
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${confidencePercent}%` }}
            />
          </View>
          <Text
            className="text-gray-400 mt-1"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
          >
            {completed_bookings} of 50 jobs completed
          </Text>
        </View>

        {/* Provider Score */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          <View>
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
            >
              Provider Score
            </Text>
            <Text
              className="text-gray-900 mt-1"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 18 }}
            >
              {best_provider_score.toFixed(2)}
            </Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-lg">
              <Ionicons name="trending-up" size={14} color="#059669" />
              <Text
                className="text-green-700 ml-1"
                style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12 }}
              >
                Higher = More Jobs
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Info Footer */}
      {completed_bookings < 50 && (
        <View className="bg-blue-50 mt-4 p-3 rounded-xl flex-row items-start">
          <Ionicons name="information-circle" size={18} color="#1D4ED8" style={{ marginTop: 1 }} />
          <Text
            className="text-blue-800 ml-2 flex-1"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
          >
            Complete more jobs to increase your ranking and get more auto-assigned bookings!
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default RankingStatsCard;
