import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../utils/api';

interface Schedule {
  id: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  lead?: {
    id: string;
    name?: string;
    phoneNumber?: string;
  };
  emailLead?: {
    id: string;
    name?: string;
    email?: string;
    phoneNumber?: string;
  };
  property?: {
    id: string;
    description: string;
    location: {
      address: string;
      city: string;
    };
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '#10b981';
    case 'SCHEDULED':
      return '#3b82f6';
    case 'CANCELLED':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
};

const ScheduleCard = ({ schedule, isDarkMode }: { schedule: Schedule; isDarkMode: boolean }) => {
  const getEntityInfo = () => {
    if (schedule.lead) {
      return {
        type: 'Lead',
        name: schedule.lead.name || 'Unknown Lead',
        contact: schedule.lead.phoneNumber || 'No phone',
      };
    }
    if (schedule.emailLead) {
      return {
        type: 'Email Lead',
        name: schedule.emailLead.name || 'Unknown Lead',
        contact: schedule.emailLead.email || 'No email',
      };
    }
    if (schedule.property) {
      return {
        type: 'Property',
        name: schedule.property.description.substring(0, 50) + '...',
        contact: `${schedule.property.location.address}, ${schedule.property.location.city}`,
      };
    }
    return { type: 'Unknown', name: 'No details', contact: '' };
  };

  const entityInfo = getEntityInfo();

  return (
    <View style={[styles.scheduleCard, isDarkMode ? styles.darkScheduleCard : styles.lightScheduleCard]}>
      <View style={styles.scheduleHeader}>
        <Text style={[styles.entityType, isDarkMode ? styles.darkEntityType : styles.lightEntityType]}>
          {entityInfo.type}
        </Text>
        <Text
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(schedule.status) },
          ]}
        >
          {schedule.status.toLowerCase()}
        </Text>
      </View>

      <View style={styles.scheduleContent}>
        <Text style={[styles.entityName, isDarkMode ? styles.darkEntityName : styles.lightEntityName]} numberOfLines={2}>
          {entityInfo.name}
        </Text>
        <Text style={[styles.entityContact, isDarkMode ? styles.darkEntityContact : styles.lightEntityContact]} numberOfLines={1}>
          {entityInfo.contact}
        </Text>
        {schedule.notes && (
          <Text style={[styles.notes, isDarkMode ? styles.darkNotes : styles.lightNotes]} numberOfLines={2}>
            {schedule.notes}
          </Text>
        )}
      </View>

      <View style={[styles.scheduleFooter, isDarkMode ? styles.darkScheduleFooter : styles.lightScheduleFooter]}>
        <Text style={[styles.scheduleDate, isDarkMode ? styles.darkScheduleDate : styles.lightScheduleDate]}>
          {new Date(schedule.scheduledAt).toLocaleDateString()} at{' '}
          {new Date(schedule.scheduledAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );
};

const SchedulesScreen = () => {
  const { isDarkMode } = useTheme();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSchedules = useCallback(async () => {
    try {
      const response = await apiService.getAllSchedules({ page: 1, limit: 50 });
      setSchedules(response.schedules);
    } catch (error) {
      console.error('Error loading schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [loadSchedules]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedules();
  }, [loadSchedules]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode ? styles.darkLoadingContainer : styles.lightLoadingContainer]}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={[styles.loadingText, isDarkMode ? styles.darkLoadingText : styles.lightLoadingText]}>
          Loading schedules...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.headerTitle, isDarkMode ? styles.darkText : styles.lightText]}>Schedules</Text>
      </View>

      <FlatList
        data={schedules}
        renderItem={({ item }) => <ScheduleCard schedule={item} isDarkMode={isDarkMode} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.schedulesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? "#FFFFFF" : "#1A1F71"}
            colors={[isDarkMode ? "#FFFFFF" : "#1A1F71"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode ? styles.darkEmptyText : styles.lightEmptyText]}>
              No schedules yet
            </Text>
            <Text style={[styles.emptySubtext, isDarkMode ? styles.darkEmptySubtext : styles.lightEmptySubtext]}>
              Your scheduled appointments will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkLoadingContainer: {
    backgroundColor: '#1A1F71',
  },
  lightLoadingContainer: {
    backgroundColor: '#E0F7FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'System',
  },
  darkLoadingText: {
    color: '#FFFFFF',
  },
  lightLoadingText: {
    color: '#1A1F71',
  },
  header: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightHeader: {
    backgroundColor: '#E0F7FA',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'System',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightText: {
    color: '#1A1F71',
  },
  schedulesList: {
    padding: 16,
  },
  scheduleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    borderWidth: 1,
  },
  darkScheduleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lightScheduleCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entityType: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },
  darkEntityType: {
    color: '#5D3FD3',
  },
  lightEntityType: {
    color: '#4F46E5',
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
  },
  scheduleContent: {
    marginBottom: 12,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: 'System',
  },
  darkEntityName: {
    color: '#FFFFFF',
  },
  lightEntityName: {
    color: '#000000',
  },
  entityContact: {
    fontSize: 14,
    marginBottom: 6,
    fontFamily: 'System',
  },
  darkEntityContact: {
    color: '#A0C4E4',
  },
  lightEntityContact: {
    color: '#6B7280',
  },
  notes: {
    fontSize: 14,
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  darkNotes: {
    color: '#A0C4E4',
  },
  lightNotes: {
    color: '#6B7280',
  },
  scheduleFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  darkScheduleFooter: {
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  lightScheduleFooter: {
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  scheduleDate: {
    fontSize: 12,
    fontFamily: 'System',
  },
  darkScheduleDate: {
    color: '#A0C4E4',
  },
  lightScheduleDate: {
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: 'System',
  },
  darkEmptyText: {
    color: '#FFFFFF',
  },
  lightEmptyText: {
    color: '#1A1F71',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'System',
  },
  darkEmptySubtext: {
    color: '#A0C4E4',
  },
  lightEmptySubtext: {
    color: '#6B7280',
  },
  darkContainer: {
    backgroundColor: '#1A1F71',
  },
  lightContainer: {
    backgroundColor: '#E0F7FA',
  },
});

export default SchedulesScreen;