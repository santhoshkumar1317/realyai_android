import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { apiService } from '../utils/api';

interface LocationData {
  street?: string;
  area?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  address?: string; // Keep for backward compatibility
}

interface PincodeResponse {
  status: string;
  data: Array<{
    pincode: string;
    area: string;
    city: string;
    state: string;
    country: string;
    latitude?: number;
    longitude?: number;
  }>;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation: _initialLocation,
}) => {
  const [currentStep, setCurrentStep] = useState<
    'pincode' | 'select_area' | 'confirm_area' | 'mark_location' | 'street_name'
  >('pincode');
  const [pincode, setPincode] = useState('');
  const [pincodeData, setPincodeData] = useState<
    PincodeResponse['data'][0] | null
  >(null);
  const [pincodeOptions, setPincodeOptions] = useState<PincodeResponse['data']>(
    [],
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null,
  );
  const [streetName, setStreetName] = useState('');

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>({ latitude: 28.6139, longitude: 77.209 }); // Default to Delhi coordinates

  const [loading, setLoading] = useState(false);
  const [tempMarkerPosition, setTempMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<MapView>(null);

  // Google Maps API key
  const GOOGLE_MAPS_API_KEY = 'AIzaSyC5lPB8YYytrDqkUbux__gKKaXtZIK6KKM';

  // Pincode API call
  const fetchPincodeDetails = async (
    pincodeParam: string,
  ): Promise<PincodeResponse | null> => {
    try {
      const data = await apiService.getPincodeDetails(pincodeParam);
      return data as PincodeResponse;
    } catch (error) {
      console.error('Pincode API error:', error);
      return null;
    }
  };

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message:
              'This app needs access to your location to show your current position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  }, []);

  // Request GPS permission only when entering map step
  useEffect(() => {
    if (currentStep === 'mark_location') {
      requestLocationPermission();
    }
  }, [currentStep, requestLocationPermission]);

  // Animate map to geocoded location
  useEffect(() => {
    if (currentLocation && currentStep === 'mark_location' && mapRef.current) {
      console.log('Animating map to region:', {
        ...currentLocation,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        },
        1000,
      );
    }
  }, [currentLocation, currentStep]);

  // Safety check for map rendering
  const renderMap = () => {
    try {
      if (!currentLocation) {
        return (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
            <ActivityIndicator size="large" color="#6a0dad" />
          </View>
        );
      }

      return (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          mapType="standard"
        >
          {(tempMarkerPosition || selectedLocation) && (
            <Marker
              coordinate={
                tempMarkerPosition || {
                  latitude: selectedLocation!.latitude,
                  longitude: selectedLocation!.longitude,
                }
              }
              title="Selected Location"
              description={selectedLocation?.address || 'Location selected'}
              draggable={false}
              onDragEnd={handleMarkerDrag}
            />
          )}
        </MapView>
      );
    } catch (error) {
      console.error('Map rendering error:', error);
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Map unavailable</Text>
          <Text style={styles.mapPlaceholderText}>
            Please check your connection
          </Text>
        </View>
      );
    }
  };

  const getCurrentLocation = () => {
    // Just request GPS permission for showing user location on map
    // Don't override the geocoded area location
    Geolocation.getCurrentPosition(
      _position => {
        console.log(
          'GPS permission granted - user location will be shown on map',
        );
      },
      error => {
        console.log('GPS permission denied or error:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handlePincodeSubmit = useCallback(async () => {
    if (!pincode.trim() || pincode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit pincode');
      return;
    }

    setLoading(true);
    const data = await fetchPincodeDetails(pincode);
    setLoading(false);

    if (data && data.status === 'success' && data.data.length > 0) {
      setPincodeOptions(data.data);

      if (data.data.length === 1) {
        // Only one area, use coordinates if available, otherwise geocode
        const selectedArea = data.data[0];
        setPincodeData(selectedArea);

        // Check if pincode data has coordinates
        if (selectedArea.latitude && selectedArea.longitude) {
          console.log(
            'Using coordinates from pincode data:',
            selectedArea.latitude,
            selectedArea.longitude,
          );
          setCurrentLocation({
            latitude: selectedArea.latitude,
            longitude: selectedArea.longitude,
          });
          setTempMarkerPosition({
            latitude: selectedArea.latitude,
            longitude: selectedArea.longitude,
          });
        } else {
          // Geocode the area for map centering
          try {
            const searchQuery = `${selectedArea.area}, ${selectedArea.city}, ${selectedArea.state} ${pincode}, India`;
            console.log('Geocoding search query:', searchQuery);
            const geocodeResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
                searchQuery,
              )}&key=${GOOGLE_MAPS_API_KEY}`,
            );

            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json();
              console.log('Geocode response:', geocodeData);
              if (geocodeData.results && geocodeData.results.length > 0) {
                const location = geocodeData.results[0].geometry.location;
                console.log('Setting current location to:', location);
                setCurrentLocation({
                  latitude: location.lat,
                  longitude: location.lng,
                });
                setTempMarkerPosition({
                  latitude: location.lat,
                  longitude: location.lng,
                });
              } else {
                console.log('No geocode results, keeping default location');
                // Keep the default Delhi coordinates already set
                setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
              }
            } else {
              console.log('Geocode API error, keeping default location');
              // Keep the default Delhi coordinates already set
              setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            // Keep the default Delhi coordinates already set
            setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
          }
        }
        setCurrentStep('confirm_area');
      } else {
        // Multiple areas, let user choose
        setCurrentStep('select_area');
      }
    } else {
      Alert.alert('Error', 'Invalid pincode or no data found');
      // Clear pincode to allow user to re-enter
      setPincode('');
    }
  }, [pincode]);

  const handleAreaSelect = async (selectedArea: PincodeResponse['data'][0]) => {
    setPincodeData(selectedArea);
    setLoading(true);

    // Check if pincode data has coordinates
    if (selectedArea.latitude && selectedArea.longitude) {
      console.log(
        'Using coordinates from pincode data (area select):',
        selectedArea.latitude,
        selectedArea.longitude,
      );
      setCurrentLocation({
        latitude: selectedArea.latitude,
        longitude: selectedArea.longitude,
      });
      setTempMarkerPosition({
        latitude: selectedArea.latitude,
        longitude: selectedArea.longitude,
      });
    } else {
      try {
        // Geocode the selected area + city + pincode for map centering
        const searchQuery = `${selectedArea.area}, ${selectedArea.city}, ${selectedArea.state} ${pincode}, India`;
        console.log('Geocoding search query (area select):', searchQuery);
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            searchQuery,
          )}&key=${GOOGLE_MAPS_API_KEY}`,
        );

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          console.log('Geocode response (area select):', geocodeData);
          if (geocodeData.results && geocodeData.results.length > 0) {
            const location = geocodeData.results[0].geometry.location;
            console.log('Setting current location to (area select):', location);
            setCurrentLocation({
              latitude: location.lat,
              longitude: location.lng,
            });
            // Set initial marker position
            setTempMarkerPosition({
              latitude: location.lat,
              longitude: location.lng,
            });
          } else {
            // Fallback if no results
            console.log(
              'No geocode results (area select), keeping default location',
            );
            setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
          }
        } else {
          // Fallback if API error
          console.log(
            'Geocode API error (area select), keeping default location',
          );
          setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Keep default location
        setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
      }
    }
    setLoading(false);
    setCurrentStep('confirm_area');
  };

  // Auto-search when pincode reaches 6 digits
  useEffect(() => {
    if (pincode.length === 6 && currentStep === 'pincode' && !loading) {
      const timer = setTimeout(() => {
        handlePincodeSubmit();
      }, 500); // Small delay to prevent rapid requests

      return () => clearTimeout(timer);
    }
  }, [pincode, currentStep, loading, handlePincodeSubmit]);

  const handleConfirmArea = async () => {
    if (pincodeData) {
      setLoading(true);

      // Check if pincode data has coordinates
      if (pincodeData.latitude && pincodeData.longitude) {
        console.log(
          'Using coordinates from pincode data (confirm area):',
          pincodeData.latitude,
          pincodeData.longitude,
        );
        setCurrentLocation({
          latitude: pincodeData.latitude,
          longitude: pincodeData.longitude,
        });
        setTempMarkerPosition({
          latitude: pincodeData.latitude,
          longitude: pincodeData.longitude,
        });
      } else {
        try {
          // Geocode the area + city + pincode to get coordinates for map centering
          const searchQuery = `${pincodeData.area}, ${pincodeData.city}, ${pincodeData.state} ${pincode}, India`;
          console.log('Geocoding search query (confirm area):', searchQuery);
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              searchQuery,
            )}&key=${GOOGLE_MAPS_API_KEY}`,
          );

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            console.log('Geocode response (confirm area):', geocodeData);
            if (geocodeData.results && geocodeData.results.length > 0) {
              const location = geocodeData.results[0].geometry.location;
              console.log(
                'Setting current location to (confirm area):',
                location,
              );
              setCurrentLocation({
                latitude: location.lat,
                longitude: location.lng,
              });
              // Set initial marker position
              setTempMarkerPosition({
                latitude: location.lat,
                longitude: location.lng,
              });
            } else {
              // Fallback if no results
              console.log(
                'No geocode results (confirm area), keeping default location',
              );
              setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
            }
          } else {
            // Fallback if API error
            console.log(
              'Geocode API error (confirm area), keeping default location',
            );
            setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          // Keep default location
          setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
        }
      }
      setLoading(false);
    }
    setCurrentStep('mark_location');
  };

  const handleLocationMarked = () => {
    if (tempMarkerPosition) {
      const formattedAddress = `${pincodeData?.area || ''}, ${
        pincodeData?.city || ''
      }, ${pincodeData?.state || ''} ${pincode}, ${
        pincodeData?.country || 'India'
      }`;
      setSelectedLocation({
        street: '',
        area: pincodeData?.area || '',
        city: pincodeData?.city || '',
        state: pincodeData?.state || '',
        country: pincodeData?.country || 'India',
        postalCode: pincode,
        latitude: tempMarkerPosition.latitude,
        longitude: tempMarkerPosition.longitude,
        address: formattedAddress,
        formattedAddress,
      });
      setCurrentStep('street_name');
    }
  };

  const handleStreetSubmit = () => {
    if (!streetName.trim()) {
      Alert.alert('Error', 'Please enter street name');
      return;
    }

    if (selectedLocation) {
      const formattedAddress = `${streetName}, ${selectedLocation.area}, ${selectedLocation.city}, ${selectedLocation.state} ${pincode}, ${selectedLocation.country}`;
      const finalLocation: LocationData = {
        ...selectedLocation,
        street: streetName,
        address: formattedAddress, // Required by backend
        formattedAddress,
      };
      onLocationSelect(finalLocation);
    }
  };

  const handleBack = () => {
    if (currentStep === 'select_area') setCurrentStep('pincode');
    else if (currentStep === 'confirm_area') {
      if (pincodeOptions.length > 1) {
        setCurrentStep('select_area');
      } else {
        setCurrentStep('pincode');
      }
    } else if (currentStep === 'mark_location') setCurrentStep('confirm_area');
    else if (currentStep === 'street_name') setCurrentStep('mark_location');
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    if (!coordinate) return;

    const { latitude, longitude } = coordinate;
    console.log('Map pressed at:', latitude, longitude);

    // Set the temporary marker position
    setTempMarkerPosition({ latitude, longitude });
  };

  const handleMarkerDrag = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setTempMarkerPosition(coordinate);
  };

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <Text
          style={[
            styles.stepText,
            currentStep === 'pincode' && styles.activeStep,
          ]}
        >
          PINCode
        </Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text
          style={[
            styles.stepText,
            (currentStep === 'select_area' || currentStep === 'confirm_area') &&
              styles.activeStep,
          ]}
        >
          Select Area
        </Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text
          style={[
            styles.stepText,
            currentStep === 'mark_location' && styles.activeStep,
          ]}
        >
          Mark Location
        </Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text
          style={[
            styles.stepText,
            currentStep === 'street_name' && styles.activeStep,
          ]}
        >
          Street Name
        </Text>
      </View>

      {/* Step Content */}
      {currentStep === 'pincode' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Enter PIN Code</Text>
          <Text style={styles.stepDescription}>
            Enter the 6-digit PIN code to find your area details
          </Text>
          <TextInput
            style={styles.pincodeInput}
            value={pincode}
            onChangeText={setPincode}
            placeholder="Enter PIN code (e.g., 400001)"
            keyboardType="numeric"
            maxLength={6}
          />
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6a0dad" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}
        </View>
      )}

      {currentStep === 'select_area' && pincodeOptions.length > 0 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Select Your Area</Text>
          <Text style={styles.stepDescription}>
            Multiple areas found for PIN code {pincode}. Please select your
            specific area:
          </Text>

          <FlatList
            data={pincodeOptions}
            keyExtractor={(item, index) => `${item.area}-${index}`}
            style={styles.areaList}
            showsVerticalScrollIndicator={true}
            initialNumToRender={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.areaOption}
                onPress={() => handleAreaSelect(item)}
              >
                <View style={styles.areaOptionContent}>
                  <Text style={styles.areaOptionTitle}>{item.area}</Text>
                  <Text style={styles.areaOptionSubtitle}>
                    {item.city}, {item.state}
                  </Text>
                  <Text style={styles.areaOptionDetails}>
                    📮 {item.pincode} • {item.country}
                  </Text>
                </View>
                <Text style={styles.selectArrow}>›</Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentStep === 'confirm_area' && pincodeData && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Confirm Area Details</Text>
          <View style={styles.areaDetails}>
            <Text style={styles.areaText}>📍 Area: {pincodeData.area}</Text>
            <Text style={styles.areaText}>🏙️ City: {pincodeData.city}</Text>
            <Text style={styles.areaText}>🏛️ State: {pincodeData.state}</Text>
            <Text style={styles.areaText}>
              🇮🇳 Country: {pincodeData.country}
            </Text>
            <Text style={styles.areaText}>📮 PIN: {pincode}</Text>
          </View>
          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.stepButton}
              onPress={handleConfirmArea}
            >
              <Text style={styles.stepButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentStep === 'mark_location' && (
        <View style={styles.mapStepContainer}>
          <Text style={styles.stepDescription}>
            Tap on the map to mark your exact location
          </Text>

          <View style={styles.mapContainer}>
            {renderMap()}
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#6a0dad" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>

          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.stepButton,
                !tempMarkerPosition && styles.stepButtonDisabled,
              ]}
              onPress={handleLocationMarked}
              disabled={!tempMarkerPosition}
            >
              <Text style={styles.stepButtonText}>
                {tempMarkerPosition ? 'Confirm' : 'Tap on Map First'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentStep === 'street_name' && selectedLocation && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Enter Street Name</Text>
          <Text style={styles.stepDescription}>
            Enter the exact street name or address for precise location
          </Text>

          <View style={styles.locationSummary}>
            <Text style={styles.summaryText}>
              📍 Coordinates: {selectedLocation.latitude.toFixed(6)},{' '}
              {selectedLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.summaryText}>
              🏙️ Area: {selectedLocation.area}, {selectedLocation.city}
            </Text>
            <Text style={styles.summaryText}>📮 PIN: {pincode}</Text>
          </View>

          <TextInput
            style={styles.streetInput}
            value={streetName}
            onChangeText={setStreetName}
            placeholder="Enter street name and number"
          />

          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.stepButton,
                !streetName.trim() && styles.stepButtonDisabled,
              ]}
              onPress={handleStreetSubmit}
              disabled={!streetName.trim()}
            >
              <Text style={styles.stepButtonText}>Complete </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6a0dad" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stepText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  activeStep: {
    color: '#2563eb',
    fontWeight: '700',
  },
  stepArrow: {
    fontSize: 16,
    color: '#cbd5e1',
    marginHorizontal: 8,
  },
  stepContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  pincodeInput: {
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    marginBottom: 30,
    marginHorizontal: 20,
    color: '#111827',
  },
  areaDetails: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  areaText: {
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 12,
    fontWeight: '500',
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  stepButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  stepButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  mapStepContainer: {
    flex: 1,
  },
  locationSummary: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  summaryText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 8,
    fontWeight: '500',
  },
  streetInput: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    marginBottom: 30,
    marginHorizontal: 20,
    color: '#111827',
  },
  header: {
    backgroundColor: '#1a0033',
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    height: 700, // Increased height for larger map display
    marginHorizontal: 10,
    marginVertical: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  map: {
    flex: 1,
    height: 700, // Explicit height for better map rendering
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  controls: {
    padding: 15,
    backgroundColor: 'white',
  },
  currentLocationButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coordinatesDisplay: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  searchContainer: {
    padding: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  searchLoader: {
    position: 'absolute',
    right: 25,
    top: 27,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  resultsList: {
    flex: 1,
  },
  searchResult: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  resultAddress: {
    fontSize: 14,
    color: '#666',
  },
  coordinatesLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6a0dad',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  locationDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  searchButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  controlButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#4CAF50',
  },
  resetButton: {
    backgroundColor: '#f44336',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#6a0dad',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  manualForm: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  submitManualButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  submitManualButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  mapTabContainer: {
    flex: 1,
  },
  mapControls: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  mapControlButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  mapControlActive: {
    backgroundColor: '#2196F3',
  },
  mapActions: {
    padding: 20,
  },
  verificationContainer: {
    backgroundColor: '#f9f9f9',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  verificationDetails: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  detailItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  verificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmFinalButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmFinalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmFinalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  areaList: {
    flex: 1,
    marginTop: 20,
  },
  areaOption: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  areaOptionContent: {
    flex: 1,
  },
  areaOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 6,
  },
  areaOptionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  areaOptionDetails: {
    fontSize: 14,
    color: '#9ca3af',
  },
  selectArrow: {
    fontSize: 24,
    color: '#2563eb',
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});

export default LocationPicker;
