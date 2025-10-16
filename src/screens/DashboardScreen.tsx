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
import { apiService, DashboardStats, User } from '../utils/api';

// Components moved outside to avoid unstable nested components
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

const RecentActivityItem = ({
  type,
  title,
  subtitle,
  time
}: {
  type: 'lead' | 'chat';
  title: string;
  subtitle: string;
  time: string;
}) => (
  <View style={styles.activityItem}>
    <View style={[styles.activityIcon, type === 'lead' ? styles.leadActivityIcon : styles.chatActivityIcon]}>
      <Text style={styles.activityIconText}>{type === 'lead' ? '👤' : '💬'}</Text>
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activitySubtitle}>{subtitle}</Text>
      <Text style={styles.activityTime}>{new Date(time).toLocaleDateString()}</Text>
    </View>
  </View>
);

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { isTokenReady } = useAuth();
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
        apiService.getUserProperties({ page: 1, limit: 1 }) // Just get count
      ]);

      setStats(dashboardStats);
      setUser(profile.user);
      setUserPropertyCount(userProperties.pagination.total);

      // Calculate qualified leads (MEDIUM + HIGH status)
      const qualifiedCount = (dashboardStats.overall.leadsByStatus.MEDIUM || 0) +
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
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Dashboard</Text>
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
        <Text style={styles.headerSubtitle}>Real Estate CRM Overview</Text>
      </View>

      {/* Today's Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="New Leads"
            value={stats.today.newLeads}
            subtitle="Today"
            color="#4CAF50"
          />
          <StatCard
            title="Chat Messages"
            value={stats.today.chatMessages}
            subtitle="Today"
            color="#2196F3"
          />
          <StatCard
            title="Total Leads"
            value={stats.today.totalLeads}
            subtitle="Today"
            color="#FF9800"
          />
        </View>
      </View>

      {/* My Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Stats</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="My Properties"
            value={userPropertyCount}
            subtitle="Listed"
            color="#9C27B0"
          />
          <StatCard
            title="Qualified Leads"
            value={qualifiedLeadsCount}
            subtitle="Total"
            color="#FF5722"
          />
          <StatCard
            title="Lead Follow-ups"
            value={stats.recentActivity.leads.filter(lead => lead.followUpStatus === 'PENDING').length}
            subtitle="Pending"
            color="#795548"
          />
        </View>
      </View>

      {/* This Week Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Leads"
            value={stats.thisWeek.leads}
            subtitle="This week"
            color="#9C27B0"
          />
          <StatCard
            title="Properties"
            value={stats.thisWeek.properties}
            subtitle="Listed"
            color="#607D8B"
          />
          <StatCard
            title="Conversion"
            value={`${stats.thisWeek.conversion}%`}
            subtitle="Rate"
            color="#795548"
          />
        </View>
      </View>

      {/* Overall Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Performance</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Leads"
            value={stats.overall.totalLeads}
            subtitle="All time"
            color="#F44336"
          />
          <StatCard
            title="Properties"
            value={stats.overall.totalProperties}
            subtitle="Listed"
            color="#3F51B5"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.overall.conversionRate}%`}
            subtitle="Qualified leads"
            color="#009688"
          />
        </View>
      </View>

      {/* Lead Status Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lead Status Distribution</Text>
        <View style={styles.statusGrid}>
          {Object.entries(stats.overall.leadsByStatus).map(([status, count]) => (
            <View key={status} style={styles.statusItem}>
              <Text style={styles.statusLabel}>
                {status.replace('_', ' ').toLowerCase()}
              </Text>
              <Text style={styles.statusValue}>{count}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {stats.recentActivity.leads.slice(0, 3).map((lead) => (
          <RecentActivityItem
            key={lead.id}
            type="lead"
            title={`${lead.name || 'Unknown'} - ${lead.status}`}
            subtitle={`Phone: ${lead.phoneNumber || 'N/A'}`}
            time={lead.createdAt}
          />
        ))}
        {stats.recentActivity.chats.slice(0, 2).map((chat) => (
          <RecentActivityItem
            key={chat.id}
            type="chat"
            title={`Chat with ${chat.telegramUserId}`}
            subtitle={chat.message.length > 50 ? `${chat.message.substring(0, 50)}...` : chat.message}
            time={chat.timestamp}
          />
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
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
            onPress={() => navigation.navigate('Chat' as never)}
          >
            <Text style={styles.actionIcon}>📬</Text>
            <Text style={styles.actionText}>Inbox</Text>
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#1a0033',
    padding: 20,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  profileButton: {
    padding: 5,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6a0dad',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePicText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    margin: 15,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    fontSize: 24,
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
  statusGrid: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityIconText: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  leadActivityIcon: {
    backgroundColor: '#4CAF50',
  },
  chatActivityIcon: {
    backgroundColor: '#2196F3',
  },
});

export default DashboardScreen;
