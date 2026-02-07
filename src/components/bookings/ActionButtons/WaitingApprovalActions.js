/**
 * WaitingApprovalActions Component
 * Accept/Reject buttons for new assignment
 */

import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from '../../common/Button';
import { CustomerAnswersCard } from '../index';
import TimeoutMessage from './TimeoutMessage';

const WaitingApprovalActions = ({
  booking,
  answers = [],
  isTimedOut,
  actionLoading,
  onAccept,
  onReject,
}) => {
  const { t } = useTranslation();

  if (isTimedOut) {
    return (
      <TimeoutMessage
        title={t('actionButtons.requestTimedOut')}
        message={t('actionButtons.requestTimedOutDesc')}
      />
    );
  }

  return (
    <View>
      {answers.length > 0 && <CustomerAnswersCard answers={answers} />}

      <View className="flex-row space-x-3">
        <View className="flex-1 mr-2">
          <Button
            title={t('actionButtons.accept')}
            onPress={onAccept}
            loading={actionLoading}
            variant="success"
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
          />
        </View>
        <View className="flex-1">
          <Button
            title={t('actionButtons.reject')}
            onPress={onReject}
            variant="danger"
            icon={<Ionicons name="close-circle-outline" size={20} color="#FFFFFF" />}
          />
        </View>
      </View>
    </View>
  );
};

export default WaitingApprovalActions;
