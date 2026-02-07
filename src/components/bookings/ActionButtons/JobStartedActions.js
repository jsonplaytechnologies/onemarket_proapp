/**
 * JobStartedActions Component
 * "Request Job Completion" button
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from '../../common/Button';

const JobStartedActions = ({ actionLoading, onPress }) => {
  const { t } = useTranslation();
  return (
    <Button
      title={t('actionButtons.requestJobCompletion')}
      onPress={onPress}
      loading={actionLoading}
      icon={<Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />}
    />
  );
};

export default JobStartedActions;
