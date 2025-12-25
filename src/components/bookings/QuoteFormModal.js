import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import Button from '../common/Button';

const DURATION_OPTIONS = [
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 300, label: '5 hours' },
  { value: 360, label: '6 hours' },
  { value: 480, label: '8 hours' },
  { value: 600, label: '10 hours' },
];

const QuoteFormModal = ({
  visible,
  onClose,
  onSubmit,
  serviceName = 'Service',
  loading = false,
}) => {
  const [amount, setAmount] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    // Validate
    const newErrors = {};

    if (!amount || parseInt(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!selectedDuration) {
      newErrors.duration = 'Please select job duration';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear form and submit
    onSubmit(parseInt(amount), selectedDuration);
    setAmount('');
    setSelectedDuration(null);
    setErrors({});
  };

  const handleClose = () => {
    setAmount('');
    setSelectedDuration(null);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ justifyContent: 'flex-end', minHeight: '100%' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-1">
                <Text
                  className="text-xl font-bold text-gray-900"
                  style={{ fontFamily: 'Poppins-Bold' }}
                >
                  Send Quote
                </Text>
                <Text
                  className="text-sm text-gray-500 mt-1"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {serviceName}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className="w-10 h-10 items-center justify-center rounded-full bg-gray-100"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Warning about one quote only */}
            <View className="bg-amber-50 p-3 rounded-xl mb-6 flex-row items-start">
              <Ionicons name="warning" size={20} color="#B45309" style={{ marginTop: 2 }} />
              <Text
                className="text-amber-800 ml-2 flex-1"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 12 }}
              >
                One quote only - discuss scope with customer first. You cannot change it after submission.
              </Text>
            </View>

            {/* Amount Input */}
            <View className="mb-6">
              <Text
                className="text-gray-600 mb-2"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                Quote Amount
              </Text>
              <View
                className={`flex-row items-center border rounded-xl px-4 py-3 ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <TextInput
                  className="flex-1 text-2xl font-semibold text-gray-900"
                  style={{ fontFamily: 'Poppins-SemiBold' }}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text);
                    setErrors({ ...errors, amount: null });
                  }}
                  keyboardType="number-pad"
                />
                <Text
                  className="text-base text-gray-500 ml-2"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  XAF
                </Text>
              </View>
              {errors.amount && (
                <Text
                  className="text-red-500 mt-1 ml-1"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {errors.amount}
                </Text>
              )}
            </View>

            {/* Duration Selection */}
            <View className="mb-6">
              <Text
                className="text-gray-600 mb-2"
                style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
              >
                Estimated Job Duration
              </Text>
              <View className="flex-row flex-wrap">
                {DURATION_OPTIONS.map((option) => {
                  const isSelected = selectedDuration === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      className={`mr-2 mb-2 px-4 py-3 rounded-xl ${
                        isSelected ? 'bg-primary' : 'bg-gray-100'
                      }`}
                      onPress={() => {
                        setSelectedDuration(option.value);
                        setErrors({ ...errors, duration: null });
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={{
                          fontFamily: 'Poppins-Medium',
                          fontSize: 14,
                          color: isSelected ? '#FFFFFF' : '#6B7280',
                        }}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.duration && (
                <Text
                  className="text-red-500 mt-1 ml-1"
                  style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
                >
                  {errors.duration}
                </Text>
              )}
            </View>

            {/* Summary */}
            {amount && selectedDuration && (
              <View className="bg-blue-50 p-4 rounded-xl mb-6">
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-blue-700"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                  >
                    Quote Summary
                  </Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text
                    className="text-blue-900"
                    style={{ fontFamily: 'Poppins-Bold', fontSize: 24 }}
                  >
                    {parseInt(amount).toLocaleString()}
                  </Text>
                  <Text
                    className="text-blue-700 ml-2"
                    style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
                  >
                    XAF
                  </Text>
                  <Text
                    className="text-blue-600 ml-3"
                    style={{ fontFamily: 'Poppins-Regular', fontSize: 13 }}
                  >
                    ({DURATION_OPTIONS.find(o => o.value === selectedDuration)?.label})
                  </Text>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <Button
              title={loading ? 'Sending...' : 'Send Quote to Customer'}
              onPress={handleSubmit}
              disabled={loading || !amount || !selectedDuration}
              loading={loading}
              icon={!loading && <Ionicons name="send-outline" size={20} color="#FFFFFF" />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default QuoteFormModal;
