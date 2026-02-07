/**
 * OnTheWayActions Component
 * "Request Job Start" button
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Button from '../../common/Button';

const OnTheWayActions = ({ actionLoading, onPress }) => {
  const { t } = useTranslation();
  return (
    <Button
      title={t('actionButtons.requestJobStart')}
      onPress={onPress}
      loading={actionLoading}
      icon={<Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />}
    />
  );
};

export default OnTheWayActions;
