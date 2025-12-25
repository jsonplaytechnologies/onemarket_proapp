import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../../services/api';
import { API_ENDPOINTS, API_BASE_URL } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useBookingSocket } from '../../hooks/useSocket';

const { width: screenWidth } = Dimensions.get('window');

const ChatScreen = ({ navigation, route }) => {
  const { bookingId, booking = {} } = route.params || {};
  const { user, token } = useAuth();

  // Early return if bookingId is missing
  if (!bookingId) {
    console.error('ChatScreen: bookingId is required');
    return null;
  }
  const insets = useSafeAreaInsets();
  const flatListRef = useRef();

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const { messages, setMessages, isUserTyping, send, typing, isConnected } =
    useBookingSocket(bookingId);

  useEffect(() => {
    fetchMessages();
  }, [bookingId]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await apiService.get(API_ENDPOINTS.BOOKING_MESSAGES(bookingId));
      if (response.success) {
        setMessages(response.data?.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage('');
    setSending(true);

    try {
      if (isConnected) {
        // Use await to properly handle the Promise and catch errors
        await send(messageText, 'text');
      } else {
        // Fallback to API when socket not connected
        await apiService.post(API_ENDPOINTS.BOOKING_MESSAGES(bookingId), {
          content: messageText,
          messageType: 'text',
        });
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on failure so user can retry
      setMessage(messageText);
      // Could add a toast/alert here to notify user of failure
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to send images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      sendImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      sendImage(result.assets[0]);
    }
  };

  const sendImage = async (imageAsset) => {
    setUploadingImage(true);

    try {
      const formData = new FormData();
      const filename = imageAsset.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageAsset.uri,
        name: filename,
        type,
      });

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKING_MESSAGES_IMAGE(bookingId)}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        // If socket is not connected, add message manually (otherwise socket will handle it)
        if (!isConnected && data.data?.message) {
          setMessages(prev => [...prev, data.data.message]);
        }
        flatListRef.current?.scrollToEnd({ animated: true });
      } else {
        alert(data.message || 'Failed to send image');
      }
    } catch (error) {
      console.error('Error sending image:', error);
      alert('Failed to send image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTyping = (text) => {
    setMessage(text);
    if (isConnected) {
      typing(text.length > 0);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isMyMessage = (msg) => {
    const senderId = msg.sender_id || msg.senderId;
    return senderId === user?.id;
  };

  const userName = booking?.user_first_name
    ? `${booking.user_first_name} ${booking.user_last_name || ''}`
    : booking?.user?.firstName
    ? `${booking.user.firstName} ${booking.user.lastName || ''}`
    : 'Customer';
  const userAvatar = booking?.user_avatar || booking?.user?.avatar;

  const renderMessage = ({ item, index }) => {
    const isMine = isMyMessage(item);
    const showAvatar =
      !isMine && (index === 0 || !isMyMessage(messages[index - 1]));
    const messageType = item.message_type || item.type || 'text';
    const isImage = messageType === 'image';

    return (
      <View
        className={`flex-row mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}
      >
        {!isMine && showAvatar && (
          userAvatar ? (
            <Image
              source={{ uri: userAvatar }}
              className="w-8 h-8 rounded-full mr-2"
            />
          ) : (
            <View className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center mr-2">
              <Ionicons name="person" size={16} color={COLORS.textSecondary} />
            </View>
          )
        )}
        {!isMine && !showAvatar && <View className="w-10" />}

        {isImage ? (
          <TouchableOpacity
            onPress={() => setSelectedImage(item.content)}
            activeOpacity={0.9}
          >
            <View
              className={`rounded-2xl overflow-hidden ${
                isMine ? 'rounded-br-sm' : 'rounded-bl-sm'
              }`}
              style={{ maxWidth: screenWidth * 0.65 }}
            >
              <Image
                source={{ uri: item.content }}
                style={{
                  width: screenWidth * 0.65,
                  height: screenWidth * 0.65,
                  borderRadius: 16,
                }}
                resizeMode="cover"
              />
              <View
                className={`absolute bottom-2 ${isMine ? 'right-2' : 'left-2'} px-2 py-0.5 rounded-full`}
                style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              >
                <Text
                  className="text-white text-xs"
                  style={{ fontFamily: 'Poppins-Regular' }}
                >
                  {formatTime(item.created_at || item.createdAt)}
                  {isMine && (item.is_read || item.isRead) && ' ✓✓'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View
            className={`max-w-3/4 px-4 py-2 rounded-2xl ${
              isMine ? 'bg-primary rounded-br-sm' : 'bg-gray-100 rounded-bl-sm'
            }`}
            style={{ maxWidth: '75%' }}
          >
            <Text
              className={`text-base ${isMine ? 'text-white' : 'text-gray-900'}`}
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {item.content}
            </Text>
            <Text
              className={`text-xs mt-1 ${
                isMine ? 'text-blue-100' : 'text-gray-500'
              }`}
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {formatTime(item.created_at || item.createdAt)}
              {isMine && (item.is_read || item.isRead) && (
                <Text> ✓✓</Text>
              )}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mr-3"
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>

        {userAvatar ? (
          <Image
            source={{ uri: userAvatar }}
            className="w-10 h-10 rounded-full mr-3"
          />
        ) : (
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </View>
        )}

        <View className="flex-1">
          <Text
            className="text-base font-medium text-gray-900"
            style={{ fontFamily: 'Poppins-Medium' }}
          >
            {userName}
          </Text>
          <Text
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Poppins-Regular' }}
          >
            {booking?.service_name}
          </Text>
        </View>

        {isConnected && (
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
            <Text
              className="text-xs text-green-600"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Online
            </Text>
          </View>
        )}
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 25}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.id || 'msg'}-${index}`}
          renderItem={renderMessage}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 8,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-16">
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={COLORS.textSecondary}
              />
              <Text
                className="text-gray-500 mt-2"
                style={{ fontFamily: 'Poppins-Regular' }}
              >
                No messages yet
              </Text>
            </View>
          }
        />

        {/* Typing Indicator */}
        {isUserTyping && (
          <View className="px-4 pb-2">
            <Text
              className="text-sm text-gray-500"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              {userName} is typing...
            </Text>
          </View>
        )}

        {/* Uploading Indicator */}
        {uploadingImage && (
          <View className="px-4 pb-2 flex-row items-center">
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text
              className="text-sm text-gray-500 ml-2"
              style={{ fontFamily: 'Poppins-Regular' }}
            >
              Sending image...
            </Text>
          </View>
        )}

        {/* Input */}
        <View
          className="flex-row items-end px-4 pt-3 border-t border-gray-200 bg-white"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          {/* Image Picker Buttons */}
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center mr-1"
            onPress={pickImage}
            disabled={uploadingImage}
          >
            <Ionicons name="image-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-10 h-10 items-center justify-center mr-2"
            onPress={takePhoto}
            disabled={uploadingImage}
          >
            <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-end bg-gray-100 rounded-2xl px-4 py-2 mr-2">
            <TextInput
              className="flex-1 text-base max-h-24"
              style={{ fontFamily: 'Poppins-Regular' }}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={message}
              onChangeText={handleTyping}
              multiline
            />
          </View>

          <TouchableOpacity
            className={`w-12 h-12 rounded-full items-center justify-center ${
              message.trim() ? 'bg-primary' : 'bg-gray-300'
            }`}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            <TouchableOpacity
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                className="flex-1"
                resizeMode="contain"
              />
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatScreen;
