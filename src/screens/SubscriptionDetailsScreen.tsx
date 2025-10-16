import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { apiService } from '../utils/api';

type RouteParams = {
  SubscriptionDetails: {
    subscription: any;
  };
};

const SubscriptionDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'SubscriptionDetails'>>();
  const { subscription: initialSubscription } = route.params;

  const [subscription, setSubscription] = useState<any>(initialSubscription);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const [subscriptionData, usageData] = await Promise.all([
        apiService.getUserSubscription(),
        apiService.getSubscriptionUsage()
      ]);

      setSubscription(subscriptionData.subscription);
      setUsage(usageData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#4CAF50';
      case 'inactive': return '#F44336';
      case 'cancelled': return '#FF9800';
      case 'trial': return '#2196F3';
      default: return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a0dad" />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  if (!subscription) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No subscription found</Text>
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscription Details</Text>
        <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
          {subscription.status?.toUpperCase()}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Plan:</Text>
            <Text style={styles.value}>{subscription.subscriptionPlan?.name || 'Unknown Plan'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Billing Cycle:</Text>
            <Text style={styles.value}>{subscription.subscriptionPlan?.billingCycle || 'Monthly'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Price:</Text>
            <Text style={styles.value}>₹{subscription.subscriptionPlan?.price || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Period</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Start Date:</Text>
            <Text style={styles.value}>{formatDate(subscription.currentPeriodStart)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>End Date:</Text>
            <Text style={styles.value}>{formatDate(subscription.currentPeriodEnd)}</Text>
          </View>
          {subscription.trialEnd && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Trial Ends:</Text>
              <Text style={styles.value}>{formatDate(subscription.trialEnd)}</Text>
            </View>
          )}
        </View>

        {usage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Statistics</Text>
            <View style={styles.usageGrid}>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>{usage.propertiesUsed || 0}</Text>
                <Text style={styles.usageLabel}>Properties</Text>
                <Text style={styles.usageLimit}>/ {subscription.subscriptionPlan?.maxProperties || '∞'}</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>{usage.leadsUsed || 0}</Text>
                <Text style={styles.usageLabel}>Leads</Text>
                <Text style={styles.usageLimit}>/ {subscription.subscriptionPlan?.maxLeads || '∞'}</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>{usage.videoReelsUsed || 0}</Text>
                <Text style={styles.usageLabel}>Video Reels</Text>
                <Text style={styles.usageLimit}>/ {subscription.subscriptionPlan?.maxVideoReels || '∞'}</Text>
              </View>
              <View style={styles.usageItem}>
                <Text style={styles.usageValue}>{usage.emailLeadsUsed || 0}</Text>
                <Text style={styles.usageLabel}>Email Leads</Text>
                <Text style={styles.usageLimit}>/ {subscription.subscriptionPlan?.maxEmailLeads || '∞'}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          {subscription.subscriptionPlan?.features?.map((feature: string, index: number) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureText}>✓ {feature}</Text>
            </View>
          )) || (
            <Text style={styles.noFeaturesText}>No features listed</Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('SubscriptionPlans' as never)}
          >
            <Text style={styles.actionButtonText}>Change Plan</Text>
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
    marginTop: 10,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1a0033',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
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
  content: {
    padding: 20,
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
  infoRow: {
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
    fontWeight: '500',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  usageItem: {
    alignItems: 'center',
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  usageValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6a0dad',
  },
  usageLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  usageLimit: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  featureItem: {
    paddingVertical: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
  },
  noFeaturesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#6a0dad',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SubscriptionDetailsScreen;