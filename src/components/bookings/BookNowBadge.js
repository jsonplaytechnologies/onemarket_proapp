import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BookNowBadge = ({ style }) => {
  return (
    <View
      className="bg-red-500 px-3 py-2 rounded-xl flex-row items-center"
      style={style}
    >
      <Ionicons name="flash" size={16} color="#FFFFFF" />
      <Text
        className="text-white ml-1"
        style={{ fontFamily: 'Poppins-Bold', fontSize: 12 }}
      >
        BOOK NOW
      </Text>
    </View>
  );
};

export default BookNowBadge;
