import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const UploadDocumentsScreen = ({ navigation }) => {
  const [idNumber, setIdNumber] = useState('');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDocs, setFetchingDocs] = useState(true);
  const [existingDocs, setExistingDocs] = useState(null);

  useEffect(() => {
    fetchExistingDocuments();
  }, []);

  const fetchExistingDocuments = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.PRO_DOCUMENTS);
      if (response.success && response.data) {
        setExistingDocs(response.data);
        // Handle both snake_case (API) and camelCase field names
        const idNum = response.data.id_number || response.data.idNumber;
        if (idNum) {
          setIdNumber(idNum);
        }
      }
    } catch (error) {
      console.log('No existing documents');
    } finally {
      setFetchingDocs(false);
    }
  };

  const pickImage = async (type) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload ID documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async (type) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'front') {
        setFrontImage(result.assets[0].uri);
      } else {
        setBackImage(result.assets[0].uri);
      }
    }
  };

  const showImageOptions = (type) => {
    Alert.alert('Select Image', 'Choose an option', [
      { text: 'Camera', onPress: () => takePhoto(type) },
      { text: 'Gallery', onPress: () => pickImage(type) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleUpload = async () => {
    if (!idNumber) {
      Alert.alert('Error', 'Please enter your ID number');
      return;
    }

    if (!frontImage || !backImage) {
      Alert.alert('Error', 'Please upload both front and back of your ID');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('idNumber', idNumber);

      formData.append('id_front', {
        uri: frontImage,
        name: 'id_front.jpg',
        type: 'image/jpeg',
      });

      formData.append('id_back', {
        uri: backImage,
        name: 'id_back.jpg',
        type: 'image/jpeg',
      });

      const response = await apiService.post(API_ENDPOINTS.PRO_DOCUMENTS, formData);

      if (response.success) {
        Alert.alert(
          'Documents Uploaded',
          'Your ID documents have been uploaded and are pending review.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to upload documents');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingDocs) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Check document status (handle snake_case from API)
  const isVerified = existingDocs?.is_id_verified || existingDocs?.isIdVerified;
  const hasSubmittedDocs = existingDocs?.id_number || existingDocs?.idNumber;
  const canResubmit = existingDocs?.resubmit_requested || existingDocs?.resubmitRequested;
  const idFrontUrl = existingDocs?.id_front_url || existingDocs?.idFrontUrl;
  const idBackUrl = existingDocs?.id_back_url || existingDocs?.idBackUrl;

  // If documents are already verified
  if (isVerified) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 pt-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-6"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
          </View>
          <Text
            className="text-xl font-bold text-gray-900 text-center mb-2"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            ID Verified
          </Text>
          <Text
            className="text-base text-gray-500 text-center"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Your identity has been verified successfully.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If documents are submitted and pending review (no re-upload allowed unless admin requests)
  if (hasSubmittedDocs && !canResubmit) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-6 pt-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-6"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-yellow-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="time" size={48} color={COLORS.warning} />
          </View>
          <Text
            className="text-xl font-bold text-gray-900 text-center mb-2"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Documents Under Review
          </Text>
          <Text
            className="text-base text-gray-500 text-center mb-6"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            Your ID documents have been submitted and are being reviewed. You'll be notified once verified.
          </Text>
          <View className="bg-gray-50 p-4 rounded-xl w-full">
            <Text
              className="text-sm text-gray-600 text-center"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              ID Number: {idNumber}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mb-6"
          >
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>

          <Text
            className="text-2xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins-Bold' }}
          >
            Upload ID Documents
          </Text>

          <Text
            className="text-base text-gray-500"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            We need to verify your identity to approve your account
          </Text>
        </View>

        {/* Form */}
        <View className="px-6">
          {/* Pending Review Notice - shown when admin requests resubmit */}
          {canResubmit && (
            <View className="bg-orange-50 p-4 rounded-xl mb-6">
              <View className="flex-row items-start">
                <Ionicons name="alert-circle" size={24} color="#EA580C" />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-sm font-medium text-orange-900"
                    style={{ fontFamily: 'Poppins-Medium' }}
                  >
                    Resubmission Required
                  </Text>
                  <Text
                    className="text-sm text-orange-700 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Admin has requested new documents. Please upload clear photos of your ID.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ID Number */}
          <View className="mb-6">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              ID Number
            </Text>
            <Input
              placeholder="Enter your ID number"
              value={idNumber}
              onChangeText={setIdNumber}
              icon="card-outline"
            />
          </View>

          {/* Front Image */}
          <View className="mb-6">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Front of ID
            </Text>
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 items-center justify-center"
              style={{ minHeight: 150 }}
              onPress={() => showImageOptions('front')}
            >
              {frontImage || idFrontUrl ? (
                <Image
                  source={{ uri: frontImage || idFrontUrl }}
                  style={{ width: '100%', height: 150, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={40} color={COLORS.textSecondary} />
                  <Text
                    className="text-sm text-gray-500 mt-2"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Tap to upload front of ID
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Back Image */}
          <View className="mb-6">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Back of ID
            </Text>
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 items-center justify-center"
              style={{ minHeight: 150 }}
              onPress={() => showImageOptions('back')}
            >
              {backImage || idBackUrl ? (
                <Image
                  source={{ uri: backImage || idBackUrl }}
                  style={{ width: '100%', height: 150, borderRadius: 8 }}
                  resizeMode="cover"
                />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={40} color={COLORS.textSecondary} />
                  <Text
                    className="text-sm text-gray-500 mt-2"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    Tap to upload back of ID
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Guidelines */}
          <View className="bg-gray-50 p-4 rounded-xl mb-6">
            <Text
              className="text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Poppins-Medium' }}
            >
              Photo Guidelines
            </Text>
            <View className="space-y-1">
              {[
                'Make sure the entire ID is visible',
                'Ensure good lighting with no glare',
                'Text should be clearly readable',
                'Use a plain background',
              ].map((guideline, index) => (
                <View key={index} className="flex-row items-center">
                  <Ionicons name="checkmark" size={16} color={COLORS.success} />
                  <Text
                    className="text-sm text-gray-600 ml-2"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {guideline}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Upload Button */}
          <Button
            title="Upload Documents"
            onPress={handleUpload}
            disabled={!idNumber || !frontImage || !backImage}
            loading={loading}
          />

          <View className="h-8" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UploadDocumentsScreen;
