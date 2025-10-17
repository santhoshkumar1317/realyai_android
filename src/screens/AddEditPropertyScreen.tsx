import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../utils/api';
import LocationPicker from '../components/LocationPicker';
import { launchImageLibrary } from 'react-native-image-picker';

const AddEditPropertyScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [formData, setFormData] = useState({
    description: '',
    pricePerSqft: '',
    locationId: '',
    contactInfo: '',
    propertyType: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    features: '',
    amenities: '',
  });

  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [imageProcessing, setImageProcessing] = useState(false);

  const propertyTypes = [
    { label: 'Land/Plot', value: 'LAND' },
    { label: 'Apartment', value: 'APARTMENT' },
    { label: 'House', value: 'HOUSE' },
    { label: 'Commercial', value: 'COMMERCIAL' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalPrice = () => {
    const area = parseFloat(formData.area);
    const pricePerSqft = parseFloat(formData.pricePerSqft);
    if (!isNaN(area) && !isNaN(pricePerSqft)) {
      return (area * pricePerSqft).toString();
    }
    return '';
  };

  const handleImageSelect = () => {
    const minPhotos = formData.propertyType === 'LAND' ? 2 : 5;

    const options = {
      mediaType: 'photo' as const,
      includeBase64: true,
      maxHeight: 1200,
      maxWidth: 1600,
      selectionLimit: 20,
    };

    setImageProcessing(true);
    launchImageLibrary(options, response => {
      setImageProcessing(false);

      if (response.didCancel) {
        console.log('User cancelled image selection');
        return;
      }

      if (response.errorMessage) {
        console.error('Image picker error:', response.errorMessage);
        Alert.alert('Error', 'Failed to select images. Please try again.');
        return;
      }

      if (response.assets && response.assets.length > 0) {
        if (response.assets.length < minPhotos) {
          Alert.alert(
            'Insufficient Photos',
            `Please select at least ${minPhotos} photos for this property type.`,
          );
          return;
        }

        const validImages = response.assets.filter(
          asset => asset.base64 && asset.type && asset.uri,
        );

        if (validImages.length !== response.assets.length) {
          Alert.alert(
            'Warning',
            'Some images could not be processed. Only valid images will be used.',
          );
        }

        if (validImages.length < minPhotos) {
          Alert.alert(
            'Error',
            `At least ${minPhotos} valid photos are required.`,
          );
          return;
        }

        setSelectedImages(validImages);
      } else {
        Alert.alert('Error', 'No images were selected.');
      }
    });
  };

  const handleLocationSelect = async (locationData: any) => {
    try {
      const response = await apiService.createLocation(locationData);
      setFormData(prev => ({ ...prev, locationId: response.location.id }));
      setSelectedLocation(locationData);
    } catch (error) {
      console.error('Error creating location:', error);
      Alert.alert('Error', 'Failed to save location');
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.propertyType !== '';
      case 2:
        return selectedLocation !== null;
      case 3:
        return (
          formData.pricePerSqft !== '' &&
          formData.contactInfo !== '' &&
          formData.area !== ''
        );
      case 4:
        const minPhotos = formData.propertyType === 'LAND' ? 2 : 5;
        return selectedImages.length >= minPhotos;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.description ||
      !formData.pricePerSqft ||
      !formData.locationId ||
      !formData.contactInfo ||
      !formData.area
    ) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const propertyData = {
        ...formData,
        pricePerSqft: parseFloat(formData.pricePerSqft),
        totalPrice: calculateTotalPrice()
          ? parseFloat(calculateTotalPrice())
          : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        bedrooms: formData.bedrooms
          ? parseInt(formData.bedrooms, 10)
          : undefined,
        bathrooms: formData.bathrooms
          ? parseInt(formData.bathrooms, 10)
          : undefined,
        features: formData.features
          ? formData.features.split(',').map(f => f.trim())
          : undefined,
        amenities: formData.amenities
          ? formData.amenities.split(',').map(a => a.trim())
          : undefined,
        images: selectedImages
          .filter(img => img.base64 && img.type)
          .map(img => `data:${img.type};base64,${img.base64}`),
      };

      await apiService.createProperty(propertyData);
      Alert.alert('Success', 'Property created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating property:', error);
      Alert.alert('Error', 'Failed to create property');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map(step => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              currentStep >= step && styles.stepActive,
            ]}
          >
            <Text
              style={[
                styles.stepText,
                currentStep >= step && styles.stepTextActive,
              ]}
            >
              {step}
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              currentStep >= step && styles.stepLabelActive,
            ]}
          >
            {step === 1
              ? 'Type'
              : step === 2
              ? 'Location'
              : step === 3
              ? 'Details'
              : 'Photos'}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Property Type</Text>
            <Text style={styles.stepSubtitle}>
              Choose the type of property you want to list
            </Text>
            <View style={styles.propertyTypeGrid}>
              {propertyTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.propertyTypeCard,
                    formData.propertyType === type.value &&
                      styles.propertyTypeSelected,
                  ]}
                  onPress={() =>
                    setFormData(prev => ({ ...prev, propertyType: type.value }))
                  }
                >
                  <Text
                    style={[
                      styles.propertyTypeText,
                      formData.propertyType === type.value &&
                        styles.propertyTypeTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            {selectedLocation ? (
              <View style={styles.locationSummary}>
                <Text style={styles.locationTitle}>📍 Selected Location</Text>
                <Text style={styles.locationAddress}>
                  {selectedLocation.address}
                </Text>
                <Text style={styles.locationDetails}>
                  {selectedLocation.city}, {selectedLocation.state},{' '}
                  {selectedLocation.country}
                </Text>
                <Text style={styles.locationCoords}>
                  Lat: {selectedLocation.latitude?.toFixed(6)}, Lng:{' '}
                  {selectedLocation.longitude?.toFixed(6)}
                </Text>
                <TouchableOpacity
                  style={styles.changeLocationButton}
                  onPress={() => setSelectedLocation(null)}
                >
                  <Text style={styles.changeLocationText}>Change Location</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <LocationPicker onLocationSelect={handleLocationSelect} />
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Property Details</Text>
            <Text style={styles.stepSubtitle}>
              Enter pricing and property information
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Area (sqft) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.area}
                  onChangeText={value => handleInputChange('area', value)}
                  placeholder="Area in sqft"
                  placeholderTextColor="#A0C4E4"
                  keyboardType="numeric"
                  selectionColor="#FFFFFF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price per sqft *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pricePerSqft}
                  onChangeText={value =>
                    handleInputChange('pricePerSqft', value)
                  }
                  placeholder="₹"
                  placeholderTextColor="#A0C4E4"
                  keyboardType="numeric"
                  selectionColor="#FFFFFF"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Total Price</Text>
                <View style={[styles.input, styles.totalPriceDisplay]}>
                  <Text style={styles.totalPriceText}>
                    {calculateTotalPrice()
                      ? `₹${calculateTotalPrice()}`
                      : 'Enter area and price per sqft'}
                  </Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Info *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.contactInfo}
                  onChangeText={value =>
                    handleInputChange('contactInfo', value)
                  }
                  placeholder="Phone number"
                  placeholderTextColor="#A0C4E4"
                  keyboardType="phone-pad"
                  maxLength={10}
                  selectionColor="#FFFFFF"
                />
              </View>

              {(formData.propertyType === 'APARTMENT' ||
                formData.propertyType === 'HOUSE') && (
                <>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Bedrooms</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.bedrooms}
                        onChangeText={value =>
                          handleInputChange('bedrooms', value)
                        }
                        placeholder="No of bedrooms"
                        placeholderTextColor="#A0C4E4"
                        keyboardType="numeric"
                        selectionColor="#FFFFFF"
                      />
                    </View>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                      <Text style={styles.label}>Bathrooms</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.bathrooms}
                        onChangeText={value =>
                          handleInputChange('bathrooms', value)
                        }
                        placeholder="No of bathrooms"
                        placeholderTextColor="#A0C4E4"
                        keyboardType="numeric"
                        selectionColor="#FFFFFF"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Features (comma separated)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.features}
                      onChangeText={value =>
                        handleInputChange('features', value)
                      }
                      placeholder="Pool, Garden, Terrace, etc."
                      placeholderTextColor="#A0C4E4"
                      selectionColor="#FFFFFF"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                      Amenities (comma separated)
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={formData.amenities}
                      onChangeText={value =>
                        handleInputChange('amenities', value)
                      }
                      placeholder="Gym, Parking, Security, etc."
                      placeholderTextColor="#A0C4E4"
                      selectionColor="#FFFFFF"
                    />
                  </View>
                </>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={value =>
                    handleInputChange('description', value)
                  }
                  placeholder="Describe the property..."
                  placeholderTextColor="#A0C4E4"
                  multiline
                  numberOfLines={4}
                  selectionColor="#FFFFFF"
                />
              </View>
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Property Photos</Text>
            <Text style={styles.stepSubtitle}>
              Upload photos of your{' '}
              {formData.propertyType.toLowerCase().replace('_', ' ')}
            </Text>

            <View style={styles.photoUploadArea}>
              <Text style={styles.photoInstruction}>
                📸{' '}
                {formData.propertyType === 'LAND'
                  ? 'Upload land/plot photos'
                  : formData.propertyType === 'APARTMENT'
                  ? 'Upload apartment photos (exterior, interior, amenities)'
                  : formData.propertyType === 'HOUSE'
                  ? 'Upload house photos (exterior, interior, garden)'
                  : 'Upload commercial property photos'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  imageProcessing && styles.uploadButtonDisabled,
                ]}
                onPress={handleImageSelect}
                disabled={imageProcessing}
              >
                <Text style={styles.uploadButtonText}>
                  {imageProcessing ? 'Processing...' : 'Select Photos'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.photoNote}>
                Minimum: {formData.propertyType === 'LAND' ? '2' : '5'} photos
                required
              </Text>

              {selectedImages.length > 0 && (
                <View style={styles.selectedImagesContainer}>
                  <Text style={styles.selectedImagesTitle}>
                    Selected Photos ({selectedImages.length})
                  </Text>
                  <FlatList
                    data={selectedImages}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                      <View style={styles.imageContainer}>
                        {item.uri ? (
                          <Image
                            key={item.uri}
                            source={{ uri: item.uri }}
                            style={styles.selectedImage}
                          />
                        ) : (
                          <View style={styles.selectedImage}>
                            <Text style={styles.imagePlaceholder}>🏠</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => {
                            const newImages = [...selectedImages];
                            newImages.splice(index, 1);
                            setSelectedImages(newImages);
                          }}
                        >
                          <Text style={styles.removeImageText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderNavigation = () => (
    <View style={styles.navigation}>
      {currentStep > 1 && (
        <TouchableOpacity style={styles.navButton} onPress={prevStep}>
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
      )}

      <View style={styles.navSpacer} />

      {currentStep < 4 ? (
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            !validateStep(currentStep) && styles.navButtonDisabled,
          ]}
          onPress={nextStep}
          disabled={!validateStep(currentStep)}
        >
          <Text style={[styles.navButtonText, styles.nextButtonText]}>
            Next
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={[styles.navButtonText, styles.nextButtonText]}>
            {loading ? 'Creating...' : 'Create Property'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Property</Text>
        <Text style={styles.headerSubtitle}>Step {currentStep} of 4</Text>
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>{renderStepContent()}</View>

      {renderNavigation()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71',
  },
  header: {
    backgroundColor: '#1A1F71',
    padding: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  stepActive: {
    borderColor: '#5D3FD3',
    backgroundColor: 'rgba(93, 63, 211, 0.2)',
  },
  stepText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 14,
    color: '#A0C4E4',
    fontWeight: '600',
    fontFamily: 'System',
  },
  stepLabelActive: {
    color: '#5D3FD3',
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  stepContent: {
    flex: 1,
    padding: 24,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'System',
  },
  stepSubtitle: {
    fontSize: 18,
    color: '#A0C4E4',
    marginBottom: 32,
    fontFamily: 'System',
  },
  propertyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  propertyTypeCard: {
    width: '48%',
    padding: 24,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  propertyTypeSelected: {
    borderColor: '#5D3FD3',
    backgroundColor: 'rgba(93, 63, 211, 0.2)',
  },
  propertyTypeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  propertyTypeTextSelected: {
    color: '#FFFFFF',
  },
  locationSummary: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 35,
    borderRadius: 16,
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'System',
  },
  locationAddress: {
    fontSize: 18,
    color: '#A0C4E4',
    marginBottom: 8,
    fontFamily: 'System',
  },
  locationDetails: {
    fontSize: 16,
    color: '#A0C4E4',
    marginBottom: 8,
    fontFamily: 'System',
  },
  locationCoords: {
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  changeLocationButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  changeLocationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  photoUploadArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 32,
    marginVertical: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  photoInstruction: {
    fontSize: 18,
    color: '#A0C4E4',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
    fontFamily: 'System',
  },
  uploadButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginBottom: 16,
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadButtonDisabled: {
    backgroundColor: '#64748b',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  photoNote: {
    fontSize: 16,
    color: '#A0C4E4',
    textAlign: 'center',
    fontFamily: 'System',
  },
  navigation: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A0C4E4',
    textAlign: 'center',
    fontFamily: 'System',
  },
  nextButton: {
    backgroundColor: '#5D3FD3',
    borderColor: '#5D3FD3',
    shadowColor: 'rgba(255,255,255,0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: '#FFFFFF',
  },
  navSpacer: {
    width: 15,
  },
  selectedImagesContainer: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  selectedImagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'System',
  },
  imageContainer: {
    marginRight: 12,
    position: 'relative',
  },
  selectedImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 30,
    color: '#A0C4E4',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(239, 68, 68, 0.5)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: 'System',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  totalPriceDisplay: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  totalPriceText: {
    fontSize: 16,
    color: '#A0C4E4',
    fontWeight: '500',
    fontFamily: 'System',
  },
});

export default AddEditPropertyScreen;