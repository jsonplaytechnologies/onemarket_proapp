import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const TimeoutCountdown = ({ timeoutAt, label = 'Time Remaining', onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const onTimeoutCalledRef = useRef(false);

  useEffect(() => {
    if (!timeoutAt) return;

    // Reset the callback guard when timeoutAt changes
    onTimeoutCalledRef.current = false;

    const calculateTimeLeft = () => {
      const now = new Date();
      const timeout = new Date(timeoutAt);
      const diff = timeout - now;

      if (diff <= 0) {
        setTimeLeft(null);
        setIsExpired(true);
        // Call onTimeout callback only once
        if (onTimeout && !onTimeoutCalledRef.current) {
          onTimeoutCalledRef.current = true;
          onTimeout();
        }
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft({ minutes, seconds, total: diff });
      setIsExpired(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [timeoutAt, onTimeout]);

  // Show expired state
  if (isExpired) {
    return (
      <View className="bg-red-50 p-4 rounded-xl mb-4">
        <View className="flex-row items-center">
          <Ionicons name="time" size={24} color="#DC2626" />
          <View className="flex-1 ml-3">
            <Text
              className="text-red-800"
              style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
            >
              Time Expired
            </Text>
            <Text
              className="text-red-600 mt-1"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
            >
              This booking request has timed out
            </Text>
          </View>
        </View>
      </View>
    );
  }

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
