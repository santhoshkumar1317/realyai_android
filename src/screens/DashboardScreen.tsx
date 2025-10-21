import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiService, DashboardStats, User } from '../utils/api';

// Components moved outside to avoid unstable nested components
const StatCard = ({
  title,
  value,
  subtitle,
  color = '#4A6FA5', // Default to blue card color
  isDarkMode = true,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  isDarkMode?: boolean;
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Text style={[styles.statValue, isDarkMode ? null : styles.lightStatValue]}>{value}</Text>
    <Text style={[styles.statTitle, isDarkMode ? null : styles.lightStatTitle]}>{title}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </View>
);

const RecentActivityItem = ({
  type,
  title,
  subtitle,
  time,
  isDarkMode = true,
}: {
  type: 'lead' | 'chat';
  title: string;
  subtitle: string;
  time: string;
  isDarkMode?: boolean;
}) => (
  <View style={[styles.activityItem, isDarkMode ? null : styles.lightActivityItem]}>
    <View
      style={[
        styles.activityIcon,
        type === 'lead' ? styles.leadActivityIcon : styles.chatActivityIcon,
      ]}
    >
      <Text style={[styles.activityIconText, isDarkMode ? null : styles.lightActivityIconText]}>
        {type === 'lead' ? '👤' : '💬'}
      </Text>
    </View>
    <View style={styles.activityContent}>
      <Text style={[styles.activityTitle, isDarkMode ? null : styles.lightActivityTitle]}>{title}</Text>
      <Text style={[styles.activitySubtitle, isDarkMode ? null : styles.lightActivitySubtitle]}>{subtitle}</Text>
      <Text style={[styles.activityTime, isDarkMode ? null : styles.lightActivityTime]}>
        {new Date(time).toLocaleDateString()}
      </Text>
    </View>
  </View>
);

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { isTokenReady } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userPropertyCount, setUserPropertyCount] = useState(0);
  const [qualifiedLeadsCount, setQualifiedLeadsCount] = useState(0);

  const loadStats = async () => {
    try {
      const [dashboardStats, profile, userProperties] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getProfile(),
        apiService.getUserProperties({ page: 1, limit: 1 }),
      ]);

      setStats(dashboardStats);
      setUser(profile.user);
      setUserPropertyCount(userProperties.pagination.total);

      const qualifiedCount =
        (dashboardStats.overall.leadsByStatus.MEDIUM || 0) +
        (dashboardStats.overall.leadsByStatus.HIGH || 0);
      setQualifiedLeadsCount(qualifiedCount);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isTokenReady) {
      loadStats();
    }
  }, [isTokenReady]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDarkMode ? "#FFFFFF" : "#1A1F71"}
          colors={[isDarkMode ? "#FFFFFF" : "#1A1F71"]}
        />
      }
    >
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, isDarkMode ? styles.darkText : styles.lightText]}>Dashboard</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={toggleTheme}
            >
              <Text style={styles.themeIcon}>
                {isDarkMode ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile' as never)}
            >
              <View style={styles.profilePic}>
                <Text style={styles.profilePicText}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.headerSubtitle, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>Real Estate CRM Overview</Text>
      </View>

      {/* Today's Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>Today's Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="New Leads"
            value={stats.today.newLeads}
            subtitle="Today"
            color="#4A6FA5" // Blue card
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Chat Messages"
            value={stats.today.chatMessages}
            subtitle="Today"
            color="#5D3FD3" // Purple card
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Total Leads"
            value={stats.today.totalLeads}
            subtitle="Today"
            color="#4A6FA5" // Blue card
            isDarkMode={isDarkMode}
          />
        </View>
      </View>

      {/* My Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>My Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="My Properties"
            value={userPropertyCount}
            subtitle="Listed"
            color="#5D3FD3" // Purple card
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Qualified Leads"
            value={qualifiedLeadsCount}
            subtitle="Total"
            color="#4A6FA5" // Blue card
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Lead Follow-ups"
            value={
              stats.recentActivity.leads.filter(
                lead => lead.followUpStatus === 'PENDING',
              ).length
            }
            subtitle="Pending"
            color="#5D3FD3" // Purple card
            isDarkMode={isDarkMode}
          />
        </View>
      </View>

      {/* This Week Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>This Week</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Leads"
            value={stats.thisWeek.leads}
            subtitle="This week"
            color="#5D3FD3"
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Properties"
            value={stats.thisWeek.properties}
            subtitle="Listed"
            color="#4A6FA5"
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Conversion"
            value={`${stats.thisWeek.conversion}%`}
            subtitle="Rate"
            color="#5D3FD3"
            isDarkMode={isDarkMode}
          />
        </View>
      </View>

      {/* Overall Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>Overall Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Leads"
            value={stats.overall.totalLeads}
            subtitle="All time"
            color="#4A6FA5"
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Properties"
            value={stats.overall.totalProperties}
            subtitle="Listed"
            color="#5D3FD3"
            isDarkMode={isDarkMode}
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.overall.conversionRate}%`}
            subtitle="Qualified leads"
            color="#4A6FA5"
            isDarkMode={isDarkMode}
          />
        </View>
      </View>

      {/* Lead Status Distribution */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>Lead Status Distribution</Text>
        <View style={[styles.statusGrid, isDarkMode ? null : styles.lightStatusGrid]}>
          {Object.entries(stats.overall.leadsByStatus).map(
            ([status, count]) => (
              <View key={status} style={[styles.statusItem, isDarkMode ? null : styles.lightStatusItem]}>
                <Text style={[styles.statusLabel, isDarkMode ? null : styles.lightStatusLabel]}>
                  {status.replace('_', ' ').toLowerCase()}
                </Text>
                <Text style={[styles.statusValue, isDarkMode ? null : styles.lightStatusValue]}>{count}</Text>
              </View>
            ),
          )}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>Recent Activity</Text>
        {stats.recentActivity.leads.slice(0, 3).map(lead => (
          <RecentActivityItem
            key={lead.id}
            type="lead"
            title={`${lead.name || 'Unknown'} - ${lead.status}`}
            subtitle={`Phone: ${lead.phoneNumber || 'N/A'}`}
            time={lead.createdAt}
            isDarkMode={isDarkMode}
          />
        ))}
        {stats.recentActivity.chats.slice(0, 2).map(chat => (
          <RecentActivityItem
            key={chat.id}
            type="chat"
            title={`Chat with ${chat.telegramUserId}`}
            subtitle={
              chat.message.length > 50
                ? `${chat.message.substring(0, 50)}...`
                : chat.message
            }
            time={chat.timestamp}
            isDarkMode={isDarkMode}
          />
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.darkText : styles.lightText]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Properties' as never)}
          >
            <Text style={styles.actionIcon}>🏠</Text>
            <Text style={styles.actionText}>View Properties</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Leads' as never)}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionText}>Manage Leads</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('BotConfiguration' as never)}
          >
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionText}>Bot Config</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Statistics' as never)}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>View Statistics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71', // Primary background
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA', // Glazier shiny white background
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
  retryButton: {
    backgroundColor: '#FF69B4', // Accent pink
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#1A1F71',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  header: {
    backgroundColor: '#1A1F71',
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeButton: {
    padding: 8,
    marginRight: 8,
  },
  themeIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#A0C4E4', // Light desaturated blue
    fontFamily: 'System',
  },
  darkSubtitle: {
    color: '#A0C4E4',
  },
  lightSubtitle: {
    color: '#1A1F71',
  },
  profileButton: {
    padding: 4,
  },
  profilePic: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#5D3FD3', // Deep purple
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
    fontFamily: 'System',
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent white
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '31.3%',
    borderLeftWidth: 4,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#3577cdff',
    marginBottom: 4,
    fontFamily: 'System',
  },
  lightStatValue: {
    color: '#1A1F71',
  },
  statTitle: {
    fontSize: 11,
    color: '#4d97d7ff',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  lightStatTitle: {
    color: '#666666',
  },
  statSubtitle: {
    fontSize: 10,
    color: '#FF69B4', // Accent pink
    marginTop: 3,
    fontFamily: 'System',
  },
  statusGrid: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  lightStatusGrid: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  lightStatusItem: {
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statusLabel: {
    fontSize: 14,
    color: '#A0C4E4',
    textTransform: 'capitalize',
    fontFamily: 'System',
  },
  lightStatusLabel: {
    color: '#666666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  lightStatusValue: {
    color: '#1A1F71',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  lightActivityItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityIconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  lightActivityIconText: {
    color: '#1A1F71',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
    fontFamily: 'System',
  },
  lightActivityTitle: {
    color: '#1A1F71',
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#A0C4E4',
    marginBottom: 6,
    fontFamily: 'System',
  },
  lightActivitySubtitle: {
    color: '#666666',
  },
  activityTime: {
    fontSize: 12,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  lightActivityTime: {
    color: '#666666',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'rgba(108, 74, 182, 0.3)', // #6C4AB6 semi-transparent
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 8,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
    color: '#FFFFFF',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
  },
  leadActivityIcon: {
    backgroundColor: '#4A6FA5',
  },
  chatActivityIcon: {
    backgroundColor: '#5D3FD3',
  },
});

export default DashboardScreen;
