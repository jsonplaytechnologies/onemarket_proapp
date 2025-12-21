import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import Button from '../../components/common/Button';

const MyServicesScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      const [allServicesRes, myServicesRes] = await Promise.all([
        apiService.get(API_ENDPOINTS.ALL_SERVICES),
        apiService.get(API_ENDPOINTS.MY_SERVICES),
      ]);

      if (allServicesRes.success) {
        setAllServices(allServicesRes.data || []);
      }

      if (myServicesRes.success) {
        setMyServices(myServicesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const isServiceAdded = (serviceId) => {
    return myServices.some((s) => s.service_id === serviceId);
  };

  const getMyService = (serviceId) => {
    return myServices.find((s) => s.service_id === serviceId);
  };

  const handleServicePress = (service) => {
    if (isServiceAdded(service.id)) {
      Alert.alert(service.name || service.service_name, 'What would you like to do?', [
        {
          text: 'Update Price',
          onPress: () => {
            setSelectedService(service);
            const myService = getMyService(service.id || service.service_id);
            setCustomPrice(myService?.custom_price?.toString() || service.base_price?.toString() || '');
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
      setSelectedService(service);
      setCustomPrice(service.base_price?.toString() || '');
      setShowPriceModal(true);
    }
  };

  const handleAddService = async () => {
    if (!selectedService || !customPrice) return;

    setSaving(true);
    try {
      const serviceId = selectedService.id || selectedService.service_id;
      const myService = getMyService(serviceId);

      if (myService) {
        await apiService.patch(API_ENDPOINTS.MY_SERVICE(myService.id), {
          customPrice: parseInt(customPrice),
        });
      } else {
        await apiService.post(API_ENDPOINTS.MY_SERVICES, {
          serviceId: serviceId,
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
    const serviceId = service.id || service.service_id;
    const myService = getMyService(serviceId);
    if (!myService) return;

    try {
      await apiService.delete(API_ENDPOINTS.MY_SERVICE(myService.id));
      fetchData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to remove service');
    }
  };

  const groupedServices = allServices.reduce((acc, service) => {
    const category = service.category_name || 'Other';
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
              My Services
            </Text>
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {myServices.length} service{myServices.length !== 1 ? 's' : ''} active
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={Object.entries(groupedServices)}
        keyExtractor={([category]) => category}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          myServices.length > 0 ? (
            <View className="px-4 mt-4">
              <Text
                className="text-sm font-medium text-gray-500 mb-2"
                style={{ fontFamily: 'Poppins-Medium' }}
              >
                YOUR ACTIVE SERVICES
              </Text>
              <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {myServices.map((service, index) => (
                  <TouchableOpacity
                    key={service.id}
                    className={`flex-row items-center p-4 ${
                      index < myServices.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                    onPress={() =>
                      handleServicePress({
                        id: service.service_id,
                        name: service.service_name,
                        base_price: service.base_price,
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
                        {service.service_name}
                      </Text>
                      <Text
                        className="text-sm text-blue-600"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        {service.custom_price?.toLocaleString()} XAF
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        renderItem={({ item: [category, services] }) => (
          <View className="px-4 mt-4">
            <Text
              className="text-sm font-medium text-gray-500 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              {category.toUpperCase()}
            </Text>
            <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {services.map((service, index) => {
                const isAdded = isServiceAdded(service.id);
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
                        {service.name}
                      </Text>
                      <Text
                        className="text-sm text-gray-500"
                        style={{ fontFamily: 'Poppins-Regular' }}
                      >
                        Base: {service.base_price?.toLocaleString()} XAF
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
        )}
        ListFooterComponent={<View className="h-8" />}
        showsVerticalScrollIndicator={false}
      />

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
              {selectedService?.name || selectedService?.service_name}
            </Text>

            <Text
              className="text-sm text-gray-500 mb-4"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Base price: {selectedService?.base_price?.toLocaleString()} XAF
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

export default MyServicesScreen;
