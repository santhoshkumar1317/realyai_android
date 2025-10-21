import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { apiService, Property } from '../utils/api';

type RouteParams = {
  PropertyDetails: {
    propertyId: string;
  };
};

const PropertyDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'PropertyDetails'>>();
  const { propertyId } = route.params;
  const { isDarkMode } = useTheme();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const loadProperty = useCallback(async () => {
    try {
      const response = await apiService.getPropertyById(propertyId);
      setProperty(response.property);
    } catch (error) {
      console.error('Error loading property:', error);
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadProperty();
  }, [loadProperty]);

  useEffect(() => {
    if (property?.images && property.images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % property.images.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [property?.images]);

  const handleShare = async () => {
    if (!property) return;

    try {
      const location = property.location
        ? `${property.location.city}, ${property.location.state}`
        : 'Unknown Location';
      const message = `Check out this property: ${
        property.propertyType || 'Property'
      } in ${location}\nPrice: ₹${property.pricePerSqft}/sqft\n${
        property.description
      }`;
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing property:', error);
    }
  };

  const handleDirections = () => {
    if (!property?.location?.latitude || !property?.location?.longitude) return;

    const { latitude, longitude } = property.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open maps'),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '#10b981'; // Emerald
      case 'RESERVED':
        return '#f59e0b'; // Amber
      case 'SOLD':
        return '#ef4444'; // Red
      case 'UNDER_MAINTENANCE':
        return '#94a3b8'; // Slate
      default:
        return '#64748b';
    }
  };

  const renderImageItem = ({ item }: { item: string }) =>
    item ? (
      <Image
        key={item}
        source={{ uri: item }}
        style={styles.carouselImage}
        resizeMode="cover"
      />
    ) : (
      <View style={styles.carouselImage}>
        <Text style={styles.imagePlaceholder}>🏠</Text>
      </View>
    );

  const onScrollEnd = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setCurrentImageIndex(roundIndex);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          isDarkMode ? styles.darkBackground : styles.lightBackground,
        ]}
      >
        <Text
          style={[
            styles.loadingText,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          Loading property details...
        </Text>
      </View>
    );
  }

  if (!property) {
    return (
      <View
        style={[
          styles.errorContainer,
          isDarkMode ? styles.darkBackground : styles.lightBackground,
        ]}
      >
        <Text
          style={[
            styles.errorText,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          Property not found
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
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
      {/* Property Images */}
      <View style={styles.imageContainer}>
        {property.images && property.images.length > 0 ? (
          <>
            <FlatList
              ref={flatListRef}
              data={property.images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onScrollEnd}
              style={styles.carousel}
            />
            {property.images.length > 1 && (
              <View style={styles.indicatorContainer}>
                {property.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.mainImage}>
            <Text style={styles.imagePlaceholder}>📷</Text>
          </View>
        )}
        <View style={styles.statusBadge}>
          <Text
            style={[
              styles.statusText,
              { backgroundColor: getStatusColor(property.status) },
            ]}
          >
            {property.status.toLowerCase().replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Property Info */}
      <View
        style={[
          styles.infoContainer,
          isDarkMode ? styles.darkSection : styles.lightSection,
        ]}
      >
        <Text
          style={[
            styles.title,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          {property.propertyType || 'Property'} in{' '}
          {property.location
            ? `${property.location.city}, ${property.location.state}`
            : 'Unknown Location'}
        </Text>

        {property.location?.address && (
          <Text
            style={[
              styles.address,
              isDarkMode ? styles.darkTextSecondary : styles.lightTextSecondary,
            ]}
          >
            📍 {property.location.address}
          </Text>
        )}

        <View style={styles.priceContainer}>
          <Text
            style={[
              styles.price,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            ₹{property.pricePerSqft?.toLocaleString()}/sqft
          </Text>
          {property.totalPrice && (
            <Text
              style={[
                styles.totalPrice,
                isDarkMode
                  ? styles.darkTextSecondary
                  : styles.lightTextSecondary,
              ]}
            >
              Total: ₹{property.totalPrice.toLocaleString()}
            </Text>
          )}
        </View>

        {/* Key Details */}
        <View style={styles.detailsGrid}>
          {property.area && (
            <View style={styles.detailItem}>
              <Text
                style={[
                  styles.detailIcon,
                  isDarkMode
                    ? styles.lightTextSecondary
                    : styles.darkTextSecondary,
                ]}
              >
                📐
              </Text>
              <Text
                style={[
                  styles.detailText,
                  isDarkMode
                    ? styles.darkTextSecondary
                    : styles.lightTextSecondary,
                ]}
              >
                {property.area} sqft
              </Text>
            </View>
          )}
          {property.bedrooms && (
            <View style={styles.detailItem}>
              <Text
                style={[
                  styles.detailIcon,
                  isDarkMode
                    ? styles.lightTextSecondary
                    : styles.darkTextSecondary,
                ]}
              >
                🛏️
              </Text>
              <Text
                style={[
                  styles.detailText,
                  isDarkMode
                    ? styles.darkTextSecondary
                    : styles.lightTextSecondary,
                ]}
              >
                {property.bedrooms} bed
              </Text>
            </View>
          )}
          {property.bathrooms && (
            <View style={styles.detailItem}>
              <Text
                style={[
                  styles.detailIcon,
                  isDarkMode
                    ? styles.lightTextSecondary
                    : styles.darkTextSecondary,
                ]}
              >
                🚿
              </Text>
              <Text
                style={[
                  styles.detailText,
                  isDarkMode
                    ? styles.darkTextSecondary
                    : styles.lightTextSecondary,
                ]}
              >
                {property.bathrooms} bath
              </Text>
            </View>
          )}
          <View style={styles.detailItem}>
            <Text
              style={[
                styles.detailIcon,
                isDarkMode
                  ? styles.lightTextSecondary
                  : styles.darkTextSecondary,
              ]}
            >
              👁️
            </Text>
            <Text
              style={[
                styles.detailText,
                isDarkMode
                  ? styles.darkTextSecondary
                  : styles.lightTextSecondary,
              ]}
            >
              {property.viewCount || 0} views
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            Description
          </Text>
          <Text
            style={[
              styles.description,
              isDarkMode ? styles.darkTextSecondary : styles.lightTextSecondary,
            ]}
          >
            {property.description}
          </Text>
        </View>

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode ? styles.darkText : styles.lightText,
              ]}
            >
              Features
            </Text>
            <View style={styles.featuresGrid}>
              {property.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Text
                    style={[
                      styles.featureText,
                      isDarkMode
                        ? styles.darkTextSecondary
                        : styles.lightTextSecondary,
                    ]}
                  >
                    ✓ {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode ? styles.darkText : styles.lightText,
              ]}
            >
              Amenities
            </Text>
            <View style={styles.amenitiesGrid}>
              {property.amenities.map((amenity, index) => (
                <View key={index} style={styles.amenityItem}>
                  <Text
                    style={[
                      styles.amenityText,
                      isDarkMode
                        ? styles.lightTextSecondary
                        : styles.darkTextSecondary,
                    ]}
                  >
                    🏢 {amenity}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Info */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            Contact Information
          </Text>
          <Text
            style={[
              styles.contactInfo,
              isDarkMode ? styles.darkText : styles.lightText,
            ]}
          >
            {property.contactInfo}
          </Text>
        </View>

        {/* Agent Info */}
        {property.user && (
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode ? styles.darkText : styles.lightText,
              ]}
            >
              Listed by
            </Text>
            <Text
              style={[
                styles.agentName,
                isDarkMode ? styles.darkText : styles.lightText,
              ]}
            >
              {property.user.companyName}
            </Text>
            <Text
              style={[
                styles.agentUsername,
                isDarkMode
                  ? styles.darkTextSecondary
                  : styles.lightTextSecondary,
              ]}
            >
              @{property.user.username}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDirections}
          >
            <Text style={styles.actionButtonText}>🗺️ Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
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
  lightText: {
    color: '#1A1F71',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightTextSecondary: {
    color: '#666666',
  },
  darkTextSecondary: {
    color: '#A0C4E4',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1F71',
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    fontFamily: 'System',
  },
  backButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#000',
  },
  mainImage: {
    height: 250,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 60,
    color: '#A0C4E4',
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
  },
  statusText: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    fontFamily: 'System',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    margin: 16,
    marginTop: -5,
    borderRadius: 16,
    padding: 30,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  lightSection: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  darkSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'System',
  },
  address: {
    fontSize: 16,
    color: '#A0C4E4',
    marginBottom: 15,
    fontFamily: 'System',
  },
  priceContainer: {
    marginBottom: 18,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF69B4', // Accent pink
    fontFamily: 'System',
  },
  totalPrice: {
    fontSize: 16,
    color: '#A0C4E4',
    marginTop: 6,
    fontFamily: 'System',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#A0C4E4',
  },
  detailText: {
    fontSize: 14,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffffff',
    marginBottom: 10,
    fontFamily: 'System',
  },
  description: {
    fontSize: 16,
    color: '#A0C4E4',
    lineHeight: 24,
    fontFamily: 'System',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    width: '50%',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    width: '50%',
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  contactInfo: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  agentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  agentUsername: {
    fontSize: 14,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionButton: {
    backgroundColor: '#5D3FD3', // Deep purple
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  carousel: {
    height: 250,
  },
  carouselImage: {
    width: width,
    height: 250,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
  },
});

export default PropertyDetailsScreen;
