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
import { apiService, Lead } from '../utils/api';
import { RootStackParamList } from '../types/navigation';
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

const LeadCard = ({
  lead,
  navigation,
  isDarkMode = true,
}: {
  lead: Lead;
  navigation: any;
  isDarkMode?: boolean;
}) => {
  const isTelegram = !!lead.telegramUserId;
  const isWhatsApp = !!lead.whatsappUserId;

  return (
    <TouchableOpacity
      style={[
        styles.leadCard,
        isDarkMode ? styles.darkLeadCard : styles.lightLeadCard,
      ]}
      onPress={() =>
        navigation.navigate('LeadDetails', {
          leadId: lead.id,
          channel: isTelegram
            ? 'telegram'
            : isWhatsApp
            ? 'whatsapp'
            : undefined,
        })
      }
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text
            style={[
              styles.leadName,
              isDarkMode ? styles.darkLeadName : styles.lightLeadName,
            ]}
          >
            {lead.name || 'Unknown Lead'}
          </Text>
          <Text
            style={[
              styles.telegramId,
              isDarkMode ? styles.darkTelegramId : styles.lightTelegramId,
            ]}
          >
            @{lead.telegramUserId || lead.whatsappUserId}
          </Text>
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
            <Text
              style={[
                styles.detailText,
                isDarkMode ? styles.darkDetailText : styles.lightDetailText,
              ]}
            >
              📞 {lead.phoneNumber}
            </Text>
          )}
          <Text
            style={[
              styles.mediumText,
              isDarkMode ? styles.darkMediumText : styles.lightMediumText,
            ]}
          >
            {isTelegram
              ? '📱 Telegram'
              : isWhatsApp
              ? '💬 WhatsApp'
              : '📱 Unknown'}
          </Text>
        </View>
        {lead.budget && (
          <Text
            style={[
              styles.detailText,
              isDarkMode ? styles.darkDetailText : styles.lightDetailText,
            ]}
          >
            💰 ₹{lead.budget.toLocaleString()}
          </Text>
        )}
        {lead.expectations && (
          <Text
            style={[
              styles.expectationsText,
              isDarkMode
                ? styles.darkExpectationsText
                : styles.lightExpectationsText,
            ]}
            numberOfLines={2}
          >
            {lead.expectations}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.leadFooter,
          isDarkMode ? styles.darkLeadFooter : styles.lightLeadFooter,
        ]}
      >
        <Text
          style={[
            styles.dateText,
            isDarkMode ? styles.darkDateText : styles.lightDateText,
          ]}
        >
          {new Date(lead.createdAt).toLocaleDateString()}
        </Text>
        <Text
          style={[
            styles.interactionText,
            isDarkMode
              ? styles.darkInteractionText
              : styles.lightInteractionText,
          ]}
        >
          Last: {formatTimeAgo(lead.lastInteraction || null)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const StatusFilter = ({
  statusFilter,
  setStatusFilter,
  isDarkMode = true,
}: {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  isDarkMode?: boolean;
}) => {
  const statuses = ['ALL', 'HIGH', 'MEDIUM', 'NOT_QUALIFIED'];

  return (
    <View
      style={[
        styles.filterContainer,
        isDarkMode ? styles.darkFilterContainer : styles.lightFilterContainer,
      ]}
    >
      <Text
        style={[
          styles.filterTitle,
          isDarkMode ? styles.darkFilterTitle : styles.lightFilterTitle,
        ]}
      >
        Filter by Status:
      </Text>
      <View style={styles.filterButtons}>
        {statuses.map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === (status === 'ALL' ? '' : status) &&
                styles.filterButtonActive,
              isDarkMode ? styles.darkFilterButton : styles.lightFilterButton,
            ]}
            onPress={() => setStatusFilter(status === 'ALL' ? '' : status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === (status === 'ALL' ? '' : status) &&
                  styles.filterButtonTextActive,
                isDarkMode
                  ? styles.darkFilterButtonText
                  : styles.lightFilterButtonText,
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
  isDarkMode = true,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  isDarkMode?: boolean;
}) => (
  <View
    style={[
      styles.statCard,
      { borderLeftColor: color },
      isDarkMode ? styles.darkStatCard : styles.lightStatCard,
    ]}
  >
    <Text
      style={[
        styles.statValue,
        isDarkMode ? styles.darkStatValue : styles.lightStatValue,
      ]}
    >
      {value}
    </Text>
    <Text
      style={[
        styles.statTitle,
        isDarkMode ? styles.darkStatTitle : styles.lightStatTitle,
      ]}
    >
      {title}
    </Text>
    {subtitle && (
      <Text
        style={[
          styles.statSubtitle,
          isDarkMode ? styles.darkStatSubtitle : styles.lightStatSubtitle,
        ]}
      >
        {subtitle}
      </Text>
    )}
  </View>
);

const LeadsScreen = () => {
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

        const response = await apiService.getLeads(params);

        const leadsWithMockData = response.leads.map(lead => ({
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
        console.error('Error loading leads:', error);
        Alert.alert('Error', 'Failed to load leads');
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
    <View
      style={[
        styles.container,
        isDarkMode ? styles.darkContainer : styles.lightContainer,
      ]}
    >
      {/* Stats Header */}
      <View
        style={[
          styles.statsHeader,
          isDarkMode ? styles.darkHeader : styles.lightHeader,
        ]}
      >
        <Text
          style={[
            styles.statsHeaderTitle,
            isDarkMode ? styles.darkText : styles.lightText,
          ]}
        >
          Leads Overview
        </Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Leads"
            value={stats.totalLeads}
            subtitle="All channels"
            color="#4A6FA5" // Blue
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Qualified Leads"
            value={stats.qualifiedLeads}
            subtitle="High/Medium"
            color="#5D3FD3" // Purple
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Pending Follow-ups"
            value={stats.pendingFollowUps}
            subtitle="Requires action"
            color="#FF69B4" // Accent pink
            isDarkMode={isDarkMode}
          />
        </View>
      </View>

      {/* Channel Navigation */}
      <View
        style={[
          styles.channelNavigation,
          isDarkMode
            ? styles.darkChannelNavigation
            : styles.lightChannelNavigation,
        ]}
      >
        <TouchableOpacity
          style={[
            styles.channelButton,
            isDarkMode ? styles.darkChannelButton : styles.lightChannelButton,
          ]}
          onPress={() => navigation.navigate('TelegramLeads')}
        >
          <Text
            style={[
              styles.channelButtonText,
              isDarkMode
                ? styles.darkChannelButtonText
                : styles.lightChannelButtonText,
            ]}
          >
            📱 Telegram
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.channelButton,
            isDarkMode ? styles.darkChannelButton : styles.lightChannelButton,
          ]}
          onPress={() => navigation.navigate('WhatsAppLeads')}
        >
          <Text
            style={[
              styles.channelButtonText,
              isDarkMode
                ? styles.darkChannelButtonText
                : styles.lightChannelButtonText,
            ]}
          >
            💬 WhatsApp
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          isDarkMode ? styles.darkSearchContainer : styles.lightSearchContainer,
        ]}
      >
        <TextInput
          style={[
            styles.searchInput,
            isDarkMode ? styles.darkSearchInput : styles.lightSearchInput,
          ]}
          placeholder="Search leads by name or phone..."
          placeholderTextColor={isDarkMode ? '#A0C4E4' : '#6B7280'}
          value={searchQuery}
          onChangeText={handleSearch}
          selectionColor={isDarkMode ? '#FFFFFF' : '#1A1F71'}
        />
      </View>

      {/* Status Filter */}
      <StatusFilter
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isDarkMode={isDarkMode}
      />

      {/* Leads List */}
      <FlatList
        data={leads}
        renderItem={({ item }) => (
          <LeadCard
            lead={item}
            navigation={navigation}
            isDarkMode={isDarkMode}
          />
        )}
        keyExtractor={item => item.id}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#FFFFFF' : '#1A1F71'}
            colors={[isDarkMode ? '#FFFFFF' : '#1A1F71']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text
              style={[
                styles.emptyText,
                isDarkMode ? styles.darkEmptyText : styles.lightEmptyText,
              ]}
            >
              {loading ? 'Loading leads...' : 'No leads found'}
            </Text>
          </View>
        }
        ListFooterComponent={
          pagination.page < pagination.pages ? (
            <View style={styles.loadingMore}>
              <Text
                style={[
                  styles.loadingMoreText,
                  isDarkMode
                    ? styles.darkLoadingMoreText
                    : styles.lightLoadingMoreText,
                ]}
              >
                Loading more...
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Results count */}
      <View
        style={[
          styles.footer,
          isDarkMode ? styles.darkFooter : styles.lightFooter,
        ]}
      >
        <Text
          style={[
            styles.resultsText,
            isDarkMode ? styles.darkResultsText : styles.lightResultsText,
          ]}
        >
          {pagination.total} leads found
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA',
  },
  statsHeader: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
  },
  lightHeader: {
    backgroundColor: '#E0F7FA',
  },
  statsHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 16,
    fontFamily: 'System',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '31.3%',
    borderLeftWidth: 4,
    elevation: 3,
  },
  darkStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  lightStatCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 5,
    fontFamily: 'System',
  },
  darkStatValue: {
    color: '#FFFFFF',
  },
  lightStatValue: {
    color: '#1A1F71',
  },
  statTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  darkStatTitle: {
    color: '#A0C4E4',
  },
  lightStatTitle: {
    color: '#6B7280',
  },
  statSubtitle: {
    fontSize: 10,
    marginTop: 3,
    fontFamily: 'System',
  },
  darkStatSubtitle: {
    color: '#FF69B4',
  },
  lightStatSubtitle: {
    color: '#DB2777',
  },
  searchContainer: {
    padding: 15,
    borderBottomWidth: 1,
  },
  darkSearchContainer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightSearchContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  searchInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    fontFamily: 'System',
  },
  darkSearchInput: {
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#FFFFFF',
  },
  lightSearchInput: {
    borderColor: 'rgba(0,0,0,0.2)',
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: '#1A1F71',
  },
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  darkFilterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightFilterContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    fontFamily: 'System',
  },
  darkFilterTitle: {
    color: '#FFFFFF',
  },
  lightFilterTitle: {
    color: '#1A1F71',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  darkFilterButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  lightFilterButton: {
    backgroundColor: '#F3F4F6',
  },
  filterButtonActive: {
    backgroundColor: '#5D3FD3',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  darkFilterButtonText: {
    color: '#A0C4E4',
  },
  lightFilterButtonText: {
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  leadCard: {
    margin: 12,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
  },
  darkLeadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  lightLeadCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginBottom: 4,
    fontFamily: 'System',
  },
  darkLeadName: {
    color: '#FFFFFF',
  },
  lightLeadName: {
    color: '#000000',
  },
  telegramId: {
    fontSize: 14,
    fontFamily: 'System',
  },
  darkTelegramId: {
    color: '#A0C4E4',
  },
  lightTelegramId: {
    color: '#6B7280',
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
    fontFamily: 'System',
  },
  darkDetailText: {
    color: '#A0C4E4',
  },
  lightDetailText: {
    color: '#6B7280',
  },
  mediumText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  darkMediumText: {
    color: '#FF69B4',
  },
  lightMediumText: {
    color: '#DB2777',
  },
  expectationsText: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
    fontFamily: 'System',
  },
  darkExpectationsText: {
    color: '#FFFFFF',
  },
  lightExpectationsText: {
    color: '#1A1F71',
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  darkLeadFooter: {
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lightLeadFooter: {
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  darkDateText: {
    color: '#A0C4E4',
  },
  lightDateText: {
    color: '#6B7280',
  },
  interactionText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  darkInteractionText: {
    color: '#A0C4E4',
  },
  lightInteractionText: {
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'System',
  },
  darkEmptyText: {
    color: '#A0C4E4',
  },
  lightEmptyText: {
    color: '#6B7280',
  },
  loadingMore: {
    padding: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontFamily: 'System',
  },
  darkLoadingMoreText: {
    color: '#A0C4E4',
  },
  lightLoadingMoreText: {
    color: '#6B7280',
  },
  footer: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  darkFooter: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lightFooter: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  resultsText: {
    fontSize: 13,
    fontFamily: 'System',
  },
  darkResultsText: {
    color: '#A0C4E4',
  },
  lightResultsText: {
    color: '#6B7280',
  },
  channelNavigation: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  darkChannelNavigation: {},
  lightChannelNavigation: {},
  channelButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  darkChannelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  lightChannelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  channelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
  darkChannelButtonText: {
    color: '#FFFFFF',
  },
  lightChannelButtonText: {
    color: '#1A1F71',
  },
});

export default LeadsScreen;
