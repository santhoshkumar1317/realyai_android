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
    case 'COMPLETED': return '#4CAF50';
    case 'SCHEDULED': return '#2196F3';
    case 'CANCELLED': return '#F44336';
    default: return '#666';
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
        contact: schedule.property.location.address + ', ' + schedule.property.location.city,
      };
    }
    return { type: 'Unknown', name: 'No details', contact: '' };
  };

  const entityInfo = getEntityInfo();

  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleHeader}>
        <Text style={styles.entityType}>{entityInfo.type}</Text>
        <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(schedule.status) }]}>
          {schedule.status}
        </Text>
      </View>

      <View style={styles.scheduleContent}>
        <Text style={styles.entityName} numberOfLines={2}>{entityInfo.name}</Text>
        <Text style={styles.entityContact} numberOfLines={1}>{entityInfo.contact}</Text>
        {schedule.notes && (
          <Text style={styles.notes} numberOfLines={2}>{schedule.notes}</Text>
        )}
      </View>

      <View style={styles.scheduleFooter}>
        <Text style={styles.scheduleDate}>
          {new Date(schedule.scheduledAt).toLocaleDateString()} at{' '}
          {new Date(schedule.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
      console.log('Frontend: Loading schedules...');
      const response = await apiService.getAllSchedules({ page: 1, limit: 50 });
      console.log('Frontend: Schedules response:', response);
      setSchedules(response.schedules);
    } catch (error) {
      console.error('Frontend: Error loading schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSchedules();
    }, [loadSchedules])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedules();
  }, [loadSchedules]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a0dad" />
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.schedulesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No schedules yet</Text>
            <Text style={styles.emptySubtext}>Your scheduled appointments will appear here</Text>
          </View>
        }
      />
    </View>
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a0033',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  schedulesList: {
    padding: 15,
  },
  scheduleCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  entityType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  scheduleContent: {
    marginBottom: 10,
  },
  entityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  entityContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notes: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  scheduleFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  scheduleDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default SchedulesScreen;