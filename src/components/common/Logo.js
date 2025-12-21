import React from 'react';
import { View, Text } from 'react-native';
import OneMarketSymbol from '../../../assets/Onemarketsymbol.svg';

const LogoIcon = ({ size = 48 }) => {
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <OneMarketSymbol width={size} height={size} preserveAspectRatio="xMidYMid meet" />
    </View>
  );
};

const Logo = ({ size = 80, showText = true, textSize = 'large' }) => {
  const getTextStyles = () => {
    switch (textSize) {
      case 'small':
        return { fontSize: 16, letterSpacing: 1 };
      case 'medium':
        return { fontSize: 20, letterSpacing: 1.5 };
      case 'large':
      default:
        return { fontSize: 28, letterSpacing: 2 };
    }
  };

  const textStyles = getTextStyles();

  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <OneMarketSymbol width={size} height={size} />
      </View>
      {showText && (
        <View className="items-center">
          <Text
            style={{
              fontFamily: 'Poppins-SemiBold',
              fontSize: textStyles.fontSize,
              letterSpacing: textStyles.letterSpacing,
              color: '#1F2937',
              marginTop: 12,
            }}
          >
            one<Text style={{ color: '#2563EB' }}>market</Text>
          </Text>
          <Text
            style={{
              fontFamily: 'Poppins-Medium',
              fontSize: textStyles.fontSize * 0.5,
              color: '#6B7280',
              marginTop: 2,
            }}
          >
            PRO
          </Text>
        </View>
      )}
    </View>
  );
};

export { Logo, LogoIcon };
export default Logo;
