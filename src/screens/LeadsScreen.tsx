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
} from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import { apiService, Lead } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

// Utility function to format time duration
const formatTimeAgo = (dateString: string | null): string => {
  if (!dateString) return 'Never';

  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

// Components moved outside to avoid unstable nested components

const getStatusColor = (status: string) => {
  switch (status) {
    case 'HIGH': return '#4CAF50';
    case 'MEDIUM': return '#FF9800';
    case 'NOT_QUALIFIED': return '#F44336';
    default: return '#666';
  }
};

const getFollowUpStatusColor = (status?: string) => {
  switch (status) {
    case 'COMPLETED': return '#4CAF50';
    case 'PENDING': return '#FF9800';
    case 'CANCELLED': return '#F44336';
    default: return '#9E9E9E';
  }
};

const LeadCard = ({ lead, navigation, isDarkMode }: { lead: Lead; navigation: any; isDarkMode: boolean }) => {

  return (
    <TouchableOpacity
      style={[styles.leadCard, { backgroundColor: isDarkMode ? '#1e1e1e' : 'white' }]}
      onPress={() => navigation.navigate('LeadDetails', { leadId: lead.id })}
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={[styles.leadName, { color: isDarkMode ? '#fff' : '#333' }]}>{lead.name || 'Unknown Lead'}</Text>
          <Text style={[styles.telegramId, { color: isDarkMode ? '#ccc' : '#666' }]}>@{lead.telegramUserId}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) }]}>
            {lead.status.replace('_', ' ')}
          </Text>
          {lead.followUpStatus && (
            <Text style={[styles.followUpBadge, { backgroundColor: getFollowUpStatusColor(lead.followUpStatus) }]}>
              {lead.followUpStatus}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.leadDetails}>
        <View style={styles.leadDetailsRow}>
          {lead.phoneNumber && (
            <Text style={[styles.detailText, { color: isDarkMode ? '#ccc' : '#666' }]}>📞 {lead.phoneNumber}</Text>
          )}
          <Text style={styles.mediumText}>📱 Telegram</Text>
        </View>
        {lead.budget && (
          <Text style={[styles.detailText, { color: isDarkMode ? '#ccc' : '#666' }]}>💰 ₹{lead.budget.toLocaleString()}</Text>
        )}
        {lead.expectations && (
          <Text style={[styles.expectationsText, { color: isDarkMode ? '#fff' : '#333' }]} numberOfLines={2}>
            {lead.expectations}
          </Text>
        )}
      </View>

      <View style={styles.leadFooter}>
        <Text style={[styles.dateText, { color: isDarkMode ? '#999' : '#999' }]}>
          {new Date(lead.createdAt).toLocaleDateString()}
        </Text>
        <Text style={[styles.interactionText, { color: isDarkMode ? '#ccc' : '#666' }]}>
          Last: {formatTimeAgo(lead.lastInteraction || null)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const StatusFilter = ({ statusFilter, setStatusFilter }: { statusFilter: string; setStatusFilter: (status: string) => void }) => {
  const statuses = ['ALL', 'HIGH', 'MEDIUM', 'NOT_QUALIFIED'];

  return (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Filter by Status:</Text>
      <View style={styles.filterButtons}>
        {statuses.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === (status === 'ALL' ? '' : status) && styles.filterButtonActive
            ]}
            onPress={() => setStatusFilter(status === 'ALL' ? '' : status)}
          >
            <Text style={[
              styles.filterButtonText,
              statusFilter === (status === 'ALL' ? '' : status) && styles.filterButtonTextActive
            ]}>
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const StatCard = ({
  title,
  value,
  subtitle,
  color = '#6a0dad'
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

type RootStackParamList = {
  LeadDetails: { leadId: string };
};

type NavigationProps = NavigationProp<RootStackParamList>;

const LeadsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { isDarkMode } = useTheme();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState({
    totalLeads: 0,
    qualifiedLeads: 0,
    pendingFollowUps: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const loadLeads = useCallback(async (page = 1, append = false) => {
    try {
      const params: any = {
        page,
        limit: pagination.limit,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      };

      const response = await apiService.getLeads(params);

      // Add mock lastInteraction data if not available from backend
      const leadsWithMockData = response.leads.map(lead => ({
        ...lead,
        lastInteraction: lead.lastInteraction || lead.updatedAt // Use updatedAt as fallback
      }));

      if (append) {
        setLeads(prev => {
          const newLeads = [...prev, ...leadsWithMockData];
          // Calculate stats from all leads
          const qualifiedCount = newLeads.filter(lead =>
            lead.status === 'MEDIUM' || lead.status === 'HIGH'
          ).length;
          const pendingFollowUps = newLeads.filter(lead =>
            lead.followUpStatus === 'PENDING'
          ).length;

          setStats({
            totalLeads: response.pagination.total,
            qualifiedLeads: qualifiedCount,
            pendingFollowUps,
          });
          return newLeads;
        });
      } else {
        setLeads(leadsWithMockData);

        // Calculate stats from current page leads
        const qualifiedCount = leadsWithMockData.filter(lead =>
          lead.status === 'MEDIUM' || lead.status === 'HIGH'
        ).length;
        const pendingFollowUps = leadsWithMockData.filter(lead =>
          lead.followUpStatus === 'PENDING'
        ).length;

        setStats({
          totalLeads: response.pagination.total,
          qualifiedLeads: qualifiedCount,
          pendingFollowUps,
        });
      }

      setPagination(response.pagination);
    } catch (error) {
      console.error('Error loading leads:', error);
      Alert.alert('Error', 'Failed to load leads');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.limit, searchQuery, statusFilter]);

  useFocusEffect(
    useCallback(() => {
      loadLeads(1, false);
    }, [loadLeads])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadLeads(1, false);
  };

  const loadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      loadLeads(pagination.page + 1, true);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };


  const getDynamicStyles = (isDark: boolean) => ({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f5f5f5',
    },
    leadCard: {
      backgroundColor: isDark ? '#1e1e1e' : 'white',
      margin: 10,
      marginBottom: 5,
      borderRadius: 10,
      padding: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    leadName: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: isDark ? '#fff' : '#333',
      marginBottom: 2,
    },
    telegramId: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
    },
    detailText: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
    },
    expectationsText: {
      fontSize: 14,
      color: isDark ? '#fff' : '#333',
      marginTop: 5,
      lineHeight: 20,
    },
    dateText: {
      fontSize: 12,
      color: isDark ? '#999' : '#999',
    },
    interactionText: {
      fontSize: 12,
      color: isDark ? '#ccc' : '#666',
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#ccc' : '#666',
      textAlign: 'center' as const,
    },
    resultsText: {
      fontSize: 12,
      color: isDark ? '#ccc' : '#666',
    },
  });

  return (
    <View style={getDynamicStyles(isDarkMode).container}>
      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <Text style={styles.statsHeaderTitle}>Leads Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            subtitle="All leads"
            color="#2196F3"
          />
          <StatCard
            title="Qualified Leads"
            value={stats.qualifiedLeads}
            subtitle="High/Medium"
            color="#4CAF50"
          />
          <StatCard
            title="Pending Follow-ups"
            value={stats.pendingFollowUps}
            subtitle="Requires action"
            color="#FF9800"
          />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads by name or phone..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Status Filter */}
      <StatusFilter statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

      {/* Leads List */}
      <FlatList
        data={leads}
        renderItem={({ item }) => <LeadCard lead={item} navigation={navigation} isDarkMode={isDarkMode} />}
        keyExtractor={(item) => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={getDynamicStyles(isDarkMode).emptyText}>
              {loading ? 'Loading leads...' : 'No leads found'}
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
        <Text style={getDynamicStyles(isDarkMode).resultsText}>
          {pagination.total} leads found
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsHeader: {
    backgroundColor: '#1a0033',
    padding: 20,
    paddingTop: 40,
  },
  statsHeaderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    width: '31%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  filterContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#6a0dad',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  leadCard: {
    backgroundColor: 'white',
    margin: 10,
    marginBottom: 5,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  telegramId: {
    fontSize: 14,
    color: '#666',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  followUpBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  leadDetails: {
    marginBottom: 10,
  },
  leadDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  mediumText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  expectationsText: {
    fontSize: 14,
    color: '#333',
    marginTop: 5,
    lineHeight: 20,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  interactionText: {
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

export default LeadsScreen;
