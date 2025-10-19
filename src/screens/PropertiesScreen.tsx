import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import {
  useNavigation,
  useFocusEffect,
  NavigationProp,
} from '@react-navigation/native';
import { apiService, Property } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

// Status color mapping using your theme
const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return '#10b981'; // Emerald (positive)
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

const PropertyCard = ({
  property,
  navigation,
  isDarkMode,
}: {
  property: Property;
  navigation: any;
  isDarkMode?: boolean;
}) => (
  <TouchableOpacity
    style={[styles.propertyCard, isDarkMode ? styles.darkPropertyCard : styles.lightPropertyCard]}
    onPress={() =>
      navigation.navigate('PropertyDetails', { propertyId: property.id })
    }
  >
    <View style={styles.propertyImage}>
      {property.images && property.images.length > 0 && property.images[0] ? (
        <Image
          key={property.images[0]}
          source={{ uri: property.images[0] }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.cardImage}>
          <Text style={styles.imagePlaceholder}>🏠</Text>
        </View>
      )}
    </View>
    <View style={styles.propertyInfo}>
      <Text style={[styles.propertyTitle, isDarkMode ? styles.darkPropertyTitle : styles.lightPropertyTitle]} numberOfLines={2}>
        {property.propertyType || 'Property'} in{' '}
        {property.location
          ? `${property.location.city}, ${property.location.state}`
          : 'Unknown Location'}
      </Text>
      <Text style={styles.propertyPrice}>
        ₹{property.pricePerSqft?.toLocaleString()}/sqft
        {property.totalPrice &&
          ` (₹${property.totalPrice.toLocaleString()} total)`}
      </Text>
      <View style={styles.propertyDetails}>
        {property.area && (
          <Text style={[styles.detailText, isDarkMode ? styles.darkDetailText : styles.lightDetailText]}>📐 {property.area} sqft</Text>
        )}
        {property.bedrooms && (
          <Text style={[styles.detailText, isDarkMode ? styles.darkDetailText : styles.lightDetailText]}>🛏️ {property.bedrooms} bed</Text>
        )}
        {property.bathrooms && (
          <Text style={[styles.detailText, isDarkMode ? styles.darkDetailText : styles.lightDetailText]}>🚿 {property.bathrooms} bath</Text>
        )}
      </View>
      <Text style={[styles.propertyDescription, isDarkMode ? styles.darkPropertyDescription : styles.lightPropertyDescription]} numberOfLines={2}>
        {property.description}
      </Text>
      <View style={styles.propertyFooter}>
        <Text
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(property.status) },
          ]}
        >
          {property.status.toLowerCase().replace('_', ' ')}
        </Text>
        <Text style={[styles.viewCount, isDarkMode ? styles.darkViewCount : styles.lightViewCount]}>👁️ {property.viewCount || 0}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const FilterModal = ({
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  loadProperties,
  isDarkMode,
}: {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: any;
  setFilters: (filters: any) => void;
  loadProperties: (page: number, append: boolean) => void;
  isDarkMode?: boolean;
}) => {
  const clearFilters = () => {
    setFilters({
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      location: '',
    });
  };

  if (!showFilters) return null;

  return (
    <View style={[styles.filterContainer, isDarkMode ? null : styles.lightFilterContainer]}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>Filters</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowFilters(false)}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.filterInput, isDarkMode ? styles.darkFilterInput : styles.lightFilterInput]}
        placeholder="Property Type"
        placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
        value={filters.propertyType}
        onChangeText={text =>
          setFilters((prev: any) => ({ ...prev, propertyType: text }))
        }
        selectionColor={isDarkMode ? "#FFFFFF" : "#1A1F71"}
      />
      <TextInput
        style={[styles.filterInput, isDarkMode ? styles.darkFilterInput : styles.lightFilterInput]}
        placeholder="Min Price"
        placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
        value={filters.minPrice}
        onChangeText={text =>
          setFilters((prev: any) => ({ ...prev, minPrice: text }))
        }
        keyboardType="numeric"
        selectionColor={isDarkMode ? "#FFFFFF" : "#1A1F71"}
      />
      <TextInput
        style={[styles.filterInput, isDarkMode ? styles.darkFilterInput : styles.lightFilterInput]}
        placeholder="Max Price"
        placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
        value={filters.maxPrice}
        onChangeText={text =>
          setFilters((prev: any) => ({ ...prev, maxPrice: text }))
        }
        keyboardType="numeric"
        selectionColor={isDarkMode ? "#FFFFFF" : "#1A1F71"}
      />
      <TextInput
        style={[styles.filterInput, isDarkMode ? styles.darkFilterInput : styles.lightFilterInput]}
        placeholder="Location"
        placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
        value={filters.location}
        onChangeText={text =>
          setFilters((prev: any) => ({ ...prev, location: text }))
        }
        selectionColor={isDarkMode ? "#FFFFFF" : "#1A1F71"}
      />
      <View style={styles.filterButtons}>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => {
            loadProperties(1, false);
            setShowFilters(false);
          }}
        >
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

type RootStackParamList = {
  PropertyDetails: { propertyId: string };
  AddEditProperty: undefined;
};

type NavigationProps = NavigationProp<RootStackParamList>;

const PropertiesScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { isDarkMode } = useTheme();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    location: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadProperties = useCallback(
    async (page = 1, append = false) => {
      try {
        const params: any = {
          page,
          limit: pagination.limit,
          search: searchQuery || undefined,
          propertyType: filters.propertyType || undefined,
          minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          location: filters.location || undefined,
        };

        const response = await apiService.getProperties(params);

        if (append) {
          setProperties(prev => [...prev, ...response.properties]);
        } else {
          setProperties(response.properties);
        }

        setPagination(response.pagination);
      } catch (error) {
        console.error('Error loading properties:', error);
        Alert.alert('Error', 'Failed to load properties');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.limit, searchQuery, filters],
  );

  useFocusEffect(
    useCallback(() => {
      loadProperties(1, false);
    }, [loadProperties]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadProperties(1, false);
  };

  const loadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      loadProperties(pagination.page + 1, true);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      {/* Search and Filter Header */}
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <TextInput
          style={[styles.searchInput, isDarkMode ? styles.darkSearchInput : styles.lightSearchInput]}
          placeholder="Search properties..."
          placeholderTextColor={isDarkMode ? "#A0C4E4" : "#666666"}
          value={searchQuery}
          onChangeText={handleSearch}
          selectionColor={isDarkMode ? "#FFFFFF" : "#1A1F71"}
        />
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterButtonText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddEditProperty' as never)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <FilterModal
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        filters={filters}
        setFilters={setFilters}
        loadProperties={loadProperties}
        isDarkMode={isDarkMode}
      />

      {/* Properties List */}
      <FlatList
        data={properties}
        renderItem={({ item }) => (
          <PropertyCard property={item} navigation={navigation} isDarkMode={isDarkMode} />
        )}
        keyExtractor={item => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode ? styles.darkEmptyText : styles.lightEmptyText]}>
              {loading ? 'Loading properties...' : 'No properties found'}
            </Text>
          </View>
        }
        ListFooterComponent={
          pagination.page < pagination.pages ? (
            <View style={styles.loadingMore}>
              <Text style={[styles.loadingMoreText, isDarkMode ? styles.darkLoadingMoreText : styles.lightLoadingMoreText]}>Loading more...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Results count */}
      <View style={[styles.footer, isDarkMode ? styles.darkFooter : styles.lightFooter]}>
        <Text style={[styles.resultsText, isDarkMode ? styles.darkResultsText : styles.lightResultsText]}>
          {pagination.total} properties found
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71', // Deep navy background
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA', // Glazier shiny white background
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1A1F71',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(0,0,0,0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 22,
    paddingHorizontal: 16,
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  darkSearchInput: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
  },
  lightSearchInput: {
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: '#FFFFFF',
    color: '#1A1F71',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: 'rgba(108, 74, 182, 0.4)', // #6C4AB6 semi-transparent
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 22,
    justifyContent: 'center',
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#5D3FD3', // Deep purple
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontFamily: 'System',
  },
  filterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightFilterContainer: {
    backgroundColor: '#F8F9FA',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FF69B4',
    fontFamily: 'System',
  },
  filterInput: {
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  darkFilterInput: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#FFFFFF',
  },
  lightFilterInput: {
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: '#FFFFFF',
    color: '#1A1F71',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'System',
  },
  applyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'System',
  },
  propertyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 12,
    marginBottom: 8,
    borderRadius: 12,
    flexDirection: 'row',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  lightPropertyCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  darkPropertyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
  },
  propertyImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  imagePlaceholder: {
    fontSize: 30,
    color: '#A0C4E4',
  },
  cardImage: {
    width: 100,
    height: 100,
    marginTop: 20,
    marginLeft: 13,
    borderRadius: 8,
  },
  propertyInfo: {
    flex: 1,
    padding: 20,
  },
  propertyTitle: {
    fontSize: 15,
    marginLeft: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'System',
  },
  lightPropertyTitle: {
    color: '#1A1F71',
  },
  darkPropertyTitle: {
    color: '#FFFFFF',
  },
  propertyPrice: {
    fontSize: 14,
    color: '#FF69B4', // Accent pink
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 10,
    fontFamily: 'System',
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 6,
    marginLeft: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#A0C4E4',
    marginRight: 14,
    fontFamily: 'System',
  },
  lightDetailText: {
    color: '#666666',
  },
  darkDetailText: {
    color: '#A0C4E4',
  },
  propertyDescription: {
    fontSize: 12,
    color: '#A0C4E4',
    marginBottom: 10,
    fontFamily: 'System',
    marginLeft: 10,
  },
  lightPropertyDescription: {
    color: '#666666',
  },
  darkPropertyDescription: {
    color: '#A0C4E4',
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'capitalize',
    fontFamily: 'System',
    marginLeft: 10,
  },
  viewCount: {
    fontSize: 12,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  lightViewCount: {
    color: '#666666',
  },
  darkViewCount: {
    color: '#A0C4E4',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#A0C4E4',
    textAlign: 'center',
    fontFamily: 'System',
  },
  lightEmptyText: {
    color: '#666666',
  },
  darkEmptyText: {
    color: '#A0C4E4',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  lightLoadingMoreText: {
    color: '#666666',
  },
  darkLoadingMoreText: {
    color: '#A0C4E4',
  },
  footer: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  lightFooter: {
    backgroundColor: '#FFFFFF',
    borderTopColor: 'rgba(0,0,0,0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkFooter: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  resultsText: {
    fontSize: 13,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  lightResultsText: {
    color: '#666666',
  },
  darkResultsText: {
    color: '#A0C4E4',
  },
});

export default PropertiesScreen;
