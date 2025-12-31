/**
 * CompletedActions Component
 * Job completion success with customer rating
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants/colors';

// Star Rating Component
const StarRating = ({ rating, size = 20 }) => {
  const stars = [];
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating || 0) - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Ionicons key={i} name="star" size={size} color="#FBBF24" />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <Ionicons key={i} name="star-half" size={size} color="#FBBF24" />
      );
    } else {
      stars.push(
        <Ionicons key={i} name="star-outline" size={size} color="#D1D5DB" />
      );
    }
  }

  return <View className="flex-row items-center">{stars}</View>;
};

const CompletedActions = ({ booking }) => {
  const reviewRating = booking?.review_rating || booking?.reviewRating;
  const reviewText = booking?.review_comment || booking?.review_text || booking?.reviewText;

  return (
    <View className="bg-green-50 p-5 rounded-xl border border-green-200">
      {/* Success Header */}
      <View className="flex-row items-center mb-4">
        <View className="w-12 h-12 bg-green-100 rounded-full items-center justify-center">
          <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
        </View>
        <View className="ml-3 flex-1">
          <Text
            className="text-green-800"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
          >
            Job Completed!
          </Text>
          <Text
            className="text-green-600"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
          >
            Earnings credited to your wallet
          </Text>
        </View>
      </View>

      {/* Customer Rating Section */}
      <View className="bg-white p-4 rounded-xl border border-green-100">
        <Text
          className="text-gray-500 mb-2"
          style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
        >
          CUSTOMER RATING
        </Text>

        {reviewRating ? (
          <View>
            <View className="flex-row items-center mb-2">
              <StarRating rating={reviewRating} size={24} />
              <Text
                className="text-gray-800 ml-2"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 20 }}
              >
                {reviewRating.toFixed(1)}
              </Text>
            </View>

            {reviewText && (
              <View className="mt-2 pt-2 border-t border-gray-100">
                <Text
                  className="text-gray-600"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                >
                  "{reviewText}"
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-row items-center">
            <StarRating rating={0} size={20} />
            <Text
              className="text-gray-400 ml-2"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
            >
              No rating yet
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CompletedActions;
