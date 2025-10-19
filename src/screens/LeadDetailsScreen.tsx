import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  NavigationProp,
} from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { apiService, Lead, ChatMessage } from '../utils/api';

type RouteParams = {
  LeadDetails: {
    leadId: string;
    channel?: 'telegram' | 'whatsapp';
  };
};

type RootStackParamList = {
  ChatDetail: { telegramUserId: string; leadName?: string };
};

const LeadDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RouteParams, 'LeadDetails'>>();
  const { leadId, channel } = route.params;
  const { isDarkMode } = useTheme();

  const [lead, setLead] = useState<Lead | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeadDetails = useCallback(async () => {
    try {
      let response;
      if (channel === 'telegram') {
        response = await apiService.getTelegramLeadById(leadId);
        setLead(response.telegramLead);
        setChatHistory(response.telegramLead.chatHistory || []);
      } else if (channel === 'whatsapp') {
        response = await apiService.getWhatsAppLeadById(leadId);
        setLead(response.whatsappLead);
        setChatHistory(response.whatsappLead.chatHistory || []);
      } else {
        response = await apiService.getLeadById(leadId);
        setLead(response.lead);
        setChatHistory(response.lead.chatHistory || []);
      }
    } catch (error) {
      console.error('Error loading lead details:', error);
      Alert.alert('Error', 'Failed to load lead details');
    } finally {
      setLoading(false);
    }
  }, [leadId, channel]);

  useEffect(() => {
    loadLeadDetails();
  }, [loadLeadDetails]);

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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
        <Text style={[styles.loadingText, isDarkMode ? styles.lightText : styles.darkText]}>Loading lead details...</Text>
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={[styles.errorContainer, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
        <Text style={[styles.errorText, isDarkMode ? styles.lightText : styles.darkText]}>Lead not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
      {/* Lead Header */}
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <View style={styles.headerContent}>
          <Text style={[styles.leadName, isDarkMode ? styles.lightText : styles.darkText]}>{lead.name || 'Unknown Lead'}</Text>
          <Text style={[styles.telegramId, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
            @{lead.telegramUserId || lead.whatsappUserId}
          </Text>
          <Text
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(lead.status) },
            ]}
          >
            {lead.status.replace('_', ' ').toLowerCase()}
          </Text>
        </View>
      </View>

      {/* Lead Info */}
      <View style={[styles.infoContainer, isDarkMode ? styles.darkSection : styles.lightSection]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode ? styles.lightText : styles.darkText]}>Contact Information</Text>
          {lead.phoneNumber && (
            <Text style={[styles.infoText, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>📞 {lead.phoneNumber}</Text>
          )}
          <Text style={[styles.infoText, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
            🗣️ Language: {lead.language.toUpperCase()}
          </Text>
        </View>

        {lead.budget && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode ? styles.lightText : styles.darkText]}>Budget</Text>
            <Text style={[styles.budgetText, isDarkMode ? styles.lightText : styles.darkText]}>
              ₹{lead.budget.toLocaleString()}
            </Text>
          </View>
        )}

        {lead.expectations && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDarkMode ? styles.lightText : styles.darkText]}>Expectations</Text>
            <Text style={[styles.expectationsText, isDarkMode ? styles.lightText : styles.darkText]}>{lead.expectations}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode ? styles.lightText : styles.darkText]}>Timeline</Text>
          <Text style={[styles.infoText, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
            Created: {new Date(lead.createdAt).toLocaleDateString()}
          </Text>
          <Text style={[styles.infoText, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
            Updated: {new Date(lead.updatedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Chat History */}
      <View style={[styles.chatContainer, isDarkMode ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, isDarkMode ? styles.lightText : styles.darkText]}>Chat History</Text>
        {chatHistory.length > 0 ? (
          chatHistory.slice(0, 10).map(chat => (
            <TouchableOpacity
              key={chat.id}
              style={[styles.chatMessage, isDarkMode ? styles.darkChatMessage : styles.lightChatMessage]}
              onPress={() =>
                navigation.navigate('ChatDetail', {
                  telegramUserId:
                    lead.telegramUserId || lead.whatsappUserId || '',
                  leadName: lead.name || 'Unknown User',
                })
              }
            >
              <View style={styles.messageHeader}>
                <Text style={[styles.messageType, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
                  {chat.messageType === 'text' ? '💬' : '📎'} {chat.messageType}
                </Text>
                <Text style={[styles.messageTime, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
                  {new Date(chat.timestamp).toLocaleString()}
                </Text>
              </View>
              <Text style={[styles.messageText, isDarkMode ? styles.lightText : styles.darkText]}>{chat.message}</Text>
              {chat.response && (
                <Text style={[styles.responseText, isDarkMode ? styles.lightText : styles.darkText]}>🤖 {chat.response}</Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.noChatText, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>No chat history available</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71',
  },
  lightBackground: {
    backgroundColor: '#E0F7FA',
  },
  darkBackground: {
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
  lightText: {
    color: '#1A1F71',
  },
  darkText: {
    color: '#FFFFFF',
  },
  lightTextSecondary: {
    color: '#666666',
  },
  darkTextSecondary: {
    color: '#A0C4E4',
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
  backButton: {
    backgroundColor: '#5D3FD3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  header: {
    backgroundColor: '#1A1F71',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lightHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  darkHeader: {
    backgroundColor: '#1A1F71',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    alignItems: 'center',
  },
  leadName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'System',
  },
  telegramId: {
    fontSize: 16,
    color: '#A0C4E4',
    marginBottom: 12,
    fontFamily: 'System',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
    fontFamily: 'System',
  },
  infoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lightSection: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  darkSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    fontFamily: 'System',
  },
  infoText: {
    fontSize: 16,
    color: '#A0C4E4',
    marginBottom: 6,
    fontFamily: 'System',
  },
  budgetText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF69B4', // Accent pink
    fontFamily: 'System',
  },
  expectationsText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    fontFamily: 'System',
  },
  chatContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chatMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lightChatMessage: {
    backgroundColor: '#F8F9FA',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  darkChatMessage: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageType: {
    fontSize: 12,
    color: '#A0C4E4',
    fontWeight: '700',
    fontFamily: 'System',
  },
  messageTime: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'System',
  },
  messageText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: 'System',
  },
  responseText: {
    fontSize: 14,
    color: '#FF69B4',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  noChatText: {
    fontSize: 16,
    color: '#A0C4E4',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
});

export default LeadDetailsScreen;
