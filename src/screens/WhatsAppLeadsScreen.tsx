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
import {
  useNavigation,
  useFocusEffect,
  NavigationProp,
} from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { apiService, Lead } from '../utils/api';
import { RootStackParamList } from '../types/navigation';

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

// Status color mapping using your theme
const getStatusColor = (status: string) => {
  switch (status) {
    case 'HIGH':
      return '#10b981'; // Emerald
    case 'MEDIUM':
      return '#f59e0b'; // Amber
    case 'NOT_QUALIFIED':
      return '#ef4444'; // Red
    default:
      return '#94a3b8';
  }
};

const getFollowUpStatusColor = (status?: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#10b981';
    case 'PENDING':
      return '#f59e0b';
    case 'CANCELLED':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
};

const LeadCard = ({ lead, navigation }: { lead: Lead; navigation: any }) => {
  return (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() =>
        navigation.navigate('LeadDetails', {
          leadId: lead.id,
          channel: 'whatsapp',
        })
      }
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{lead.name || 'Unknown Lead'}</Text>
          <Text style={styles.telegramId}>@{lead.whatsappUserId}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(lead.status) },
            ]}
          >
            {lead.status.replace('_', ' ')}
          </Text>
          {lead.followUpStatus && (
            <Text
              style={[
                styles.followUpBadge,
                {
                  backgroundColor: getFollowUpStatusColor(lead.followUpStatus),
                },
              ]}
            >
              {lead.followUpStatus}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.leadDetails}>
        <View style={styles.leadDetailsRow}>
          {lead.phoneNumber && (
            <Text style={styles.detailText}>📞 {lead.phoneNumber}</Text>
          )}
          <Text style={styles.mediumText}>💬 WhatsApp</Text>
        </View>
        {lead.budget && (
          <Text style={styles.detailText}>
            💰 ₹{lead.budget.toLocaleString()}
          </Text>
        )}
        {lead.expectations && (
          <Text style={styles.expectationsText} numberOfLines={2}>
            {lead.expectations}
          </Text>
        )}
      </View>

      <View style={styles.leadFooter}>
        <Text style={styles.dateText}>
          {new Date(lead.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.interactionText}>
          Last: {formatTimeAgo(lead.lastInteraction || null)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const StatusFilter = ({
  statusFilter,
  setStatusFilter,
}: {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}) => {
  const statuses = ['ALL', 'HIGH', 'MEDIUM', 'NOT_QUALIFIED'];

  return (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Filter by Status:</Text>
      <View style={styles.filterButtons}>
        {statuses.map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === (status === 'ALL' ? '' : status) &&
                styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(status === 'ALL' ? '' : status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === (status === 'ALL' ? '' : status) &&
                  styles.filterButtonTextActive,
              ]}
            >
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
  color = '#4A6FA5',
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

const WhatsAppLeadsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
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

  const loadLeads = useCallback(
    async (page = 1, append = false) => {
      try {
        const params: any = {
          page,
          limit: pagination.limit,
          search: searchQuery || undefined,
          status: statusFilter || undefined,
        };

        const response = await apiService.getWhatsAppLeads(params);

        const leadsWithMockData = response.whatsappLeads.map(lead => ({
          ...lead,
          lastInteraction: lead.lastInteraction || lead.updatedAt,
        }));

        if (append) {
          setLeads(prev => {
            const newLeads = [...prev, ...leadsWithMockData];
            const qualifiedCount = newLeads.filter(
              lead => lead.status === 'MEDIUM' || lead.status === 'HIGH',
            ).length;
            const pendingFollowUps = newLeads.filter(
              lead => lead.followUpStatus === 'PENDING',
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
          const qualifiedCount = leadsWithMockData.filter(
            lead => lead.status === 'MEDIUM' || lead.status === 'HIGH',
          ).length;
          const pendingFollowUps = leadsWithMockData.filter(
            lead => lead.followUpStatus === 'PENDING',
          ).length;

          setStats({
            totalLeads: response.pagination.total,
            qualifiedLeads: qualifiedCount,
            pendingFollowUps,
          });
        }

        setPagination(response.pagination);
      } catch (error) {
        console.error('Error loading WhatsApp leads:', error);
        Alert.alert('Error', 'Failed to load WhatsApp leads');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [pagination.limit, searchQuery, statusFilter],
  );

  useFocusEffect(
    useCallback(() => {
      loadLeads(1, false);
    }, [loadLeads]),
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

  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      {/* Stats Header */}
      <View style={[styles.statsHeader, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.statsHeaderTitle, isDarkMode ? styles.darkText : styles.lightText]}>💬 WhatsApp Leads</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            subtitle="WhatsApp users"
            color="#25D366" // WhatsApp green
          />
          <StatCard
            title="Qualified Leads"
            value={stats.qualifiedLeads}
            subtitle="High/Medium"
            color="#5D3FD3" // Purple
          />
          <StatCard
            title="Pending Follow-ups"
            value={stats.pendingFollowUps}
            subtitle="Requires action"
            color="#FF69B4" // Accent pink
          />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search WhatsApp leads by name or phone..."
          placeholderTextColor="#A0C4E4"
          value={searchQuery}
          onChangeText={handleSearch}
          selectionColor="#FFFFFF"
        />
      </View>

      {/* Status Filter */}
      <StatusFilter
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Leads List */}
      <FlatList
        data={leads}
        renderItem={({ item }) => (
          <LeadCard lead={item} navigation={navigation} />
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
            <Text style={styles.emptyText}>
              {loading ? 'Loading WhatsApp leads...' : 'No WhatsApp leads found'}
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
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Results count */}
      <View style={styles.footer}>
        <Text style={styles.resultsText}>{pagination.total} WhatsApp leads found</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71', // Primary background
    paddingTop: 20, // Add padding to prevent content from hiding behind status bar
  },
  statsHeader: {
    backgroundColor: '#1A1F71',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  statsHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '31.3%',
    borderLeftWidth: 4,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 5,
    fontFamily: 'System',
  },
  statTitle: {
    fontSize: 11,
    color: '#A0C4E4',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#FF69B4',
    marginTop: 3,
    fontFamily: 'System',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  filterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'System',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  filterButtonActive: {
    backgroundColor: '#5D3FD3',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#A0C4E4',
    fontWeight: '600',
    fontFamily: 'System',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  leadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    margin: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'System',
  },
  telegramId: {
    fontSize: 14,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 6,
    fontFamily: 'System',
  },
  followUpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
    fontFamily: 'System',
  },
  leadDetails: {
    marginBottom: 12,
  },
  leadDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  mediumText: {
    fontSize: 13,
    color: '#FF69B4',
    fontWeight: '600',
    fontFamily: 'System',
  },
  expectationsText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 6,
    lineHeight: 20,
    fontFamily: 'System',
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  dateText: {
    fontSize: 12,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  interactionText: {
    fontSize: 12,
    color: '#A0C4E4',
    fontFamily: 'System',
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
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: '#A0C4E4',
    fontFamily: 'System',
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
  resultsText: {
    fontSize: 13,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
  },
  lightHeader: {
    backgroundColor: '#E0F7FA',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
});

export default WhatsAppLeadsScreen;