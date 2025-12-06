import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';

const OTPInput = ({ length = 6, value, onChange, onComplete, autoFocus = true }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (value === '') {
      setOtp(new Array(length).fill(''));
    } else if (value) {
      const otpArray = value.split('').slice(0, length);
      while (otpArray.length < length) {
        otpArray.push('');
      }
      setOtp(otpArray);
    }
  }, [value, length]);

  const handleChange = (text, index) => {
    if (!/^\d*$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange(otpString);

    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (otpString.length === length && !otpString.includes('') && onComplete) {
      onComplete(otpString);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index) => {
    const firstEmptyIndex = otp.findIndex((digit) => digit === '');
    if (firstEmptyIndex !== -1 && firstEmptyIndex < index) {
      inputRefs.current[firstEmptyIndex]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            digit ? styles.inputFilled : styles.inputEmpty,
          ]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="number-pad"
          maxLength={1}
          autoFocus={autoFocus && index === 0}
          selectTextOnFocus
          textAlignVertical="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  input: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
    includeFontPadding: false,
    paddingVertical: 0,
    paddingTop: Platform.OS === 'android' ? 2 : 0,
  },
  inputEmpty: {
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  inputFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
});

export default OTPInput;
