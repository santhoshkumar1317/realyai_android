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

const ScheduleCard = ({ schedule }: { schedule: Schedule }) => {
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
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.entityType}>{entityInfo.type}</Text>
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
        <Text style={styles.entityName} numberOfLines={2}>
          {entityInfo.name}
        </Text>
        <Text style={styles.entityContact} numberOfLines={1}>
          {entityInfo.contact}
        </Text>
        {schedule.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {schedule.notes}
          </Text>
        )}
      </View>

      <View style={styles.scheduleFooter}>
        <Text style={styles.scheduleDate}>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5D3FD3" />
        <Text style={styles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedules</Text>
      </View>

      <FlatList
        data={schedules}
        renderItem={({ item }) => <ScheduleCard schedule={item} />}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.schedulesList}
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
            <Text style={styles.emptyText}>No schedules yet</Text>
            <Text style={styles.emptySubtext}>
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
    backgroundColor: '#1A1F71',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1F71',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1F71',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  schedulesList: {
    padding: 16,
  },
  scheduleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: '#5D3FD3',
    fontFamily: 'System',
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
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'System',
  },
  entityContact: {
    fontSize: 14,
    color: '#A0C4E4',
    marginBottom: 6,
    fontFamily: 'System',
  },
  notes: {
    fontSize: 14,
    color: '#A0C4E4',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  scheduleFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  scheduleDate: {
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
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: 'System',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0C4E4',
    textAlign: 'center',
    fontFamily: 'System',
  },
});

export default SchedulesScreen;
