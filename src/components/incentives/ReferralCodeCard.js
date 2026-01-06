import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../../constants/colors';

const ReferralCodeCard = ({
  code,
  totalUses = 0,
  totalEarned = 0,
  onShare,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 XAF';
    return `${amount.toLocaleString()} XAF`;
  };

  if (compact) {
    return (
      <View className="bg-blue-50 rounded-xl p-4 flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
            <Ionicons name="gift-outline" size={20} color={COLORS.primary} />
          </View>
          <View className="flex-1">
            <Text
              className="text-gray-500"
              style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
            >
              Your Referral Code
            </Text>
            <Text
              className="text-gray-900"
              style={{ fontFamily: 'Poppins-Bold', fontSize: 18, letterSpacing: 2 }}
            >
              {code || '--------'}
            </Text>
          </View>
        </View>
        <View className="flex-row">
          <TouchableOpacity
            onPress={handleCopy}
            className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-2"
            activeOpacity={0.7}
          >
            <Ionicons
              name={copied ? 'checkmark' : 'copy-outline'}
              size={18}
              color={copied ? '#16A34A' : COLORS.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onShare}
            className="w-10 h-10 bg-primary rounded-xl items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5" style={{ backgroundColor: COLORS.primary }}>
      <Text
        className="text-white/70 mb-1"
        style={{ fontFamily: 'Poppins-Regular', fontSize: 12 }}
      >
        Your Referral Code
      </Text>
      <Text
        className="text-white mb-4"
        style={{ fontFamily: 'Poppins-Bold', fontSize: 28, letterSpacing: 4 }}
      >
        {code || '--------'}
      </Text>

      <View className="flex-row mb-4">
        <TouchableOpacity
          onPress={handleCopy}
          className="flex-1 bg-white/20 rounded-xl py-3 flex-row items-center justify-center mr-2"
          activeOpacity={0.7}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={18}
            color="#FFFFFF"
          />
          <Text
            className="text-white ml-2"
            style={{ fontFamily: 'Poppins-Medium', fontSize: 14 }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onShare}
          className="flex-1 bg-white rounded-xl py-3 flex-row items-center justify-center"
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={18} color={COLORS.primary} />
          <Text
            className="ml-2"
            style={{ fontFamily: 'Poppins-Medium', fontSize: 14, color: COLORS.primary }}
          >
            Share
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row bg-white/10 rounded-xl p-3">
        <View className="flex-1 items-center border-r border-white/20">
          <Text
            className="text-white"
            style={{ fontFamily: 'Poppins-Bold', fontSize: 20 }}
          >
            {totalUses}
          </Text>
          <Text
            className="text-white/60"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
          >
            Referrals
          </Text>
        </View>
        <View className="flex-1 items-center">
          <Text
            className="text-white"
            style={{ fontFamily: 'Poppins-Bold', fontSize: 20 }}
          >
            {formatCurrency(totalEarned)}
          </Text>
          <Text
            className="text-white/60"
            style={{ fontFamily: 'Poppins-Regular', fontSize: 11 }}
          >
            Earned
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ReferralCodeCard;
