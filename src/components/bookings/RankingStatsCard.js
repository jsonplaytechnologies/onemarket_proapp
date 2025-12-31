import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RankingStatsCard = ({ stats }) => {
  const [showInfo, setShowInfo] = useState(false);

  if (!stats) {
    return null;
  }

  const {
    trustScore = 4.0,
    jobConfidence = 0.1,
    bestProviderScore = 0.4,
    completedBookings = 0,
    totalReviews = 0,
  } = stats;

  const confidencePercent = Math.round(jobConfidence * 100);
  const jobsNeeded = Math.max(0, 50 - completedBookings);

  return (
    <>
      <TouchableOpacity
        className="rounded-2xl p-5 border border-purple-100"
        onPress={() => setShowInfo(true)}
        activeOpacity={0.7}
        style={{ backgroundColor: '#F5F3FF' }}
      >
        {/* Header with Main Score */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <View className="flex-row items-center">
              <Text
                className="text-gray-500"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
              >
                Your Provider Score
              </Text>
              <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" style={{ marginLeft: 4 }} />
            </View>
            <View className="flex-row items-baseline">
              <Text
                className="text-purple-700"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 36 }}
              >
                {bestProviderScore.toFixed(1)}
              </Text>
              <Text
                className="text-gray-400 ml-1"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
              >
                / 5.0
              </Text>
            </View>
          </View>
          <View className="w-14 h-14 bg-purple-100 rounded-full items-center justify-center">
            <Ionicons name="trophy" size={28} color="#7C3AED" />
          </View>
        </View>

        {/* Two Stats Row */}
        <View className="flex-row bg-white rounded-xl p-3 mb-3">
          <View className="flex-1 items-center border-r border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text
                className="text-gray-900 ml-1"
                style={{ fontFamily: 'Poppins-Bold', fontSize: 18 }}
              >
                {trustScore.toFixed(1)}
              </Text>
            </View>
            <Text
              className="text-gray-400 mt-1"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              Rating ({totalReviews} reviews)
            </Text>
          </View>

          <View className="flex-1 items-center">
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 18 }}
            >
              {completedBookings}
            </Text>
            <Text
              className="text-gray-400 mt-1"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              Jobs Done
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-gray-600"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
            >
              Experience Level
            </Text>
            <Text
              className="text-purple-600"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 12 }}
            >
              {confidencePercent}%
            </Text>
          </View>
          <View className="h-2 bg-purple-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${confidencePercent}%` }}
            />
          </View>
          {jobsNeeded > 0 && (
            <Text
              className="text-gray-400 mt-2"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              Complete {jobsNeeded} more jobs to reach max score potential
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Info Modal */}
      <Modal
        visible={showInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInfo(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-[85%]">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl text-gray-900"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                How Your Score Works
              </Text>
              <TouchableOpacity
                onPress={() => setShowInfo(false)}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Main Formula */}
              <View className="bg-purple-50 rounded-xl p-4 mb-5">
                <Text
                  className="text-purple-800 text-center mb-2"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
                >
                  Provider Score Formula
                </Text>
                <Text
                  className="text-purple-900 text-center"
                  style={{ fontFamily: 'Poppins-Bold', fontSize: 18 }}
                >
                  Rating x Experience Level
                </Text>
                <Text
                  className="text-purple-600 text-center mt-1"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {trustScore.toFixed(1)} x {confidencePercent}% = {bestProviderScore.toFixed(1)}
                </Text>
              </View>

              {/* Rating Explanation */}
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-amber-100 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="star" size={18} color="#F59E0B" />
                  </View>
                  <Text
                    className="text-gray-900"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
                  >
                    Rating ({trustScore.toFixed(1)}/5)
                  </Text>
                </View>
                <Text
                  className="text-gray-600 ml-11"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                >
                  Based on customer reviews. Each new rating gradually updates your score. Keep delivering quality service to maintain high ratings.
                </Text>
              </View>

              {/* Experience Explanation */}
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-purple-100 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="briefcase" size={18} color="#7C3AED" />
                  </View>
                  <Text
                    className="text-gray-900"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
                  >
                    Experience Level ({confidencePercent}%)
                  </Text>
                </View>
                <Text
                  className="text-gray-600 ml-11"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                >
                  Increases as you complete jobs. Reaches 100% after 50 completed jobs. This shows customers you're reliable and experienced.
                </Text>
                <View className="ml-11 mt-2 bg-gray-50 rounded-lg p-3">
                  <Text
                    className="text-gray-500"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                  >
                    Your progress: {completedBookings}/50 jobs
                  </Text>
                </View>
              </View>

              {/* Why It Matters */}
              <View className="mb-5">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center mr-3">
                    <Ionicons name="trending-up" size={18} color="#059669" />
                  </View>
                  <Text
                    className="text-gray-900"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
                  >
                    Why It Matters
                  </Text>
                </View>
                <Text
                  className="text-gray-600 ml-11"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                >
                  Higher scores mean you get priority for automatic job assignments. When customers request "Book Now", providers with the highest scores are matched first.
                </Text>
              </View>

              {/* Tips */}
              <View className="bg-blue-50 rounded-xl p-4 mb-4">
                <Text
                  className="text-blue-800 mb-3"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
                >
                  Tips to Improve Your Score
                </Text>

                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginTop: 1 }} />
                  <Text
                    className="text-blue-700 ml-2 flex-1"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                  >
                    Complete more jobs to build experience
                  </Text>
                </View>

                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginTop: 1 }} />
                  <Text
                    className="text-blue-700 ml-2 flex-1"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                  >
                    Provide excellent service to get 5-star reviews
                  </Text>
                </View>

                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginTop: 1 }} />
                  <Text
                    className="text-blue-700 ml-2 flex-1"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                  >
                    Respond quickly to booking requests
                  </Text>
                </View>

                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={18} color="#2563EB" style={{ marginTop: 1 }} />
                  <Text
                    className="text-blue-700 ml-2 flex-1"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                  >
                    Stay online during your available hours
                  </Text>
                </View>
              </View>

              {/* Current Stats Summary */}
              <View className="bg-gray-50 rounded-xl p-4">
                <Text
                  className="text-gray-700 mb-3"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
                >
                  Your Current Stats
                </Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500" style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}>
                    Provider Score
                  </Text>
                  <Text className="text-gray-900" style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13 }}>
                    {bestProviderScore.toFixed(2)} / 5.0
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500" style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}>
                    Rating
                  </Text>
                  <Text className="text-gray-900" style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13 }}>
                    {trustScore.toFixed(1)} ({totalReviews} reviews)
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500" style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}>
                    Experience Level
                  </Text>
                  <Text className="text-gray-900" style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13 }}>
                    {confidencePercent}%
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-500" style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}>
                    Jobs Completed
                  </Text>
                  <Text className="text-gray-900" style={{ fontFamily: 'Poppins-SemiBold', fontSize: 13 }}>
                    {completedBookings}
                  </Text>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default RankingStatsCard;
