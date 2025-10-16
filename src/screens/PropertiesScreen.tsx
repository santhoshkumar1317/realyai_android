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
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { apiService, Property } from '../utils/api';

// Components moved outside to avoid unstable nested components
const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE': return '#4CAF50';
    case 'RESERVED': return '#FF9800';
    case 'SOLD': return '#F44336';
    case 'UNDER_MAINTENANCE': return '#9E9E9E';
    default: return '#666';
  }
};

const PropertyCard = ({ property, navigation }: { property: Property; navigation: any }) => (
  <TouchableOpacity
    style={styles.propertyCard}
    onPress={() => navigation.navigate('PropertyDetails', { propertyId: property.id })}
  >
    <View style={styles.propertyImage}>
      {property.images && property.images.length > 0 && property.images[0] ? (
        <Image key={property.images[0]} source={{ uri: property.images[0] }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={styles.cardImage}>
          <Text style={styles.imagePlaceholder}>🏠</Text>
        </View>
      )}
    </View>
    <View style={styles.propertyInfo}>
      <Text style={styles.propertyTitle}>
        {property.propertyType || 'Property'} in {property.location ? `${property.location.city}, ${property.location.state}` : 'Unknown Location'}
      </Text>
      <Text style={styles.propertyPrice}>
        ₹{property.pricePerSqft?.toLocaleString()}/sqft
        {property.totalPrice && ` (₹${property.totalPrice.toLocaleString()} total)`}
      </Text>
      <View style={styles.propertyDetails}>
        {property.area && (
          <Text style={styles.detailText}>📐 {property.area} sqft</Text>
        )}
        {property.bedrooms && (
          <Text style={styles.detailText}>🛏️ {property.bedrooms} bed</Text>
        )}
        {property.bathrooms && (
          <Text style={styles.detailText}>🚿 {property.bathrooms} bath</Text>
        )}
      </View>
      <Text style={styles.propertyDescription} numberOfLines={2}>
        {property.description}
      </Text>
      <View style={styles.propertyFooter}>
        <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) }]}>
          {property.status.toLowerCase().replace('_', ' ')}
        </Text>
        <Text style={styles.viewCount}>👁️ {property.viewCount || 0}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const FilterModal = ({
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  loadProperties
}: {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  filters: any;
  setFilters: (filters: any) => void;
  loadProperties: (page: number, append: boolean) => void;
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
    <View style={styles.filterContainer}>
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
        style={styles.filterInput}
        placeholder="Property Type"
        value={filters.propertyType}
        onChangeText={(text) => setFilters((prev: any) => ({ ...prev, propertyType: text }))}
      />
      <TextInput
        style={styles.filterInput}
        placeholder="Min Price"
        value={filters.minPrice}
        onChangeText={(text) => setFilters((prev: any) => ({ ...prev, minPrice: text }))}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.filterInput}
        placeholder="Max Price"
        value={filters.maxPrice}
        onChangeText={(text) => setFilters((prev: any) => ({ ...prev, maxPrice: text }))}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.filterInput}
        placeholder="Location"
        value={filters.location}
        onChangeText={(text) => setFilters((prev: any) => ({ ...prev, location: text }))}
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

  const loadProperties = useCallback(async (page = 1, append = false) => {
    try {
      const params: any = {
        page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        propertyType: filters.propertyType || undefined,
        minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        minArea: undefined, // Not implemented in UI yet
        maxArea: undefined, // Not implemented in UI yet
        bedrooms: undefined, // Not implemented in UI yet
        bathrooms: undefined, // Not implemented in UI yet
        location: filters.location || undefined,
      };

      const response = await apiService.getProperties(params);
      console.log('Properties response:', response.properties);

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
  }, [pagination.limit, searchQuery, filters]);

  useFocusEffect(
    useCallback(() => {
      loadProperties(1, false);
    }, [loadProperties])
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

  const clearFilters = () => {
    setFilters({
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      location: '',
    });
  };

  return (
    <View style={styles.container}>
      {/* Search and Filter Header */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search properties..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={handleSearch}
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
      />

      {/* Properties List */}
      <FlatList
        data={properties}
        renderItem={({ item }) => <PropertyCard property={item} navigation={navigation} />}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading properties...' : 'No properties found'}
            </Text>
          </View>
        }
        ListFooterComponent={
          pagination.page < pagination.pages ? (
            <View style={styles.loadingMore}>
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      {/* Results count */}
      <View style={styles.footer}>
        <Text style={styles.resultsText}>
          {pagination.total} properties found
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1a0033',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: 'white',
    color: 'white',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 16,
    color: 'white',
  },
  addButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  filterInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clearButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  propertyCard: {
    backgroundColor: 'white',
    margin: 10,
    marginBottom: 5,
    borderRadius: 10,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propertyImage: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 30,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  propertyInfo: {
    flex: 1,
    padding: 15,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  propertyPrice: {
    fontSize: 14,
    color: '#6a0dad',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  propertyDetails: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginRight: 15,
  },
  propertyDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  propertyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  viewCount: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: '#666',
  },
  footer: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 12,
    color: '#666',
  },
});

export default PropertiesScreen;
