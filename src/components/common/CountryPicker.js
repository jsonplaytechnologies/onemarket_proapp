import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES } from '../../constants/countries';

const CountryPicker = ({ visible, onClose, onSelect, selectedCountry }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery)
  );

  const renderCountryItem = ({ item }) => {
    const isSelected = selectedCountry?.code === item.code;

    return (
      <TouchableOpacity
        className={`flex-row items-center px-4 py-3 ${
          isSelected ? 'bg-blue-50' : ''
        }`}
        onPress={() => {
          onSelect(item);
          onClose();
        }}
      >
        <Text className="text-2xl mr-3">{item.flag}</Text>
        <Text className="flex-1 text-base text-gray-900">{item.name}</Text>
        <Text className="text-base text-gray-600">{item.code}</Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#2563EB" className="ml-2" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center px-4 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={onClose} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-gray-900 flex-1">
            Select Country
          </Text>
        </View>

        {/* Search */}
        <View className="px-4 py-3">
          <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 text-base ml-2"
              placeholder="Search country..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Country List */}
        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item.code}
          renderItem={renderCountryItem}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-gray-200 mx-4" />
          )}
        />
      </View>
    </Modal>
  );
};

export default CountryPicker;
