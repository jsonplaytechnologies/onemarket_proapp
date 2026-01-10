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
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import apiService from '../../services/api';
import { API_ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';

const UploadDocumentsScreen = ({ navigation }) => {
  const { t } = useTranslation();
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
      Alert.alert(t('onboarding.documents.permissionRequired'), t('onboarding.documents.photoPermission'));
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
      Alert.alert(t('onboarding.documents.permissionRequired'), t('onboarding.documents.cameraPermission'));
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
    Alert.alert(t('onboarding.documents.selectImage'), '', [
      { text: t('onboarding.documents.camera'), onPress: () => takePhoto(type) },
      { text: t('onboarding.documents.gallery'), onPress: () => pickImage(type) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const handleUpload = async () => {
    if (!idNumber) {
      Alert.alert(t('common.error'), t('onboarding.documents.enterIdNumber'));
      return;
    }

    if (!frontImage || !backImage) {
      Alert.alert(t('common.error'), t('onboarding.documents.uploadBothSides'));
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
          t('onboarding.documents.documentsUploaded'),
          t('onboarding.documents.documentsUploadedMessage'),
          [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), error.message || 'Failed to upload documents');
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
            {t('onboarding.documents.idVerified')}
          </Text>
          <Text
            className="text-base text-gray-500 text-center"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {t('onboarding.documents.idVerifiedMessage')}
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
            {t('onboarding.documents.documentsUnderReview')}
          </Text>
          <Text
            className="text-base text-gray-500 text-center mb-6"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {t('onboarding.documents.documentsUnderReviewMessage')}
          </Text>
          <View className="bg-gray-50 p-4 rounded-xl w-full">
            <Text
              className="text-sm text-gray-600 text-center"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {t('onboarding.documents.idNumber')}: {idNumber}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const guidelines = [
    t('onboarding.documents.guideline1'),
    t('onboarding.documents.guideline2'),
    t('onboarding.documents.guideline3'),
    t('onboarding.documents.guideline4'),
  ];

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
            {t('onboarding.documents.title')}
          </Text>

          <Text
            className="text-base text-gray-500"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {t('onboarding.documents.subtitle')}
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
                    {t('onboarding.documents.resubmissionRequired')}
                  </Text>
                  <Text
                    className="text-sm text-orange-700 mt-1"
                    style={{ fontFamily: 'Poppins-Regular' }}
                  >
                    {t('onboarding.documents.resubmissionMessage')}
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
              {t('onboarding.documents.idNumber')}
            </Text>
            <Input
              placeholder={t('onboarding.documents.idNumberPlaceholder')}
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
              {t('onboarding.documents.frontOfId')}
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
                    {t('onboarding.documents.tapToUploadFront')}
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
              {t('onboarding.documents.backOfId')}
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
                    {t('onboarding.documents.tapToUploadBack')}
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
              {t('onboarding.documents.photoGuidelines')}
            </Text>
            <View className="space-y-1">
              {guidelines.map((guideline, index) => (
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
            title={t('onboarding.documents.uploadDocuments')}
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
