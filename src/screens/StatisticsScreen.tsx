import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
// import { apiService } from '../utils/api';

const StatisticsScreen = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      let statsData;

      // Comment out subscription-related calls for now
      // switch (selectedPeriod) {
      //   case 'today':
      //     statsData = await apiService.getDailyStats();
      //     break;
      //   case 'week':
      //     statsData = await apiService.getWeeklyStats();
      //     break;
      //   case 'month':
      //     statsData = await apiService.getMonthlyStats();
      //     break;
      //   default:
      //     statsData = await apiService.getDailyStats();
      // }

      // Use mock data for now
      statsData = {
        totalLeads: 25,
        chatMessages: 150,
        newLeads: 5,
        leadsByStatus: {
          'NOT_QUALIFIED': 10,
          'MEDIUM': 8,
          'HIGH': 7
        },
        overall: {
          totalLeads: 150,
          totalProperties: 45,
          conversionRate: 15.5,
          leadsByStatus: {
            'NOT_QUALIFIED': 80,
            'MEDIUM': 40,
            'HIGH': 30
          }
        }
      };

      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      Alert.alert('Error', 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  const PeriodFilter = ({ selectedPeriod: selectedPeriodProp, setSelectedPeriod: setSelectedPeriodProp }: { selectedPeriod: 'today' | 'week' | 'month'; setSelectedPeriod: (period: 'today' | 'week' | 'month') => void }) => {
    const periods = [
      { key: 'today', label: 'Today' },
      { key: 'week', label: 'This Week' },
      { key: 'month', label: 'This Month' }
    ];

    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Time Period:</Text>
        <View style={styles.filterButtons}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.filterButton,
                selectedPeriodProp === period.key && styles.filterButtonActive
              ]}
              onPress={() => setSelectedPeriodProp(period.key as 'today' | 'week' | 'month')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedPeriodProp === period.key && styles.filterButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const getPeriodTitle = () => {
    switch (selectedPeriod) {
      case 'today': return 'Today\'s Performance';
      case 'week': return 'This Week\'s Performance';
      case 'month': return 'This Month\'s Performance';
      default: return 'Performance';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics & Analytics</Text>
        <Text style={styles.headerSubtitle}>Detailed performance metrics</Text>
      </View>

      {/* Period Filter */}
      <PeriodFilter selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />

      {stats && (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getPeriodTitle()}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalLeads || stats.leads || 0}</Text>
                <Text style={styles.statLabel}>Total Leads</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.chatMessages || stats.totalChats || 0}</Text>
                <Text style={styles.statLabel}>Chat Messages</Text>
              </View>
              {stats.newLeads !== undefined && (
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.newLeads}</Text>
                  <Text style={styles.statLabel}>New Leads</Text>
                </View>
              )}
            </View>
          </View>

          {/* Lead Chat Analysis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lead Chat Analysis</Text>
            <View style={styles.chatStats}>
              <View style={styles.chatStatItem}>
                <Text style={styles.chatStatValue}>{stats.chatMessages || stats.totalChats || 0}</Text>
                <Text style={styles.chatStatLabel}>Total Messages</Text>
              </View>
              <View style={styles.chatStatItem}>
                <Text style={styles.chatStatValue}>
                  {stats.totalLeads ? Math.round((stats.chatMessages || 0) / stats.totalLeads) : 0}
                </Text>
                <Text style={styles.chatStatLabel}>Avg per Lead</Text>
              </View>
              <View style={styles.chatStatItem}>
                <Text style={styles.chatStatValue}>
                  {stats.leadsByStatus ? (Object.values(stats.leadsByStatus) as number[]).reduce((a, b) => a + b, 0) : (stats.overall?.leadsByStatus ? (Object.values(stats.overall.leadsByStatus) as number[]).reduce((a, b) => a + b, 0) : 0)}
                </Text>
                <Text style={styles.chatStatLabel}>Active Conversations</Text>
              </View>
            </View>
          </View>

          {stats.overall?.leadsByStatus && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lead Status Distribution</Text>
              <View style={styles.statusList}>
                {Object.entries(stats.overall.leadsByStatus).map(([status, count]) => (
                  <View key={status} style={styles.statusItem}>
                    <Text style={styles.statusLabel}>{status.replace('_', ' ')}</Text>
                    <Text style={styles.statusValue}>{String(count)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {stats.overall && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Metrics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.overall.totalLeads || 0}</Text>
                  <Text style={styles.statLabel}>Total Leads</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.overall.totalProperties || 0}</Text>
                  <Text style={styles.statLabel}>Properties</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{`${stats.overall.conversionRate || 0}%`}</Text>
                  <Text style={styles.statLabel}>Conversion Rate</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
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
  header: {
    backgroundColor: '#1a0033',
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  content: {
    padding: 15,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6a0dad',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statusList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#6a0dad',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  chatStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  chatStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  chatStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default StatisticsScreen;
