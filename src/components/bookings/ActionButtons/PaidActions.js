/**
 * PaidActions Component
 * "I'm On The Way" button with time window restrictions for scheduled bookings
 *
 * For scheduled bookings:
 * - Can only mark "On The Way" from 1 hour before to 1 hour after scheduled time
 * - Shows countdown if too early
 * - Shows "Window closed" message if too late
 *
 * For instant bookings (is_book_now = true):
 * - No restrictions, button always available
 */

import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../common/Button';

// Time window constants (should match backend)
const ON_THE_WAY_WINDOW_BEFORE = 60; // minutes
const ON_THE_WAY_WINDOW_AFTER = 60;  // minutes

const PaidActions = ({ actionLoading, onPress, booking }) => {
  const [timeState, setTimeState] = useState({
    status: 'loading', // 'loading' | 'too_early' | 'available' | 'too_late'
    hoursUntil: 0,
    minutesUntil: 0,
    secondsUntil: 0,
  });

  useEffect(() => {
    // For instant bookings or missing booking data, always available
    if (!booking || booking.is_book_now || !booking.requested_datetime) {
      setTimeState({ status: 'available' });
      return;
    }

    const calculateTimeState = () => {
      const now = new Date();
      const scheduledTime = new Date(booking.requested_datetime);
      const diffMs = scheduledTime.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // Window opens: ON_THE_WAY_WINDOW_BEFORE minutes before scheduled time
      const windowOpenTime = new Date(scheduledTime.getTime() - (ON_THE_WAY_WINDOW_BEFORE * 60 * 1000));
      const msUntilOpen = windowOpenTime.getTime() - now.getTime();

      // Too early: more than ON_THE_WAY_WINDOW_BEFORE minutes before scheduled time
      if (diffMinutes > ON_THE_WAY_WINDOW_BEFORE) {
        const hours = Math.floor(msUntilOpen / (1000 * 60 * 60));
        const minutes = Math.floor((msUntilOpen % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msUntilOpen % (1000 * 60)) / 1000);

        setTimeState({
          status: 'too_early',
          hoursUntil: Math.max(0, hours),
          minutesUntil: Math.max(0, minutes),
          secondsUntil: Math.max(0, seconds),
          scheduledTime: scheduledTime.toLocaleString(),
        });
        return;
      }

      // Too late: more than ON_THE_WAY_WINDOW_AFTER minutes after scheduled time
      if (diffMinutes < -ON_THE_WAY_WINDOW_AFTER) {
        setTimeState({
          status: 'too_late',
          scheduledTime: scheduledTime.toLocaleString(),
        });
        return;
      }

      // Within window: available
      setTimeState({
        status: 'available',
        scheduledTime: scheduledTime.toLocaleString(),
      });
    };

    calculateTimeState();
    const interval = setInterval(calculateTimeState, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  // Loading state
  if (timeState.status === 'loading') {
    return (
      <Button
        title="I'm On The Way"
        onPress={onPress}
        loading={true}
        disabled={true}
        icon={<Ionicons name="navigate-outline" size={20} color="#FFFFFF" />}
      />
    );
  }

  // Too early: show countdown
  if (timeState.status === 'too_early') {
    const { hoursUntil, minutesUntil, secondsUntil, scheduledTime } = timeState;

    // Format countdown string
    let countdownText;
    if (hoursUntil > 0) {
      countdownText = `${hoursUntil}h ${minutesUntil}m`;
    } else {
      countdownText = `${String(minutesUntil).padStart(2, '0')}:${String(secondsUntil).padStart(2, '0')}`;
    }

    const isCloseToAvailable = hoursUntil === 0 && minutesUntil < 30;
    const bgColor = isCloseToAvailable ? 'bg-blue-50' : 'bg-amber-50';
    const iconColor = isCloseToAvailable ? '#1D4ED8' : '#B45309';
    const textColor = isCloseToAvailable ? 'text-blue-800' : 'text-amber-800';

    return (
      <View>
        <View className={`${bgColor} p-4 rounded-xl mb-4`}>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={24} color={iconColor} />
            <View className="flex-1 ml-3">
              <Text
                className={textColor}
                style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
              >
                Available in
              </Text>
              <Text
                className={textColor}
                style={{ fontFamily: 'Poppins-Bold', fontSize: 20 }}
              >
                {countdownText}
              </Text>
              <Text
                className={`${textColor} mt-1 opacity-80`}
                style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
              >
                Scheduled for {scheduledTime}
              </Text>
            </View>
            {isCloseToAvailable && (
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text
                  className="text-blue-600"
                  style={{ fontFamily: 'Poppins-SemiBold', fontSize: 11 }}
                >
                  SOON
                </Text>
              </View>
            )}
          </View>
        </View>
        <Button
          title="I'm On The Way"
          onPress={() => {}}
          disabled={true}
          icon={<Ionicons name="navigate-outline" size={20} color="#999999" />}
        />
      </View>
    );
  }

  // Too late: show window closed message
  if (timeState.status === 'too_late') {
    return (
      <View>
        <View className="bg-red-50 p-4 rounded-xl mb-4">
          <View className="flex-row items-center">
            <Ionicons name="close-circle-outline" size={24} color="#DC2626" />
            <View className="flex-1 ml-3">
              <Text
                className="text-red-800"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 13 }}
              >
                Time Window Closed
              </Text>
              <Text
                className="text-red-600 mt-1"
                style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
              >
                The scheduled service time has passed. This booking may be auto-cancelled soon.
              </Text>
            </View>
          </View>
        </View>
        <Button
          title="I'm On The Way"
          onPress={() => {}}
          disabled={true}
          icon={<Ionicons name="navigate-outline" size={20} color="#999999" />}
        />
      </View>
    );
  }

  // Available: show normal button
  return (
    <Button
      title="I'm On The Way"
      onPress={onPress}
      loading={actionLoading}
      icon={<Ionicons name="navigate-outline" size={20} color="#FFFFFF" />}
    />
  );
};

export default PaidActions;
