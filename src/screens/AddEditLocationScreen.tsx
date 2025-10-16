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
    setShowMapPicker(false); // Switch to form view after selection
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.address || !formData.city || !formData.state || !formData.country) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      Alert.alert('Error', 'Please select a location on the map to get coordinates');
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
        { text: 'OK', onPress: () => navigation.goBack() }
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
        initialLocation={formData.latitude && formData.longitude ? {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        } : undefined}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Refine Location Details</Text>
        <Text style={styles.headerSubtitle}>Review and adjust the selected location</Text>
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
            onChangeText={(value) => handleInputChange('address', value)}
            placeholder="Full street address..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              placeholder="City name"
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>State *</Text>
            <TextInput
              style={styles.input}
              value={formData.state}
              onChangeText={(value) => handleInputChange('state', value)}
              placeholder="State/Province"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Country *</Text>
            <TextInput
              style={styles.input}
              value={formData.country}
              onChangeText={(value) => handleInputChange('country', value)}
              placeholder="Country name"
            />
          </View>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Postal Code</Text>
            <TextInput
              style={styles.input}
              value={formData.postalCode}
              onChangeText={(value) => handleInputChange('postalCode', value)}
              placeholder="ZIP/Postal code"
            />
          </View>
        </View>

        <View style={styles.coordinatesDisplay}>
          <Text style={styles.coordinatesLabel}>GPS Coordinates (Auto-filled from map selection)</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Latitude *</Text>
              <TextInput
                style={[styles.input, styles.readOnly]}
                value={formData.latitude}
                editable={false}
                placeholder="-90 to 90"
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Longitude *</Text>
              <TextInput
                style={[styles.input, styles.readOnly]}
                value={formData.longitude}
                editable={false}
                placeholder="-180 to 180"
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a0033',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
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
    backgroundColor: '#6a0dad',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backToMapButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  backToMapText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  coordinatesDisplay: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#6a0dad',
  },
  coordinatesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6a0dad',
    marginBottom: 10,
    textAlign: 'center',
  },
  readOnly: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
});

export default AddEditLocationScreen;
