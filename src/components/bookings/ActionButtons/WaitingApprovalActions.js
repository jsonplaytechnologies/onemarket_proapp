/**
 * WaitingApprovalActions Component
 * Accept/Reject buttons for new assignment
 */

import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  if (isTimedOut) {
    return (
      <TimeoutMessage
        title="Request Timed Out"
        message="You did not respond in time. This booking is no longer available."
      />
    );
  }

  return (
    <View>
      {answers.length > 0 && <CustomerAnswersCard answers={answers} />}

      <View className="flex-row space-x-3">
        <View className="flex-1 mr-2">
          <Button
            title="Accept"
            onPress={onAccept}
            loading={actionLoading}
            variant="success"
            icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
          />
        </View>
        <View className="flex-1">
          <Button
            title="Reject"
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
