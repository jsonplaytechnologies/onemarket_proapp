import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const DurationPicker = ({ value, onValueChange, error }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDurationOptions();
  }, []);

  const fetchDurationOptions = async () => {
    setLoading(true);
    try {
      const response = await apiService.get(API_ENDPOINTS.BOOKING_DURATION_OPTIONS);
      if (response.success && response.data) {
        setOptions(response.data);
      }
    } catch (error) {
      console.error('Error fetching duration options:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedLabel = () => {
    if (!value) return 'Select Duration';
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : 'Select Duration';
  };

  const handleSelect = (optionValue) => {
    onValueChange(optionValue);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        className={`flex-row items-center justify-between border rounded-xl px-4 py-3 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View className="flex-1">
          <Text
            className={value ? 'text-gray-900' : 'text-gray-400'}
            style={{ fontFamily: 'Poppins-Medium', fontSize: 15 }}
          >
            {getSelectedLabel()}
          </Text>
        </View>
        <Ionicons name="time-outline" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {error && (
        <Text
          className="text-red-500 mt-1 ml-1"
          style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
        >
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8 max-h-96">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Select Duration
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`py-4 px-4 rounded-xl mb-2 ${
                      value === option.value ? 'bg-primary' : 'bg-gray-50'
                    }`}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text
                        style={{
                          fontFamily: 'Poppins-Medium',
                          fontSize: 15,
                          color: value === option.value ? '#FFFFFF' : '#111827',
                        }}
                      >
                        {option.label}
                      </Text>
                      {value === option.value && (
                        <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DurationPicker;
