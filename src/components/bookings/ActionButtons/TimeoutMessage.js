/**
 * TimeoutMessage Component
 * Displays timeout message for limbo states
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TimeoutMessage = ({ title, message }) => {
  return (
    <View className="bg-red-50 p-4 rounded-xl">
      <View className="flex-row items-center">
        <Ionicons name="time" size={24} color="#DC2626" />
        <View className="flex-1 ml-3">
          <Text
            className="text-red-800"
            style={{ fontFamily: 'Poppins-SemiBold', fontSize: 14 }}
          >
            {title}
          </Text>
          <Text
            className="text-red-600 mt-1"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
          >
            {message}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default TimeoutMessage;
