import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { apiService, Lead, ChatMessage } from '../utils/api';

type RouteParams = {
  LeadDetails: {
    leadId: string;
  };
};

type RootStackParamList = {
  ChatDetail: { telegramUserId: string; leadName?: string };
};

const LeadDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'LeadDetails'>>();
  const { leadId } = route.params;

  const [lead, setLead] = useState<Lead | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeadDetails = useCallback(async () => {
    try {
      const response = await apiService.getLeadById(leadId);
      setLead(response.lead);
      setChatHistory(response.lead.chatHistory || []);
    } catch (error) {
      console.error('Error loading lead details:', error);
      Alert.alert('Error', 'Failed to load lead details');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadLeadDetails();
  }, [loadLeadDetails]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HIGH': return '#4CAF50';
      case 'MEDIUM': return '#FF9800';
      case 'NOT_QUALIFIED': return '#F44336';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading lead details...</Text>
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lead not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Lead Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.leadName}>{lead.name || 'Unknown Lead'}</Text>
          <Text style={styles.telegramId}>@{lead.telegramUserId}</Text>
          <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(lead.status) }]}>
            {lead.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Lead Info */}
      <View style={styles.infoContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {lead.phoneNumber && (
            <Text style={styles.infoText}>📞 {lead.phoneNumber}</Text>
          )}
          <Text style={styles.infoText}>🗣️ Language: {lead.language.toUpperCase()}</Text>
        </View>

        {lead.budget && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            <Text style={styles.budgetText}>₹{lead.budget.toLocaleString()}</Text>
          </View>
        )}

        {lead.expectations && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expectations</Text>
            <Text style={styles.expectationsText}>{lead.expectations}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <Text style={styles.infoText}>
            Created: {new Date(lead.createdAt).toLocaleDateString()}
          </Text>
          <Text style={styles.infoText}>
            Updated: {new Date(lead.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Chat History */}
      <View style={styles.chatContainer}>
        <Text style={styles.sectionTitle}>Chat History</Text>
        {chatHistory.length > 0 ? (
          chatHistory.slice(0, 10).map((chat) => (
            <TouchableOpacity
              key={chat.id}
              style={styles.chatMessage}
              onPress={() => navigation.navigate('ChatDetail', {
                telegramUserId: lead.telegramUserId,
                leadName: lead.name || 'Unknown User'
              })}
            >
              <View style={styles.messageHeader}>
                <Text style={styles.messageType}>
                  {chat.messageType === 'text' ? '💬' : '📎'} {chat.messageType}
                </Text>
                <Text style={styles.messageTime}>
                  {new Date(chat.timestamp).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.messageText}>{chat.message}</Text>
              {chat.response && (
                <Text style={styles.responseText}>🤖 {chat.response}</Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noChatText}>No chat history available</Text>
        )}
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
  backButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#1a0033',
    padding: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  leadName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  telegramId: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  infoContainer: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  budgetText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  expectationsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  chatContainer: {
    backgroundColor: 'white',
    margin: 15,
    marginTop: 0,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatMessage: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageType: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  responseText: {
    fontSize: 14,
    color: '#6a0dad',
    fontStyle: 'italic',
  },
  noChatText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LeadDetailsScreen;
