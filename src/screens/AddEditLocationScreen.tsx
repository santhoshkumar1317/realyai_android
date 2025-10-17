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
import { apiService } from '../utils/api';
import LocationPicker from '../components/LocationPicker';

const AddEditLocationScreen = () => {
  const navigation = useNavigation();
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refine Location Details</Text>
        <Text style={styles.headerSubtitle}>
          Review and adjust the selected location
        </Text>
        <TouchableOpacity
          style={styles.backToMapButton}
          onPress={() => setShowMapPicker(true)}
        >
          <Text style={styles.backToMapText}>← Back to Map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.address}
            onChangeText={value => handleInputChange('address', value)}
            placeholder="Full street address..."
            placeholderTextColor="#A0C4E4"
            multiline
            numberOfLines={3}
            selectionColor="#FFFFFF"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={value => handleInputChange('city', value)}
              placeholder="City name"
              placeholderTextColor="#A0C4E4"
              selectionColor="#FFFFFF"
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={value => handleInputChange('state', value)}
              placeholder="State/Province"
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
              value={formData.country}
              onChangeText={value => handleInputChange('country', value)}
              placeholder="Country name"
              placeholderTextColor="#A0C4E4"
              selectionColor="#FFFFFF"
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={formData.postalCode}
              onChangeText={value => handleInputChange('postalCode', value)}
              placeholder="ZIP/Postal code"
              placeholderTextColor="#A0C4E4"
              selectionColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.coordinatesDisplay}>
          <Text style={styles.coordinatesLabel}>
            GPS Coordinates (Auto-filled from map selection)
          </Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Latitude *</Text>
              <TextInput
                style={[styles.input, styles.readOnly]}
                value={formData.latitude}
                editable={false}
                placeholder="-90 to 90"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Longitude *</Text>
              <TextInput
                style={[styles.input, styles.readOnly]}
                value={formData.longitude}
                editable={false}
                placeholder="-180 to 180"
                placeholderTextColor="#94a3b8"
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
});

export default AddEditLocationScreen;
