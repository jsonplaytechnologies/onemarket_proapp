import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTierInfo, formatBonusRate } from '../../services/incentiveService';

const TierBadge = ({
  tier = 'starter',
  size = 'medium',
  showBonus = false,
  showLabel = true,
}) => {
  const tierInfo = getTierInfo(tier);

  const sizes = {
    small: {
      container: 'px-2 py-1',
      icon: 14,
      text: 11,
      bonusText: 9,
    },
    medium: {
      container: 'px-3 py-1.5',
      icon: 16,
      text: 13,
      bonusText: 10,
    },
    large: {
      container: 'px-4 py-2',
      icon: 20,
      text: 15,
      bonusText: 12,
    },
  };

  const sizeConfig = sizes[size] || sizes.medium;

  return (
    <View
      className={`flex-row items-center rounded-full ${sizeConfig.container}`}
      style={{ backgroundColor: tierInfo.bgColor }}
    >
      <Ionicons
        name={tierInfo.icon}
        size={sizeConfig.icon}
        color={tierInfo.color}
      />
      {showLabel && (
        <Text
          className="ml-1"
          style={{
            fontFamily: 'Poppins-SemiBold',
            fontSize: sizeConfig.text,
            color: tierInfo.color,
          }}
        >
          {tierInfo.name}
        </Text>
      )}
      {showBonus && tierInfo.bonusRate > 0 && (
        <Text
          className="ml-1"
          style={{
            fontFamily: 'Poppins-Medium',
            fontSize: sizeConfig.bonusText,
            color: tierInfo.color,
          }}
        >
          +{formatBonusRate(tierInfo.bonusRate)}
        </Text>
      )}
    </View>
  );
};

export default TierBadge;
