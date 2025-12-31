/**
 * OnTheWayActions Component
 * "Request Job Start" button
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../common/Button';

const OnTheWayActions = ({ actionLoading, onPress }) => {
  return (
    <Button
      title="Request Job Start"
      onPress={onPress}
      loading={actionLoading}
      icon={<Ionicons name="play-circle-outline" size={20} color="#FFFFFF" />}
    />
  );
};

export default OnTheWayActions;
