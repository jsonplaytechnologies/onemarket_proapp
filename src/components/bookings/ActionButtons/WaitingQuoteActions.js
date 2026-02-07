/**
 * WaitingQuoteActions Component
 * Chat and Send Quote buttons
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from '../../common/Button';
import { CustomerAnswersCard } from '../index';
import { COLORS } from '../../../constants/colors';
import TimeoutMessage from './TimeoutMessage';

const WaitingQuoteActions = ({
  booking,
  bookingId,
  answers = [],
  isTimedOut,
  navigation,
  onSendQuote,
}) => {
  const { t } = useTranslation();

  if (isTimedOut) {
    return (
      <TimeoutMessage
        title={t('actionButtons.quoteTimeExpired')}
        message={t('actionButtons.quoteTimeExpiredDesc')}
      />
    );
  }

  return (
    <View>
      {answers.length > 0 && <CustomerAnswersCard answers={answers} />}

      {/* Chat Guidance */}
      <View className="bg-blue-50 p-4 rounded-xl mb-4">
        <View className="flex-row items-start">
          <Ionicons name="information-circle" size={22} color="#1D4ED8" />
          <Text
            className="text-blue-800 ml-3 flex-1"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
          >
            {t('actionButtons.chatGuidance')}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row space-x-3">
        <View className="flex-1 mr-2">
          <Button
            title={t('actionButtons.chat')}
            onPress={() => navigation.navigate('Chat', { bookingId, booking })}
            variant="secondary"
            icon={<Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />}
          />
        </View>
        <View className="flex-1">
          <Button
            title={t('actionButtons.sendQuote')}
            onPress={onSendQuote}
            icon={<Ionicons name="document-text-outline" size={20} color="#FFFFFF" />}
          />
        </View>
      </View>
    </View>
  );
};

export default WaitingQuoteActions;
