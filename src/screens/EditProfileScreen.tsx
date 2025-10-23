import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { apiService, User } from '../utils/api';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    companyName: '',
    phoneNumber: '',
    companyAddress: {
      street: '',
      area: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
    },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await apiService.getProfile();
      const user = profile.user;
      setFormData({
        username: user.username || '',
        companyName: user.companyName || '',
        phoneNumber: user.phoneNumber || '',
        companyAddress: {
          street: user.companyAddress?.street || '',
          area: user.companyAddress?.area || '',
          city: user.companyAddress?.city || '',
          state: user.companyAddress?.state || '',
          country: user.companyAddress?.country || '',
          pincode: user.companyAddress?.pincode || '',
        },
      });
    } catch (error) {
      console.error('Error loading profile for editing:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('companyAddress.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        companyAddress: {
          ...prev.companyAddress,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (
      !formData.username.trim() ||
      !formData.companyName.trim() ||
      !formData.phoneNumber.trim()
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const updateData: Partial<User> = {
        username: formData.username.trim(),
        companyName: formData.companyName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        companyAddress: {
          street: formData.companyAddress.street.trim() || undefined,
          area: formData.companyAddress.area.trim() || undefined,
          city: formData.companyAddress.city.trim(),
          state: formData.companyAddress.state.trim(),
          country: formData.companyAddress.country.trim(),
          pincode: formData.companyAddress.pincode.trim() || undefined,
        },
      };

      await apiService.updateProfile(updateData);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          isDarkMode
            ? styles.darkLoadingContainer
            : styles.lightLoadingContainer,
        ]}
      >
        <ActivityIndicator
          size="large"
          color={isDarkMode ? '#FFFFFF' : '#5D3FD3'}
        />
        <Text
          style={[
            styles.loadingText,
            isDarkMode ? styles.darkLoadingText : styles.lightLoadingText,
          ]}
        >
          Loading profile...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        isDarkMode ? styles.darkBackground : styles.lightBackground,
      ]}
    >
      <View
        style={[
          styles.header,
          isDarkMode ? styles.darkHeader : styles.lightHeader,
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            isDarkMode ? styles.darkHeaderText : styles.lightHeaderText,
          ]}
        >
          Edit Profile
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            isDarkMode ? styles.darkHeaderSubtitle : styles.lightHeaderSubtitle,
          ]}
        >
          Update your account information
        </Text>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.section,
            isDarkMode ? styles.darkSection : styles.lightSection,
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              isDarkMode ? styles.darkSectionTitle : styles.lightSectionTitle,
            ]}
          >
            Basic Information
          </Text>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                isDarkMode ? styles.darkLabel : styles.lightLabel,
              ]}
            >
              Username *
            </Text>
            <TextInput
              style={[
                styles.input,
                isDarkMode ? styles.darkInput : styles.lightInput,
              ]}
              value={formData.username}
              onChangeText={value => handleInputChange('username', value)}
              placeholder="Enter your username"
              placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
              selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                isDarkMode ? styles.darkLabel : styles.lightLabel,
              ]}
            >
              Company Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                isDarkMode ? styles.darkInput : styles.lightInput,
              ]}
              value={formData.companyName}
              onChangeText={value => handleInputChange('companyName', value)}
              placeholder="Enter your company name"
              placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
              selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                isDarkMode ? styles.darkLabel : styles.lightLabel,
              ]}
            >
              Phone Number *
            </Text>
            <TextInput
              style={[
                styles.input,
                isDarkMode ? styles.darkInput : styles.lightInput,
              ]}
              value={formData.phoneNumber}
              onChangeText={value => handleInputChange('phoneNumber', value)}
              placeholder="Enter your phone number"
              placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
              selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View
          style={[
            styles.section,
            isDarkMode ? styles.darkSection : styles.lightSection,
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              isDarkMode ? styles.darkSectionTitle : styles.lightSectionTitle,
            ]}
          >
            Company Address
          </Text>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                isDarkMode ? styles.darkLabel : styles.lightLabel,
              ]}
            >
              Street
            </Text>
            <TextInput
              style={[
                styles.input,
                isDarkMode ? styles.darkInput : styles.lightInput,
              ]}
              value={formData.companyAddress.street}
              onChangeText={value =>
                handleInputChange('companyAddress.street', value)
              }
              placeholder="Street address"
              placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
              selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                isDarkMode ? styles.darkLabel : styles.lightLabel,
              ]}
            >
              Area/Locality
            </Text>
            <TextInput
              style={[
                styles.input,
                isDarkMode ? styles.darkInput : styles.lightInput,
              ]}
              value={formData.companyAddress.area}
              onChangeText={value =>
                handleInputChange('companyAddress.area', value)
              }
              placeholder="Area or locality"
              placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
              selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text
                style={[
                  styles.label,
                  isDarkMode ? styles.darkLabel : styles.lightLabel,
                ]}
              >
                City *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode ? styles.darkInput : styles.lightInput,
                ]}
                value={formData.companyAddress.city}
                onChangeText={value =>
                  handleInputChange('companyAddress.city', value)
                }
                placeholder="City"
                placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
                selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text
                style={[
                  styles.label,
                  isDarkMode ? styles.darkLabel : styles.lightLabel,
                ]}
              >
                State *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode ? styles.darkInput : styles.lightInput,
                ]}
                value={formData.companyAddress.state}
                onChangeText={value =>
                  handleInputChange('companyAddress.state', value)
                }
                placeholder="State"
                placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
                selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text
                style={[
                  styles.label,
                  isDarkMode ? styles.darkLabel : styles.lightLabel,
                ]}
              >
                Country *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode ? styles.darkInput : styles.lightInput,
                ]}
                value={formData.companyAddress.country}
                onChangeText={value =>
                  handleInputChange('companyAddress.country', value)
                }
                placeholder="Country"
                placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
                selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text
                style={[
                  styles.label,
                  isDarkMode ? styles.darkLabel : styles.lightLabel,
                ]}
              >
                Pincode
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDarkMode ? styles.darkInput : styles.lightInput,
                ]}
                value={formData.companyAddress.pincode}
                onChangeText={value =>
                  handleInputChange('companyAddress.pincode', value)
                }
                placeholder="Pincode"
                placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
                selectionColor={isDarkMode ? '#FFFFFF' : '#000000'}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cancelButton,
              isDarkMode ? styles.darkCancelButton : styles.lightCancelButton,
            ]}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text
              style={[
                styles.cancelButtonText,
                isDarkMode ? styles.darkCancelText : styles.lightCancelText,
              ]}
            >
              Cancel
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
  },
  lightBackground: {
    backgroundColor: '#E0F7FA',
  },
  darkBackground: {
    backgroundColor: '#1A1F71',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkLoadingContainer: {
    backgroundColor: '#1A1F71',
  },
  lightLoadingContainer: {
    backgroundColor: '#E0F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'System',
  },
  darkLoadingText: {
    color: '#FFFFFF',
  },
  lightLoadingText: {
    color: '#1A1F71',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  lightHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    fontFamily: 'System',
  },
  darkHeaderText: {
    color: '#FFFFFF',
  },
  lightHeaderText: {
    color: '#1A1F71',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'System',
  },
  darkHeaderSubtitle: {
    color: '#A0C4E4',
  },
  lightHeaderSubtitle: {
    color: '#6B7280',
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    borderWidth: 1,
  },
  lightSection: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  darkSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    fontFamily: 'System',
  },
  darkSectionTitle: {
    color: '#FFFFFF',
  },
  lightSectionTitle: {
    color: '#1A1F71',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: 'System',
  },
  darkLabel: {
    color: '#A0C4E4',
  },
  lightLabel: {
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'System',
  },
  lightInput: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,0,0,0.2)',
    color: '#1A1F71',
  },
  darkInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.3)',
    color: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  actions: {
    marginTop: 24,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: '#5D3FD3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#64748b',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  lightCancelButton: {
    borderColor: 'rgba(0,0,0,0.2)',
  },
  darkCancelButton: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  darkCancelText: {
    color: '#A0C4E4',
  },
  lightCancelText: {
    color: '#6B7280',
  },
});

export default EditProfileScreen;
