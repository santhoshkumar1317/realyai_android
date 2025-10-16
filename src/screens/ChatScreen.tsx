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

// Component moved outside to avoid unstable nested components
const ChatSessionCard = ({ session, onPress }: { session: any; onPress: () => void }) => (
  <TouchableOpacity style={styles.chatCard} onPress={onPress}>
    <View style={styles.chatHeader}>
      <Text style={styles.leadName}>{session.lead?.name || 'Unknown User'}</Text>
      <Text style={styles.messageCount}>{session.messageCount} messages</Text>
    </View>
    <Text style={styles.lastMessage}>
      {session.lastMessage?.message || 'No messages yet'}
    </Text>
    <Text style={styles.timestamp}>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Active Conversations</Text>
        <Text style={styles.headerSubtitle}>Chat with your leads</Text>
      </View>

      <FlatList
        data={activeChats}
        renderItem={({ item }) => <ChatSessionCard session={item} onPress={() => handleChatPress(item)} />}
        keyExtractor={(item) => item.telegramUserId}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
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
