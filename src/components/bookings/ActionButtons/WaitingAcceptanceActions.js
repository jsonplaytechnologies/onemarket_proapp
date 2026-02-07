/**
 * WaitingAcceptanceActions Component
 * Display while waiting for customer to accept quote
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const formatCurrency = (amount) => {
  if (!amount) return 'N/A';
  return `${amount.toLocaleString()} XAF`;
};

const WaitingAcceptanceActions = ({ booking }) => {
  const { t } = useTranslation();
  return (
    <View className="bg-indigo-50 p-5 rounded-xl">
      <View className="flex-row items-center mb-3">
        <Ionicons name="time-outline" size={24} color="#4F46E5" />
        <Text
          className="text-indigo-800 ml-2"
          style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
        >
          {t('actionButtons.waitingForCustomer')}
        </Text>
      </View>

      <View className="border-t border-indigo-200 pt-3 mt-2">
        <Text
          className="text-indigo-700 mb-1"
          style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
        >
          {t('actionButtons.yourQuote')}
        </Text>
        <View className="flex-row items-baseline">
          <Text
            className="text-indigo-900"
            style={{ fontFamily: 'Poppins-Bold', fontSize: 28 }}
          >
            {formatCurrency(booking.quotation_amount)}
          </Text>
          {booking.quoted_duration_minutes && (
            <Text
              className="text-indigo-600 ml-3"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 14 }}
            >
              ({Math.floor(booking.quoted_duration_minutes / 60)}h {booking.quoted_duration_minutes % 60}m)
            </Text>
          )}
        </View>
      </View>

      <Text
        className="text-indigo-600 text-center mt-4"
        style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
      >
        {t('actionButtons.customerNotifiedQuote')}
      </Text>
    </View>
  );
};

export default WaitingAcceptanceActions;
