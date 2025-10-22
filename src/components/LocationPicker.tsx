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
import { useTheme } from '../context/ThemeContext';
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
  address?: string;
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
  const { isDarkMode } = useTheme();


  const getStyles = (isDark: boolean) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1A1F71',
    },
    lightBackground: {
      backgroundColor: '#E0F7FA',
    },
    darkBackground: {
      backgroundColor: '#1A1F71',
    },
    lightStepIndicator: {
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    lightStepContainer: {
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    lightAreaDetails: {
      backgroundColor: '#FFFFFF',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      borderColor: 'rgba(0,0,0,0.1)',
    },
    lightLocationSummary: {
      backgroundColor: '#FFFFFF',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      borderColor: 'rgba(0,0,0,0.1)',
    },
    lightAreaOption: {
      backgroundColor: '#FFFFFF',
      shadowColor: 'rgba(0, 0, 0, 0.1)',
      borderColor: 'rgba(0,0,0,0.1)',
    },
    lightMapContainer: {
      shadowColor: 'rgba(0, 0, 0, 0.1)',
    },
    lightStepActions: {
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderTopColor: 'rgba(0,0,0,0.1)',
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: 'rgba(0,0,0,0.2)',
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    stepText: {
      fontSize: 14,
      color: isDark ? '#A0C4E4' : '#666666',
      fontWeight: '600',
      fontFamily: 'System',
    },
    activeStep: {
      color: '#5D3FD3',
      fontWeight: '700',
    },
    stepArrow: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.4)',
      marginHorizontal: 8,
    },
    stepContainer: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
    stepTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: isDark ? '#FFFFFF' : '#1A1F71',
      textAlign: 'center',
      marginBottom: 12,
      fontFamily: 'System',
    },
    stepDescription: {
      fontSize: 18,
      color: isDark ? '#A0C4E4' : '#666666',
      textAlign: 'center',
      marginBottom: 32,
      fontFamily: 'System',
    },
    pincodeInput: {
      borderWidth: 2,
      borderColor: '#5D3FD3',
      borderRadius: 12,
      padding: 16,
      fontSize: 18,
      textAlign: 'center',
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginBottom: 30,
      marginHorizontal: 20,
      color: isDark ? '#FFFFFF' : '#000000',
      fontFamily: 'System',
    },
    areaDetails: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 16,
      padding: 24,
      marginBottom: 30,
      marginHorizontal: 20,
      shadowColor: 'rgba(255,255,255,0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    areaText: {
      fontSize: 18,
      color: isDark ? '#FFFFFF' : '#1A1F71',
      marginBottom: 12,
      fontWeight: '500',
      fontFamily: 'System',
    },
    stepActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    stepButton: {
      backgroundColor: '#5D3FD3',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      flex: 1,
      marginHorizontal: 8,
      alignItems: 'center',
      shadowColor: 'rgba(255,255,255,0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    stepButtonDisabled: {
      backgroundColor: '#64748b',
    },
    stepButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
      fontFamily: 'System',
    },
    backButton: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 24,
      paddingVertical: 16,
      borderRadius: 12,
      flex: 1,
      marginHorizontal: 8,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    backButtonText: {
      color: '#A0C4E4',
      fontSize: 16,
      fontWeight: '600',
      fontFamily: 'System',
    },
    mapStepContainer: {
      flex: 1,
    },
    locationSummary: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      marginHorizontal: 20,
      shadowColor: 'rgba(255,255,255,0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    summaryText: {
      fontSize: 16,
      color: isDark ? '#A0C4E4' : '#666666',
      marginBottom: 8,
      fontWeight: '500',
      fontFamily: 'System',
    },
    streetInput: {
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      backgroundColor: 'rgba(255,255,255,0.1)',
      marginBottom: 30,
      marginHorizontal: 20,
      color: isDark ? '#FFFFFF' : '#000000',
      fontFamily: 'System',
    },
    mapContainer: {
      flex: 1,
      position: 'relative',
      height: 700,
      marginHorizontal: 10,
      marginVertical: 15,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: 'rgba(255,255,255,0.3)',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    map: {
      flex: 1,
      height: 700,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: '#FFFFFF',
      marginTop: 10,
      fontSize: 16,
      fontFamily: 'System',
    },
    areaList: {
      flex: 1,
      marginTop: 20,
    },
    areaOption: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      marginHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: 'rgba(255,255,255,0.3)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    areaOptionContent: {
      flex: 1,
    },
    areaOptionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#1A1F71',
      marginBottom: 6,
      fontFamily: 'System',
    },
    areaOptionSubtitle: {
      fontSize: 16,
      color: isDark ? '#A0C4E4' : '#666666',
      marginBottom: 4,
      fontFamily: 'System',
    },
    areaOptionDetails: {
      fontSize: 14,
      color: isDark ? '#94a3b8' : '#888888',
      fontFamily: 'System',
    },
    selectArrow: {
      fontSize: 24,
      color: '#5D3FD3',
      fontWeight: '700',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
    },
    mapPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    mapPlaceholderText: {
      fontSize: 16,
      color: '#A0C4E4',
      marginBottom: 20,
      fontFamily: 'System',
    },
  });

  const styles = getStyles(isDarkMode);
  const [currentStep, setCurrentStep] = useState<
    'pincode' | 'select_area' | 'confirm_area' | 'mark_location' | 'street_name'
  >('pincode');
  const [pincode, setPincode] = useState('');
  const [pincodeData, setPincodeData] = useState<PincodeResponse['data'][0] | null>(null);
  const [pincodeOptions, setPincodeOptions] = useState<PincodeResponse['data']>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [streetName, setStreetName] = useState('');

  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>({ latitude: 28.6139, longitude: 77.209 });

  const [loading, setLoading] = useState(false);
  const [tempMarkerPosition, setTempMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const mapRef = useRef<MapView>(null);

  const GOOGLE_MAPS_API_KEY = 'AIzaSyC5lPB8YYytrDqkUbux__gKKaXtZIK6KKM';

  const fetchPincodeDetails = async (pincodeParam: string): Promise<PincodeResponse | null> => {
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
            message: 'This app needs access to your location to show your current position on the map.',
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

  useEffect(() => {
    if (currentStep === 'mark_location') {
      requestLocationPermission();
    }
  }, [currentStep, requestLocationPermission]);

  useEffect(() => {
    if (currentLocation && currentStep === 'mark_location' && mapRef.current) {
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

  const renderMap = () => {
    if (!currentLocation) {
      return (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          <ActivityIndicator size="large" color="#5D3FD3" />
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
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      _position => {
        console.log('GPS permission granted');
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
        const selectedArea = data.data[0];
        setPincodeData(selectedArea);

        if (selectedArea.latitude && selectedArea.longitude) {
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
            const searchQuery = `${selectedArea.area}, ${selectedArea.city}, ${selectedArea.state} ${pincode}, India`;
            const geocodeResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`,
            );

            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json();
              if (geocodeData.results && geocodeData.results.length > 0) {
                const location = geocodeData.results[0].geometry.location;
                setCurrentLocation({ latitude: location.lat, longitude: location.lng });
                setTempMarkerPosition({ latitude: location.lat, longitude: location.lng });
              } else {
                setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
              }
            } else {
              setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
          }
        }
        setCurrentStep('confirm_area');
      } else {
        setCurrentStep('select_area');
      }
    } else {
      Alert.alert('Error', 'Invalid pincode or no data found');
      setPincode('');
    }
  }, [pincode]);

  const handleAreaSelect = async (selectedArea: PincodeResponse['data'][0]) => {
    setPincodeData(selectedArea);
    setLoading(true);

    if (selectedArea.latitude && selectedArea.longitude) {
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
        const searchQuery = `${selectedArea.area}, ${selectedArea.city}, ${selectedArea.state} ${pincode}, India`;
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`,
        );

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.results && geocodeData.results.length > 0) {
            const location = geocodeData.results[0].geometry.location;
            setCurrentLocation({ latitude: location.lat, longitude: location.lng });
            setTempMarkerPosition({ latitude: location.lat, longitude: location.lng });
          } else {
            setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
          }
        } else {
          setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
      }
    }
    setLoading(false);
    setCurrentStep('confirm_area');
  };

  useEffect(() => {
    if (pincode.length === 6 && currentStep === 'pincode' && !loading) {
      const timer = setTimeout(() => {
        handlePincodeSubmit();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pincode, currentStep, loading, handlePincodeSubmit]);

  const handleConfirmArea = async () => {
    if (pincodeData) {
      setLoading(true);
      if (pincodeData.latitude && pincodeData.longitude) {
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
          const searchQuery = `${pincodeData.area}, ${pincodeData.city}, ${pincodeData.state} ${pincode}, India`;
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`,
          );

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.results && geocodeData.results.length > 0) {
              const location = geocodeData.results[0].geometry.location;
              setCurrentLocation({ latitude: location.lat, longitude: location.lng });
              setTempMarkerPosition({ latitude: location.lat, longitude: location.lng });
            } else {
              setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
            }
          } else {
            setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          setTempMarkerPosition({ latitude: 28.6139, longitude: 77.209 });
        }
      }
      setLoading(false);
    }
    setCurrentStep('mark_location');
  };

  const handleLocationMarked = () => {
    if (tempMarkerPosition) {
      const formattedAddress = `${pincodeData?.area || ''}, ${pincodeData?.city || ''}, ${pincodeData?.state || ''} ${pincode}, ${pincodeData?.country || 'India'}`;
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
        address: formattedAddress,
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
    setTempMarkerPosition({ latitude, longitude });
  };

  const handleMarkerDrag = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setTempMarkerPosition(coordinate);
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
      {/* Step Indicator */}
      <View style={[styles.stepIndicator, isDarkMode ? null : styles.lightStepIndicator]}>
        <Text style={[styles.stepText, currentStep === 'pincode' && styles.activeStep]}>PINCode</Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text
          style={[
            styles.stepText,
            (currentStep === 'select_area' || currentStep === 'confirm_area') && styles.activeStep,
          ]}
        >
          Select Area
        </Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text style={[styles.stepText, currentStep === 'mark_location' && styles.activeStep]}>Mark Location</Text>
        <Text style={styles.stepArrow}>→</Text>
        <Text style={[styles.stepText, currentStep === 'street_name' && styles.activeStep]}>Street Name</Text>
      </View>

      {/* Step Content */}
      {currentStep === 'pincode' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Enter PIN Code</Text>
          <Text style={styles.stepDescription}>Enter the 6-digit PIN code to find your area details</Text>
          <TextInput
            style={styles.pincodeInput}
            value={pincode}
            onChangeText={setPincode}
            placeholder="Enter PIN code (e.g., 400001)"
            placeholderTextColor="#A0C4E4"
            keyboardType="numeric"
            maxLength={6}
            selectionColor="#FFFFFF"
          />
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#5D3FD3" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}
        </View>
      )}

      {currentStep === 'select_area' && pincodeOptions.length > 0 && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Select Your Area</Text>
          <Text style={styles.stepDescription}>
            Multiple areas found for PIN code {pincode}. Please select your specific area:
          </Text>

          <FlatList
            data={pincodeOptions}
            keyExtractor={(item, index) => `${item.area}-${index}`}
            style={styles.areaList}
            showsVerticalScrollIndicator={true}
            initialNumToRender={2}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.areaOption, isDarkMode ? null : styles.lightAreaOption]} onPress={() => handleAreaSelect(item)}>
                <View style={styles.areaOptionContent}>
                  <Text style={styles.areaOptionTitle}>{item.area}</Text>
                  <Text style={styles.areaOptionSubtitle}>{item.city}, {item.state}</Text>
                  <Text style={styles.areaOptionDetails}>📮 {item.pincode} • {item.country}</Text>
                </View>
                <Text style={styles.selectArrow}>›</Text>
              </TouchableOpacity>
            )}
          />

          <View style={[styles.stepActions, isDarkMode ? null : styles.lightStepActions]}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentStep === 'confirm_area' && pincodeData && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Confirm Area Details</Text>
          <View style={[styles.areaDetails, isDarkMode ? null : styles.lightAreaDetails]}>
            <Text style={styles.areaText}>📍 Area: {pincodeData.area}</Text>
            <Text style={styles.areaText}>🏙️ City: {pincodeData.city}</Text>
            <Text style={styles.areaText}>🏛️ State: {pincodeData.state}</Text>
            <Text style={styles.areaText}>🇮🇳 Country: {pincodeData.country}</Text>
            <Text style={styles.areaText}>📮 PIN: {pincode}</Text>
          </View>
          <View style={[styles.stepActions, isDarkMode ? null : styles.lightStepActions]}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepButton} onPress={handleConfirmArea}>
              <Text style={styles.stepButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {currentStep === 'mark_location' && (
        <View style={styles.mapStepContainer}>
          <Text style={styles.stepDescription}>Tap on the map to mark your exact location</Text>

          <View style={[styles.mapContainer, isDarkMode ? null : styles.lightMapContainer]}>
            {renderMap()}
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#5D3FD3" />
                <Text style={styles.loadingText}>Loading map...</Text>
              </View>
            )}
          </View>

          <View style={[styles.stepActions, isDarkMode ? null : styles.lightStepActions]}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepButton, !tempMarkerPosition && styles.stepButtonDisabled]}
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
          <Text style={styles.stepDescription}>Enter the exact street name or address for precise location</Text>

          <View style={[styles.locationSummary, isDarkMode ? null : styles.lightLocationSummary]}>
            <Text style={styles.summaryText}>📍 Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</Text>
            <Text style={styles.summaryText}>🏙️ Area: {selectedLocation.area}, {selectedLocation.city}</Text>
            <Text style={styles.summaryText}>📮 PIN: {pincode}</Text>
          </View>

          <TextInput
            style={styles.streetInput}
            value={streetName}
            onChangeText={setStreetName}
            placeholder="Enter street name and number"
            placeholderTextColor="#A0C4E4"
            selectionColor="#FFFFFF"
          />

          <View style={[styles.stepActions, isDarkMode ? null : styles.lightStepActions]}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepButton, !streetName.trim() && styles.stepButtonDisabled]}
              onPress={handleStreetSubmit}
              disabled={!streetName.trim()}
            >
              <Text style={styles.stepButtonText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#5D3FD3" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}
    </View>
  );
};


export default LocationPicker;