import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const StatisticsScreen = () => {
  const { isDarkMode } = useTheme();
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
    <ScrollView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.headerTitle, isDarkMode ? styles.darkText : styles.lightText]}>Statistics & Analytics</Text>
        <Text style={[styles.headerSubtitle, isDarkMode ? styles.darkSubtitle : styles.lightSubtitle]}>Detailed performance metrics</Text>
      </View>

      <PeriodFilter
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
      />

      {stats && (
        <View style={styles.content}>
          <View style={[styles.section, isDarkMode ? null : styles.lightSection]}>
            <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>{getPeriodTitle()}</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, isDarkMode ? null : styles.lightStatCard]}>
                <Text style={[styles.statValue, isDarkMode ? null : styles.lightStatValue]}>
                  {stats.totalLeads || stats.leads || 0}
                </Text>
                <Text style={[styles.statLabel, isDarkMode ? null : styles.lightStatLabel]}>Total Leads</Text>
              </View>
              <View style={[styles.statCard, isDarkMode ? null : styles.lightStatCard]}>
                <Text style={[styles.statValue, isDarkMode ? null : styles.lightStatValue]}>
                  {stats.chatMessages || stats.totalChats || 0}
                </Text>
                <Text style={[styles.statLabel, isDarkMode ? null : styles.lightStatLabel]}>Chat Messages</Text>
              </View>
              {stats.newLeads !== undefined && (
                <View style={[styles.statCard, isDarkMode ? null : styles.lightStatCard]}>
                  <Text style={[styles.statValue, isDarkMode ? null : styles.lightStatValue]}>{stats.newLeads}</Text>
                  <Text style={[styles.statLabel, isDarkMode ? null : styles.lightStatLabel]}>New Leads</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.section, isDarkMode ? null : styles.lightSection]}>
            <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>Lead Chat Analysis</Text>
            <View style={styles.chatStats}>
              <View style={[styles.chatStatItem, isDarkMode ? null : styles.lightChatStatItem]}>
                <Text style={[styles.chatStatValue, isDarkMode ? null : styles.lightChatStatValue]}>
                  {stats.chatMessages || stats.totalChats || 0}
                </Text>
                <Text style={[styles.chatStatLabel, isDarkMode ? null : styles.lightChatStatLabel]}>Total Messages</Text>
              </View>
              <View style={[styles.chatStatItem, isDarkMode ? null : styles.lightChatStatItem]}>
                <Text style={[styles.chatStatValue, isDarkMode ? null : styles.lightChatStatValue]}>
                  {stats.totalLeads
                    ? Math.round((stats.chatMessages || 0) / stats.totalLeads)
                    : 0}
                </Text>
                <Text style={[styles.chatStatLabel, isDarkMode ? null : styles.lightChatStatLabel]}>Avg per Lead</Text>
              </View>
              <View style={[styles.chatStatItem, isDarkMode ? null : styles.lightChatStatItem]}>
                <Text style={[styles.chatStatValue, isDarkMode ? null : styles.lightChatStatValue]}>
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
                <Text style={[styles.chatStatLabel, isDarkMode ? null : styles.lightChatStatLabel]}>Active Conversations</Text>
              </View>
            </View>
          </View>

          {stats.overall?.leadsByStatus && (
            <View style={[styles.section, isDarkMode ? null : styles.lightSection]}>
              <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>Lead Status Distribution</Text>
              <View style={[styles.statusList, isDarkMode ? null : styles.lightStatusList]}>
                {Object.entries(stats.overall.leadsByStatus).map(
                  ([status, count]) => (
                    <View key={status} style={[styles.statusItem, isDarkMode ? null : styles.lightStatusItem]}>
                      <Text style={[styles.statusLabel, isDarkMode ? null : styles.lightStatusLabel]}>
                        {status.replace('_', ' ')}
                      </Text>
                      <Text style={[styles.statusValue, isDarkMode ? null : styles.lightStatusValue]}>{String(count)}</Text>
                    </View>
                  ),
                )}
              </View>
            </View>
          )}

          {stats.overall && (
            <View style={[styles.section, isDarkMode ? null : styles.lightSection]}>
              <Text style={[styles.sectionTitle, isDarkMode ? null : styles.lightSectionTitle]}>Overall Metrics</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, isDarkMode ? null : styles.lightStatCard]}>
                  <Text style={[styles.statValue, isDarkMode ? null : styles.lightStatValue]}>
                    {stats.overall.totalLeads || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDarkMode ? null : styles.lightStatLabel]}>Total Leads</Text>
                </View>
                <View style={[styles.statCard, isDarkMode ? null : styles.lightStatCard]}>
                  <Text style={[styles.statValue, isDarkMode ? null : styles.lightStatValue]}>
                    {stats.overall.totalProperties || 0}
                  </Text>
                  <Text style={[styles.statLabel, isDarkMode ? null : styles.lightStatLabel]}>Properties</Text>
                </View>
                <View style={[styles.statCard, isDarkMode ? null : styles.lightStatCard]}>
                  <Text style={[styles.statValue, isDarkMode ? null : styles.lightStatValue]}>{`${
                    stats.overall.conversionRate || 0
                  }%`}</Text>
                  <Text style={[styles.statLabel, isDarkMode ? null : styles.lightStatLabel]}>Conversion Rate</Text>
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
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightHeader: {
    backgroundColor: '#E0F7FA',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
  darkSubtitle: {
    color: '#A0C4E4',
  },
  lightSubtitle: {
    color: '#666666',
  },
  lightSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  lightSectionTitle: {
    color: '#1A1F71',
  },
  lightStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  lightStatValue: {
    color: '#1A1F71',
  },
  lightStatLabel: {
    color: '#666666',
  },
  lightChatStatItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  lightChatStatValue: {
    color: '#1A1F71',
  },
  lightChatStatLabel: {
    color: '#666666',
  },
  lightStatusList: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  lightStatusItem: {
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  lightStatusLabel: {
    color: '#666666',
  },
  lightStatusValue: {
    color: '#1A1F71',
  },
});

export default StatisticsScreen;
