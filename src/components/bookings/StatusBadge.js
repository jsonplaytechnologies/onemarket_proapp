import React from 'react';
import { View, Text } from 'react-native';

const STATUS_CONFIG = {
  // Phase 2 - Assignment Flow
  waiting_approval: {
    label: 'New Request',
    bg: 'bg-amber-50',
    text: '#B45309',
  },
  waiting_quote: {
    label: 'Send Quote',
    bg: 'bg-blue-50',
    text: '#1D4ED8',
  },
  waiting_acceptance: {
    label: 'Quote Sent',
    bg: 'bg-violet-50',
    text: '#7C3AED',
  },

  // End states
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50',
    text: '#DC2626',
  },
  quote_rejected: {
    label: 'Quote Rejected',
    bg: 'bg-red-50',
    text: '#DC2626',
  },
  quote_expired: {
    label: 'Quote Expired',
    bg: 'bg-orange-50',
    text: '#EA580C',
  },
  reassigned: {
    label: 'Reassigned',
    bg: 'bg-gray-100',
    text: '#6B7280',
  },

  // Active job statuses
  paid: {
    label: 'Ready to Go',
    bg: 'bg-emerald-50',
    text: '#059669',
  },
  on_the_way: {
    label: 'On The Way',
    bg: 'bg-blue-50',
    text: '#1D4ED8',
  },
  job_start_requested: {
    label: 'Starting',
    bg: 'bg-orange-50',
    text: '#EA580C',
  },
  job_started: {
    label: 'In Progress',
    bg: 'bg-blue-50',
    text: '#1D4ED8',
  },
  job_complete_requested: {
    label: 'Finishing',
    bg: 'bg-orange-50',
    text: '#EA580C',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: '#059669',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-gray-100',
    text: '#6B7280',
  },
  failed: {
    label: 'Failed',
    bg: 'bg-red-50',
    text: '#DC2626',
  },
};

const StatusBadge = ({ status, size = 'medium' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.waiting_approval;

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 8, paddingVertical: 4, fontSize: 11 };
      case 'large':
        return { paddingHorizontal: 14, paddingVertical: 6, fontSize: 14 };
      default:
        return { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12 };
    }
  };

  const styles = getSizeStyles();

  return (
    <View
      className={`rounded-lg ${config.bg}`}
      style={{ paddingHorizontal: styles.paddingHorizontal, paddingVertical: styles.paddingVertical }}
    >
      <Text
        style={{
          fontFamily: 'Poppins-Medium',
          fontSize: styles.fontSize,
          color: config.text,
        }}
      >
        {config.label}
      </Text>
    </View>
  );
};

export default StatusBadge;
