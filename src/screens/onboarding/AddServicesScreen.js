import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const AddServicesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [allServices, setAllServices] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [customPrice, setCustomPrice] = useState('');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all available services
      const allServicesRes = await apiService.get(API_ENDPOINTS.ALL_SERVICES);
      if (allServicesRes.success) {
        setAllServices(allServicesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching all services:', error);
    }

    try {
      // Fetch user's selected services
      const myServicesRes = await apiService.get(API_ENDPOINTS.MY_SERVICES);
      if (myServicesRes.success) {
        setMyServices(myServicesRes.data || []);
      }
    } catch (error) {
      // Handle pending approval or other errors gracefully
      console.log('My services not available yet:', error.message);
      setMyServices([]);
    }

    setLoading(false);
  };

  const isServiceAdded = (serviceId) => {
    return myServices.some((s) => (s.service_id || s.serviceId) === serviceId);
  };

  const getMyService = (serviceId) => {
    return myServices.find((s) => (s.service_id || s.serviceId) === serviceId);
  };

  const handleServicePress = (service) => {
    const serviceName = service.name || service.service_name;
    const basePrice = service.base_price || service.basePrice;

    if (isServiceAdded(service.id)) {
      // Already added - show options
      Alert.alert(serviceName, 'What would you like to do?', [
        {
          text: 'Update Price',
          onPress: () => {
            setSelectedService({ ...service, name: serviceName, basePrice });
            const myService = getMyService(service.id);
            const customPriceVal = myService?.custom_price || myService?.customPrice;
            setCustomPrice(customPriceVal?.toString() || basePrice?.toString() || '');
            setShowPriceModal(true);
          },
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => handleRemoveService(service),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      // Not added - show price modal
      setSelectedService({ ...service, name: serviceName, basePrice });
      setCustomPrice(basePrice?.toString() || '');
      setShowPriceModal(true);
    }
  };

  const handleAddService = async () => {
    if (!selectedService || !customPrice) return;

    setSaving(true);
    try {
      const myService = getMyService(selectedService.id);

      if (myService) {
        // Update existing service
        await apiService.patch(API_ENDPOINTS.MY_SERVICE(myService.id), {
          customPrice: parseInt(customPrice),
        });
      } else {
        // Add new service
        await apiService.post(API_ENDPOINTS.MY_SERVICES, {
          serviceId: selectedService.id,
          customPrice: parseInt(customPrice),
        });
      }

      setShowPriceModal(false);
      setSelectedService(null);
      setCustomPrice('');
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveService = async (service) => {
    const myService = getMyService(service.id);
    if (!myService) return;

    try {
      await apiService.delete(API_ENDPOINTS.MY_SERVICE(myService.id));
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to remove service');
    }
  };

  // Group services by category
  const groupedServices = allServices.reduce((acc, service) => {
    const category = service.category_name || service.categoryName || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {});

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-4"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text
              className="text-xl font-bold text-gray-900"
              style={{ fontFamily: 'Poppins-Bold' }}
            >
              Add Services
            </Text>
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {myServices.length} service{myServices.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* My Services */}
        {myServices.length > 0 && (
          <View className="px-4 mt-4">
            <Text
              className="text-sm font-medium text-gray-500 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              YOUR SERVICES
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {myServices.map((service, index) => {
                const serviceId = service.service_id || service.serviceId;
                const serviceName = service.service_name || service.serviceName;
                const customPriceVal = service.custom_price || service.customPrice;
                const basePriceVal = service.base_price || service.basePrice;

                return (
                  <TouchableOpacity
                    key={service.id}
                    className={`flex-row items-center p-4 ${
                      index < myServices.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    onPress={() =>
                      handleServicePress({
                        id: serviceId,
                        name: serviceName,
                        basePrice: basePriceVal,
                      })
                    }
                  >
                    <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                      <Ionicons name="checkmark" size={20} color={COLORS.success} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins-Medium' }}
                      >
                        {serviceName}
                      </Text>
                      <Text
                        className="text-sm text-primary"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        {customPriceVal?.toLocaleString()} XAF
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* All Services */}
        {Object.entries(groupedServices).map(([category, services]) => (
          <View key={category} className="px-4 mt-4">
            <Text
              className="text-sm font-medium text-gray-500 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              {category.toUpperCase()}
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {services.map((service, index) => {
                const isAdded = isServiceAdded(service.id);
                const serviceName = service.name || service.service_name;
                const basePrice = service.base_price || service.basePrice;

                return (
                  <TouchableOpacity
                    key={service.id}
                    className={`flex-row items-center p-4 ${
                      index < services.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    onPress={() => handleServicePress(service)}
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        isAdded ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      <Ionicons
                        name={isAdded ? 'checkmark' : 'add'}
                        size={20}
                        color={isAdded ? COLORS.success : COLORS.textSecondary}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-base font-medium text-gray-900"
                        style={{ fontFamily: 'Poppins-Medium' }}
                      >
                        {serviceName}
                      </Text>
                      <Text
                        className="text-sm text-gray-500"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        Base: {basePrice?.toLocaleString()} XAF
                      </Text>
                    </View>
                    <Ionicons
                      name={isAdded ? 'checkmark-circle' : 'add-circle-outline'}
                      size={24}
                      color={isAdded ? COLORS.success : COLORS.primary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <View className="h-32" />
      </ScrollView>

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <Button
          title="Save & Continue"
          onPress={() => navigation.goBack()}
          disabled={myServices.length === 0}
          icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />}
        />
      </View>

      {/* Price Modal */}
      <Modal
        visible={showPriceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPriceModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
            <View className="flex-row items-center justify-between mb-6">
              <Text
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: 'Poppins-Bold' }}
              >
                Set Your Price
              </Text>
              <TouchableOpacity onPress={() => setShowPriceModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text
              className="text-base text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              {selectedService?.name}
            </Text>

            <Text
              className="text-sm text-gray-500 mb-4"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Base price: {selectedService?.basePrice?.toLocaleString()} XAF
            </Text>

            <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3 mb-6">
              <TextInput
                className="flex-1 text-xl font-semibold text-gray-900"
                style={{ fontFamily: 'Poppins-SemiBold' }}
                placeholder="0"
                value={customPrice}
                onChangeText={setCustomPrice}
                keyboardType="number-pad"
              />
              <Text
                className="text-base text-gray-500 ml-2"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                XAF
              </Text>
            </View>

            <Button
              title={isServiceAdded(selectedService?.id) ? 'Update Price' : 'Add Service'}
              onPress={handleAddService}
              disabled={!customPrice}
              loading={saving}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default AddServicesScreen;
