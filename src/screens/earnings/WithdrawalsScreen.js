import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import Button from '../../components/common/Button';

const WithdrawalsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('mobile_money');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [withdrawalsRes, earningsRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.WITHDRAWALS),
        apiService.get(API_ENDPOINTS.EARNINGS),
      ]);

      if (withdrawalsRes.success) {
        setWithdrawals(withdrawalsRes.data || []);
      }

      if (earningsRes.success) {
        setEarnings(earningsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleWithdraw = async () => {
    const amountNum = parseInt(amount);

    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amountNum > (earnings?.wallet?.availableBalance || 0)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiService.post(API_ENDPOINTS.WITHDRAWALS, {
        amount: amountNum,
        method,
      });

      if (response.success) {
        setShowWithdrawModal(false);
        setAmount('');
        Alert.alert('Success', 'Withdrawal request submitted. It will be processed shortly.');
        fetchData();
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit withdrawal request');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 XAF';
    return `${amount.toLocaleString()} XAF`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Failed' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <View className={`px-2 py-1 rounded-full ${config.bg}`}>
        <Text
          className={`text-xs font-medium ${config.text}`}
          style={{ fontFamily: 'Poppins-Medium' }}
        >
          {config.label}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
            >
              <Ionicons name="arrow-back" size={22} color="#111827" />
            </TouchableOpacity>
            <Text
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Withdrawals
            </Text>
          </View>
        </View>

        {/* Available Balance */}
        <View className="px-4 mt-4">
          <View className="bg-primary rounded-xl p-4">
            <Text
              className="text-white/80 text-sm"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Available to Withdraw
            </Text>
            <Text
              className="text-white text-2xl font-bold mt-1"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              {formatCurrency(earnings?.wallet?.availableBalance)}
            </Text>

            <TouchableOpacity
              className="bg-white rounded-xl py-3 mt-4 items-center"
              onPress={() => setShowWithdrawModal(true)}
              disabled={(earnings?.wallet?.availableBalance || 0) <= 0}
            >
              <Text
                className="text-primary font-semibold"
                style={{ fontFamily: 'Poppins-SemiBold' }}
              >
                Request Withdrawal
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Withdrawal History */}
        <View className="px-4 mt-6">
          <Text
            className="text-lg font-semibold text-gray-900 mb-3"
            style={{ fontFamily: 'Poppins-SemiBold' }}
          >
            Withdrawal History
          </Text>

          {withdrawals.length > 0 ? (
            withdrawals.map((withdrawal, index) => (
              <View
                key={withdrawal.id}
                className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons
                      name={
                        withdrawal.method === 'mobile_money'
                          ? 'phone-portrait-outline'
                          : 'business-outline'
                      }
                      size={20}
                      color={COLORS.textSecondary}
                    />
                    <Text
                      className="text-gray-900 font-medium ml-2"
                      style={{ fontFamily: 'Poppins-Medium' }}
                    >
                      {withdrawal.method === 'mobile_money' ? 'Mobile Money' : 'Bank Transfer'}
                    </Text>
                  </View>
                  {getStatusBadge(withdrawal.status)}
                </View>

                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-lg font-bold text-gray-900"
                    style={{ fontFamily: 'Poppins-Bold' }}
                  >
                    {formatCurrency(withdrawal.amount)}
                  </Text>
                  <Text
                    className="text-sm text-gray-500"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {formatDate(withdrawal.created_at)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-xl p-8 items-center border border-gray-200">
              <Ionicons name="wallet-outline" size={48} color={COLORS.textSecondary} />
              <Text
                className="text-gray-500 mt-2 text-center"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                No withdrawals yet
              </Text>
            </View>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Request Withdrawal
              </Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Text
              className="text-gray-600 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Amount
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-4">
              <TextInput
                className="flex-1 text-2xl font-semibold text-gray-900"
                style={{ fontFamily: 'Poppins-SemiBold' }}
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
              />
              <Text
                className="text-base text-gray-500 ml-2"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                XAF
              </Text>
            </View>

            <Text
              className="text-sm text-gray-500 mb-4"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Available: {formatCurrency(earnings?.wallet?.availableBalance)}
            </Text>

            {/* Method */}
            <Text
              className="text-gray-600 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Withdrawal Method
            </Text>
            <View className="flex-row mb-6">
              <TouchableOpacity
                className={`flex-1 p-4 rounded-xl mr-2 border ${
                  method === 'mobile_money' ? 'border-primary bg-blue-50' : 'border-gray-200'
                }`}
                onPress={() => setMethod('mobile_money')}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={24}
                  color={method === 'mobile_money' ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  className={`mt-2 font-medium ${
                    method === 'mobile_money' ? 'text-primary' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Mobile Money
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 p-4 rounded-xl border ${
                  method === 'bank_transfer' ? 'border-primary bg-blue-50' : 'border-gray-200'
                }`}
                onPress={() => setMethod('bank_transfer')}
              >
                <Ionicons
                  name="business-outline"
                  size={24}
                  color={method === 'bank_transfer' ? COLORS.primary : COLORS.textSecondary}
                />
                <Text
                  className={`mt-2 font-medium ${
                    method === 'bank_transfer' ? 'text-primary' : 'text-gray-700'
                  }`}
                  style={{ fontFamily: 'Poppins-Medium' }}
                >
                  Bank Transfer
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Submit Request"
              onPress={handleWithdraw}
              disabled={!amount || parseInt(amount) <= 0}
              loading={submitting}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WithdrawalsScreen;
