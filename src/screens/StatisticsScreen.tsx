import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const StatisticsScreen = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    'today' | 'week' | 'month'
  >('today');

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);

      // Mock data (as in your original)
      const statsData = {
        totalLeads: 25,
        chatMessages: 150,
        newLeads: 5,
        leadsByStatus: {
          NOT_QUALIFIED: 10,
          MEDIUM: 8,
          HIGH: 7,
        },
        overall: {
          totalLeads: 150,
          totalProperties: 45,
          conversionRate: 15.5,
          leadsByStatus: {
            NOT_QUALIFIED: 80,
            MEDIUM: 40,
            HIGH: 30,
          },
        },
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

  const PeriodFilter = ({
    selectedPeriod: selectedPeriodProp,
    setSelectedPeriod: setSelectedPeriodProp,
  }: {
    selectedPeriod: 'today' | 'week' | 'month';
    setSelectedPeriod: (period: 'today' | 'week' | 'month') => void;
  }) => {
    const periods = [
      { key: 'today', label: 'Today' },
      { key: 'week', label: 'This Week' },
      { key: 'month', label: 'This Month' },
    ];

    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Time Period:</Text>
        <View style={styles.filterButtons}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.filterButton,
                selectedPeriodProp === period.key && styles.filterButtonActive,
              ]}
              onPress={() =>
                setSelectedPeriodProp(period.key as 'today' | 'week' | 'month')
              }
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedPeriodProp === period.key &&
                    styles.filterButtonTextActive,
                ]}
              >
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
      case 'today':
        return "Today's Performance";
      case 'week':
        return "This Week's Performance";
      case 'month':
        return "This Month's Performance";
      default:
        return 'Performance';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistics & Analytics</Text>
        <Text style={styles.headerSubtitle}>Detailed performance metrics</Text>
      </View>

      <PeriodFilter
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
      />

      {stats && (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{getPeriodTitle()}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats.totalLeads || stats.leads || 0}
                </Text>
                <Text style={styles.statLabel}>Total Leads</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {stats.chatMessages || stats.totalChats || 0}
                </Text>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lead Chat Analysis</Text>
            <View style={styles.chatStats}>
              <View style={styles.chatStatItem}>
                <Text style={styles.chatStatValue}>
                  {stats.chatMessages || stats.totalChats || 0}
                </Text>
                <Text style={styles.chatStatLabel}>Total Messages</Text>
              </View>
              <View style={styles.chatStatItem}>
                <Text style={styles.chatStatValue}>
                  {stats.totalLeads
                    ? Math.round((stats.chatMessages || 0) / stats.totalLeads)
                    : 0}
                </Text>
                <Text style={styles.chatStatLabel}>Avg per Lead</Text>
              </View>
              <View style={styles.chatStatItem}>
                <Text style={styles.chatStatValue}>
                  {stats.leadsByStatus
                    ? (Object.values(stats.leadsByStatus) as number[]).reduce(
                        (a, b) => a + b,
                        0,
                      )
                    : stats.overall?.leadsByStatus
                    ? (
                        Object.values(stats.overall.leadsByStatus) as number[]
                      ).reduce((a, b) => a + b, 0)
                    : 0}
                </Text>
                <Text style={styles.chatStatLabel}>Active Conversations</Text>
              </View>
            </View>
          </View>

          {stats.overall?.leadsByStatus && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lead Status Distribution</Text>
              <View style={styles.statusList}>
                {Object.entries(stats.overall.leadsByStatus).map(
                  ([status, count]) => (
                    <View key={status} style={styles.statusItem}>
                      <Text style={styles.statusLabel}>
                        {status.replace('_', ' ')}
                      </Text>
                      <Text style={styles.statusValue}>{String(count)}</Text>
                    </View>
                  ),
                )}
              </View>
            </View>
          )}

          {stats.overall && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Metrics</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {stats.overall.totalLeads || 0}
                  </Text>
                  <Text style={styles.statLabel}>Total Leads</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {stats.overall.totalProperties || 0}
                  </Text>
                  <Text style={styles.statLabel}>Properties</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{`${
                    stats.overall.conversionRate || 0
                  }%`}</Text>
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
  header: {
    backgroundColor: '#1A1F71',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#A0C4E4',
    fontFamily: 'System',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#5D3FD3',
    marginBottom: 6,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    color: '#A0C4E4',
    textAlign: 'center',
    fontFamily: 'System',
  },
  statusList: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statusLabel: {
    fontSize: 14,
    color: '#A0C4E4',
    textTransform: 'capitalize',
    fontFamily: 'System',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5D3FD3',
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
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#5D3FD3',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#A0C4E4',
    fontWeight: '600',
    fontFamily: 'System',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  chatStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chatStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3b82f6',
    marginBottom: 6,
    fontFamily: 'System',
  },
  chatStatLabel: {
    fontSize: 12,
    color: '#A0C4E4',
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default StatisticsScreen;
