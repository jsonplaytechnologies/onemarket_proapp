import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import Button from '../../components/common/Button';

const DAYS_OF_WEEK = [
  { key: 0, label: 'Sunday', short: 'Sun' },
  { key: 1, label: 'Monday', short: 'Mon' },
  { key: 2, label: 'Tuesday', short: 'Tue' },
  { key: 3, label: 'Wednesday', short: 'Wed' },
  { key: 4, label: 'Thursday', short: 'Thu' },
  { key: 5, label: 'Friday', short: 'Fri' },
  { key: 6, label: 'Saturday', short: 'Sat' },
];

const AvailabilityScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState({});
  const [showStartPicker, setShowStartPicker] = useState(null);
  const [showEndPicker, setShowEndPicker] = useState(null);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRO_AVAILABILITY_GET);
      if (response.success && response.data) {
        // Convert array of availability slots to day-based object
        const availByDay = {};
        response.data.forEach((slot) => {
          availByDay[slot.day_of_week] = {
            enabled: slot.is_active,
            start_time: slot.start_time,
            end_time: slot.end_time,
          };
        });
        setAvailability(availByDay);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      Alert.alert('Error', 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayKey) => {
    setAvailability((prev) => ({
      ...prev,
      [dayKey]: {
        enabled: !(prev[dayKey]?.enabled),
        start_time: prev[dayKey]?.start_time || '09:00:00',
        end_time: prev[dayKey]?.end_time || '17:00:00',
      },
    }));
  };

  const updateTime = (dayKey, type, time) => {
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:00`;

    setAvailability((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [type]: timeString,
      },
    }));

    setShowStartPicker(null);
    setShowEndPicker(null);
  };

  const parseTime = (timeString) => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '09:00 AM';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert to API format
      const slots = [];
      Object.entries(availability).forEach(([dayKey, data]) => {
        if (data.enabled) {
          slots.push({
            day_of_week: parseInt(dayKey, 10),
            start_time: data.start_time,
            end_time: data.end_time,
            is_active: true,
          });
        }
      });

      const response = await apiService.put(API_ENDPOINTS.PRO_AVAILABILITY_SET, {
        slots,
      });

      if (response.success) {
        Alert.alert('Success', 'Availability updated successfully');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', error.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Availability
            </Text>
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Set your weekly schedule
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View className="bg-blue-50 mx-4 mt-4 p-4 rounded-xl">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={22} color="#1D4ED8" />
            <Text
              className="text-blue-800 ml-3 flex-1"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
            >
              Set your weekly schedule. Users will see these times as available when scheduling appointments with you.
            </Text>
          </View>
        </View>

        {/* Day Slots */}
        <View className="px-4 mt-4 mb-8">
          {DAYS_OF_WEEK.map((day) => {
            const dayData = availability[day.key] || { enabled: false };
            return (
              <View
                key={day.key}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
              >
                {/* Day Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <Text
                    className="text-gray-900"
                    style={{ fontFamily: 'Poppins-SemiBold', fontSize: 16 }}
                  >
                    {day.label}
                  </Text>
                  <Switch
                    value={dayData.enabled}
                    onValueChange={() => toggleDay(day.key)}
                    trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                    thumbColor={dayData.enabled ? COLORS.primary : '#F3F4F6'}
                  />
                </View>

                {/* Time Pickers */}
                {dayData.enabled && (
                  <View className="flex-row items-center space-x-3">
                    {/* Start Time */}
                    <View className="flex-1">
                      <Text
                        className="text-gray-500 mb-2"
                        style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                      >
                        Start Time
                      </Text>
                      <TouchableOpacity
                        className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
                        onPress={() => setShowStartPicker(day.key)}
                      >
                        <Text
                          className="text-gray-900"
                          style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
                        >
                          {formatTime(dayData.start_time)}
                        </Text>
                        <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>

                    {/* End Time */}
                    <View className="flex-1">
                      <Text
                        className="text-gray-500 mb-2"
                        style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                      >
                        End Time
                      </Text>
                      <TouchableOpacity
                        className="border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
                        onPress={() => setShowEndPicker(day.key)}
                      >
                        <Text
                          className="text-gray-900"
                          style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
                        >
                          {formatTime(dayData.end_time)}
                        </Text>
                        <Ionicons name="time-outline" size={18} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Time Pickers */}
                {showStartPicker === day.key && (
                  <DateTimePicker
                    value={parseTime(dayData.start_time)}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        updateTime(day.key, 'start_time', selectedTime);
                      } else {
                        setShowStartPicker(null);
                      }
                    }}
                  />
                )}

                {showEndPicker === day.key && (
                  <DateTimePicker
                    value={parseTime(dayData.end_time)}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        updateTime(day.key, 'end_time', selectedTime);
                      } else {
                        setShowEndPicker(null);
                      }
                    }}
                  />
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="bg-white px-6 py-4 border-t border-gray-200">
        <Button title="Save Availability" onPress={handleSave} loading={saving} />
      </View>
    </SafeAreaView>
  );
};

export default AvailabilityScreen;
