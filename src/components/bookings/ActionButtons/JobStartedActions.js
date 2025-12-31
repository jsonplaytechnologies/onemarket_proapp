/**
 * JobStartedActions Component
 * "Request Job Completion" button
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../common/Button';

const JobStartedActions = ({ actionLoading, onPress }) => {
  return (
    <Button
      title="Request Job Completion"
      onPress={onPress}
      loading={actionLoading}
      icon={<Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />}
    />
  );
};

export default JobStartedActions;
