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
import { apiService, User } from '../utils/api';

const EditProfileScreen = () => {
  const navigation = useNavigation();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <Text style={styles.headerSubtitle}>
          Update your account information
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={value => handleInputChange('username', value)}
              placeholder="Enter your username"
              placeholderTextColor="#A0C4E4"
              selectionColor="#FFFFFF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.companyName}
              onChangeText={value => handleInputChange('companyName', value)}
              placeholder="Enter your company name"
              placeholderTextColor="#A0C4E4"
              selectionColor="#FFFFFF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={value => handleInputChange('phoneNumber', value)}
              placeholder="Enter your phone number"
              placeholderTextColor="#A0C4E4"
              selectionColor="#FFFFFF"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street</Text>
            <TextInput
              style={styles.input}
              value={formData.companyAddress.street}
              onChangeText={value =>
                handleInputChange('companyAddress.street', value)
              }
              placeholder="Street address"
              placeholderTextColor="#A0C4E4"
              selectionColor="#FFFFFF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area/Locality</Text>
            <TextInput
              style={styles.input}
              value={formData.companyAddress.area}
              onChangeText={value =>
                handleInputChange('companyAddress.area', value)
              }
              placeholder="Area or locality"
              placeholderTextColor="#A0C4E4"
              selectionColor="#FFFFFF"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={styles.input}
                value={formData.companyAddress.city}
                onChangeText={value =>
                  handleInputChange('companyAddress.city', value)
                }
                placeholder="City"
                placeholderTextColor="#A0C4E4"
                selectionColor="#FFFFFF"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>State *</Text>
              <TextInput
                style={styles.input}
                value={formData.companyAddress.state}
                onChangeText={value =>
                  handleInputChange('companyAddress.state', value)
                }
                placeholder="State"
                placeholderTextColor="#A0C4E4"
                selectionColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Country *</Text>
              <TextInput
                style={styles.input}
                value={formData.companyAddress.country}
                onChangeText={value =>
                  handleInputChange('companyAddress.country', value)
                }
                placeholder="Country"
                placeholderTextColor="#A0C4E4"
                selectionColor="#FFFFFF"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                value={formData.companyAddress.pincode}
                onChangeText={value =>
                  handleInputChange('companyAddress.pincode', value)
                }
                placeholder="Pincode"
                placeholderTextColor="#A0C4E4"
                selectionColor="#FFFFFF"
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
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
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
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  header: {
    backgroundColor: '#1A1F71',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'System',
  },
  headerSubtitle: {
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
    marginBottom: 20,
    fontFamily: 'System',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#A0C4E4',
    marginBottom: 10,
    fontFamily: 'System',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontFamily: 'System',
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
    shadowColor: 'rgba(255,255,255,0.3)',
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
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cancelButtonText: {
    color: '#A0C4E4',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
});

export default EditProfileScreen;
