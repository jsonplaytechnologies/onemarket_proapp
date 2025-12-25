import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const ScopeConfirmation = ({ bookingId, isConfirmed, onConfirmed }) => {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(isConfirmed);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await apiService.post(API_ENDPOINTS.BOOKING_CONFIRM_SCOPE(bookingId));
      setConfirmed(true);
      if (onConfirmed) onConfirmed();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to confirm scope');
    } finally {
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <View className="bg-green-50 p-4 rounded-xl mb-4">
        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={24} color="#059669" />
          <Text
            className="text-green-800 ml-3 flex-1"
            style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
          >
            Scope confirmed. You can now send a quotation.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-blue-50 p-4 rounded-xl mb-4">
      <View className="flex-row items-center mb-3">
        <Ionicons name="information-circle" size={24} color="#1D4ED8" />
        <Text
          className="text-blue-800 ml-3 flex-1"
          style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
        >
          Discuss and agree on the job scope with the customer in chat before sending a quote.
        </Text>
      </View>
      <TouchableOpacity
        className="bg-primary py-3 px-4 rounded-xl flex-row items-center justify-center"
        onPress={handleConfirm}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text
              className="text-white ml-2"
              style={{ fontFamily: 'Poppins-SemiBold', fontSize: 15 }}
            >
              Confirm Scope Discussed
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ScopeConfirmation;
