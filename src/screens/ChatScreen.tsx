import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

// Component moved outside to avoid unstable nested components
const ChatSessionCard = ({ session, onPress, isDarkMode }: { session: any; onPress: () => void; isDarkMode: boolean }) => (
  <TouchableOpacity style={[styles.chatCard, isDarkMode ? styles.darkChatCard : styles.lightChatCard]} onPress={onPress}>
    <View style={styles.chatHeader}>
      <Text style={[styles.leadName, isDarkMode ? styles.lightText : styles.darkText]}>{session.lead?.name || 'Unknown User'}</Text>
      <Text style={[styles.messageCount, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>{session.messageCount} messages</Text>
    </View>
    <Text style={[styles.lastMessage, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
      {session.lastMessage?.message || 'No messages yet'}
    </Text>
    <Text style={[styles.timestamp, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
      {new Date(session.lastActivity).toLocaleString()}
    </Text>
  </TouchableOpacity>
);

type RootStackParamList = {
  ChatDetail: { telegramUserId: string; leadName?: string };
};

type NavigationProps = NavigationProp<RootStackParamList>;

const ChatScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { isDarkMode } = useTheme();
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveChats();
  }, []);

  const loadActiveChats = async () => {
    try {
      // TODO: Load active chats from backend API
      // For now, just show a placeholder
      setActiveChats([
        {
          telegramUserId: '123456789',
          lead: { name: 'Rajesh Kumar', status: 'HIGH' },
          lastActivity: new Date(),
          lastMessage: { message: 'Hi! Looking for properties', timestamp: new Date() },
          messageCount: 5,
        }
      ]);
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', 'Failed to load chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (session: any) => {
    navigation.navigate('ChatDetail', {
      telegramUserId: session.telegramUserId,
      leadName: session.lead?.name || 'Unknown User'
    });
  };

  return (
    <View style={[styles.container, isDarkMode ? styles.darkBackground : styles.lightBackground]}>
      <View style={[styles.header, isDarkMode ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.headerTitle, isDarkMode ? styles.lightText : styles.darkText]}>Active Conversations</Text>
        <Text style={[styles.headerSubtitle, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>Chat with your leads</Text>
      </View>

      <FlatList
        data={activeChats}
        renderItem={({ item }) => <ChatSessionCard session={item} onPress={() => handleChatPress(item)} isDarkMode={isDarkMode} />}
        keyExtractor={(item) => item.telegramUserId}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDarkMode ? styles.lightTextSecondary : styles.darkTextSecondary]}>
              {loading ? 'Loading conversations...' : 'No active conversations'}
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
    backgroundColor: '#f5f5f5',
  },
  lightBackground: {
    backgroundColor: '#E0F7FA',
  },
  darkBackground: {
    backgroundColor: '#1A1F71',
  },
  header: {
    backgroundColor: '#1a0033',
    padding: 20,
  },
  lightHeader: {
    backgroundColor: '#FFFFFF',
  },
  darkHeader: {
    backgroundColor: '#1a0033',
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
  chatCard: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lightChatCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
  },
  darkChatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  messageCount: {
    fontSize: 12,
    color: '#666',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  timestamp: {
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ChatScreen;
