import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const Logo = ({ size = 80, showText = true, textSize = 'large' }) => {
  const scale = size / 100;

  // Generate dotted circles pattern matching the original logo
  const generateCircles = () => {
    const circles = [];
    const rings = [
      { radius: 22, count: 28, dotSize: 3.3, color: '#3B82F6' },
      { radius: 32, count: 28, dotSize: 4.4, color: '#2563EB' },
      { radius: 42, count: 28, dotSize: 5.5, color: '#1D4ED8' },
    ];

    rings.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + ring.radius * Math.cos(angle);
        const y = 50 + ring.radius * Math.sin(angle);
        circles.push(
          <Circle
            key={`${ringIndex}-${i}`}
            cx={x * scale}
            cy={y * scale}
            r={ring.dotSize * scale}
            fill={ring.color}
          />
        );
      }
    });

    return circles;
  };

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
        <Svg width={size} height={size} viewBox={`0 0 ${100 * scale} ${100 * scale}`}>
          {generateCircles()}
        </Svg>
      </View>
      {showText && (
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
      )}
    </View>
  );
};

export default Logo;
