import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const CustomerAnswersCard = ({ answers }) => {
  if (!answers || answers.length === 0) {
    return null;
  }

  return (
    <View className="bg-blue-50 rounded-xl p-4 mb-4">
      <View className="flex-row items-center mb-3">
        <Ionicons name="clipboard-outline" size={22} color="#1D4ED8" />
        <Text
          className="text-blue-800 ml-2"
          style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
        >
          Customer's Requirements
        </Text>
      </View>

      {answers.map((answer, index) => (
        <View
          key={answer.id || index}
          className={index > 0 ? 'mt-3 pt-3 border-t border-blue-200' : ''}
        >
          <Text
            className="text-blue-700 mb-1"
            style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
          >
            {answer.question_text}
          </Text>
          <View className="flex-row items-start">
            <Ionicons
              name="arrow-forward"
              size={14}
              color="#1D4ED8"
              style={{ marginTop: 2, marginRight: 6 }}
            />
            <Text
              className="text-blue-900 flex-1"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
            >
              {answer.answer_text}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

export default CustomerAnswersCard;
