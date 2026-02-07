/**
 * JobCompleteRequestedActions Component
 * Waiting for customer to confirm completion
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../constants/colors';

const JobCompleteRequestedActions = () => {
  const { t } = useTranslation();
  return (
    <View className="bg-yellow-50 p-4 rounded-xl">
      <View className="flex-row items-center">
        <Ionicons name="time" size={24} color={COLORS.warning} />
        <Text
          className="text-yellow-800 ml-2"
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          {t('actionButtons.waitingCompletion')}
        </Text>
      </View>
    </View>
  );
};

export default JobCompleteRequestedActions;
