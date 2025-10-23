import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiService, User } from '../utils/api';
import { launchImageLibrary } from 'react-native-image-picker';
import { ActionSheetIOS } from 'react-native';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logoutUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await apiService.getProfile();
      setUser(profile.user);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutUser();
          } catch (error) {
            console.error('Error logging out:', error);
          }
        },
      },
    ]);
  };

  const handleAvatarPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: user?.profileImage
            ? ['View Image', 'Change Image', 'Cancel']
            : ['Add Image', 'Cancel'],
          cancelButtonIndex: user?.profileImage ? 2 : 1,
          destructiveButtonIndex: undefined,
        },
        buttonIndex => {
          if (user?.profileImage) {
            if (buttonIndex === 0) {
              setShowImageModal(true);
            } else if (buttonIndex === 1) {
              handleImagePick();
            }
          } else {
            if (buttonIndex === 0) {
              handleImagePick();
            }
          }
        },
      );
    } else {
      // For Android, show Alert with options
      const options = user?.profileImage
        ? ['View Image', 'Change Image', 'Cancel']
        : ['Add Image', 'Cancel'];

      Alert.alert(
        'Profile Image',
        'Choose an action',
        options.map((option, index) => ({
          text: option,
          onPress: () => {
            if (user?.profileImage) {
              if (index === 0) setShowImageModal(true);
              else if (index === 1) handleImagePick();
            } else {
              if (index === 0) handleImagePick();
            }
          },
          style: option === 'Cancel' ? 'cancel' : 'default',
        })),
      );
    }
  };

  const handleImagePick = async () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: true,
      maxHeight: 800,
      maxWidth: 800,
      quality: 0.8 as any,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        return;
      }

      if (response.errorMessage) {
        Alert.alert('Error', 'Failed to pick image');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setUploadingImage(true);

        try {
          let base64Data = asset.base64;

          // If no base64, try to convert from URI
          if (!base64Data && asset.uri) {
            // For React Native, we can use the asset.uri directly
            // In a real implementation, you might want to use a library like react-native-image-resizer
            base64Data = asset.uri;
          }

          if (!base64Data) {
            Alert.alert('Error', 'Failed to process image');
            return;
          }

          const updateData = {
            profileImage: base64Data.startsWith('data:')
              ? base64Data
              : `data:${asset.type};base64,${base64Data}`,
          };

          await apiService.updateProfile(updateData as any);
          setUser(prev => (prev ? { ...prev, ...updateData } : null));
          Alert.alert('Success', 'Profile image updated successfully');
        } catch (error) {
          console.error('Error updating profile image:', error);
          Alert.alert('Error', 'Failed to update profile image');
        } finally {
          setUploadingImage(false);
        }
      }
    });
  };

  const toggleBotStatus = async (botType: 'telegram' | 'whatsapp') => {
    if (!user) return;

    const currentStatus =
      botType === 'telegram' ? user.telegramBotActive : user.whatsappBotActive;
    const newStatus = !currentStatus;
    const botName = botType === 'telegram' ? 'Telegram Bot' : 'WhatsApp Bot';

    Alert.alert(
      `Toggle ${botName}`,
      `Are you sure you want to ${
        newStatus ? 'activate' : 'deactivate'
      } the ${botName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus ? 'Activate' : 'Deactivate',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const updateData = {
                [botType === 'telegram'
                  ? 'telegramBotActive'
                  : 'whatsappBotActive']: newStatus,
              };

              await apiService.updateProfile(updateData);
              setUser(prev => (prev ? { ...prev, ...updateData } : null));
              Alert.alert(
                'Success',
                `${botName} ${
                  newStatus ? 'activated' : 'deactivated'
                } successfully`,
              );
            } catch (error) {
              console.error(`Error toggling ${botType} bot status:`, error);
              Alert.alert('Error', `Failed to update ${botName} status`);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleAvatarPress}
          disabled={uploadingImage}
        >
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <View style={styles.plusIconContainer}>
            <Text style={styles.plusIconText}>+</Text>
          </View>
          {uploadingImage && (
            <View style={styles.uploadingOverlay}>
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.username, isDarkMode ? styles.darkText : styles.lightText]}>{user?.username}</Text>
        <Text style={[styles.company, isDarkMode ? styles.darkCompany : styles.lightCompany]}>{user?.companyName}</Text>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (navigation as any).navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalContent}>
              {user?.profileImage && (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.content}>
        <View style={[styles.section, isDarkMode ? null : styles.lightSection]}>
          <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>Account Information</Text>
          <View style={[styles.infoItem, isDarkMode ? null : styles.lightInfoItem]}>
            <Text style={[styles.label, isDarkMode ? null : styles.lightLabel]}>Email:</Text>
            <Text style={[styles.value, isDarkMode ? null : styles.lightValue]}>{user?.email}</Text>
          </View>
          <View style={[styles.infoItem, isDarkMode ? null : styles.lightInfoItem]}>
            <Text style={[styles.label, isDarkMode ? null : styles.lightLabel]}>Phone:</Text>
            <Text style={[styles.value, isDarkMode ? null : styles.lightValue]}>{user?.phoneNumber}</Text>
          </View>
          <View style={[styles.infoItem, isDarkMode ? null : styles.lightInfoItem]}>
            <Text style={[styles.label, isDarkMode ? null : styles.lightLabel]}>Company:</Text>
            <Text style={[styles.value, isDarkMode ? null : styles.lightValue]}>{user?.companyName}</Text>
          </View>
          <View style={[styles.infoItem, isDarkMode ? null : styles.lightInfoItem]}>
            <Text style={[styles.label, isDarkMode ? null : styles.lightLabel]}>Member since:</Text>
            <Text style={[styles.value, isDarkMode ? null : styles.lightValue]}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={[styles.section, isDarkMode ? null : styles.lightSection]}>
          <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>Company Address</Text>
          {user?.companyAddress ? (
            <View style={[styles.addressContainer, isDarkMode ? null : styles.lightAddressContainer]}>
              {user.companyAddress.street && (
                <Text style={[styles.addressLine, isDarkMode ? null : styles.lightAddressLine]}>
                  {user.companyAddress.street}
                </Text>
              )}
              {user.companyAddress.area && (
                <Text style={[styles.addressLine, isDarkMode ? null : styles.lightAddressLine]}>
                  {user.companyAddress.area}
                </Text>
              )}
              <Text style={[styles.addressLine, isDarkMode ? null : styles.lightAddressLine]}>
                {user.companyAddress.city}, {user.companyAddress.state}
              </Text>
              <Text style={[styles.addressLine, isDarkMode ? null : styles.lightAddressLine]}>
                {user.companyAddress.country} - {user.companyAddress.pincode}
              </Text>
            </View>
          ) : (
            <Text style={[styles.noAddressText, isDarkMode ? null : styles.lightNoAddressText]}>No company address set</Text>
          )}
        </View>

        <View style={[styles.section, isDarkMode ? null : styles.lightSection]}>
          <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>Communication Channels</Text>
          <TouchableOpacity
            style={[styles.infoItem, isDarkMode ? null : styles.lightInfoItem]}
            onPress={() => toggleBotStatus('telegram')}
          >
            <Text style={[styles.label, isDarkMode ? null : styles.lightLabel]}>Telegram Bot:</Text>
            <View style={styles.statusContainer}>
              <Text
                style={
                  user?.telegramBotActive
                    ? styles.activeStatus
                    : styles.inactiveStatus
                }
              >
                {user?.telegramBotActive ? 'Active' : 'Inactive'}
              </Text>
              <Text style={[styles.tapHint, isDarkMode ? null : styles.lightTapHint]}>Tap to toggle</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.infoItem, isDarkMode ? null : styles.lightInfoItem]}
            onPress={() => toggleBotStatus('whatsapp')}
          >
            <Text style={[styles.label, isDarkMode ? null : styles.lightLabel]}>WhatsApp Bot:</Text>
            <View style={styles.statusContainer}>
              <Text
                style={
                  user?.whatsappBotActive
                    ? styles.activeStatus
                    : styles.inactiveStatus
                }
              >
                {user?.whatsappBotActive ? 'Active' : 'Inactive'}
              </Text>
              <Text style={[styles.tapHint, isDarkMode ? null : styles.lightTapHint]}>Tap to toggle</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1F71',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  header: {
    marginTop: 40,
    backgroundColor: '#1A1F71',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5D3FD3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  plusIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5D3FD3',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: '800',
    fontFamily: 'System',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
    fontFamily: 'System',
  },
  company: {
    fontSize: 16,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 15,
    fontFamily: 'System',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontSize: 14,
    color: '#A0C4E4',
    fontWeight: '600',
    fontFamily: 'System',
  },
  value: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  actions: {
    marginTop: 24,
  },
  actionButton: {
    backgroundColor: '#5D3FD3',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#FFFFFF',
  },
  addressContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    borderRadius: 12,
  },
  addressLine: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'System',
  },
  noAddressText: {
    fontSize: 14,
    color: '#A0C4E4',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    fontFamily: 'System',
  },
  activeStatus: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '700',
    fontFamily: 'System',
  },
  inactiveStatus: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '700',
    fontFamily: 'System',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  tapHint: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    fontFamily: 'System',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  modalImage: {
    width: 300,
    height: 300,
    borderRadius: 8,
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightHeader: {
    backgroundColor: '#E0F7FA',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
  darkCompany: {
    color: '#A0C4E4',
  },
  lightCompany: {
    color: '#666666',
  },
  lightSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  lightSectionTitle: {
    color: '#1A1F71',
  },
  lightInfoItem: {
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  lightLabel: {
    color: '#666666',
  },
  lightValue: {
    color: '#1A1F71',
  },
  lightAddressContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  lightAddressLine: {
    color: '#1A1F71',
  },
  lightNoAddressText: {
    color: '#666666',
  },
  lightTapHint: {
    color: '#999999',
  },
  editButton: {
    backgroundColor: '#5D3FD3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
    alignSelf: 'center',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  plusIconText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
