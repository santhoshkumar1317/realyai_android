import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  // ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { apiService, User } from '../utils/api';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logoutUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // const [subscription, setSubscription] = useState<any>(null);
  // const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    // loadSubscription(); // Commented out subscription loading
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await apiService.getProfile();
      console.log('Profile loaded:', profile);
      setUser(profile.user);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // const loadSubscription = async () => {
  //   try {
  //     setSubscriptionLoading(true);
  //     const subscriptionData = await apiService.getUserSubscription();
  //     setSubscription(subscriptionData.subscription);
  //   } catch (error) {
  //     console.error('Error loading subscription:', error);
  //     // Don't show error alert for subscription - it's optional
  //   } finally {
  //     setSubscriptionLoading(false);
  //   }
  // };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutUser();
            // Navigate to login - this would be handled by auth context
          } catch (error) {
            console.error('Error logging out:', error);
          }
        },
      },
    ]);
  };

  const toggleBotStatus = async (botType: 'telegram' | 'whatsapp') => {
    if (!user) return;

    const currentStatus = botType === 'telegram' ? user.telegramBotActive : user.whatsappBotActive;
    const newStatus = !currentStatus;
    const botName = botType === 'telegram' ? 'Telegram Bot' : 'WhatsApp Bot';

    Alert.alert(
      `Toggle ${botName}`,
      `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} the ${botName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newStatus ? 'Activate' : 'Deactivate',
          style: newStatus ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const updateData = {
                [botType === 'telegram' ? 'telegramBotActive' : 'whatsappBotActive']: newStatus,
              };

              await apiService.updateProfile(updateData);

              // Update local state
              setUser(prev => prev ? { ...prev, ...updateData } : null);

              Alert.alert('Success', `${botName} ${newStatus ? 'activated' : 'deactivated'} successfully`);
            } catch (error) {
              console.error(`Error toggling ${botType} bot status:`, error);
              Alert.alert('Error', `Failed to update ${botName} status`);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.company}>{user?.companyName}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{user?.phoneNumber}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Company:</Text>
            <Text style={styles.value}>{user?.companyName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>Member since:</Text>
            <Text style={styles.value}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Address</Text>
          {user?.companyAddress ? (
            <View style={styles.addressContainer}>
              {user.companyAddress.street && (
                <Text style={styles.addressLine}>
                  {user.companyAddress.street}
                </Text>
              )}
              {user.companyAddress.area && (
                <Text style={styles.addressLine}>
                  {user.companyAddress.area}
                </Text>
              )}
              <Text style={styles.addressLine}>
                {user.companyAddress.city}, {user.companyAddress.state}
              </Text>
              <Text style={styles.addressLine}>
                {user.companyAddress.country} - {user.companyAddress.pincode}
              </Text>
            </View>
          ) : (
            <Text style={styles.noAddressText}>No company address set</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Communication Channels</Text>
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => toggleBotStatus('telegram')}
          >
            <Text style={styles.label}>Telegram Bot:</Text>
            <View style={styles.statusContainer}>
              <Text
                style={
                  user?.telegramBotActive
                    ? styles.activeStatus
                    : styles.inactiveStatus
                }
              >
                {user?.telegramBotActive ? 'Active' : 'Inactive'}
              </Text>
              <Text style={styles.tapHint}>Tap to toggle</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => toggleBotStatus('whatsapp')}
          >
            <Text style={styles.label}>WhatsApp Bot:</Text>
            <View style={styles.statusContainer}>
              <Text
                style={
                  user?.whatsappBotActive
                    ? styles.activeStatus
                    : styles.inactiveStatus
                }
              >
                {user?.whatsappBotActive ? 'Active' : 'Inactive'}
              </Text>
              <Text style={styles.tapHint}>Tap to toggle</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          {subscriptionLoading ? (
            <View style={styles.subscriptionLoading}>
              <ActivityIndicator size="small" color="#6a0dad" />
              <Text style={styles.loadingText}>Loading subscription...</Text>
            </View>
          ) : subscription ? (
            <View style={styles.subscriptionContainer}>
              <View style={styles.subscriptionInfo}>
                <Text style={styles.subscriptionPlan}>
                  {subscription.subscriptionPlan?.name || 'Unknown Plan'}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  Status: {subscription.status}
                </Text>
                <Text style={styles.subscriptionDates}>
                  Valid until: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewSubscriptionButton}
                onPress={() => (navigation as any).navigate('SubscriptionDetails', { subscription })}
              >
                <Text style={styles.viewSubscriptionText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noSubscriptionContainer}>
              <Text style={styles.noSubscriptionText}>No active subscription</Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => (navigation as any).navigate('SubscriptionPlans')}
              >
                <Text style={styles.upgradeButtonText}>View Plans</Text>
              </TouchableOpacity>
            </View>
          )}
        </View> */}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (navigation as any).navigate('EditProfile')}
          >
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
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
  header: {
    backgroundColor: '#1a0033',
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6a0dad',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  company: {
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
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
  },
  actions: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#f44336',
  },
  logoutButtonText: {
    color: 'white',
  },
  botStatusValue: {
    fontSize: 14,
    color: '#4CAF50',
  },
  addressContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  addressLine: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  noAddressText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  activeStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  inactiveStatus: {
    fontSize: 14,
    color: '#F44336',
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  tapHint: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  subscriptionLoading: {
    alignItems: 'center',
    padding: 20,
  },
  subscriptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6a0dad',
    marginBottom: 5,
  },
  subscriptionStatus: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  subscriptionDates: {
    fontSize: 12,
    color: '#666',
  },
  viewSubscriptionButton: {
    backgroundColor: '#6a0dad',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewSubscriptionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noSubscriptionContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noSubscriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  upgradeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
