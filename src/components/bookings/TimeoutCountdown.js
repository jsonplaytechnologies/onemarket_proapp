import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const TimeoutCountdown = ({ timeoutAt, label = 'Time Remaining' }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!timeoutAt) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const timeout = new Date(timeoutAt);
      const diff = timeout - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft({ minutes, seconds, total: diff });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [timeoutAt]);

  if (!timeLeft) return null;

  const isUrgent = timeLeft.total < 300000; // Less than 5 minutes
  const bgColor = isUrgent ? 'bg-red-50' : 'bg-amber-50';
  const iconColor = isUrgent ? '#DC2626' : '#B45309';
  const textColor = isUrgent ? 'text-red-800' : 'text-amber-800';

  return (
    <View className={`${bgColor} p-4 rounded-xl mb-4`}>
      <View className="flex-row items-center">
        <Ionicons name="time" size={24} color={iconColor} />
        <View className="flex-1 ml-3">
          <Text
            className={`${textColor}`}
            style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
          >
            {label}
          </Text>
          <Text
            className={`${textColor} mt-1`}
            style={{ fontFamily: 'Poppins-Bold', fontSize: 18 }}
          >
            {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </Text>
        </View>
        {isUrgent && (
          <View className="bg-red-100 px-3 py-1 rounded-full">
            <Text
              className="text-red-600"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 11 }}
            >
              URGENT
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default TimeoutCountdown;
