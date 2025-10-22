import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../utils/api';
import LocationPicker from '../components/LocationPicker';

const AddEditLocationScreen = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(true);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    latitude: '',
    longitude: '',
  });

  const handleLocationSelect = (locationData: any) => {
    setFormData({
      address: locationData.address || '',
      city: locationData.city || '',
      state: locationData.state || '',
      country: locationData.country || '',
      postalCode: locationData.postalCode || '',
      latitude: locationData.latitude?.toString() || '',
      longitude: locationData.longitude?.toString() || '',
    });
    setShowMapPicker(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (
      !formData.address ||
      !formData.city ||
      !formData.state ||
      !formData.country
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert(
        'Error',
        'Please select a location on the map to get coordinates',
      );
      return;
    }

    setLoading(true);
    try {
      const locationData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        postalCode: formData.postalCode || undefined,
      };

      await apiService.createLocation(locationData);
      Alert.alert('Success', 'Location created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating location:', error);
      Alert.alert('Error', 'Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  if (showMapPicker) {
    return (
      <LocationPicker
        onLocationSelect={handleLocationSelect}
        initialLocation={
          formData.latitude && formData.longitude
            ? {
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
              }
            : undefined
        }
      />
    );
  }

  return (
    <ScrollView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.headerTitle, isDarkMode ? styles.darkText : styles.lightText]}>Refine Location Details</Text>
        <Text style={[styles.headerSubtitle, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>
          Review and adjust the selected location
        </Text>
        <TouchableOpacity
          style={styles.backToMapButton}
          onPress={() => setShowMapPicker(true)}
        >
          <Text style={styles.backToMapText}>← Back to Map</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.form, isDarkMode ? null : styles.lightForm]}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isDarkMode ? styles.darkLabel : styles.lightLabel]}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea, isDarkMode ? styles.darkInput : styles.lightInput]}
            value={formData.address}
            onChangeText={value => handleInputChange('address', value)}
            placeholder="Full street address..."
            placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
            multiline
            numberOfLines={3}
            selectionColor={isDarkMode ? "#FFFFFF" : "#000000"}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, isDarkMode ? styles.darkLabel : styles.lightLabel]}>City *</Text>
            <TextInput
              style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
              value={formData.city}
              onChangeText={value => handleInputChange('city', value)}
              placeholder="City name"
              placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
              selectionColor={isDarkMode ? "#FFFFFF" : "#000000"}
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, isDarkMode ? styles.darkLabel : styles.lightLabel]}>State *</Text>
            <TextInput
              style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
              value={formData.state}
              onChangeText={value => handleInputChange('state', value)}
              placeholder="State/Province"
              placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
              selectionColor={isDarkMode ? "#FFFFFF" : "#000000"}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, isDarkMode ? styles.darkLabel : styles.lightLabel]}>Country *</Text>
            <TextInput
              style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
              value={formData.country}
              onChangeText={value => handleInputChange('country', value)}
              placeholder="Country name"
              placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
              selectionColor={isDarkMode ? "#FFFFFF" : "#000000"}
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={[styles.label, isDarkMode ? styles.darkLabel : styles.lightLabel]}>Postal Code</Text>
            <TextInput
              style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
              value={formData.postalCode}
              onChangeText={value => handleInputChange('postalCode', value)}
              placeholder="ZIP/Postal code"
              placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
              selectionColor={isDarkMode ? "#FFFFFF" : "#000000"}
            />
          </View>
        </View>

        <View style={[styles.coordinatesDisplay, isDarkMode ? null : styles.lightCoordinatesDisplay]}>
          <Text style={styles.coordinatesLabel}>
            GPS Coordinates (Auto-filled from map selection)
          </Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, isDarkMode ? styles.darkLabel : styles.lightLabel]}>Latitude *</Text>
              <TextInput
                style={[styles.input, styles.readOnly, isDarkMode ? styles.darkReadOnly : styles.lightReadOnly]}
                value={formData.latitude}
                editable={false}
                placeholder="-90 to 90"
                placeholderTextColor={isDarkMode ? "#94a3b8" : "#999999"}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, isDarkMode ? styles.darkLabel : styles.lightLabel]}>Longitude *</Text>
              <TextInput
                style={[styles.input, styles.readOnly, isDarkMode ? styles.darkReadOnly : styles.lightReadOnly]}
                value={formData.longitude}
                editable={false}
                placeholder="-180 to 180"
                placeholderTextColor={isDarkMode ? "#94a3b8" : "#999999"}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Location'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71',
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA',
  },
  header: {
    backgroundColor: '#1A1F71',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightHeader: {
    backgroundColor: '#E0F7FA',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'System',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  darkSubtitle: {
    color: '#A0C4E4',
  },
  lightSubtitle: {
    color: '#666666',
  },
  backToMapButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backToMapText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  form: {
    padding: 20,
  },
  lightForm: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: 'System',
  },
  darkLabel: {
    color: '#FFFFFF',
  },
  lightLabel: {
    color: '#1A1F71',
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
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  submitButton: {
    backgroundColor: '#5D3FD3',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#64748b',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  coordinatesDisplay: {
    backgroundColor: 'rgba(93, 63, 211, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#5D3FD3',
  },
  lightCoordinatesDisplay: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(0,0,0,0.2)',
  },
  coordinatesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5D3FD3',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'System',
  },
  readOnly: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#A0C4E4',
  },
  lightReadOnly: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    color: '#666666',
  },
  darkReadOnly: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#A0C4E4',
  },
});

export default AddEditLocationScreen;
